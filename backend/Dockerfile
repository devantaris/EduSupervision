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

# Make start script executable
RUN chmod +x start.sh

# Expose FastAPI port
EXPOSE 8000

# Start command: run migrations, seeding, worker, and server
CMD ["bash", "start.sh"]
