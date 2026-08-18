import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'src'))

from bgremove.export import export_onnx

parser = argparse.ArgumentParser()
parser.add_argument('--config', default='configs/train.yaml')
parser.add_argument('--checkpoint', default='checkpoints/best.pt')
args = parser.parse_args()
print(export_onnx(args.config, args.checkpoint))
