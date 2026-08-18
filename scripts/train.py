import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'src'))

from bgremove.train import run

parser = argparse.ArgumentParser()
parser.add_argument('--config', default='configs/train.yaml')
args = parser.parse_args()
run(args.config)
