from pathlib import Path
import yaml
import torch
from torch.utils.data import DataLoader
from torch.utils.tensorboard import SummaryWriter
from tqdm import tqdm

from .data import SegmentationDataset
from .losses import CompositeSegmentationLoss
from .metrics import f_measure, iou, mae
from .model import build_model


def load_config(path: str):
    with open(path, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)


def run(config_path: str):
    cfg = load_config(config_path)
    torch.manual_seed(cfg['seed'])
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    train_ds = SegmentationDataset(cfg['data']['train_images'], cfg['data']['train_masks'], cfg['data']['image_size'], train=True)
    val_ds = SegmentationDataset(cfg['data']['val_images'], cfg['data']['val_masks'], cfg['data']['image_size'], train=False)
    train_loader = DataLoader(train_ds, batch_size=cfg['training']['batch_size'], shuffle=True, num_workers=cfg['data']['num_workers'], pin_memory=True)
    val_loader = DataLoader(val_ds, batch_size=cfg['training']['batch_size'], shuffle=False, num_workers=cfg['data']['num_workers'], pin_memory=True)

    model = build_model(cfg['model']['name'], cfg['model']['in_channels'], cfg['model']['out_channels']).to(device)
    loss_fn = CompositeSegmentationLoss(**cfg['loss'])
    optimizer = torch.optim.AdamW(model.parameters(), lr=cfg['training']['learning_rate'], weight_decay=cfg['training']['weight_decay'])
    scaler = torch.cuda.amp.GradScaler(enabled=cfg['training']['amp'] and device.type == 'cuda')
    writer = SummaryWriter(cfg['training']['log_dir'])
    ckpt_dir = Path(cfg['training']['checkpoint_dir']); ckpt_dir.mkdir(parents=True, exist_ok=True)
    best_mae = float('inf')

    for epoch in range(1, cfg['training']['epochs'] + 1):
        model.train(); running = 0.0
        for images, masks in tqdm(train_loader, desc=f'Epoch {epoch}'):
            images, masks = images.to(device), masks.to(device)
            optimizer.zero_grad(set_to_none=True)
            with torch.cuda.amp.autocast(enabled=scaler.is_enabled()):
                logits = model(images); loss = loss_fn(logits, masks)
            scaler.scale(loss).backward()
            scaler.unscale_(optimizer)
            torch.nn.utils.clip_grad_norm_(model.parameters(), cfg['training']['grad_clip'])
            scaler.step(optimizer); scaler.update()
            running += loss.item()

        model.eval(); vals = {'mae': [], 'iou': [], 'f': []}
        with torch.inference_mode():
            for images, masks in val_loader:
                images, masks = images.to(device), masks.to(device)
                pred = torch.sigmoid(model(images))
                vals['mae'].append(mae(pred, masks)); vals['iou'].append(iou(pred, masks)); vals['f'].append(f_measure(pred, masks))
        metrics = {k: sum(v) / len(v) for k, v in vals.items()}
        train_loss = running / max(1, len(train_loader))
        writer.add_scalar('loss/train', train_loss, epoch)
        for k, v in metrics.items(): writer.add_scalar(f'metrics/{k}', v, epoch)
        state = {'model': model.state_dict(), 'optimizer': optimizer.state_dict(), 'epoch': epoch, 'metrics': metrics, 'config': cfg}
        torch.save(state, ckpt_dir / 'latest.pt')
        if metrics['mae'] < best_mae:
            best_mae = metrics['mae']; torch.save(state, ckpt_dir / 'best.pt')
        print(f"epoch={epoch} loss={train_loss:.4f} mae={metrics['mae']:.4f} iou={metrics['iou']:.4f} f={metrics['f']:.4f}")
    writer.close()
