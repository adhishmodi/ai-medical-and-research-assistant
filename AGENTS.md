# AGENTS.md

## Repository conventions

- This is a TanStack Start + Vite + Nitro application.
- Keep server-only modules named *.server.ts and never expose server secrets through VITE_* variables.
- Keep API/provider calls in server-only modules.
- The generated src/routeTree.gen.ts is runtime source and should be committed; do not hand-edit it when the route generator is available.
- Run npm run lint, npm test, and npm run build before considering a change complete.
- Do not add mock citations to live AI responses. Sources shown to users must come from trusted retrieval or the curated fallback.
- Preserve the visible medical safety notice and avoid diagnosis, individualized prescribing, or unsupported medical claims.
- Keep documentation synchronized with the actual provider, RAG, and deployment configuration.
