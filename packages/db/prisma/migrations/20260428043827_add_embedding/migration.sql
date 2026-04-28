-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column
ALTER TABLE "Content" ADD COLUMN "embedding" vector(384);

-- Add index for fast cosine similarity search
CREATE INDEX content_embedding_idx ON "Content"
    USING ivfflat ("embedding" vector_cosine_ops)
    WITH (lists = 100);