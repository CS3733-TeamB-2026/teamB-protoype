import os
from sentence_transformers import SentenceTransformer

def setup():
    model_id = "ibm-granite/granite-embedding-97m-multilingual-r2"
    cache_path = "model_cache"

    print(f"--- Pre-downloading {model_id} to {cache_path} ---")
    # This downloads the model files into the specified folder
    SentenceTransformer(model_id, cache_folder=cache_path)
    print("--- Download Complete ---")

if __name__ == "__main__":
    setup()