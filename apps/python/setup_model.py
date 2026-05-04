import os
from sentence_transformers import SentenceTransformer, export_static_quantized_openvino_model
from optimum.intel import OVQuantizationConfig

def setup():
    model_id = 'ibm-granite/granite-embedding-97m-multilingual-r2'
    export_path = 'granite-quantized'

    print(f"--- Downloading and Quantizing {model_id} ---")

    # Documentation says: Load with backend="openvino" BEFORE quantizing
    model = SentenceTransformer(model_id, backend="openvino")

    # This creates the 'openvino/' folder inside 'granite-quantized'
    export_static_quantized_openvino_model(
        model=model,
        quantization_config=OVQuantizationConfig(),
        model_name_or_path=export_path
    )
    print("--- Model Setup Complete ---")

if __name__ == "__main__":
    setup()