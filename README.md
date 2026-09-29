# AI Medical & Research Assistant

An educational web app that lets users ask medical and biomedical research
questions in plain language and get back a structured, source-referenced
explanation.

> ⚠️ **Educational use only.** This tool does not diagnose conditions,
> interpret personal test results, or recommend medication. It is not a
> substitute for professional medical advice — see the in-app safety notice
> and [PROJECT_SPEC.md](./PROJECT_SPEC.md) for the full intent behind it.

**Status: work in progress.** The core flow (ask → AI answer → structured
display) is working end to end. See [What's next](#whats-next) for what's
still planned.

## What works right now

- A question form where the user types a medical/biomedical question and
  clicks **Ask Assistant**, with input validation and a "clear" action.
- The question is sent to an AI model (Anthropic's Claude) through a
  server-side function — the API key is never exposed to the browser.
- The model is constrained by a dedicated system prompt that requires it to:
  - give general educational information, not a diagnosis
  - never claim certainty about an individual having a disease
  - never prescribe or advise starting/stopping/changing medication
  - separate well-established facts from uncertainty
  - avoid unsupported claims and never invent citations
  - point urgent-sounding situations toward professional/emergency care
  - explain plainly when a question can't be safely answered
- Answers render in a consistent structure: **Summary → Key information →
  Important considerations → When to seek medical care → Sources**.
- A fixed **safety disclaimer** is always shown beneath every answer,
  independent of what the model returns.
- Loading state (skeleton UI) while waiting on the API, and a graceful error
  state with a "try again" action if the request fails.

## Tech stack

- **[TanStack Start](https://tanstack.com/start)** — full-stack React
  framework (SSR + file-based routing) built on **TanStack Router** and
  **Vite**
- **TypeScript**
- **Tailwind CSS v4** for styling
- **[shadcn/ui](https://ui.shadcn.com/)** components (Radix-based primitives)
- **Anthropic API** (Claude) for generating answers, called only from a
  server function

## Project structure

```
src/
├─ routes/
│  ├─ index.tsx          # Main page — question form, loading/error states, answer
│  └─ __root.tsx          # App shell, <head> tags, error/404 pages
├─ components/
│  ├─ QuestionForm.tsx    # Question input + "Ask Assistant" button
│  ├─ AnswerPanel.tsx     # Renders the structured answer + loading skeleton
│  ├─ SourceCard.tsx      # One source citation card
│  ├─ SafetyNotice.tsx    # The fixed safety disclaimer
│  └─ ui/                 # Generic shadcn/ui components (buttons, cards, etc.)
├─ lib/
│  └─ assistant.server.ts # Server-only function + system prompt that calls the Anthropic API
├─ data/
│  └─ mockResponses.ts    # Types, example questions, and the original mock
│                          # answer generator (now unused, kept as reference)
└─ router.tsx              # Router + React Query client setup
```

## Getting started

You'll need [Node.js](https://nodejs.org/) (or [Bun](https://bun.sh/), which
this project also supports) and an [Anthropic API key](https://console.anthropic.com/).

```bash
git clone https://github.com/adhishmodi/ai-medical-and-research-assistant.git
cd ai-medical-and-research-assistant
npm i
```

Copy the example env file and add your key:

```bash
cp .env.example .env
```

```
# .env
ANTHROPIC_API_KEY=sk-ant-...
```

This variable is read only on the server (`src/lib/assistant.server.ts`) and
is never bundled into client-side code — do not prefix it with `VITE_`, and
never commit your real `.env` file.

Then start the dev server:

```bash
npm run dev
```

## How a request flows

```
User types a question
   → QuestionForm (client)
   → index.tsx validates it, shows loading state
   → askAssistant() server function call (RPC, no key on the client)
   → src/lib/assistant.server.ts calls the Anthropic API with ANTHROPIC_API_KEY
   → Model returns a structured JSON answer
   → Server validates the shape, or returns a friendly error on failure
   → index.tsx renders AnswerPanel (or the "try again" error state)
```

## What's next

Nothing below is implemented yet — this is the plan, not a changelog:

- **Source verification** — the model is instructed never to invent
  citations, but nothing currently checks its sources against a real
  database or link-checker. A verification step (or a curated source list
  per topic) would make citations more trustworthy.
- **Rate limiting / abuse protection** on the server function, since it's a
  public endpoint that spends API credits.
- **Automated tests** for `assistant.server.ts` (response parsing, error
  handling) and for the question-validation logic.
- **Conversation history / follow-up questions** — right now every question
  is a fresh, stateless request with no memory of prior turns.
- **Better error messages** distinguishing network failures, invalid API
  keys, and malformed model output, rather than one generic message.
- **Deployment** — picking and configuring a hosting target (the project is
  already set up for Cloudflare via Nitro, but this hasn't been deployed
  anywhere yet).
- **Accessibility and mobile polish** pass on the existing UI.
- **Retiring `mockResponses.ts`'s `getMockAnswer`** once the real API path
  is trusted, or repurposing it as an explicit offline/demo mode.

## Notes

- `src/data/mockResponses.ts` still contains the original hardcoded demo
  answers used before the real API was connected. It's no longer called by
  the app but is kept as a reference / potential offline fallback.
- See [PROJECT_SPEC.md](./PROJECT_SPEC.md) for the original design brief and
  [AGENTS.md](./AGENTS.md) for AI-assistant-specific project conventions.
