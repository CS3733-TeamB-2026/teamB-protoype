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


import os

def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        # Use absolute path to avoid directory confusion
        export_path = os.path.abspath("granite-quantized")

        print(f"--- Loading model from: {export_path} ---")
        _model = SentenceTransformer(
            export_path,
            backend="openvino",
            model_kwargs={
                "file_name": "openvino/openvino_model_qint8_quantized.xml"
            }
        )
        print("--- Model loaded successfully ---")
    return _model

@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/embed")
def embed(body: dict) -> dict:
    text: str = body.get("text", "")
    vector = get_model().encode(text[:32768], normalize_embeddings=True)
    return {"embedding": vector.tolist()}
