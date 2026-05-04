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
        model_id = "ibm-granite/granite-embedding-97m-multilingual-r2"
        # We tell the library to look in our local 'model_cache' folder
        cache_path = os.path.abspath("model_cache")

        print(f"--- Loading model {model_id} from {cache_path} ---")
        _model = SentenceTransformer(model_id, cache_folder=cache_path)
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
