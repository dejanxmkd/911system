from pathlib import Path
import yaml
import torch
from .model import build_model


def export_onnx(config_path: str, checkpoint: str):
    with open(config_path, 'r', encoding='utf-8') as f:
        cfg = yaml.safe_load(f)
    model = build_model(cfg['model']['name'], cfg['model']['in_channels'], cfg['model']['out_channels'])
    state = torch.load(checkpoint, map_location='cpu')
    model.load_state_dict(state.get('model', state)); model.eval()
    size = cfg['data']['image_size']
    dummy = torch.randn(1, 3, size, size)
    out = Path(cfg['export']['onnx_path']); out.parent.mkdir(parents=True, exist_ok=True)
    dynamic_axes = {'image': {0: 'batch', 2: 'height', 3: 'width'}, 'mask': {0: 'batch', 2: 'height', 3: 'width'}} if cfg['export']['dynamic_axes'] else None
    torch.onnx.export(model, dummy, out, input_names=['image'], output_names=['mask'], opset_version=cfg['export']['opset'], dynamic_axes=dynamic_axes)
    return out
