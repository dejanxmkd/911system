FROM python:3.10-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY src ./src
COPY web ./web
COPY configs ./configs
RUN mkdir -p /app/checkpoints /app/runtime/review /app/dataset/reviewed
ENV PYTHONPATH=/app/src
ENV BGREMOVE_CHECKPOINT=/app/checkpoints/best.pt
EXPOSE 8000
CMD ["uvicorn", "bgremove.api:app", "--host", "0.0.0.0", "--port", "8000"]
