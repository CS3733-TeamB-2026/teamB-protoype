import os
import shutil
from sentence_transformers import SentenceTransformer, export_static_quantized_openvino_model
from optimum.intel import OVQuantizationConfig

def setup():
    model_id = 'ibm-granite/granite-embedding-97m-multilingual-r2'
    export_path = 'granite-quantized'

    print(f"--- Downloading and Quantizing {model_id} ---")
    model = SentenceTransformer(model_id, backend='openvino')

    export_static_quantized_openvino_model(
        model=model,
        quantization_config=OVQuantizationConfig(),
        model_name_or_path=export_path
    )

    # Copy metadata files so the loader recognizes the library later
    metadata = ['config.json', 'tokenizer.json', 'tokenizer_config.json', 'special_tokens_map.json', 'modules.json']
    source_dir = model.tokenizer.name_or_path if hasattr(model, 'tokenizer') else ''

    print(f"--- Copying metadata from {source_dir} to {export_path} ---")
    for f in metadata:
        src = os.path.join(source_dir, f)
        if os.path.exists(src):
            shutil.copy(src, export_path)
    print("--- Model Setup Complete ---")

if __name__ == "__main__":
    setup()