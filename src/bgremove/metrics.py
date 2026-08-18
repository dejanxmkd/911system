import torch


def mae(pred, target):
    return torch.mean(torch.abs(pred - target)).item()


def iou(pred, target, threshold=0.5, eps=1e-6):
    p = (pred >= threshold).float()
    t = (target >= threshold).float()
    intersection = (p * t).sum()
    union = ((p + t) > 0).float().sum()
    return ((intersection + eps) / (union + eps)).item()


def f_measure(pred, target, threshold=0.5, beta2=0.3, eps=1e-6):
    p = (pred >= threshold).float()
    t = (target >= threshold).float()
    tp = (p * t).sum()
    precision = tp / (p.sum() + eps)
    recall = tp / (t.sum() + eps)
    return (((1 + beta2) * precision * recall) / (beta2 * precision + recall + eps)).item()
