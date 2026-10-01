# Backend — AI Medical & Research Assistant

## Request flow

~~~text
Frontend
   |
   | askAssistant({ data: { question } })
   v
TanStack Start server function
   |
   +--> Query router
   |      +--> general medical
   |      +--> research
   |      +--> medication
   |      +--> urgent safety
   |      +--> non-medical
   |
   +--> PubMed retrieval
   +--> WHO / MedlinePlus retrieval
   +--> Optional Supabase pgvector RAG
   +--> AI provider chain
   |      +--> Gemini
   |      +--> OpenAI
   |      +--> Anthropic
   |      +--> Groq
   |
   +--> Structured response validation
   +--> Retrieved-source grounding
   |
   v
Frontend AnswerPanel / ResearchReport
~~~

## Environment

Copy .env.example to .env. Secrets must remain server-side.

~~~env
GEMINI_API_KEY=...
~~~

RAG:

~~~env
SUPABASE_URL=...
SUPABASE_SECRET_KEY=...
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
GEMINI_EMBEDDING_DIMENSIONS=768
~~~

Optional provider fallbacks:

~~~env
OPENAI_API_KEY=
OPENAI_MODEL=
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=
GROQ_API_KEY=
GROQ_MODEL=
~~~

## Response contract

~~~ts
{
  topic: string;
  summary: string;
  keyInformation: string[];
  considerations: string[];
  whenToSeekCare: string[];
  sources: Array<{
    title: string;
    organization: string;
    description: string;
    url?: string;
    category?: "research" | "guidance";
    publicationYear?: string;
    studyType?: string;
    evidenceLevel?: "high" | "moderate" | "limited" | "not_applicable";
    relevance?: number;
  }>;
}
~~~

## RAG behavior

RAG is optional at runtime. When configured, semantic retrieval uses Gemini embeddings and Supabase pgvector. Live PubMed/WHO/MedlinePlus retrieval remains the authoritative source path; RAG is additional semantic context, not a replacement for source retrieval.

## Health endpoint

GET /api/health reports whether required server configuration is present without returning secret values.

## Verification

~~~bash
npm run lint
npm test
npm run build
~~~

For a live smoke test, ask a non-personal medical research question and verify that the response contains retrieved sources, a safety notice, and no client-exposed API keys.
