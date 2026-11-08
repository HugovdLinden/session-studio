---
name: Session Studio
description: A calm working surface for planning and reviewing design sessions.
colors:
  ink: "#17243a"
  muted: "#546277"
  accent: "#2454d6"
  accent-hover: "#1b43b4"
  canvas: "#f3f5f9"
  surface: "#ffffff"
  line: "#dbe1ea"
  field-line: "#bfc9d8"
  placeholder: "#637186"
  focus: "#789bff"
  secondary-hover: "#edf1f7"
  navigation-active: "#edf2ff"
  icon-active: "#eaf0ff"
  selected-field: "#eef3ff"
  operational-surface: "#f9fafc"
  diverging-ink: "#643a9e"
  diverging-surface: "#f0e9fb"
  reverging-ink: "#136459"
  reverging-surface: "#e1f3ee"
  converging-ink: "#865109"
  converging-surface: "#fff0d5"
  resting-ink: "#48586b"
  resting-surface: "#e9edf2"
  organisation-ink: "#475977"
  organisation-surface: "#eaf0fa"
  success: "#196947"
  danger: "#a52d3d"
  danger-surface: "#fcecf0"
  danger-line: "#edbfc8"
  warning: "#77510b"
  warning-surface: "#fff6e2"
  warning-line: "#e8cd8b"
typography:
  headline:
    fontFamily: "Segoe UI, Inter, Arial, sans-serif"
    fontSize: "2rem"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-.025em"
  section:
    fontFamily: "Segoe UI, Inter, Arial, sans-serif"
    fontSize: "1.4rem"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "-.015em"
  title:
    fontFamily: "Segoe UI, Inter, Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 650
    lineHeight: 1.35
  body:
    fontFamily: "Segoe UI, Inter, Arial, sans-serif"
    fontSize: "16px"
    lineHeight: 1.6
  control:
    fontFamily: "Segoe UI, Inter, Arial, sans-serif"
    fontSize: ".9375rem"
    fontWeight: 600
    lineHeight: 1.4
  label:
    fontFamily: "Segoe UI, Inter, Arial, sans-serif"
    fontSize: ".875rem"
    fontWeight: 600
  caption:
    fontFamily: "Segoe UI, Inter, Arial, sans-serif"
    fontSize: ".8125rem"
  badge:
    fontFamily: "Segoe UI, Inter, Arial, sans-serif"
    fontSize: ".75rem"
    fontWeight: 600
    lineHeight: 1.3
rounded:
  badge: "5px"
  step: "6px"
  control: "8px"
  candidate: "12px"
  surface: "14px"
  circular: "50%"
spacing:
  tight: "4px"
  compact: "8px"
  control-gap: "12px"
  row-gap: "16px"
  form-gap: "18px"
  inset: "20px"
  panel: "24px"
  section: "28px"
  page: "32px"
  spacious: "40px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "12px 18px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "12px 18px"
  button-secondary-hover:
    backgroundColor: "{colors.secondary-hover}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: ".72rem .85rem"
  navigation:
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "9px 12px"
  navigation-active:
    backgroundColor: "{colors.navigation-active}"
    textColor: "{colors.accent}"
  category-diverging:
    backgroundColor: "{colors.diverging-surface}"
    textColor: "{colors.diverging-ink}"
    typography: "{typography.badge}"
    rounded: "{rounded.badge}"
    padding: "5px 9px"
  activity-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "20px 24px"
  candidate-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.candidate}"
    padding: "16px"
  warning:
    backgroundColor: "{colors.warning-surface}"
    textColor: "{colors.warning}"
    rounded: "{rounded.control}"
    padding: "14px 16px"
---

# Design System: Session Studio

## Overview

**Creative North Star: "The Workshop Desk"**

Session Studio is a calm working surface for designers preparing a workshop. White surfaces, cool grey surroundings and ink typography support repeated inspection and editing. Blue identifies actions; restrained category tints help people scan an agenda without overwhelming its content.

The user's sketches establish a stacked agenda, progressively disclosed method and step guidance, and opposing intake and replacement panels. The simple double-diamond identity connects the workspace to the design process. This document consolidates the first build's provisional direction from its CSS and components; it does not record visual approval or a rendered accessibility audit.

