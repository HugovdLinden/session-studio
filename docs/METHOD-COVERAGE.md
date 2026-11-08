# Method catalogue coverage audit

Audit date: 14 October 2026. Scope: all 107 indexed records in `lib/discovery.json`, including the eight Delft index aliases already implemented in `lib/catalogue.ts`.

## Result and interpretation

- Delft: 58 newly recovered runnable procedure summaries, eight existing procedures preserved, and one combined instrument entry needing verification (PrEmo & Photo-Elicitation).
- Road Map: 40 entries remain **source unavailable**. The supplied 30-page preview ends before the method catalogue; a title in a contents list is not a procedure. Similarly named Delft methods have not been copied into Road Map records.
- The new procedure summaries are original paraphrases of the supplied Delft scans. Most source pages contain a short practical workflow, not exhaustive professional instructions. Required external templates, instruments, research competence and prior evidence remain explicit prerequisites.
- All new active-work durations, difficulty labels and default design-team ranges are **editable facilitator estimates**. They are not book ratings. Source research sample guidance and real exposure durations are recorded separately. Brainstorming & Brainwriting retains its explicit source group constraint of 4–15.
- Phase, thinking-mode and goal mappings are facilitator interpretations based on the described use. They are not ratings asserted by the book. Existing IDs and the original eight methods are not replaced.
- Multi-session stage boundaries are supplied only for documented preparation/research/analysis phases or other explicit substantive stages. Their notes identify recruitment, homework, fieldwork, waiting and fabrication. An estimate never certifies that those activities fit within the active workshop time.

## Evidence and audit method

Primary local source: `../skills/lead-creative-session-facilitator/references/books/delft-design-guide.pdf` (relative to the application directory). The 219-page file is image-only. Rendered pages were locally OCR-read; irregular ordering, headings and ambiguous numeric constraints were checked against page images. The relevant method range is PDF positions 75–212. The table below records actual one-based PDF positions, not an inferred offset. The scan contains out-of-order pages (for example Synectics and Brainstorming, and Experience Prototyping and Wizard of Oz), blank/duplicate images, and a tablet page counter that differs from both PDF position and printed page.

The eight supplementary photographs in `references/books/delft-supplement/` cover Design Drawing as a Language, Reasoning in Design, Basic Design Cycle, Product Innovation Process and related diagrams. Their existing visually recovered records in `references/delft-models-and-drawing.md` support framework guidance; they do not supply additional method-catalogue protocols. They are not counted as newly recovered activities.

Road Map evidence: `references/books/road-map-preview-30-pages.pdf` and the existing verified `references/road-map-preview.md`. Front matter and printed pp. 1–21 supply facilitation principles; the named method chapters appear only in contents. Procedure retrieval requires the full relevant passages.

Reproducible data build: run `python scripts/build-recovered-catalogue.py` from the application directory. This rebuilds the reviewed JSON and this report from authored paraphrases; it does not turn arbitrary OCR into executable instructions. Original OCR and page images are temporary audit material and must not be published as application assets.

## Delft entry-by-entry coverage

