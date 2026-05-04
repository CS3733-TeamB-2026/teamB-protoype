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
        # 1. Load the base model using the OpenVINO backend
        _model = SentenceTransformer("ibm-granite/granite-embedding-97m-multilingual-r2", backend="openvino")

        quantization_config = OVQuantizationConfig()

        # 2. Export and save the quantized model to a local folder
        # We use 'model_name_or_path' as the output destination
        export_static_quantized_openvino_model(
            model=_model,
            quantization_config=quantization_config,
            model_name_or_path="granite-quantized" # This becomes the folder name
        )

        # 3. Load the model back from the local folder
        # We point directly to the folder we just created
        _model = SentenceTransformer(
            "granite-quantized",
            backend="openvino",
            device="cpu",
            model_kwargs={
                "torch_dtype": torch.float16,
                "file_name": "openvino/openvino_model_qint8_quantized.xml"
            },
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
