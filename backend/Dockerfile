FROM python:3.11-slim

# Install system dependencies needed by PyMuPDF, python-magic, psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    libmagic1 \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency manifest first for layer caching
COPY pyproject.toml ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -e .

# Copy the rest of the application
COPY . .

# Expose FastAPI port
EXPOSE 8000

# Start command: run migrations then start server
CMD alembic upgrade head && python seed.py && uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
