import torch
import torch.nn.functional as F
from torch import nn


def dice_loss(logits, target, eps=1e-6):
    pred = torch.sigmoid(logits)
    intersection = (pred * target).sum(dim=(1, 2, 3))
    denom = pred.sum(dim=(1, 2, 3)) + target.sum(dim=(1, 2, 3))
    return (1 - ((2 * intersection + eps) / (denom + eps))).mean()


def boundary_loss(logits, target):
    pred = torch.sigmoid(logits)
    kernel = torch.tensor([[0.,1.,0.],[1.,-4.,1.],[0.,1.,0.]], device=pred.device).view(1,1,3,3)
    pred_edge = F.conv2d(pred, kernel, padding=1).abs()
    target_edge = F.conv2d(target, kernel, padding=1).abs()
    return F.l1_loss(pred_edge, target_edge)


class CompositeSegmentationLoss(nn.Module):
    def __init__(self, bce_weight=0.50, dice_weight=0.35, boundary_weight=0.15):
        super().__init__()
        self.bce_weight = bce_weight
        self.dice_weight = dice_weight
        self.boundary_weight = boundary_weight

    def forward(self, logits, target):
        bce = F.binary_cross_entropy_with_logits(logits, target)
        dice = dice_loss(logits, target)
        boundary = boundary_loss(logits, target)
        return self.bce_weight * bce + self.dice_weight * dice + self.boundary_weight * boundary
