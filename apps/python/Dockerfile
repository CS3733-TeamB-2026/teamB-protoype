FROM python:3.12-slim

# 1. Install system tools for math libs and downloading
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 2. Get UV (the fast python manager)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
WORKDIR /app

# 3. Setup cache directory for models
ENV SENTENCE_TRANSFORMERS_HOME=/app/.cache
RUN mkdir -p /app/.cache

# 4. Copy files from the 'python' folder (relative to root)
COPY apps/python/pyproject.toml apps/python/uv.lock ./
RUN uv sync --no-dev --frozen --no-cache

COPY apps/python/main.py .

# 5. Pre-download the model
RUN uv run python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('ibm-granite/granite-embedding-97m-multilingual-r2', device='cpu')"

EXPOSE 3001
CMD ["uv", "run", "python", "main.py"]