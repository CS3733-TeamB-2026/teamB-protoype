FROM python:3.12-slim

# Install system tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Get uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Cache directory for sentence-transformers models
ENV SENTENCE_TRANSFORMERS_HOME=/app/.cache
RUN mkdir -p /app/.cache

# Copy only dependency files first (better layer caching)
COPY apps/python/pyproject.toml apps/python/uv.lock ./
RUN uv sync --no-dev --frozen --no-cache

# Copy source
COPY apps/python/main.py .

# Pre-download the model so it's baked into the image
RUN uv run python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('ibm-granite/granite-embedding-97m-multilingual-r2', device='cpu')"

EXPOSE 3001
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3001"]