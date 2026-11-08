# Project workspace — storage, migration, export/import and limits

The planner (projects, sessions, agendas, completion notes) stays **browser-local**, exactly as in the local-planner delivery. Each project can additionally have one **online workspace**: a read-only, Miro-style board where photos, PDFs and notes are collected, commented on and arranged by session and agenda block, plus a step-by-step **session runner** with method templates.

## Why the workspace is online

QR-code uploads come from participants' phones. A phone cannot write into the facilitator's browser storage, so workspace content is stored on the Site:

| Data | Where | Notes |
| --- | --- | --- |
| Projects, sessions, agendas, completion notes | Browser `localStorage` (`session-studio-local-projects-v1:<user>`) | Unchanged from PR #4. |
| Link from a project to its workspace | Inside the local project (`workspace.boardId`) | Saved before the workspace opens; a storage failure stops the navigation and is shown. |
| Workspace records: boards, items, comments, templates, current step | Site D1 (`DB` binding), tables `board`, `board_item`, `board_comment`, `board_template` | Added by migrations `0001_live_board.sql` and `0002_session_runner.sql`. Additive only. |
| Photos and uploaded PDFs | Site R2 (`BUCKET` binding) | Photos are resized on the device to max 2000 px JPEG before upload (≤ 12 MB); PDFs ≤ 20 MB. Never stored in `localStorage`. |

No paid service, model call, API key, Miro app or second email list is involved. Every workspace route requires the Site's existing sign-in (`member()` + same-origin check, as for the planner routes); pages redirect to Sites sign-in.

## Who can see workspace content

**Anyone on the Site's existing invited-user list who has a workspace link or QR code** can view it, upload, comment, delete (soft, restorable) and fill in templates. There is no per-project permission. Participants who scan a QR code must therefore be on Sam's access list and sign in on their phone. Projects themselves remain private to the browser; nothing about a project is shared except what is mirrored into its workspace (project name/description and the sessions' agendas).

This is shared online storage, not live collaboration on the planner: two people editing the same project's agenda in different browsers still work on separate local copies.

## How the planner and workspace connect

- **Project page → Project workspace panel**: *Create / Open workspace* and a header *Workspace* button. Material is added once a session is running: the runner's start page takes material before the session (drag-and-drop or QR), and each step has its own QR code. Opening mirrors the project's current sessions into the board (`PUT /api/boards/:id/project`).
- **Start session (version 10)**: after a session plan is confirmed, *Start session* still saves the plan and dispatches `session-studio:session-start-requested`, then opens the session runner at `/board/:id/run?session=<sessionId>`. With several goals, each session is labelled "Goal · Session n" on the board.
- The board and runner link back with `/?project=<projectId>&session=<sessionId>`, which reopens that project and session.
- **Frames use stable block IDs** (`Activity.instanceId`). Reordering a block, or moving it to another session, keeps its uploads, comments and template. If a block is removed, its uploads move to *General*; its template is kept.
- The planner remains the source of truth. The rule-based planner does not read or interpret workspace content; users record outcomes manually.

## Completed sessions

Completing a session stores a fixed **workspace summary** in its completion record (`completion.workspace`: board id, time, item count and a text summary of notes and templates). Completed sessions stay immutable, so this record remains understandable even if the workspace is edited later. If the summary cannot be loaded, the user is asked whether to complete without it.

## Export, import and copies

- **Project backup (JSON)** keeps the workspace link (`workspace.boardId`) and any completion summaries. It does not contain photos or PDFs.
- **Importing** (project file or browser backup) always creates a new project. The original's workspace link is removed and recorded only as `workspaceCopyFrom`. The project shows *Copy and open workspace*; that duplicates every item, comment, file and template into a new board owned by the new project, so edits never reach the original.
- If the original workspace is unavailable (deleted, or on another Site), the copy fails visibly and the imported project keeps working without a workspace. Use **Export → Download board (PDF)** on the original for a portable record of photos, notes, comments and templates.
- Downloads: documents are **PDF** (plan, board, blank templates) and images **PNG** (photos, QR codes); uploaded PDFs download as PDF. JSON is only the project backup format.

## Migration from earlier data

- Planner projects and backups made before the workspace existed import unchanged (`workspace` and `workspaceCopyFrom` default to `null`).
- PR #4's legacy single-draft import is unchanged.
- Boards created by the earlier stand-alone workspace prototype (single plan per board) are read as one session called *Session*.
- The prototype's own browser project list (`session-studio-projects-v1`) was never published and is not imported.

## Size limits

The workspace mirrors every session's agenda (about 15 KB per full session). Programmes beyond roughly 100 full sessions are refused with a clear message instead of failing in the database; split goals into separate projects.

## Failure handling

- Workspace save failures in the planner show an error and do not navigate; *Retry* saves the link.
- Stale-tab detection from PR #4 also disables workspace opening.
- Upload failures show per-file errors with *Retry*. Server or storage outages show the board's error state and "Reconnecting…".
