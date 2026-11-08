# Personal graduation companion — local edition

This local addition is on `codex/graduation-companion`. The published group Site remains version 13. Do not deploy the local bridge or push private research/history to GitHub.

## Start and bookmark

Double-click **Start Graduation Companion.cmd** in the project folder. Keep its window running and bookmark **http://127.0.0.1:5181/**. Click the animated Codex pet to open Gerd. The panel shows the subscription connection status.

Alternatively run `npm run companion`. Requires Node 22.13+, installed dependencies and Codex signed in with ChatGPT. The launcher detects the Windows Codex executable and bundled Python. Other installations can set `COMPANION_CODEX_BIN` and `COMPANION_PYTHON`. Never supply an API key. The laptop, launcher and internet connection must remain available for AI replies.

## Context, conversation and skills

Put reference files in `graduation-context/`. Supported: Markdown, TXT, CSV, JSON, DOCX and text-based PDF. The panel lists extraction status. Scanned PDFs need OCR; PDF extraction requires Python plus pypdf. Hidden files and symbolic links are excluded. Limits: 60 documents, three directory levels, 10 MB/document, 16,000 characters/document and 48,000 characters overall. PDF/DOCX extraction is cached until the file changes.

No specialist skills are attached yet. Ask “Remember this decision: …” to save a note to `graduation-context/companion-notes.md`. Ordinary conversation does not automatically edit reference files.

The conversation identity and latest 200 displayed messages are stored in ignored `.companion/conversation.json`. Codex persists the conversation itself. Refreshing/restarting resumes the same thread. Do not share this state file publicly.

The connection panel shows `codex resume <thread-id>` for continuing in a terminal. **Stop the local companion launcher first:** a thread cannot have two active writers. Terminal replies are not automatically mirrored into the website transcript. Shared notes are reread on the next question. Desktop deep-link handoff is not implemented.

## Website controls

When asked, Gerd can navigate the current website, fill visible forms, select options and press its buttons. It receives labelled controls from the current screen, not arbitrary access to the computer. Each stage is validated against a fresh snapshot; stale screens are rejected. Navigation or submission ends a stage, and the next stage receives the new screen. Commands are bounded to ten stages. Every UI action batch is followed by a fresh verification turn, even when the model says no next step is needed. Generation waits up to 20 seconds for the intake busy state, and subsequent snapshots include validation messages, field values, selected phase states, goal headings and session-card count. Partial streamed replies never execute actions.

Submit, delete or rebuild actions require authorization in the human request; the model is instructed to preserve existing application confirmations. External websites, arbitrary scripts, password/file fields and the assistant's own controls are excluded. UI form edits use the application's normal validation and persistence. Generic website operations do not have a universal undo.

A separate validated timing action changes current/next session duration or existing activity duration atomically. It checks project revision, protects completed sessions, retains method timing floors and offers **Undo timing edit** until another project edit occurs. Stop reply or closing the panel cancels an in-flight answer; completed actions are not rolled back by cancellation.

Project agendas remain in browser/account storage. This local bookmark has a different origin from the hosted Site; import an existing project backup once to continue it here. Context files and companion conversation are separate from project JSON exports.

## Voice, responsiveness and pet

The main microphone button now starts an experimental **subscription voice conversation**, using Codex App Server’s native v3 WebRTC transport. This replaces browser dictation/read-aloud as the main voice path. Speak English; replies use the selected native conversational voice. This is not an embedded ChatGPT Voice page and its availability depends on the installed Codex version and account.

Open **Microphone & voice** beside the chat controls. Choose your input, use **Find microphones** if names are missing, and use the six-second level test before calling. The selected input feeds WebRTC directly. Stop the call before changing devices or voices. Start/Stop, microphone mute and reply mute are provided. Calls stop after 15 minutes, on panel close, connection loss or exhausted/unverifiable allowance. Audio tracks, connections and audio playback are released on stop. No raw audio is saved by this application; finalized transcripts join the existing private Gerd history.

Voice retains the same Gerd thread and project references. Website commands delegate to the backing agent, return validated structured replies, and run through the existing fresh-screen guards and verification loop. Partial transcripts never execute edits. The microphone pauses while a website command is being processed. Missing or invalid command responses fail visibly without applying that response’s actions.

**Test voice connection without microphone** checks the native connection and requests a short spoken greeting without capturing input. This does not verify your physical microphone, hearing quality or spoken command recognition. Those still require a human check. Browser permissions, audio playback restrictions and network transport can affect a call. Legacy browser dictation and Windows voice typing remain under **Voice & controls** as alternatives; their separate browser/system voices are not used for native voice replies.

Replies now stream their public answer with visible progress, reuse the loaded conversation and use low reasoning effort for conversation and medium for planner commands and verification. This reduces unnecessary setup work; actual response time still depends on the model and connection.

The launcher reuses OpenAI's built-in **Codex** pet (`pet_id: codex`) spritesheet, downloaded through the Pets connector:
https://cdn.openai.com/c6d7b0d0-3abf-40b5-9d0c-ecd2b9364692/codex-spritesheet-v4.webp

Local asset: `public/images/codex-companion.webp` (1536 × 1872, 192 × 208 frames). Existing animations represent idle, listening, thinking, speaking and error states. Reduced-motion preferences use a static frame. This does not change the selected pet inside ChatGPT.

