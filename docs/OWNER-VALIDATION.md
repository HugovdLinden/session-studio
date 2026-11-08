# Owner integration verification — 16 October 2026

Delivery: `esmayyork/gen-ai-course`, branch `session-studio-local-planner`, implementation `7360b710ffbd2d12c1eb252c0f04246dead67919`. The branch's later `1624aa3` commit changes delivery documentation only; the application directory matches the implementation commit.

Integrated only the application directory into the existing Site source. Owner baseline matched `b91911cf903938cb85f49b6a628c03c7de356b1a` exactly; no newer owner changes were present. Preserved the homepage design, example cards, phase-map component, Site ID/URL, DB binding, metadata migration and current invitation list. Restored custom/private access on the owner's explicit request. No GitHub main merge or GitHub push was performed for this integration.

## Recovery and hosted data

Recovery publication: Site version 4, `appgprj_6ac89bc61950819196db653ac26df2a0~appgver_ac8fdc2eeab08191875363d7c0b5d152`.

Saved a source archive and access/metadata backup privately outside the application source. Supported database inspection returned only `method_metadata`, with zero rows and no truncation. Version history contains four metadata-only releases; there is no deployed shared-project release to roll back. Migration files and journal match the owner baseline. No hosted schema migration, table drop, file deletion, R2 resource or server secret was required. The database tools expose user tables rather than an internal migration ledger; no ledger was modified.

## Integration adjustments

- Retained the existing double-diamond brand in the new project headers instead of the delivery's text diamond.
- Validated project edits before placing them in in-memory state. Invalid names/settings retain prior valid values, so recovery exports remain importable. Quota failures still retain valid unsaved work for export.

## Checks performed on this checkout

- `npm ci`: installed 686 packages from the committed lockfile.
- `npm run typecheck`: passed.
- `npm test`: all 50 tests passed, including isolated API/authentication tests, quota-failure storage fakes, stale-save rejection, imports, completion immutability and original planning constraints.
- `npm run build`: passed; routes are `/`, `/api/catalogue` and `/api/plan`.
- Preview used a disposable local metadata database. No production metadata mutation tests ran.
- Created a project from Home; generated 90-minute and 60-minute sessions; moved a block within its session using accessible controls and pointer dragging; moved a block between sessions and observed the destination overrun.
- Changed the second session to 70 minutes through its intake and regenerated it. Method search plus phase/mode filters returned Braindrawing; the phase diagram followed the selected phase.
- Approved and completed a session with outcome, decision and question notes; refreshed/reopened and verified completion remained read-only with notes intact.
- Exported a project and imported it as a distinct copy (two matching cards). Exported the browser backup and imported both entries as distinct additional copies (four cards).
- A second tab's edit caused the first tab's stale-data warning; Reload saved projects recovered the latest name. An invalid-name edit displayed a clear error and retained the previous valid value.
- Imported the previous single-draft browser value as a new approved project. Its original key is retained by the implementation; no direct browser-storage mutation or clearing was used.
- Desktop and 390px viewport checks covered Home and the project/agenda view. Actual document width was 375px without horizontal overflow. Native phone touch remains untested.
- Anonymous HTTP requests to the hosted root and catalogue return 401. Client-supplied identity headers do not bypass the gateway (401). Page and APIs require trusted Sites identity; there is no second application email allowlist.
- Active app/lib/package/hosting source has no Miro endpoints, QR/upload/project APIs, OpenAI endpoints, paid-model calls or corresponding credentials. No account setup was performed for those services.

## Verification limits

Quota failure is covered with deterministic storage fakes; an actual browser quota error was not induced. The implementation visibly reports save failure and retains unsaved state for export. Native touch and a second invited person's interactive sign-in were not exercised. The post-publication owner-account smoke check is recorded separately in the release handoff. Projects and notes remain browser/account-local, not shared or AI-interpreted.
