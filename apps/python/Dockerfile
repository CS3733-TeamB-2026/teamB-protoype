FROM python:3.12-slim

USER root
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl libglib2.0-0 libgl1 libegl1 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# 1. Install dependencies
COPY apps/python/pyproject.toml apps/python/uv.lock ./
RUN uv sync --no-dev --frozen

# 2. Pre-download the model (The "Simple Bake")
COPY apps/python/setup_model.py .
RUN uv run python setup_model.py

# 3. Copy application code
COPY apps/python/main.py .

EXPOSE 3001
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3001"]