**Key Characteristics:**

- Clear task hierarchy and restrained functional colour.
- Readable system sans with tabular minutes.
- Stacked agenda and nested native disclosures.
- Flat working surfaces; elevated dialogs only.
- No marketing sections or decorative imagery.

## Colors

The palette places cool neutral surfaces behind ink text and uses saturated blue sparingly to identify actions.

### Primary

- **Workshop Blue** (`accent`): primary actions, identity mark, text actions, selection borders and replacement targets. `accent-hover` deepens primary buttons on hover.
- **Focus Blue** (`focus`): the visible keyboard outline, distinct from the button fill.
- **Quiet Blue** (`navigation-active`, `icon-active`, `selected-field`): pale fills for active navigation, icon controls and selected experience options.

### Secondary

- **Muted Violet** (`diverging-*`), **Workshop Teal** (`reverging-*`), **Soft Amber** (`converging-*`), **Rest Slate** (`resting-*`) and **Process Slate** (`organisation-*`): category text and pale badge surfaces. These classify methods rather than compete with actions.
- **Completion Green** (`success`): within-budget totals, ready library records and approved handoff status.
- **Constraint Red** (`danger`, `danger-surface`, `danger-line`): invalid or incompatible values and over-budget status.
- **Caution Amber** (`warning`, `warning-surface`, `warning-line`): constraint notices that require a conscious decision.

### Neutral

- **Ink** (`ink`): headings, input values and primary content.
- **Cool Slate** (`muted`, `placeholder`): supporting copy, captions and placeholders.
- **Cool Canvas** (`canvas`): surrounding workspace; **White Surface** (`surface`): forms, methods and panels.
- **Quiet Operational Surface** (`operational-surface`): session organisation activities.
- **Cool Divider** (`line`) and **Field Stroke** (`field-line`): structural separation and editable-control boundaries.

**The Labelled Colour Rule.** Category and constraint colours always accompany text; colour alone never explains a method or warning.

## Typography

Use the existing Segoe UI, Inter, Arial, sans-serif stack throughout. Segoe UI leads on Windows; the implementation does not bundle a custom typeface. Type is compact and readable, with sentence case and modest heading weight rather than large editorial contrast.

### Hierarchy

- **Headline**: project and screen titles. On the planning surface it reduces to 1.7rem at the mobile breakpoint and 1.5rem on narrow phones.
- **Section**: intake, approval and grouped sections; panel and dialog headings use slightly smaller local variants.
- **Title**: agenda method names; replacement names use 1rem.
- **Body**: explanatory paragraphs. Method summaries and action controls use the smaller control scale; detail text and form labels use the label scale.
- **Caption and badge**: provenance, timing annotations, categories and source references. Keep them subordinate to the method name and decision.

The intake introduction's 2.8rem heading is a local screen treatment, not a new global display role. Library description copy is constrained to 65ch; intake introductory copy to 40ch on desktop.

**The Stable Minutes Rule.** Use tabular numerals for durations, elapsed-time labels, budget totals and catalogue ratings.

## Layout

The shell uses a white topbar (76px desktop, 64px at 800px and below), a cool canvas, and centred working areas. The agenda container is capped at 970px including horizontal padding; the intake and library caps are 1200px and 1180px. Desktop page padding is 32px; planning reduces to 24px at 1100px, 20px at 800px, and 12px at 480px.

The signature agenda grid pairs a 52px time rail with the method column and a 16px gap. Numbered circular markers connect with a fine vertical line; elapsed minutes stay adjacent to each method. At 1100px the rail becomes 38px with a 10px gap, and at 480px it becomes 30px with an 8px gap. The approval section aligns with method content below the agenda.

Intake uses two main columns and a two-column form; the main layout stacks at 800px and the form stacks at 480px. Desktop drawers occupy 370px at the corresponding edge, narrowing to 330px at 1100px, while agenda margins reserve that space. At 800px and below they become modal panels with a viewport-bounded width currently capped at 420px; the background workspace is inert and page scrolling is locked. The pinned direction calls for full-width mobile panels: this width mismatch is an implementation follow-up, not a reusable invariant.

