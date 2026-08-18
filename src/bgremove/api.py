import io
import os
import shutil
import uuid
import zipfile
from pathlib import Path

import numpy as np
from fastapi import Body, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from PIL import Image
from pydantic import BaseModel

ROOT = Path(__file__).resolve().parents[2]
WEB_DIR = ROOT / "web"
RUNTIME_DIR = ROOT / "runtime" / "review"
DATASET_DIR = ROOT / "dataset" / "reviewed"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

app = FastAPI(title="AI Background Removal API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://dejanxmkd.github.io",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

if WEB_DIR.exists():
    app.mount("/static", StaticFiles(directory=WEB_DIR), name="static")

_model = None


def get_model():
    global _model
    if _model is None:
        checkpoint = os.getenv("BGREMOVE_CHECKPOINT", "checkpoints/best.pt")
        if not Path(checkpoint).exists():
            raise RuntimeError(
                f"Model checkpoint not found at '{checkpoint}'. Train or provide a checkpoint first."
            )
        try:
            from .inference import BackgroundRemover
        except Exception as exc:
            raise RuntimeError(f"Model runtime is not ready: {exc}") from exc
        _model = BackgroundRemover(checkpoint)
    return _model


def safe_name(name: str) -> str:
    return Path(name).name.replace(" ", "_")


def save_review_pair(session_id: str, item_id: str, filename: str, raw: bytes):
    session_dir = RUNTIME_DIR / session_id
    original_dir = session_dir / "original"
    result_dir = session_dir / "result"
    mask_dir = session_dir / "mask"
    for folder in (original_dir, result_dir, mask_dir):
        folder.mkdir(parents=True, exist_ok=True)

    original = Image.open(io.BytesIO(raw)).convert("RGB")
    image = np.array(original)
    rgba = get_model().remove(image)

    stem = f"{item_id}_{Path(filename).stem}"
    original_path = original_dir / f"{stem}.png"
    result_path = result_dir / f"{stem}.png"
    mask_path = mask_dir / f"{stem}.png"

    original.save(original_path, format="PNG")
    Image.fromarray(rgba, mode="RGBA").save(result_path, format="PNG")
    Image.fromarray(rgba[:, :, 3], mode="L").save(mask_path, format="PNG")

    return {
        "id": item_id,
        "name": filename,
        "original": f"/review/file/{session_id}/original/{original_path.name}",
        "result": f"/review/file/{session_id}/result/{result_path.name}",
        "mask": f"/review/file/{session_id}/mask/{mask_path.name}",
        "decision": "pending",
    }


def iter_uploaded_images(filename: str, raw: bytes):
    ext = Path(filename).suffix.lower()
    if ext == ".zip":
        with zipfile.ZipFile(io.BytesIO(raw)) as archive:
            for info in archive.infolist():
                if info.is_dir():
                    continue
                member = Path(info.filename)
                if member.suffix.lower() not in ALLOWED_EXTENSIONS:
                    continue
                if "__MACOSX" in member.parts:
                    continue
                yield safe_name(member.name), archive.read(info)
        return

    if ext in ALLOWED_EXTENSIONS:
        yield safe_name(filename), raw


class Decision(BaseModel):
    decision: str


@app.get("/")
def index():
    index_path = WEB_DIR / "index.html"
    if not index_path.exists():
        return {"status": "ok", "message": "Review UI is not installed yet."}
    return FileResponse(index_path)


@app.get("/styles.css")
def styles():
    return FileResponse(WEB_DIR / "styles.css", media_type="text/css")


@app.get("/app.js")
def frontend_js():
    return FileResponse(WEB_DIR / "app.js", media_type="application/javascript")


@app.get("/health")
def health():
    checkpoint = os.getenv("BGREMOVE_CHECKPOINT", "checkpoints/best.pt")
    return {
        "status": "ok",
        "checkpoint": checkpoint,
        "model_ready": Path(checkpoint).exists(),
    }


@app.post("/remove-background")
async def remove_background(file: UploadFile = File(...)):
    try:
        raw = await file.read()
        image = np.array(Image.open(io.BytesIO(raw)).convert("RGB"))
        rgba = get_model().remove(image)
        out = io.BytesIO()
        Image.fromarray(rgba, mode="RGBA").save(out, format="PNG")
        return Response(content=out.getvalue(), media_type="image/png")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/review/upload")
async def upload_for_review(files: list[UploadFile] = File(...)):
    session_id = uuid.uuid4().hex[:12]
    items = []
    errors = []

    try:
        for upload in files:
            raw = await upload.read()
            found = False
            for filename, image_raw in iter_uploaded_images(upload.filename or "upload", raw):
                found = True
                item_id = uuid.uuid4().hex[:10]
                try:
                    items.append(save_review_pair(session_id, item_id, filename, image_raw))
                except Exception as exc:
                    errors.append({"name": filename, "error": str(exc)})
            if not found:
                errors.append({"name": upload.filename, "error": "No supported images found."})
    except zipfile.BadZipFile as exc:
        raise HTTPException(status_code=400, detail="Invalid ZIP file.") from exc

    if not items and errors:
        raise HTTPException(status_code=400, detail=errors[0]["error"])

    return {"session_id": session_id, "items": items, "errors": errors}


@app.get("/review/file/{session_id}/{kind}/{filename}")
def review_file(session_id: str, kind: str, filename: str):
    if kind not in {"original", "result", "mask"}:
        raise HTTPException(status_code=404, detail="Not found")
    path = RUNTIME_DIR / safe_name(session_id) / kind / safe_name(filename)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(path)


@app.post("/review/{session_id}/{item_id}/decision")
def review_decision(session_id: str, item_id: str, payload: Decision = Body(...)):
    if payload.decision not in {"approved", "rejected", "pending"}:
        raise HTTPException(status_code=400, detail="Decision must be approved, rejected, or pending.")

    session_dir = RUNTIME_DIR / safe_name(session_id)
    matches = list((session_dir / "original").glob(f"{safe_name(item_id)}_*.png"))
    if not matches:
        raise HTTPException(status_code=404, detail="Review item not found.")

    original_path = matches[0]
    result_path = session_dir / "result" / original_path.name
    mask_path = session_dir / "mask" / original_path.name

    if payload.decision == "pending":
        return {"ok": True, "decision": "pending"}

    destination = DATASET_DIR / payload.decision
    images_dir = destination / "images"
    masks_dir = destination / "masks"
    results_dir = destination / "results"
    for folder in (images_dir, masks_dir, results_dir):
        folder.mkdir(parents=True, exist_ok=True)

    shutil.copy2(original_path, images_dir / original_path.name)
    shutil.copy2(mask_path, masks_dir / mask_path.name)
    shutil.copy2(result_path, results_dir / result_path.name)

    return {"ok": True, "decision": payload.decision}
