# AI Background Removal Model

Production-ready human/foreground background-removal model project, implemented from scratch around the requirements in the project brief.

## Goal
Train a high-quality image segmentation / alpha-matting pipeline for automatic background removal on a custom dataset of 1,000+ image/mask pairs, with particular attention to hair, fur, fine edges, transparent/semi-transparent regions, shadows, motion blur, low light, and visually complex backgrounds.

## Core targets

- MAE: `< 0.020`
- F-measure: `> 0.95`
- IoU: `> 0.93`
- Inference target: `< 100 ms` on target GPU deployment
- Edge quality target: Excellent
- Transparent-object handling target: Good

## Stack

- Python 3.10+
- PyTorch 2.x
- CUDA 11.8+
- IS-Net / U2-Net style encoder-decoder segmentation baseline
- Albumentations for dataset augmentation
- OpenCV + Pillow for preprocessing
- pymatting for optional alpha-matting refinement
- ONNX export with TensorRT-ready deployment path
- FastAPI + Uvicorn REST API
- TensorBoard monitoring
- Docker deployment

## Project structure

```text
configs/
  train.yaml
src/bgremove/
  data.py
  model.py
  losses.py
  metrics.py
  postprocess.py
  inference.py
  train.py
  evaluate.py
  export.py
  api.py
scripts/
  train.py
  evaluate.py
  export_onnx.py
requirements.txt
Dockerfile
.gitignore
```

## Data layout

```text
data/
  train/
    images/
    masks/
  val/
    images/
    masks/
  test/
    images/
    masks/
```

Each image must have a matching mask with the same filename stem.

## Training plan

1. Validate image/mask pairs and split train/validation/test.
2. Train a U2-Net-style segmentation baseline.
3. Use BCE + Dice + boundary-aware loss.
4. Apply augmentations conservatively: resize/crop, horizontal flip, color/brightness/contrast, blur/noise, scale/rotate, and edge-preserving transformations.
5. Monitor MAE, F-measure and IoU on validation data after each epoch.
6. Save both latest and best checkpoints.
7. Add hard-edge / alpha-matting post-processing for hair and fine boundaries.
8. Export the best model to ONNX for deployment and later TensorRT optimization.

## Permanent implementation rule

This repository is the source of truth for this new project. All future work should extend the existing modules and configuration instead of replacing the architecture ad hoc. New features must be added in the smallest compatible way possible and should not silently change existing behavior, defaults, dataset conventions, model I/O, metrics, or deployment interfaces.

## Quick start

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python scripts/train.py --config configs/train.yaml
```

Evaluation:

```bash
python scripts/evaluate.py --config configs/train.yaml --checkpoint checkpoints/best.pt
```

ONNX export:

```bash
python scripts/export_onnx.py --config configs/train.yaml --checkpoint checkpoints/best.pt
```

API:

```bash
uvicorn bgremove.api:app --host 0.0.0.0 --port 8000
```