| Existing index ID | Method | Status | Retrieval / remaining requirement |
|---|---|---|---|
| `index-delft-contextmapping` | Contextmapping | Recovered | Printed p. 83; supplied PDF position 75. |
| `index-delft-thing-ethnography` | Thing Ethnography | Recovered | Printed p. 85; supplied PDF position 77. |
| `index-delft-cultural-probes` | Cultural Probes | Recovered | Printed p. 87; supplied PDF position 79. |
| `index-delft-user-observations` | User Observations | Recovered | Printed p. 89; supplied PDF position 81. |
| `index-delft-interviews` | Interviews | Recovered | Printed p. 91; supplied PDF position 83. |
| `index-delft-questionnaires` | Questionnaires | Recovered | Printed p. 93; supplied PDF position 85. |
| `index-delft-focus-groups` | Focus Groups | Recovered | Printed p. 95; supplied PDF position 87. |
| `index-delft-ecodesign-strategy-wheel` | Ecodesign Strategy Wheel | Recovered | Printed p. 97; supplied PDF position 89. |
| `index-delft-ecodesign-checklist` | Ecodesign Checklist | Recovered | Printed p. 99; supplied PDF position 91. Bring the actual Ecodesign Checklist. |
| `index-delft-fast-track-life-cycle-analysis` | Fast Track Life Cycle Analysis | Recovered | Printed p. 101; supplied PDF position 93. |
| `index-delft-swot-search-areas` | SWOT & Search Areas | Recovered | Printed p. 103; supplied PDF position 95. |
| `index-delft-trend-foresight` | Trend Foresight | Recovered | Printed p. 105; supplied PDF position 97. |
| `index-delft-brand-dna` | Brand DNA | Recovered | Printed p. 107; supplied PDF position 99. |
| `index-delft-wwwh` | WWWH | Recovered | Printed p. 109; supplied PDF position 102. |
| `index-delft-design-drawing-to-discover` | Design Drawing to Discover | Recovered | Printed p. 111; supplied PDF position 104. |
| `index-delft-persona` | Persona | Recovered | Printed p. 115; supplied PDF position 108. |
| `index-delft-cultura` | Cultura | Recovered | Printed p. 117; supplied PDF position 110. Bring the Cultura Question Card Set and Canvas. |
| `index-delft-problem-definition` | Problem Definition | Recovered | Printed p. 119; supplied PDF position 112. |
| `index-delft-function-analysis` | Function Analysis | Recovered | Printed p. 121; supplied PDF position 114. |
| `index-delft-product-life-cycle` | Product Life Cycle | Recovered | Printed p. 123; supplied PDF position 116. |
| `index-delft-list-of-requirements` | List of Requirements | Recovered | Printed p. 125; supplied PDF position 118. |
| `index-delft-mind-mapping` | Mind Mapping | Recovered | Printed p. 127; supplied PDF position 120. |
| `index-delft-journey-mapping` | Journey Mapping | Recovered | Printed p. 129; supplied PDF position 123. |
| `index-delft-product-journey-mapping` | Product Journey Mapping | Recovered | Printed p. 131; supplied PDF position 124. |
| `index-delft-project-value-modelling` | Project Value Modelling | Recovered | Printed p. 133; supplied PDF position 126. Bring the referenced project-value blueprint. |
| `index-delft-business-modelling` | Business Modelling | Recovered | Printed p. 135; supplied PDF position 128. |
| `index-delft-sustainable-business-modelling` | Sustainable Business Modelling | Recovered | Printed p. 137; supplied PDF position 130. |
| `index-delft-future-visioning` | Future Visioning | Recovered | Printed p. 139; supplied PDF position 132. |
| `index-delft-ansoff-growth-matrix` | Ansoff Growth Matrix | Recovered | Printed p. 141; supplied PDF position 134. |
| `index-delft-segmentation-targeting-positioning` | Segmentation-Targeting-Positioning | Recovered | Printed p. 143; supplied PDF position 136. |
| `index-delft-vrio-analysis` | VRIO Analysis | Recovered | Printed p. 145; supplied PDF position 138. |
| `index-delft-porter-s-five-forces` | Porter's Five Forces | Recovered | Printed p. 147; supplied PDF position 140. |
| `index-delft-perceptual-map` | Perceptual Map | Recovered | Printed p. 149; supplied PDF position 142. |
| `index-delft-collage` | Collage | Recovered | Printed p. 151; supplied PDF position 144. |
| `index-delft-storyboarding` | Storyboarding | Recovered | Printed p. 153; supplied PDF position 146. |
| `index-delft-written-scenario` | Written Scenario | Recovered | Printed p. 155; supplied PDF position 148. |
| `index-delft-design-drawing-to-define` | Design Drawing to Define | Recovered | Printed p. 157; supplied PDF position 150. |
| `index-delft-analogies-metaphors` | Analogies & Metaphors | Recovered | Printed p. 161; supplied PDF position 154. |
| `index-delft-biomimicry` | Biomimicry | Recovered | Printed p. 163; supplied PDF position 156. |
| `index-delft-synectics` | Synectics | Recovered | Printed p. 165; supplied PDF position 159. |
| `index-delft-brainstorming-brainwriting` | Brainstorming & Brainwriting | Recovered | Printed p. 167; supplied PDF position 158. |
| `index-delft-braindrawing` | Braindrawing | Recovered (existing) | Printed p. 169; PDF p. 162; canonical ID `delft-braindrawing` preserved. |
| `index-delft-morphological-chart` | Morphological Chart | Recovered (existing) | Printed p. 171; PDF p. 164; canonical ID `delft-morphological-chart` preserved. |
| `index-delft-scamper` | SCAMPER | Recovered (existing) | Printed p. 173; PDF p. 166; canonical ID `delft-scamper` preserved. |
| `index-delft-how-tos` | How-Tos | Recovered (existing) | Printed p. 175; PDF p. 168; canonical ID `delft-how-tos` preserved. |
| `index-delft-harris-profile` | Harris Profile | Recovered (existing) | Printed p. 177; PDF p. 170; canonical ID `delft-harris-profile` preserved. |
| `index-delft-evr-decision-matrix` | EVR Decision Matrix | Recovered | Printed p. 179; supplied PDF position 172. |
| `index-delft-c-box` | C-Box | Recovered (existing) | Printed p. 181; PDF p. 174; canonical ID `delft-c-box` preserved. |
| `index-delft-value-ir-pmi` | vALUe, IR & PMI | Recovered | Printed p. 183; supplied PDF position 177. |
| `index-delft-datum-method` | Datum Method | Recovered (existing) | Printed p. 185; PDF p. 178; canonical ID `delft-datum` preserved. |
| `index-delft-weighted-objectives` | Weighted Objectives | Recovered (existing) | Printed p. 187; PDF p. 180; canonical ID `delft-weighted-objectives` preserved. |
| `index-delft-storytelling` | Storytelling | Recovered | Printed p. 189; supplied PDF position 182. |
| `index-delft-usage-analytics` | Usage Analytics | Recovered | Printed p. 191; supplied PDF position 184. |
| `index-delft-comfort-evaluation` | Comfort Evaluation | Recovered | Printed p. 193; supplied PDF position 186. |
| `index-delft-premo-photo-elicitation` | PrEmo & Photo-Elicitation | Needs verification | Printed p. 195; supplied PDF position 188. Instrument and administration/scoring protocol absent; unavailable for scheduling. |
| `index-delft-role-playing` | Role-Playing | Recovered | Printed p. 197; supplied PDF position 190. |
| `index-delft-product-usability-evaluation` | Product Usability Evaluation | Recovered | Printed p. 199; supplied PDF position 192. |
| `index-delft-product-concept-evaluation` | Product Concept Evaluation | Recovered | Printed p. 201; supplied PDF position 195. |
| `index-delft-cost-price-estimation` | Cost Price Estimation | Recovered | Printed p. 203; supplied PDF position 196. |
| `index-delft-prototype-reflection-cards` | Prototype Reflection Cards | Recovered | Printed p. 205; supplied PDF position 198. |
| `index-delft-cinematic-prototyping` | Cinematic Prototyping | Recovered | Printed p. 207; supplied PDF position 200. |
| `index-delft-design-drawing-to-develop` | Design Drawing to Develop | Recovered | Printed p. 209; supplied PDF position 202. |
| `index-delft-experience-prototyping` | Experience Prototyping | Recovered | Printed p. 211; supplied PDF position 207. |
| `index-delft-wizard-of-oz` | Wizard of Oz | Recovered | Printed p. 213; supplied PDF position 205. |
| `index-delft-design-drawing-to-deliver` | Design Drawing to Deliver | Recovered | Printed p. 215; supplied PDF position 208. |
| `index-delft-3d-physical-models` | 3D Physical Models | Recovered | Printed p. 217; supplied PDF position 211. |
| `index-delft-technical-documentation` | Technical Documentation | Recovered | Printed p. 219; supplied PDF position 212. |

