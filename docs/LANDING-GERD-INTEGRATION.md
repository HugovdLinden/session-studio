# Landing page and Gerd integration

Selective integration from `esmayyork/gen-ai-course`, branch `codex/session-studio-welcome-projects`, commit `6e36a8269e01c3915e5da7901fe0f2711691a30a`.

Only the opening-screen design, its transition and Gerd's appearance/interface were brought over. The current project gallery, intake, goal/session planner, catalogue, storage keys, migrations and hosting identity remain in place. The branch's older single-session state and storage implementation were not merged.

`app/welcome-experience.tsx` shows the opening screen on page load. Proceed fades/slides into the existing `ProjectsWorkspace`; reduced-motion preferences skip the animation. Existing Home buttons return to the current gallery. The opening page also permits library access. No saved project is modified by entering the workspace.

`app/gerd.tsx` and `app/gerd.css` retain the original assistant/avatar appearance with typed questions, optional voice dictation and spoken-reply controls. Dictation fills the input for review before sending. The panel remains available in session-planning dialogs and preserves its conversation across ordinary navigation. Closing/unmounting aborts pending requests and clears speech-recognition callbacks. The avatar comes from the same branch's `public/images/gerd-avatar.png`.

Gerd is intentionally not connected to an AI provider. `/api/gerd` uses existing Sites authentication, checks request origin and bounds inputs; GET reports `configured:false`, and valid POST returns a friendly 503 response. There are no provider requests, added secrets, paid calls or project mutations. This boundary is covered by service tests. Its eventual provider/model/source-knowledge connection is a separate piece of work.

The workspace passes a bounded current project/goal/session context to Gerd through `onGerdContext`. Context is transient and only submitted when the user sends a question. Gerd conversation is not written into project/browser persistence.

Local review checkouts under `outputs/` are excluded from TypeScript application checks, matching their existing exclusion from source-control delivery.
