# Phase 8 RAG

Supabase Postgres + pgvector is the Phase 8 database and vector store.

Flow:

1. Discover candidate evidence from PubMed and trusted health sources.
2. Normalize and chunk the retrieved source text.
3. Generate 768-dimensional Gemini document embeddings.
4. Store source metadata, chunks, and embeddings in Postgres.
5. Generate a query embedding.
6. Run cosine-similarity search through the match_medical_chunks SQL function.
7. Add the retrieved chunks to the LLM evidence context.

RAG is optional until SUPABASE_URL and SUPABASE_SECRET_KEY are configured. Without them, the existing live retrieval path continues to work.

Environment:

- SUPABASE_URL
- SUPABASE_SECRET_KEY
- GEMINI_API_KEY
- GEMINI_EMBEDDING_MODEL (optional; defaults to gemini-embedding-001)
- GEMINI_EMBEDDING_DIMENSIONS (optional; defaults to 768)

Run supabase/migrations/202609290001_phase8_rag.sql in Supabase before enabling RAG.
Keep the Supabase secret key server-side only.
