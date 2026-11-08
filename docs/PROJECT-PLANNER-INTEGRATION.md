# Project planner integration handoff

Implemented 21 October 2026. Scope: intake and project overview with embedded session agendas. Home styling and session execution/history remain owned by teammates.

## Current behavior

Projects contain goals and ordered session IDs. New intake uses selectable diamond halves, typed goals, expertise, participants and availability. Weekly/total availability initializes session lengths, including breaks and energizers. It is not an ongoing aggregate budget. A manual session count leads over optional weeks/frequency helpers.

The overview displays activity previews, base/completed/Next outlines, optional week markers, accessible reordering, empty-session addition and a right-side New goal panel. Only the first unfinished session is Next. Removal checks remaining sessions against half the originally planned count, rounded up; additions count toward the remaining number. Completed work and its prerequisites are protected.

Session agendas open in a desktop overlay/mobile surface. Changes save in the browser; closing preserves drafts. Individual time edits do not regenerate plans. Confirming a plan is distinct from session completion.

## Teammate integration

Listen for the browser event `session-studio:session-confirmed`. Its detail is `{projectId, goalId, sessionId, plan}`. This is a local UI integration event, not a cross-device synchronization mechanism. The confirmed snapshot can also be downloaded as JSON. Replace the current handoff surface with the team's execution screen when available.

Execution must explicitly write session `status: 'completed'` with a completion record. Confirmation only writes `approved`. History cards are inactive until a history screen is supplied.

## Existing data

Browser storage key remains account-scoped `session-studio-local-projects-v1:<userId>` for discovery compatibility. New payloads and exports use version 2. Version 1 reads/imports migrate flat sessions into a deterministic legacy goal without regenerating agendas, changing IDs or discarding completion data. Export before clearing browser data. Browser-local projects do not synchronize across devices or accounts.

## Facilitator boundary

Sam confirmed the Main facilitator currently exists as skill files only. There is no callable model service configured. The runnable fallback is labelled a local programme draft: it uses phase progression and recovered method knowledge, and does not interpret the typed goal. Do not represent this as live AI facilitation.

`lib/programme-service.ts` and `/api/programme` supply a provider-independent server adapter. Optional runtime secrets `FACILITATOR_ENDPOINT` (HTTPS) and `FACILITATOR_TOKEN` connect a separately deployed service. Neither secret is sent to the browser. `/api/programme` GET exposes only a configured boolean, to signed-in visitors.

The POST request sends the typed goal, context, selected cycle instances, requested session skeletons and method knowledge. The service returns `{sessions: Session[]}` matching the supplied IDs and per-session settings. It may interpret purpose/output/dependencies and choose documented methods; it cannot invent method identity, instructions, constraints, completion or participant counts. The adapter validates before replacing saved work and surfaces failure without silent fallback. Existing staged-method dependencies are checked within the affected goal.

No paid model account, credentials or external facilitator deployment has been created by this change.

## Defaults chosen during implementation

- Initial availability is rounded to whole minutes per session. Initial duration is limited to 10–720 minutes; requested session count is limited to 120 per project.
- Manual count stays fixed until Recalculate is selected.
- New goals may be added before a prior goal completes and inherit setup for review.
- Goal intake replacement requires explicit acknowledgement if existing agendas would change; protected completed work and prerequisites remain.
- Fixed participants during explicit pinned-method replanning remains provisional for Sam's follow-up.

## Validation

- 66 automated checks passed: migration/storage, method constraints, removal floor with additions, cross-goal completion checks, facilitator response grounding and authentication.
- TypeScript and production build checked.
- Browser checks: twelve-session project; new goal with manual count and blank schedule helpers; empty session; icebreaker insertion; 35-minute duration surviving close/reopen; confirmation handoff without completion; accessible session reordering; desktop and 375-pixel mobile layouts without horizontal overflow.
- No live facilitator call was tested because no callable facilitator exists yet. Execution/history screens and shared multi-device persistence remain outside this change.
