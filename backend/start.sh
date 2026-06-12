#!/bin/bash
set -e

echo "Running database migrations..."
alembic upgrade head

echo "Seeding database..."
python seed.py

echo "Starting Celery background worker..."
# Run Celery with concurrency=1 to fit comfortably in Render's 512MB free tier RAM
celery -A app.tasks.evaluation_worker.celery_app worker --loglevel=info -Q ai_heavy,notifications --concurrency=1 &

echo "Starting FastAPI application..."
# Run Uvicorn with 1 worker to optimize memory usage
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1
