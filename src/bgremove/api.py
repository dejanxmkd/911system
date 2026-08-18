import io
import os
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import Response
from PIL import Image
from .inference import BackgroundRemover

app = FastAPI(title='AI Background Removal API')
_model = None


def get_model():
    global _model
    if _model is None:
        checkpoint = os.getenv('BGREMOVE_CHECKPOINT', 'checkpoints/best.pt')
        _model = BackgroundRemover(checkpoint)
    return _model


@app.get('/health')
def health():
    return {'status': 'ok'}


@app.post('/remove-background')
async def remove_background(file: UploadFile = File(...)):
    try:
        raw = await file.read()
        image = np.array(Image.open(io.BytesIO(raw)).convert('RGB'))
        rgba = get_model().remove(image)
        out = io.BytesIO()
        Image.fromarray(rgba, mode='RGBA').save(out, format='PNG')
        return Response(content=out.getvalue(), media_type='image/png')
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