## Road Map entry-by-entry coverage

| Existing index ID | Method | Status | Required next source |
|---|---|---|---|
| `index-roadmap-brainstorming-traditional` | Brainstorming (traditional) | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-brainwriting-with-post-its` | Brainwriting with Post-its | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-brainwriting-6-3-5` | Brainwriting 6.3.5 | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-creative-confrontation-excursion-forced-fit` | Creative Confrontation (excursion & forced fit) | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-excursion-1-criminal-round` | Excursion 1: Criminal Round | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-excursion-2-take-a-walk` | Excursion 2: Take a Walk | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-excursion-3-hidden-presumptions` | Excursion 3: Hidden Presumptions | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-excursion-4-absurd-questioning` | Excursion 4: Absurd Questioning | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-excursion-5-random-words` | Excursion 5: Random Words | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-excursion-6-random-objects` | Excursion 6: Random Objects | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-excursion-7-visual-stimulation` | Excursion 7: Visual Stimulation | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-excursion-8-guided-fantasy` | Excursion 8: Guided Fantasy | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-excursion-9-personal-analogy` | Excursion 9: Personal Analogy | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-excursion-10-direct-analogy-or-metaphor` | Excursion 10: Direct Analogy or Metaphor | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-excursion-11-symbolic-and-fantasy-analogy` | Excursion 11: Symbolic and Fantasy Analogy | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-flower-association` | Flower Association | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-how-to-s-or-h2-s` | How To's or H2's | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-interactive-brainsketching` | Interactive Brainsketching | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-ladder-of-abstraction` | Ladder of Abstraction | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-making-a-collage` | Making a Collage | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-matec` | MATEC | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-mind-mapping-in-a-group-session` | Mind Mapping in a Group Session | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-morphological-synthesis` | Morphological Synthesis | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-picture-the-problem` | Picture the Problem | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-scamper` | SCAMPER | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-40-inventive-principles-of-triz` | 40 Inventive Principles of TRIZ | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-5w1h` | 5W1H | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-idea-gallery` | Idea Gallery | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-elevator-pitch` | Elevator Pitch | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-spontaneous-clustering` | Spontaneous Clustering | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-sequencing` | Sequencing | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-restating-the-problem` | Restating the Problem | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-hits-or-dots` | Hits or Dots | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-paired-comparison` | Paired Comparison | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-criteria-ranking` | Criteria & Ranking | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-ualo` | UALo | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-making-a-poster` | Making a Poster | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-devil-s-and-angel-s-advocates` | Devil's and Angel's Advocates | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-force-field-analysis` | Force Field Analysis | Source unavailable | Full named method passage; contents alone are insufficient. |
| `index-roadmap-parking-lot` | Parking Lot | Source unavailable | Full named method passage; contents alone are insufficient. |

## Remaining work before specialist facilitation

Obtain the full Road Map method pages and the PrEmo instrument/protocol. Verify external toolkit editions for Cultura, Ecodesign Checklist and Project Value Modelling. Pilot recovered activities with the intended group and revise facilitator estimates through the metadata editor. For research activities, plan participant access, study duration and data preparation explicitly. For engineering, analytics and quantitative research, involve appropriate expertise rather than treating a concise card as certification.

The procedure source and estimated planning guidance are separate fields. Persisted user metadata must override defaults without changing the source-backed procedure or hard participant constraints. Demo presets remain separate. Catalogue recovery does not establish copyright permission to redistribute full book scans; the app uses concise paraphrases and citations rather than page images.