## Billing and connection boundary

Only a ChatGPT account is accepted. API-key accounts are refused, common API-key environment variables are stripped from the child process, and there is no paid API fallback, purchase action or automatic top-up in this code. The bridge checks reported included allowance before every stage and pauses on exhausted or unverifiable limits. Account-level credit/top-up settings remain owned by ChatGPT. Concurrent use elsewhere can change limits while a reply runs.

The browser talks only to its same-origin local server. The bridge uses private stdio, loopback binding, Host/Origin checks and a per-launch mutation token. It does not send Codex credentials to the browser or expose arbitrary RPC methods. No standalone external service is installed.

Ordinary `npm run dev` leaves the bridge off. Production builds retain the existing unconfigured `/api/gerd` route. The bridge is development-only and enabled by `npm run companion`. Never expose the development server publicly.

## Verification

Typecheck, production build and 92 tests passed. Tests cover billing refusal, persistence, malformed responses, concurrent sends, document limits, cross-origin protection, timing validation, control-target validation, streaming parsing and voice preferences. A live subscription conversation successfully navigated to intake and filled only the requested Project name without saving/submitting a project. No paid API was used.

Physical speech recognition/audio playback remain unverified. The embedded browser had no synthesis voices. Automated Chrome navigation was marked cross-site and correctly rejected by local sign-in protection (HTTP 403). Security checks were retained. Open the bookmark directly in the Chrome address bar; if manual navigation also encounters this, report the error before relying on microphone control there.

Codex App Server is experimental. Protocol failures should remain visible rather than silently switching conversation or billing mode.

Voice recovery check: typecheck and 92 tests passed; browser UI verified that the Windows voice-typing button focuses the message field without submitting. User reported the embedded preview speech service returns a network error despite microphone access. End-to-end audible dictation still requires the user. Browser speech recognition support/reference: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition

## Application handoff and audio selection update

`docs/GERD-WEBSITE-HANDOFF.md` documents the workflow policy loaded from `scripts/companion/website-guide.mjs`. It covers goal fidelity, all diamond halves, schedule/count precedence, explicit creation authorization, verification and current rule-based generation limits. Existing conversations receive the versioned policy without losing identity/history. No specialist method skills were attached.

Voice settings now list input devices after permission, remember the choice and offer a six-second input-level test. Tests release all tracks and audio contexts on stop, close or failure. For an explicitly selected input the browser recognition request passes its live audio track; this feature is experimental and not implemented by every browser. It cannot repair an unavailable recognition service. Windows dictation continues to use the Windows-selected microphone. No recording is saved by the input-level test.

Saved reply voices are matched exactly. If a saved voice is unavailable, speech fails visibly rather than silently falling back to a system voice. Available automatic voices must be English; voice quality still depends on the browser/system catalogue. ChatGPT’s exact voice is not supplied.

Handoff verification: typecheck, production build and 95 tests passed. A live subscription-driven check opened a new unsaved intake, filled an exact goal sentence, selected Discover/Define only, and verified master level, participant count, total hours, schedule and session count. The test explicitly prohibited submission and correctly stopped before generation; it did not alter existing projects. Physical audio capture quality and selected-track compatibility remain device/browser checks.

## Latest interface and group handoff

The method replacement picker has draft filters with an explicit Apply filters button that updates results and collapses the filter panel; Clear filters resets immediately. Pet animations run roughly four times more slowly. Drag the pet or focus it and use arrow keys (Shift for larger moves); placement is remembered and bounded within the viewport/session overlay. In the lower half, chat opens above with normal chronological messages. In the upper half, it opens below, with composer/warnings first, newest messages first (scroll down for older messages), and the Gerd header at the bottom.

See `docs/GROUPMATE-AI-SETUP.md` for a copyable setup prompt. Verification: 97 tests pass; live browser checks confirmed dragging, both panel orientations, overlay bounds and applied filtering. No real agenda was changed during these UI checks.

## Subscription voice implementation verification

The account/voice probe verified a ChatGPT Plus account, included allowance, available native v3 voices and a WebRTC SDP answer without using the microphone. The website also reached a connected WebRTC state in the Codex preview with microphone capture disabled. Repeated calls then ended with native transport_closed before sustained speech/output could be verified; the installed native voice path is not yet established as usable. A v2 comparison and skipping live-context injection did not resolve the failure. Do not describe this as end-to-end human speech testing: physical audio and spoken website commands still need the user's check. Automated tests cover billing refusal, voice selection, call ownership, final-only transcript persistence and validated delegated UI actions. No API key or paid Realtime API fallback is configured.

See `docs/VOICE-MODE.md` for operation and limits. This is local development functionality; it is not added to the hosted group site by pushing source alone.

## Resizable chat controls

Microphone settings have their own sticky close button; Escape closes that settings section first. Drag any of the four chat corners to resize, or use the header +/− buttons. Corner handles also accept arrow keys (Shift for larger steps). The preferred size is saved in this browser and clamped to the screen/session overlay. Closing settings does not stop an active voice call. Browser checks verified corner dragging, independent settings closure, size buttons and size restoration after refresh; typecheck and 106 tests passed.
