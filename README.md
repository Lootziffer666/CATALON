# CATALON

CATALON is a deterministic UI pipeline demo with **A2UI as the single source of truth (SSOT)**.

## Current verified minimal flows

1. **Composer gate**: prompt -> structured `A2UI` JSON (`composePromptToA2UI`).
2. **Preview gate**: `A2UI` JSON -> reproducible render instruction plan (`createRenderPlan`).
3. **Executor gate**: approved `A2UI` JSON -> scoped file mutation plan only (`planScopedMutation`).
4. **Self-healing gate**: known break (`overflow-hidden-with-scroll`) -> rule-based fix (`applyKnownLayoutFix`).

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000/atelier`.

## Environment hygiene

- `.env.local` exists and currently contains local placeholder values.
- `.env*.local` is already gitignored.
- For sharing, prefer a separate `.env.example` with non-secret defaults.

## Build status policy

Use `BUILD_STATUS.md` as an honest operational log, not a marketing statement.

## API gateway evaluation

See `docs/api-gateway-evaluation.md` for a focused feature-fit review against CATALON needs.
