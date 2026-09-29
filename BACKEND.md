# Backend — AI Medical & Research Assistant

This branch contains backend work only. Frontend components should remain independent so frontend and backend can be developed in parallel.

## Current backend flow

```
Frontend
   |
   | askAssistant({ question })
   v
TanStack Start Server Function
   |
   +--> Query Router
   |      +--> general medical
   |      +--> research
   |      +--> medication
   |      +--> urgent safety
   |      +--> non-medical
   |
   +--> PubMed retrieval (when appropriate)
   |
   +--> Trusted health-source retrieval
   |      +--> MedlinePlus / NLM
   |      +--> WHO
   |
   +--> AI provider
   |      +--> Gemini
   |      +--> optional provider fallbacks
   |
   +--> Structured JSON validation
   |
   +--> Retrieved sources merged into response
   |
   v
Frontend AnswerPanel / ResearchReport
```

## Backend responsibilities

- Keep API keys server-side.
- Validate incoming questions.
- Route questions before retrieval.
- Retrieve biomedical evidence from PubMed for medical/research queries.
- Retrieve authoritative patient-facing information from WHO/MedlinePlus.
- Apply safety-first behavior to urgent and medication queries.
- Ask the model for a fixed JSON response shape.
- Validate the model response before returning it.
- Attach retrieved sources to the response instead of trusting model-generated citations.
- Fall back to the curated mock response set if no AI provider is configured or providers fail.

## Response contract

```ts
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
  }>;
}
```

## Environment

Required for live AI generation:

```env
GEMINI_API_KEY=your_server_side_key
GEMINI_MODEL=gemini-3.8-flash
```

The key must never be exposed through a `VITE_` variable or frontend code.

Optional provider keys already supported by the provider layer:

```env
OPENAI_API_KEY=
OPENAI_MODEL=
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=
GROQ_API_KEY=
GROQ_MODEL=
```

## Local development

```bash
npm install
npm run dev
```

The frontend currently calls the server function directly, so no separate Express/FastAPI process is required for the prototype.

## Backend-first development rule

Do not edit `src/components/**` or visual route code on this branch unless a frontend/backend contract change is required. Frontend work can continue on a separate branch and later consume the stable `askAssistant` response.

## Next backend milestones

1. Harden request validation and limits.
2. Add backend unit tests for query routing and response validation.
3. Add retrieval timeout handling.
4. Add request-level logging without logging sensitive user content.
5. Add a small backend health/status endpoint if deployment requires one.
6. Add persistent server-side research history only if the project scope later requires accounts/database storage.
