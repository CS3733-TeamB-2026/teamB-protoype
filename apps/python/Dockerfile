FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
WORKDIR /app

# Copy from the root context to the subfolder
COPY apps/python/pyproject.toml apps/python/uv.lock ./
RUN uv sync --no-dev --frozen --no-cache

COPY apps/python/main.py .

# Pre-download the model (this part takes time/CPU)
RUN uv run python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('granite-embedding-97m-multilingual-r2', device='cpu')"

EXPOSE 3001
CMD ["uv", "run", "python", "main.py"]