Use the documented spacing steps for component rhythm. Preserve generous separation between methods and compact grouping within each method. At the mobile breakpoint the library replaces its table header and four-column records with stacked content. Above 1550px open drawers receive an additional centred outer margin.

## Elevation & Depth

Working cards and desktop panels are flat, separated by cool strokes, surface tones and spacing. The only shadows are structural overlays: dialogs use `0 20px 65px rgba(17,31,55,.2)` with a dark translucent backdrop; mobile drawers use `0 12px 60px rgba(17,31,55,.25)`. Do not apply these shadows to resting agenda cards.

**The Working Surface Rule.** Use borders and tonal separation for ordinary content; reserve shadows for modal overlays.

Motion describes state changes: buttons transition background, text and border colour over .16s; disclosure chevrons rotate over .18s; agenda margins transition over .2s. Reduced-motion CSS disables transitions, and programmatic scrolling uses an immediate jump when the reduced-motion preference is enabled.

## Shapes

Controls have gently curved corners (`control`); category badges are slightly tighter (`badge`), while method and intake surfaces use the broader `surface` shape. Replacement cards and the library container use `candidate`. Step numbers use compact outlined squares (`step`), and agenda markers are circular. Ordinary boundaries are 1px; replacement targets use a 2px dashed blue outline with a 3px offset. Keyboard focus uses a 3px outline with a 3px offset.

## Components

### Buttons

Primary buttons combine blue fill, white text, modest semibold type and the control radius. Standard buttons have a 44px minimum height; secondary buttons use white fill and the field stroke. Hover changes fill without translating or lifting. Small buttons use 7px 12px padding and a 36px minimum height. Disabled buttons have half opacity and a not-allowed cursor; retain their labels. Compact icon controls use quiet slate and a pale blue active or hover fill.

### Inputs / Fields

White editable fields use the field stroke, control corners and .72rem .85rem padding. Labels sit above values with an 8px gap; optional text is quieter and normal weight. Focus uses the common visible outline. Invalid goal selection is explicitly labelled and accompanied by a text notice. Experience radio options have bordered tiles; their selected state adds a pale blue fill and blue border.

### Navigation

The topbar places the double-diamond identity at the left and the library/back action at the right. Navigation uses compact semibold text with quiet default colour and pale blue hover or current fill. The private-workspace annotation disappears at the mobile breakpoint.

### Chips

Category badges use the badge typography, 5px 9px padding and category-specific pale fills with dark text. They are descriptive labels, not clickable filters. Provenance badges distinguish demo estimates from saved library ratings. Unclassified records currently have no explicit colour pair; do not promote that omission into a category style.

### Cards / Containers

Agenda cards use white fill, cool borders, surface corners and 20px 24px padding, reducing through 18px to 14px on narrow screens. Organisation activities use a quieter fill. Replacement cards use 16px padding and tighter corners, pairing category and metadata with an explicit Replace action. Ready replacement records may also be dragged, but the button provides the same operation without dragging.

### Agenda disclosures and timing

Method disclosures show name and takeaway before expanding input, materials and steps. Each step has its own native disclosure for longer guidance. Chevrons rotate when open. Timing fields use tabular numbers and compact widths; read-only handoff cards retain timing text and disclosures. The selected replacement target is outlined and described in text.

### Panels and dialogs

Intake opens on the left; replacement choices open on the right. Each panel has a separated heading, explicit close control and independently scrollable body. Mobile panels carry dialog semantics, focus containment and focus restoration. Metadata and constraint decisions use native modal dialogs, with text explaining the decision before actions. Constraint notices use text alongside their icon and colour.

## Do's and Don'ts

### Do:

- **Do** keep method names, timing and the next action easy to scan.
- **Do** use tabular numerals for timing and labelled colour for categories and constraints.
- **Do** retain visible keyboard focus and native disclosure controls.
- **Do** preserve the opposing panels and stacked agenda established by the user's sketches.
- **Do** keep provenance and uncertain estimates visible in quiet supporting text.

### Don't:

- **Don't** introduce marketing sections or decorative imagery into the working app.
- **Don't** use colour alone to communicate a category, error or constraint.
- **Don't** add shadows to ordinary resting cards.
- **Don't** turn local introductory typography into a global display scale.
- **Don't** treat implementation gaps or unverified rendered behaviour as approved design rules.
