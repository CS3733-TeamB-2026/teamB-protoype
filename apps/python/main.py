from __future__ import annotations

import torch
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer, export_static_quantized_openvino_model
from optimum.intel import OVQuantizationConfig

app = FastAPI(title="python", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

_model: SentenceTransformer | None = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        export_path = "granite-quantized"

        # Use the absolute path to avoid directory resolution issues
        import os
        abs_path = os.path.abspath(export_path)

        _model = SentenceTransformer(
            abs_path,
            backend="openvino",
            model_kwargs={
                "file_name": "openvino/openvino_model_qint8_quantized.xml",
                # Explicitly pass library_name to optimum via model_kwargs
                "library_name": "sentence_transformers"
            }
        )
    return _model

@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/embed")
def embed(body: dict) -> dict:
    text: str = body.get("text", "")
    vector = get_model().encode(text[:32768], normalize_embeddings=True)
    return {"embedding": vector.tolist()}
