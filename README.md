# Session Studio — browser-local planner

Preserves Sam's homepage and phase diagram with method search/filtering, categorized source catalogue, accessible agenda reordering, multiple session budgets, experience labels and completion notes.

Projects are saved per signed-in account and browser. Export/import JSON to back up or share work. No shared-project backend, paid AI requests, Miro integration or file uploads. The existing Sites visitor list and sign-in remain; the existing DB binding stores method-library metadata only.

## Run and verify

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run db:migrate:local
npm run dev
```

Use the existing Sites runtime scripts. On Windows, SITES_LOCAL_STATE may point to a short writable local-preview directory. Do not commit local runtime state or credentials.

## Main files

- app/home.tsx: Sam's homepage, local project cards and search.
- app/projects-workspace.tsx: local save/import/export, session programmes and completion.
- lib/local-projects.ts: storage conflict checks, file format and rule-based programme generation.
- app/studio.tsx: agenda editor and method browsing.
- app/phase-map.tsx: Sam's unchanged phase diagram.
- lib/recovered-methods.json and docs/METHOD-COVERAGE.md: recovered source procedures and remaining coverage gaps.
- docs/VALIDATION.md: completed verification and owner checks.

## Publish

Use [Sam's complete handoff prompt](../SAM-HANDOFF-PROMPT.md) and [publishing guide](../PUBLISHING.md). Existing published access and identity must be preserved. This branch does not deploy automatically and does not change main.
