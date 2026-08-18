from pathlib import Path
import cv2
import numpy as np
import torch
from PIL import Image

from .model import build_model
from .postprocess import composite_rgba, refine_mask


class BackgroundRemover:
    def __init__(self, checkpoint: str, image_size: int = 512, device: str | None = None):
        self.device = torch.device(device or ('cuda' if torch.cuda.is_available() else 'cpu'))
        self.image_size = image_size
        self.model = build_model().to(self.device)
        state = torch.load(checkpoint, map_location=self.device)
        self.model.load_state_dict(state.get('model', state))
        self.model.eval()

    def predict_alpha(self, image_rgb: np.ndarray) -> np.ndarray:
        h, w = image_rgb.shape[:2]
        resized = cv2.resize(image_rgb, (self.image_size, self.image_size), interpolation=cv2.INTER_AREA)
        x = resized.astype(np.float32) / 255.0
        x = (x - np.array([0.485, 0.456, 0.406], dtype=np.float32)) / np.array([0.229, 0.224, 0.225], dtype=np.float32)
        x = torch.from_numpy(x.transpose(2, 0, 1)).unsqueeze(0).to(self.device)
        with torch.inference_mode():
            alpha = torch.sigmoid(self.model(x))[0, 0].cpu().numpy()
        alpha = cv2.resize(alpha, (w, h), interpolation=cv2.INTER_LINEAR)
        return refine_mask(alpha)

    def remove(self, image_rgb: np.ndarray) -> np.ndarray:
        return composite_rgba(image_rgb, self.predict_alpha(image_rgb))

    def remove_file(self, input_path: str, output_path: str):
        image = np.array(Image.open(input_path).convert('RGB'))
        Image.fromarray(self.remove(image), mode='RGBA').save(output_path)
