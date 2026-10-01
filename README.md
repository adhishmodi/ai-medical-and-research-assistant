# AI Medical & Research Assistant

An educational full-stack web application for exploring medical and biomedical questions with evidence-aware AI responses.

> **Educational use only.** The application does not diagnose conditions, interpret personal test results, or prescribe/change medication. It is not a substitute for professional medical care.

## Current architecture

```text
Browser
  │
  ▼
TanStack Start server function
  │
  ├─ Query router
  │    ├─ general medical
  │    ├─ research
  │    ├─ medication
  │    ├─ urgent safety
  │    └─ non-medical
  ├─ PubMed retrieval
  ├─ WHO + MedlinePlus retrieval
  ├─ Optional Supabase pgvector RAG
  ├─ Server-side AI provider chain
  │    ├─ Gemini
  │    ├─ OpenAI
  │    ├─ Anthropic
  │    └─ Groq
  └─ Structured response validation + grounded sources
```

The browser never receives server-side API keys. AI-generated citation URLs are not treated as verified: displayed sources come from application retrieval or the curated offline fallback.

## Tech stack

- TanStack Start + TanStack Router
- React 19 + TypeScript
- Vite + Nitro
- Tailwind CSS v4
- Radix/shadcn-style UI components
- PubMed / NCBI retrieval
- WHO and MedlinePlus retrieval
- Gemini structured generation and embeddings
- Optional Supabase PostgreSQL + pgvector
- Vitest + ESLint + Prettier
- Vercel-compatible Nitro deployment

## Project structure

```text
src/
├─ components/                 # UI and evidence/report presentation
├─ data/mockResponses.ts      # Curated offline fallback + response types
├─ lib/
│  ├─ ai/providers.server.ts   # AI provider chain
│  ├─ assistant.server.ts      # Main server function and safety/grounding logic
│  ├─ pubmed.server.ts         # PubMed retrieval
│  ├─ trusted-sources.server.ts# WHO / MedlinePlus retrieval
│  ├─ query-router.server.ts   # Query classification
│  └─ rag/                     # Embedding, chunking and pgvector retrieval
├─ routes/
│  ├─ __root.tsx
│  ├─ index.tsx
│  └─ api/health.ts            # Backend readiness endpoint
├─ router.tsx
├─ server.ts
└─ start.ts

supabase/migrations/           # pgvector schema + similarity RPC
vite.config.ts                 # TanStack Start + Nitro + Tailwind + React
vercel.json                    # Vercel framework declaration
```

## Local development

Requirements: Node.js 20+ is recommended.

```bash
git clone https://github.com/adhishmodi/ai-medical-and-research-assistant.git
cd ai-medical-and-research-assistant
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

At minimum, configure:

```env
GEMINI_API_KEY=your_server_side_key
```

For RAG, also configure:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your_server_side_secret_key
```

Optional provider keys are documented in .env.example.

Start development:

```bash
npm run dev
```

Quality checks:

```bash
npm run lint
npm test
npm run build
```

npm run build performs both the Vite production build and a strict TypeScript check.

## Backend health

Once running, the readiness endpoint is:

```text
GET /api/health
```

It reports configuration status without exposing secret values. A fully configured backend returns HTTP 200; missing required backend configuration returns HTTP 503.

## RAG

The Supabase migration creates:

- medical_documents
- medical_chunks
- pgvector HNSW indexing
- match_medical_chunks cosine-similarity RPC

Embeddings use gemini-embedding-001 with 768 dimensions by default. The server uses the secret Supabase key and keeps the RAG tables protected by RLS.

## Safety and grounding

The server:

- validates and normalizes incoming questions;
- routes urgent and medication queries through safety-focused instructions;
- retrieves authoritative sources before generation;
- distinguishes research evidence from health guidance;
- validates the model response shape;
- never exposes model-generated URLs as verified citations;
- falls back to curated educational responses if no AI provider is available.

This is an educational research assistant, not a clinical decision system.

## Deployment

The project is configured for Vercel/TanStack Start through Nitro. Add server-side environment variables in the hosting provider; do not prefix secrets with VITE_.

See BACKEND.md for the backend contract and environment details.
