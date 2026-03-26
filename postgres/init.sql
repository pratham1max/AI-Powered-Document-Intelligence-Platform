-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Indexes are created after SQLAlchemy creates tables via Alembic/lifespan.
-- This script runs at container init time to ensure the extension is available.

-- HNSW index for fast ANN search on embeddings (run after table creation)
-- CREATE INDEX IF NOT EXISTS idx_chunks_embedding
--     ON document_chunks USING hnsw (embedding vector_cosine_ops);

-- Index on document user_id (also handled by SQLAlchemy model, but explicit here)
-- CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
