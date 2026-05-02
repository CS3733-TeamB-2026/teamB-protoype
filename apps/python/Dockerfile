FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --no-dev --frozen --no-cache

COPY main.py

RUN uv run python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('granite-embedding-97m-multilingual-r2', device='cpu')"

EXPOSE 3001

CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3001"]