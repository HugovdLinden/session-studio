# Project planner — development plan

Updated 21 October 2026. Implementation authorized and underway. See PROJECT-PLANNER-INTEGRATION.md for implemented behavior and the pending live facilitator connection. GitHub changes remain separate from Site publication.

## Confirmed scope

We own intake and project planning. Teammates own Home and session execution/history. Preserve their screen designs and agree shared data/navigation contracts.

Project → goals → ordered sessions → existing agendas → activities and steps.

## Intake

- Project name/description, expertise, participants, typed goal, availability, weeks, sessions per week and authoritative session count.
- Availability is elapsed session time INCLUDING breaks and energizers. Weekly/total availability initializes individual session durations, divided over the initial sessions.
- Never track ongoing goal/project time totals, remaining budgets or cross-session time warnings. Time tracking and warnings exist only inside sessions.
- Weeks × sessions/week initially fills count. Manual count leads and works without helper values. Proposal: retain a manual override until explicit recalculation.
- Interactive diamond phases replace the dropdown. Click to select/deselect. Every additional diamond is a single Develop/Deliver cycle with its own identity.
- The facilitator must interpret the typed goal and generate a coherent programme, rather than attach goal text to independent generic plans.

Example: 4 weeks × 3 sessions/week = 12 sessions. 14 hours/week initially averages 4h40 per session including breaks. No ongoing aggregate time tracking follows.

## Overview and session editing

- Show each goal with an ordered grid of session boxes and compact activity previews. No session names, dates or independent session goals.
- Every box has an outline. Base, completed and next have distinct colours plus labels/icons.
- Confirmed next rule: only the first unfinished session is marked Next. Confirmation is distinct from execution completion.
- Completed sessions remain inactive links until teammates provide history.
- Opening a session shows the existing editable agenda in an approximately 80% desktop overlay, nearly fullscreen on mobile. Closing saves a draft; confirmation emits a handoff to the execution screen.
- Preserve expandable method/step explanations, replacements, breaks, energizers, activity addition/removal and accessible dragging.
- Add session opens an empty agenda with an editable session duration. Reorder sessions within their goal through dragging or accessible move controls.
- The removal safeguard checks the number of sessions remaining, not cumulative deletions. Retain at least half the original planned count (rounded up). Added sessions count toward the remaining total. Example: 12 originally planned sessions require at least 6 remaining; adding 2 permits 8 removals before that floor is reached. Do not maintain a cumulative deletion allowance.

## Existing agenda rules retained

- Novice: three eligible alternatives. Bachelor: three recommendations plus same-category methods. Master: full library organised by category, no recommendations. Replacement methods also have expandable details.
- Method time minimum: 60% of advised time, rounded up to whole minutes.
- Activity-time editing updates the session total/warning, without regenerating the plan.
- Bachelor/master method replacement breaking participant constraints or exceeding session availability by more than 30 minutes shows a warning. Dismiss accepts the violation; Make new planning based on this method explicitly replans while retaining that method. Replanning may increase session duration; it must not silently rebuild other sessions.
- Fixed participant count during replanning is provisional: the user explicitly intends to revisit it.
- Intake changes may require replanning. Proposal: clearly show affected uncompleted plans before replacement and preserve completed work.

## Another goal

Underlined New goal text/divider opens a side panel. Prefill participants; collect typed goal, availability, weeks, frequency and authoritative count. Append the new goal and its sessions while preserving previous work. No goal time tracking. Phase inheritance and concurrent goals remain implementation proposals rather than confirmed restrictions.

## Implementation sequence

1. Agree versioned project/goal/session contracts with teammates. Migrate flat projects into a legacy goal, preserving IDs, agendas, completion records and account scope. Do not infer a programme during migration.
2. Build revised intake, phase-cycle selection and calculated/manual count inputs.
3. Build goal/session grid, outline states, optional week dividers, new-goal panel and add/remove/reorder interactions.
4. Extract the current agenda editor into the overlay. Keep time warnings local and provide stable draft/confirmation callbacks to teammates.
5. Connect a server-side programme facilitator adapter. Input: typed goal, context, phase cycles, expertise, participants, individual session durations and method knowledge. Output: ordered, coherent sessions with recognised method/step references. Validate output before saving; keep provider credentials out of the browser. Preserve saved work on generation failure and identify any fallback explicitly.
6. Verify the three journeys, migration/export compatibility, manual counts, deletion boundary, repeated diamond cycles, session-only warnings, completion handoff, mobile and keyboard interactions.

## Findings from Milo and release review

The current browser programme generator creates sessions independently and bypasses the single-session API. Updating only the existing chief will not connect typed-goal interpretation. Add the programme adapter at the actual project-generation boundary.

Current storage/export schemas assume a flat list, a categorical goal, a single phase and a 12-session maximum. Version/migrate these deliberately. Typed goal text must remain separate from method categories. Repeated Develop/Deliver cycles need stable instance IDs, not a deduplicated phase list. Never truncate saved sessions or reset edited durations on reload to reconcile count inputs.

Participant locking should remain a policy rather than a permanent schema restriction while awaiting the user's follow-up.

## Confirmed follow-up decisions

1. Only the first unfinished session is marked Next.
2. The removal safeguard uses the number of sessions left, including additions, rather than the total number of deletions. The original planned count supplies the halfway reference.

Other defaults to document during implementation: manual-count override reset, initial duration rounding, phase inheritance, count changes affecting existing drafts, and explicit regeneration previews. Do not treat these proposals as confirmed user rules.


