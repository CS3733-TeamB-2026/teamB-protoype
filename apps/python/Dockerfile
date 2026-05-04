FROM python:3.12-slim

# 1. Install system tools for math libs and downloading
# Install system tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 2. Get UV (the fast python manager)
# Get uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# 3. Setup cache directory for models
# Cache directory for sentence-transformers models
ENV SENTENCE_TRANSFORMERS_HOME=/app/.cache
RUN mkdir -p /app/.cache

# 4. Copy files from the 'python' folder (relative to root)
# Copy only dependency files first (better layer caching)
COPY apps/python/pyproject.toml apps/python/uv.lock ./
RUN uv sync --no-dev --frozen --no-cache

# Copy source
COPY apps/python/main.py .

# 5. Pre-download the model
# Pre-download the model so it's baked into the image
RUN uv run python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('ibm-granite/granite-embedding-97m-multilingual-r2', device='cpu')"

EXPOSE 3001
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3001"]
