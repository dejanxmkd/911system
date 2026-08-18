from pathlib import Path
import albumentations as A
import cv2
from albumentations.pytorch import ToTensorV2
from torch.utils.data import Dataset


def build_transforms(image_size: int, train: bool):
    transforms = [A.Resize(image_size, image_size)]
    if train:
        transforms = [
            A.LongestMaxSize(max_size=image_size),
            A.PadIfNeeded(image_size, image_size, border_mode=cv2.BORDER_REFLECT_101),
            A.RandomCrop(image_size, image_size),
            A.HorizontalFlip(p=0.5),
            A.ShiftScaleRotate(shift_limit=0.04, scale_limit=0.10, rotate_limit=10, border_mode=cv2.BORDER_REFLECT_101, p=0.45),
            A.ColorJitter(brightness=0.18, contrast=0.18, saturation=0.12, hue=0.04, p=0.35),
            A.OneOf([A.GaussianBlur(blur_limit=(3, 5)), A.MotionBlur(blur_limit=5)], p=0.15),
            A.GaussNoise(p=0.12),
        ]
    transforms += [
        A.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)),
        ToTensorV2(),
    ]
    return A.Compose(transforms)


class SegmentationDataset(Dataset):
    def __init__(self, images_dir: str, masks_dir: str, image_size: int = 512, train: bool = True):
        self.images_dir = Path(images_dir)
        self.masks_dir = Path(masks_dir)
        self.transform = build_transforms(image_size, train)
        exts = {'.jpg', '.jpeg', '.png', '.webp', '.bmp'}
        images = sorted(p for p in self.images_dir.iterdir() if p.suffix.lower() in exts)
        self.pairs = []
        for image_path in images:
            mask_path = next((self.masks_dir / f'{image_path.stem}{ext}' for ext in ('.png', '.jpg', '.jpeg', '.webp') if (self.masks_dir / f'{image_path.stem}{ext}').exists()), None)
            if mask_path:
                self.pairs.append((image_path, mask_path))
        if not self.pairs:
            raise RuntimeError('No image/mask pairs found')

    def __len__(self):
        return len(self.pairs)

    def __getitem__(self, index):
        image_path, mask_path = self.pairs[index]
        image = cv2.imread(str(image_path), cv2.IMREAD_COLOR)
        mask = cv2.imread(str(mask_path), cv2.IMREAD_GRAYSCALE)
        if image is None or mask is None:
            raise RuntimeError(f'Failed to read {image_path} or {mask_path}')
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        result = self.transform(image=image, mask=mask)
        image_t = result['image'].float()
        mask_t = result['mask'].float().unsqueeze(0) / 255.0
        return image_t, mask_t.clamp(0, 1)
