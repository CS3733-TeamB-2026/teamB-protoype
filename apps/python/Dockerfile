FROM python:3.12-slim

USER root

# Install system tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libglib2.0-0 \
    libgl1 \
    libegl1 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# 1. Install dependencies
COPY apps/python/pyproject.toml apps/python/uv.lock ./
RUN uv sync --no-dev --frozen --no-cache

# 2. BAKE THE MODEL FIRST (using a one-liner to avoid needing main.py yet)
# This layer will stay cached unless your pyproject.toml changes!
RUN uv run python -c "\
from sentence_transformers import SentenceTransformer, export_static_quantized_openvino_model; \
from optimum.intel import OVQuantizationConfig; \
model_id = 'ibm-granite/granite-embedding-97m-multilingual-r2'; \
export_path = 'granite-quantized'; \
model = SentenceTransformer(model_id, backend='openvino'); \
export_static_quantized_openvino_model(model=model, quantization_config=OVQuantizationConfig(), model_name_or_path=export_path)"

# 3. Finally, copy your source code
# Changes here will NOT trigger the model rebuild above
COPY apps/python/main.py .

EXPOSE 3001
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3001"]