# Final V1.5.2 — really this one now final

This branch contains Sam's current local integration of Session Studio: the existing home, intake, lavender project planner and Gerd companion, plus the session runner, method templates, uploads, board and exports.

The ending overview includes **Elapsed time** in minutes:seconds, calculated from this browser/account's saved activity timers. Pauses and time outside the runner are excluded. Countdown timers stop at zero; resetting an activity timer clears its recorded time. This is a local timing summary, not a cross-device attendance log.

The activity QR heading is **Upload to project workspace**. Uploads still attach to the selected activity's stable workspace frame.

## Setup

From `session-studio/session-planner`, use Node 22.13 or newer:

```text
npm ci
npm run db:migrate:local
npm run dev -- --host 127.0.0.1 --port 5184 --strictPort
```

For the local subscription-based assistant, use `npm run companion` instead; it starts the app on port 5181. Each groupmate uses their own Codex sign-in, companion conversation and `graduation-context` folder. See `GROUPMATE-AI-SETUP.md` and `GRADUATION-COMPANION.md` for the full handoff. The special two-server connection used during integration review is documented in `LOCAL-INTEGRATION-PREVIEW.md`; a normal installation does not need two servers.

Only source, shared assets and setup documents are included. Browser projects, local uploads/databases, conversation history, private context documents, dependency folders and credentials are excluded. Existing repository planning references and skill materials remain in their original folders.

This is a source branch, not a hosted deployment. Real phone uploads require an accessible hosted preview and an invited account. The local QR preview does not make the computer accessible to phones automatically.
