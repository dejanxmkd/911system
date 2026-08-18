import cv2
import numpy as np


def refine_mask(mask: np.ndarray, feather_radius: int = 1) -> np.ndarray:
    mask = np.clip(mask.astype(np.float32), 0.0, 1.0)
    if feather_radius > 0:
        k = feather_radius * 2 + 1
        mask = cv2.GaussianBlur(mask, (k, k), 0)
    return np.clip(mask, 0.0, 1.0)


def composite_rgba(image_rgb: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    alpha_u8 = (np.clip(alpha, 0.0, 1.0) * 255).astype(np.uint8)
    return np.dstack([image_rgb.astype(np.uint8), alpha_u8])
