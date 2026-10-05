FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for OpenMP & XGBoost
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

# Execute training and save artifacts
RUN python -u src/train_pipeline.py

# Create non-root user for security
RUN addgroup --system appgroup && adduser --system --group appuser
USER appuser

EXPOSE 8000

ENV HOST=0.0.0.0
ENV PORT=8000
ENV ENVIRONMENT=production

CMD ["sh", "-c", "uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
