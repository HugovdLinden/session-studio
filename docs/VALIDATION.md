# Validation — browser-local planner (16 October 2026)

This release is on `session-studio-local-planner`, preserving Sam's homepage and unchanged phase-map component. Main, the prior draft branches and the live Site were not modified.

## Automated verification

- **50 tests passed** with `node scripts/test.mjs`.
- **TypeScript passed** with `node node_modules/typescript/bin/tsc --noEmit`.
- **Production build passed** with `node scripts/run-framework.mjs build`.
- The build exposes only `/`, `/api/catalogue` and `/api/plan`; the project/upload/sync APIs are removed.
- Source scan of app/lib/package/hosting configuration found no Miro endpoints, OpenAI API endpoints/credentials, QR dependency, project API calls or extra team email configuration.
- Hosting manifest, DB schema and migration journal match the metadata-only main baseline. No new storage resource or migration is required for that baseline.

Tests cover original planning and source-integrity rules, filtering, block preservation and reordering, stage constraints, immutable completed sessions, legacy intake/draft/approved import, overruns, browser storage round trips, malformed storage, stale-save rejection, quota failures, per-account keys, portable export/import, restoring browser backups as new copies, unequal session budgets, completed-session preservation, and infeasible-session errors. API tests use isolated SQLite and simulated Sites identity: sign-in remains required, cross-origin catalogue writes are rejected and authenticated Site users do not need a second email list. The rule-based endpoint works without model credentials.

## Browser checks

Created a local project from Sam's new-project card. Generated 90-minute and 60-minute agendas, moved Introduction between them, and saw the destination overrun warning. Refreshed the page, reopened the project and confirmed the saved 85/90-minute source agenda and moved block. Exported JSON, imported it through the file picker, and confirmed two separate project cards with the same retained agenda contents. Recorded completion outcomes successfully on the imported copy. A change in a second tab produced the stale-tab alert in the first tab; reloading saved projects recovered the current state. Reviewed the homepage at desktop and 390px mobile width: document width 375px, no horizontal overflow.

The download created a disposable local verification JSON file in Downloads; it is not included in the repository. No real teammate or hosted project data was used. Storage quotas/corrupt data were tested through deterministic storage fakes, not by damaging browser data.

## Remaining owner checks

Sam's editing chat must reconcile any newer Site source, run the commands again on that checkout, verify the actual Site invitation gate, and publish through the existing owner workflow. The existing invited-user list was not changed or re-created. Hosted publishing and real second-account access were not exercised here. Native phone touch behavior remains an owner smoke check; mobile verification here used a browser viewport.

Projects are browser-local, not automatically shared. JSON export/import transfers copies. The planner uses fixed rules and does not interpret evidence or project notes. The replacement canvas is not connected. Missing source procedures remain unavailable for scheduling, and facilitator estimates still require practical validation. No AI or Miro accounts need configuring for this release.
