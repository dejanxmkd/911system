from __future__ import annotations

import torch
from torch import nn
import torch.nn.functional as F


class ConvBlock(nn.Module):
    def __init__(self, in_ch: int, out_ch: int):
        super().__init__()
        self.block = nn.Sequential(
            nn.Conv2d(in_ch, out_ch, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_ch, out_ch, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.block(x)


class U2NetLite(nn.Module):
    """Compact encoder-decoder baseline for foreground segmentation.

    This intentionally keeps a simple, production-friendly U2-Net-inspired
    shape while leaving room to swap in a deeper IS-Net/U2-Net backbone later.
    """

    def __init__(self, in_channels: int = 3, out_channels: int = 1):
        super().__init__()
        widths = [32, 64, 128, 256]
        self.enc1 = ConvBlock(in_channels, widths[0])
        self.enc2 = ConvBlock(widths[0], widths[1])
        self.enc3 = ConvBlock(widths[1], widths[2])
        self.bottleneck = ConvBlock(widths[2], widths[3])
        self.pool = nn.MaxPool2d(2)

        self.up3 = nn.ConvTranspose2d(widths[3], widths[2], 2, stride=2)
        self.dec3 = ConvBlock(widths[2] * 2, widths[2])
        self.up2 = nn.ConvTranspose2d(widths[2], widths[1], 2, stride=2)
        self.dec2 = ConvBlock(widths[1] * 2, widths[1])
        self.up1 = nn.ConvTranspose2d(widths[1], widths[0], 2, stride=2)
        self.dec1 = ConvBlock(widths[0] * 2, widths[0])
        self.head = nn.Conv2d(widths[0], out_channels, 1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        e1 = self.enc1(x)
        e2 = self.enc2(self.pool(e1))
        e3 = self.enc3(self.pool(e2))
        b = self.bottleneck(self.pool(e3))

        d3 = self.up3(b)
        d3 = self.dec3(torch.cat([d3, e3], dim=1))
        d2 = self.up2(d3)
        d2 = self.dec2(torch.cat([d2, e2], dim=1))
        d1 = self.up1(d2)
        d1 = self.dec1(torch.cat([d1, e1], dim=1))
        return self.head(d1)


def build_model(name: str = "u2net_lite", in_channels: int = 3, out_channels: int = 1) -> nn.Module:
    if name != "u2net_lite":
        raise ValueError(f"Unsupported model: {name}")
    return U2NetLite(in_channels=in_channels, out_channels=out_channels)
