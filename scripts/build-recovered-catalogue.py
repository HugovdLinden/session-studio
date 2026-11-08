"""Rebuild source-reviewed catalogue additions. No OCR text or scans are redistributed.
Run from session-studio/session-planner. Records paraphrase the supplied local book.
Numbers are PDF position / printed page, verified against the scanned headings.
"""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
index=json.loads((root/'lib/discovery.json').read_text())
records=[]
def add(slug,pdf,printed,category,phases,goals,minutes,difficulty,takeaway,inputs,steps,materials='Paper or shared board; writing tools',note='',group=None,stages=None):
    item=next(x for x in index if x['id']=='index-delft-'+slug)
    citation=f'Delft Design Guide · {item["name"]} · How; printed p. {printed}, supplied PDF p. {pdf} · paraphrased procedure'
    estimate=f'Facilitator estimate: {minutes} minutes of active design-team work, difficulty {difficulty}; revise for the project. Phase, thinking-mode and goal tags are facilitator mappings.'
    if stages: estimate+=' Fieldwork, recruitment, fabrication, response waits and repeated trials are additional work; allocate them separately using the stage notes.'
    item.update(phases=phases.split(),goals=goals.split(),category=category,takeaway=takeaway,input=inputs,materials=materials,steps=[dict(title=t.split('::')[0],summary=t.split('::')[1],detail=(t.split('::')[2] if len(t.split('::'))>2 else 'Source-backed paraphrase. '+note)) for t in steps],source=citation,verifiedProcedure=True,revision=0,metadataOrigin='estimate',defaultMinutes=minutes,minParticipants=group[0] if group else 1,maxParticipants=group[1] if group else 8,difficulty=difficulty)
    item.pop('phase',None)
    item['sourceRecord']=dict(name=item['name'],book='Delft Design Guide',section='Methods',heading='How',fit=takeaway,input=inputs,core='; '.join(s['summary'] for s in item['steps']),output=takeaway,consideration=note or 'Use the source procedure in context; the editable schedule is a facilitator adaptation.',planningEstimate=estimate,sourceGroup=(f'Source participant guidance: {group[0]}–{group[1]}.' if group else 'No fixed design-team group range recovered; 1–8 is a facilitator estimate, not the research sample size.'),sourceScope=f'Printed p. {printed}; supplied PDF position {pdf}.',citation=citation)
    if group:item.update(knownMin=group[0],knownMax=group[1])
    if stages:item['stages']=[dict(id=s[0],title=s[1],stepIndices=s[2],requiresStageIds=([stages[i-1][0]] if i else []),betweenSessionNote=s[3]) for i,s in enumerate(stages)]
    records.append(item)
# Discover: preparation, actual fieldwork and interpretation must remain distinct.
add('contextmapping',75,83,'diverging','discover define','understand frame',120,'difficult','Surface everyday experiences and translate them into design insights.','Research topic, participant access and an open-ended sensitising package.',[
'Prepare and sensitise::Define the topic, goal and participants; record team assumptions and create open-ended homework about everyday routines.',
'Collect experiences::After participants complete the homework, use it to start interviews, home visits or generative sessions. Ask participants to make artefacts about present, past and possible future experiences.',
'Interpret and communicate::Look for patterns that inspire design; communicate selected insights and explain concepts from the users’ perspectives.'
],note='The source suggests 3–20 participating users; this is a research sample, not a limit on the design team. Sensitising homework happens before the generative encounter.',stages=[('prepare','Prepare sensitising research',[0],'Give participants time to complete sensitising homework before the next stage; arrange recruitment and visits separately.'),('research','Generative research',[1],'Complete the planned participant encounters and prepare research records before analysis.'),('interpret','Interpret and communicate',[2],'Use the actual research material; do not substitute assumptions for missing responses.')])
add('thing-ethnography',77,85,'diverging','discover','understand flexibility',120,'difficult','Reveal relations around connected objects that human accounts may miss.','Research context, relevant objects and feasible data collection tools.',[
'Choose objects::Identify objects relevant to the research; decide between instrumenting everyday objects and studying existing connected products.',
'Instrument and collect::Choose sensors, software and analysis tools that fit the setting; collect data about the objects’ relations and interactions.',
'Analyse and repeat::Use timelines or other visual analysis to explore connections; revise data collection until it reveals something previously unknown.'
],materials='Suitable sensors/software, data records and visual analysis tools',note='Data volume is not insight. Some settings rule out cameras; specialist analytics may need expert support. Instrumentation does not automatically make interpretations objective.',stages=[('instrument','Design instrumentation',[0],'Acquire, configure and test sensors/software; collect real-use data over an appropriate period before analysis.'),('collect','Collect object data',[1],'Data collection is fieldwork with its own duration and access constraints.'),('analyse','Analyse relations',[2],'Check interpretations and repeat collection if the data does not answer useful questions.')])
add('cultural-probes',79,87,'diverging','discover','understand flexibility',100,'medium','Gather self-documented experiences to inspire subsequent design research.','A topic, intended users and ways to return completed probe materials.',[
'Set the goal::Agree with the team what experiences the probes should explore.',
'Design and pilot::Make playful, inviting materials; test them with an intended user and revise unclear assignments.',
'Distribute and collect::Send tailored packages with clear expectations; allow independent completion and arrange reminders or collection.',
'Interpret together::Study the returned material and take promising insights into a follow-up generative session.'
],materials='Tailored diary, postcard, image or recording materials',note='Probes inspire possibilities; they do not validate causal explanations or answer every specific research question. The source suggests a few users up to about 30.',stages=[('prepare','Prepare and pilot probes',[0,1],'Pilot with an intended user and revise; then allow participants sufficient time for self-documentation.'),('collect','Distribute and collect probes',[2],'This is fieldwork and a response wait; it must not be treated as an in-room timed exercise.'),('interpret','Interpret probe returns',[3],'Use actual returned materials before arranging a follow-up session.')])
add('user-observations',81,89,'diverging','discover develop deliver iterate','understand',120,'medium','Turn observed use into documented themes and design implications.','Research questions, participant access and a real or simulated use setting.',[
'Define the study::Specify what, who and where to observe; agree sample, duration, costs and design criteria.',
'Prepare and pilot::Arrange participants, privacy and consent; create an observation checklist, pilot it and revise.',
'Observe use::Observe with an open mind and record what happens, including unexpected uses; expand notes promptly after each observation.',
'Analyse and share::Transcribe relevant records, group themes and triangulate with other evidence; discuss findings with stakeholders.'
],materials='Observation checklist; suitable notes, photo, audio or video tools',note='Being observed can change behaviour. Protect participant privacy and follow the study’s ethical requirements.',stages=[('prepare','Prepare observation study',[0,1],'Arrange access and complete the pilot before conducting the study.'),('observe','Observe participants',[2],'Allocate real-world observation duration separately; ensure the required participants and setting are available.'),('analyse','Analyse observations',[3],'Allow transcription/preparation before the analysis session.')])
add('interviews',83,91,'diverging','discover develop deliver iterate','understand',120,'medium','Understand participants’ perceptions and motivations through qualitative accounts.','Research questions and access to people familiar with the topic.',[
'Prepare the guide::Translate research questions into topics, pilot the guide and improve it.',
'Invite and brief::Recruit suitable interviewees and explain the goal, use of their input and consent arrangements.',
'Interview::Use open questions, listen, summarise and clarify in a relaxed setting; record only with agreement.',
'Analyse accounts::Transcribe or summarise, compare accounts and draw supported conclusions; update participants if they wish.'
],materials='Topic guide, consent information and agreed recording or note tools',note='The source describes roughly one hour per interview, with recruitment and analysis additional. Qualitative interview counts are not the number of designers in a planning session.',stages=[('prepare','Prepare interviews',[0,1],'Recruit and schedule participants; a pilot may require a separate appointment.'),('interview','Conduct interviews',[2],'Budget about one hour per interview as source guidance, plus practical overheads; do not fit an entire study into a short session.'),('analyse','Analyse interview accounts',[3],'Prepare transcripts or summaries before team analysis.')])
add('questionnaires',85,93,'diverging','discover develop deliver','understand select',90,'difficult','Collect structured answers to defined research questions.','Research questions, appropriate respondents and an analysis approach.',[
'Design questions::Choose topics and suitable response formats; write focused questions, group related topics and order them clearly.',
'Pilot and revise::Pre-test comprehension, response formats and concept representations; remove questions that do not serve the research aim.',
'Collect responses::Invite an appropriate sample and administer the questionnaire.',
'Analyse and report::Summarise answer frequencies or means as appropriate and investigate relevant relationships; describe the sample and limitations.'
],materials='Questionnaire tool and analysis tools',note='Questionnaire quality determines result quality. Do not claim subconscious experience or population representativeness from an unsuitable sample.',stages=[('prepare','Design and pilot questionnaire',[0,1],'Complete a pilot and arrange respondents before distribution.'),('collect','Collect survey responses',[2],'Keep the questionnaire open for a planned response period; this waiting time is separate from session time.'),('analyse','Analyse responses',[3],'Only analyse received data; additional statistical expertise may be required.')])
add('focus-groups',87,95,'diverging','discover develop deliver','understand select',150,'difficult','Compare perspectives through moderated discussion with intended users.','A topic guide and participants from the target group.',[
'Prepare and pilot::Write a topic guide and test it in a pilot focus group; revise topics and pacing.',
'Invite participants::Arrange the target participants, moderator, recorder and a suitable setting.',
'Moderate discussion::Begin with familiar topics, then explore the planned issues; invite quieter voices and prevent domination.',
'Analyse and report::Report main opinions and their range, illustrated by relevant quotations.'
],materials='Topic guide, concept representations when applicable and recording tools',note='Source guidance: 6–8 target participants plus a moderator and recorder; each group takes 90–120 minutes. The book recommends at least three groups. These numbers concern research groups, not design-team size.',stages=[('prepare','Prepare and recruit groups',[0,1],'Pilot, recruitment and scheduling are separate work.'),('discuss','Conduct focus groups',[2],'Reserve 90–120 minutes per research group; repeat across the planned groups before analysis.'),('analyse','Analyse group discussions',[3],'Transcribe recordings and compare groups; one group does not establish prevalence.')])
add('ecodesign-strategy-wheel',89,97,'reverging','discover develop iterate','understand select',50,'medium','Locate promising environmental improvements across a product’s life cycle.','A product or concept and evidence about its life-cycle impacts.',[
'Define and score::Identify the product and qualitatively score each wheel dimension using the Ecodesign Checklist.',
'Explore improvements::Consider concept changes, low-impact materials, material reduction, production, distribution, use, lifetime and end-of-life.',
'Prioritise and revisit::Discuss conflicting strategies and promising changes; repeat the scoring after redesign.'
],materials='Ecodesign Strategy Wheel and Ecodesign Checklist',note='Scores are qualitative judgments; a spider diagram does not make them objective. Consider behaviour as well as technical changes.')
add('ecodesign-checklist',91,99,'reverging','discover develop iterate','understand frame',60,'medium','Identify environmental design priorities across the product life cycle.','Product or concept and the Ecodesign Checklist.',[
'Define the product::Choose the product, concept or existing design to investigate.',
'Research its life cycle::Find materials, manufacturing, packaging, storage, distribution, use and end-of-life information.',
'Work through the checklist::Start with new-concept questions, then examine each life-cycle stage and generate improvement options.',
'Describe priorities::Make options explicit and use the Strategy Wheel to visualise and prioritise them.'
],materials='Ecodesign Checklist and lifecycle research',note='Obtain the actual checklist before facilitating. The source gives this workflow rather than reproducing every checklist question. Research must be available before scoring; checklists may need contextual additions.')
add('fast-track-life-cycle-analysis',93,101,'converging','discover develop deliver iterate','understand select',120,'difficult','Compare environmental burdens and identify life-cycle hotspots.','Product-system inventory, functional performance and appropriate impact data.',[
'Define goal and functional unit::Agree scope and a measurable function; check that the unit supports comparison of different solutions.',
'Set system boundaries::Identify included life-cycle stages and allocation rules.',
'Build the inventory::Quantify materials, production, use resources, transport and end-of-life; record data quality and assumptions.',
'Calculate impacts::Apply appropriate impact factors consistently and separate totals by stage and component.',
'Interpret hotspots::Identify dominant burdens and improvement options; state uncertainty and missing data.'
],materials='LCA data source, calculation tool and product inventory',note='Requires LCA competence and validated data. Never omit a material merely because its factor is missing. Active-work estimate excludes data acquisition and does not certify an LCA.',stages=[('scope','Scope and inventory',[0,1,2],'Acquire and verify inventory and impact data before calculation; research may span days.'),('assess','Calculate and interpret',[3,4],'Check assumptions, functional equivalence and uncertainty before comparing solutions.')])
add('swot-search-areas',95,103,'diverging','discover define','understand frame flexibility',90,'medium','Translate organisational strengths and external opportunities into design search areas.','Evidence about the organisation, users, competitors and external trends.',[
'Scope and analyse::Define the business environment; examine external trends and benchmark internal strengths and weaknesses.',
'Build SWOT::Summarise strengths, weaknesses, opportunities and threats in a shared matrix.',
'Generate search areas::Combine strengths with opportunities to produce a broad set of possible innovation domains.',
'Select and investigate::Choose areas using explicit criteria, then conduct contextual research and formulate a design brief.',
'Generate product ideas::Use the researched brief to generate ideas in the chosen search areas.'
],note='The source suggests about 20–60 search areas. A two-dimensional matrix simplifies a complex context.',stages=[('search','Generate and select search areas',[0,1,2,3],'Conduct contextual research and establish feasibility of selected areas before subsequent product ideation.'),('ideate','Ideate from researched briefs',[4],'Bring actual contextual findings and the agreed design brief.')])
add('trend-foresight',97,105,'reverging','discover define','understand frame',90,'medium','Organise weak signals into an explicit set of future-facing trend topics.','A research domain and collected images/signals from multiple sources.',[
'Set the radar::Choose a domain of interest and sources such as magazines or online material.',
'Collect signals::Gather a broad image set of new developments with potential future relevance.',
'Cluster and name::Group shared elements, connect clusters and propose trend names.',
'Assess and communicate::Map user impact and innovation urgency, choose meaningful topics and give each a title, explanation and representative image.'
],materials='Collected images, source references and an impact/urgency grid',note='The book suggests about 80 images and around two hours for an online search. The 90-minute facilitator estimate covers team synthesis; collection is additional.',stages=[('scan','Scope and collect trend signals',[0,1],'Allow approximately two hours of image research as source guidance; check signals against multiple sources over time.'),('synthesise','Synthesize trend topics',[2,3],'Bring the collected and attributed image set to the synthesis session.')])
add('brand-dna',99,107,'reverging','discover define','frame',60,'medium','Describe a coherent purpose, personality and positioning for a brand.','Knowledge of the organisation, its beliefs and intended audience.',[
'Define purpose::Express what the brand believes and strives to achieve.',
'Describe personality::Choose traits that describe how the brand would behave as a person.',
'Position the offer::State the offer, audience, category and functional, emotional or expressive benefits.',
'Align the elements::Iterate the three elements into a compact, authentic description.'
],note='The source treats this as an iterative model, not a fixed sequence. Competition, roots and evidence for values may require additional analysis.')
add('wwwh',102,109,'diverging','discover define','understand frame',35,'easy','Question and reframe an initial design problem systematically.','An initial problem statement or design brief.',[
'State the starting problem::Write a brief initial formulation.',
'Ask six question families::Explore who, what, where, when, why and how, including stakeholders, previous attempts and context.',
'Review and prioritise::Compare answers, identify missing information and decide which issues matter most.',
'Reframe::Rewrite the problem in light of the analysis.'
],note='The indexed label WWWH is retained for compatibility; the scanned heading is WWWWWH. The questions are a checklist, not proof that a problem is understood.')
add('design-drawing-to-discover',104,111,'diverging','discover iterate','understand frame',35,'easy','Use sketches to uncover relationships and clarify the brief.','An initial brief, observed situation or product to explore.',[
'Sketch the domain::Externalise first observations, product principles, interactions or system elements in simple drawings.',
'Annotate relationships::Show relevant relations and add text for properties drawings cannot communicate.',
'Reflect and clarify::Use the sketches to question assumptions, identify gaps and discuss the emerging brief with the client.'
],materials='Paper and drawing tools or a tablet',note='Facilitator grouping of the source’s non-numbered guidance. Keep informal sketches focused on the relevant issue; polish is not the aim.')
# Define
add('persona',108,115,'reverging','define','understand frame',60,'medium','Make research-based user archetypes that inform design decisions.','Rich qualitative research about intended users.',[
'Gather user evidence::Collect observations, interview insights and contextual accounts.',
'Identify patterns::Choose relevant characteristics and cluster similarities and differences.',
'Create personas::Build about three to five distinct archetypes; give each a name, visual representation, relevant context, goals and supporting research quotations.'
],note='Personas should represent evidence, not invented stereotypes. Research collection precedes the estimated synthesis workshop.')
add('cultura',110,117,'reverging','discover define','understand flexibility',90,'difficult','Structure contextual research to build understanding across cultural boundaries.','A research context, access to participants, Cultura Question Card Set and Canvas.',[
'Prepare questions::Use the Cultura cards to define the context, users, place and time; prioritise specific questions.',
'Investigate::Seek answers through field studies and desk research.',
'Map and discuss::Organise findings on the Cultura Canvas and discuss them with the team and stakeholders.'
],materials='Cultura Question Card Set, Cultura Canvas and research records',note='Requires the actual Cultura toolkit; the supplied page explains its use but does not reproduce all cards. A broad context and fine-grained attention may be needed.',stages=[('prepare','Prepare cultural inquiry',[0],'Obtain the Cultura materials and arrange participant access.'),('research','Investigate the context',[1],'Carry out field and desk research outside the synthesis workshop; do not replace findings with cultural assumptions.'),('synthesise','Discuss research on the canvas',[2],'Use actual research evidence to populate the canvas.')])
add('problem-definition',112,119,'reverging','define iterate','frame',40,'easy','Agree a clear problem scope and desired situation.','The problem owner’s formulation or findings from problem analysis.',[
'Examine the starting problem::Use open questions to explore stakeholders, context, desired change and side effects to avoid.',
'Choose a scope::Balance a scope broad enough for alternatives with one narrow enough to act on.',
'Write and revise::Describe the problem and desired end situation; refine the formulation with the client and stakeholders.'
],note='Problem definition is iterative; defining a problem does not solve it.')
add('function-analysis',114,121,'reverging','define develop','understand frame',60,'difficult','Describe what a product and its parts must do before choosing solutions.','A product purpose and information about use and flows.',[
'Define the main function::Describe the product as a black box with inputs and outputs where possible.',
'List subfunctions::Identify supporting functions, using the use phase as a starting point.',
'Structure functions::Order functions chronologically, connect matter/energy/information flows and distinguish hierarchy levels.',
'Explore structures::Add auxiliary functions and compare variations in boundaries, sequence and grouping.'
],note='Function structures are iterative. Describe required functions before committing to physical parts.')
add('product-life-cycle',116,123,'reverging','define discover','understand frame',45,'easy','Build a life-cycle activity overview that supports requirements.','A defined product, product group or service.',[
'Define scope and stages::Identify the product and relevant stages, starting with originate, distribute, use and discard.',
'List activities::Describe what the product passes through using verb–noun phrases.',
'Organise and use::Map activities under the stages and use the result as a checklist for generating criteria.'
],note='This is an overview of processes and activities, not a numerical environmental life-cycle assessment.')
add('list-of-requirements',118,125,'converging','define develop deliver iterate','frame select',60,'medium','Maintain explicit, usable criteria for developing and comparing designs.','Design brief and evidence about users, context, constraints and standards.',[
'Generate requirements::Use a suitable structure such as the product life cycle to cover relevant requirements.',
'Find gaps and operationalise::Identify missing research; express requirements in observable or measurable terms and distinguish demands from wishes.',
'Consolidate::Remove duplicates and non-discriminating items; organise hierarchy.',
'Review and maintain::Check validity, measurability, brevity and practicability; update requirements as evidence develops.'
],note='Do not invent regulatory thresholds. Missing evidence or standards must be researched before treating a requirement as validated.')
add('mind-mapping',120,127,'diverging','define discover develop','understand frame flexibility',30,'easy','Expose associations and relationships around a central topic.','A theme or design problem.',[
'Start centrally::Place the topic in the centre and draw a boundary around it.',
'Branch associations::Add major facets outward, then subbranches; capture thoughts freely.',
'Connect and reflect::Use visual distinctions and links to show relationships; review and restructure the map.',
'Share maps::When working in a group, compare individual maps and discuss differences.'
],note='Individual mapping before group discussion follows the source guidance. A map structures thinking; it is not independent evidence.')
add('journey-mapping',123,129,'reverging','discover define develop iterate','understand frame',60,'medium','Show user experiences over time and identify opportunities between touchpoints.','Qualitative user evidence and a defined user perspective.',[
'Choose perspective::Specify whose experience is mapped and the purpose of the map.',
'Map the journey::Lay out stages, activities and intended achievements along time.',
'Add experience lanes::Select relevant rows such as aims, barriers, emotions and opportunities; populate them with research quotations and images.',
'Review and iterate::Discuss relationships and gaps; distinguish the current journey from a proposed ideal journey.'
],note='Use research for current experiences, not team assumptions. Quantitative service evidence can support prioritisation where available.')
add('product-journey-mapping',124,131,'reverging','define develop','understand frame',60,'medium','Plan product, component and service flows across repeated use cycles.','A product concept, component lifetimes and intended circular service model.',[
'Analyse use cycles::Describe the product, components and desired number and length of use cycles.',
'Map component lifetimes::Estimate how many cycles each component can last and where replacement is needed.',
'Map service touchpoints::Place use stages, repairs, updates, consumables, logistics and refurbishment on a timeline.',
'Align stakeholders::Add responsible actors, strategic actions and flows; resolve inconsistent scenarios together.'
],note='Component lifetime estimates require evidence. This map centres on the product, while a customer journey centres on human experience.')
add('project-value-modelling',126,133,'reverging','define','frame select',60,'medium','Align value creation, value capture and project collaboration.','A specific project and the project-value blueprint.',[
'Set the objective::Choose a case and the purpose of the modelling exercise.',
'Identify and prioritise values::Distinguish value for others from value for the designer; assess expertise and risks.',
'Plan value capture::Use the blueprint to examine partners, activities, collaboration agreements and revenues.',
'Reflect and act::Check relationships, remove low-priority items and identify concrete actions for the main opportunities and risks.'
],materials='Project Value Modelling blueprint and movable notes',note='Requires the project-value blueprint referenced in the source. It targets project-specific value tensions rather than every firm-level strategy.')
add('business-modelling',128,135,'reverging','define develop','frame',60,'medium','Align the components of a product or service business proposal.','A business idea and knowledge of intended customers and delivery constraints.',[
'Clarify the offer::Define the value proposition and how it differs from alternatives.',
'Map delivery and customers::Describe key activities, resources and partners alongside customer segments, relationships and channels.',
'Map finances::Identify cost structure and revenue streams.',
'Align the canvas::Check relationships across all nine elements and revise inconsistencies.'
],materials='Business Model Canvas, preferably a large print or shared board',note='Facilitator grouping of the source’s four clusters; the source explicitly allows different orders. Validate assumptions outside the workshop.')
add('sustainable-business-modelling',130,137,'diverging','define develop','frame flexibility',75,'medium','Find ways a business can create positive value across its stakeholder network.','Business purpose and knowledge of customers, investors, employees, partners, environment and society.',[
'Clarify purpose::Explain the business’s reason for existing beyond financial returns.',
'Map created value::Identify positive value and negative impacts mitigated for every stakeholder group.',
'Identify losses::Find missed or destroyed value and conflicting local or global effects.',
'Generate opportunities::Brainstorm new activities and collaborations that turn negatives into positive value.'
],materials='Stakeholder value map and notes',note='The source deliberately places blue-sky ideation after the value analysis.')
add('future-visioning',132,139,'diverging','define develop','frame flexibility',75,'medium','Express a desired future experience grounded in trend research.','Creative trend research and an organisational context.',[
'Share trends::Present findings and capture unmet needs, wishes and dilemmas as value drivers.',
'Envision futures::In subgroups, discuss desired values and generate future opportunities; capture ideas visibly.',
'Cluster value drivers::Group resonant opportunities and refine patterns until the team understands them.',
'Express the vision::Choose three to five value drivers, write short statements and sketch a supporting vision image.'
],note='Source recommends subgroups of 3–5; larger teams should divide accordingly. Trend research is a prerequisite, not an outcome invented in the session.')
add('ansoff-growth-matrix',134,141,'converging','define','frame select',45,'difficult','Compare growth directions and their organisational risks.','Current products, markets, capabilities and growth ambitions.',[
'Map the present::Define existing products and markets and identify the current growth quadrant.',
'Plot alternatives::Identify feasible new products and markets; place combinations in the existing/new product–market matrix.',
'Evaluate and choose::Assess opportunities and risks and choose a direction consistent with ambitions and ability to manage risk.'
],note='The source places strategic decisions with senior innovation managers; novice designers should not treat the matrix as authority to set company strategy.')
add('segmentation-targeting-positioning',136,143,'converging','define','frame select',75,'difficult','Choose a target market and articulate a defensible value proposition.','Market evidence, organisational capabilities and competing offers.',[
'Segment::Choose demographic, geographic, psychographic, behavioural or needs-based dimensions; make segments identifiable and actionable.',
'Evaluate targets::Compare unmet needs, size and growth, organisational fit and competition.',
'Choose targeting::Decide which attractive segments the organisation can serve.',
'Position::Choose a distinctive basis in attributes, benefits or values; formulate the target, category, value promise and evidence supporting it.'
],note='Market data must precede confident selection. A positioning claim needs an evidence-based reason to believe it.')
add('vrio-analysis',138,145,'converging','define','understand select',50,'difficult','Assess resources as potential sources of competitive advantage.','Evidence about organisational resources and capabilities.',[
'Inventory resources::Identify relevant resources and capabilities.',
'Assess in order::For each, examine value, rarity, difficulty of imitation and whether the organisation can use it effectively.',
'Interpret implications::Record competitive and economic implications of the pattern of answers.'
],note='Imitability requires a real understanding of how resources are developed. The matrix is structured and does not replace research.')
add('porter-s-five-forces',140,147,'converging','define discover','understand frame',60,'difficult','Assess the competitive environment and strategic positioning possibilities.','Evidence about an industry, its geography and relevant actors.',[
'Define the environment::Set product/service and geographical scope; identify buyers, suppliers, rivals, entrants and substitutes.',
'Assess the forces::Examine entry threats, supplier and buyer power, substitutes and rivalry; explain their drivers.',
'Consider combined effects::Identify dominant forces and overall attractiveness, including competitors’ positions.',
'Consider change and position::Assess likely changes and how organisational strengths could respond or influence the environment.'
],note='Document evidence and scope; judgments depend on which competitive environment was defined.')
add('perceptual-map',142,149,'reverging','define discover','understand select',60,'medium','Compare how customers perceive competing offers.','Relevant product attributes, competitor set and access to potential customers.',[
'Define attributes and alternatives::Choose attributes customers notice and the competing products or brands.',
'Collect ratings::Ask potential customers to rate the alternatives and the importance of the attributes; pilot the questions first.',
'Plot and compare::Select two important attributes, map ratings and repeat with other pairs as useful.'
],materials='Rating instrument, spreadsheet and plotting tools',note='Base the map on customer ratings. Designer guesses do not constitute a measured perceptual map.',stages=[('prepare','Prepare perceptual research',[0],'Pilot question wording and response formats; arrange a suitable customer sample.'),('rate','Collect customer ratings',[1],'Recruitment and response collection occur outside the plotting workshop.'),('map','Map perceptions',[2],'Use the received ratings and report sample limitations.')])
add('collage',144,151,'reverging','define develop','frame flexibility',45,'easy','Make visual qualities or a design vision explicit through a composed image collection.','A purpose such as communicating a vision or deriving visual criteria.',[
'Collect and group::Choose suitable media, gather imagery and group it by relevant themes.',
'Explore composition::Choose background, orientation, texture and scale; sketch compositions and foreground/background relationships.',
'Assemble and assess::Arrange a provisional collage and check whether it communicates the intended characteristics.',
'Finalise::Fix the composition once it meets its purpose and articulate resulting criteria.'
],materials='Images and optional physical materials; collage tools',note='A collage’s meaning depends on context and interpretation; discuss its intended message.')
add('storyboarding',146,153,'diverging','define develop','frame flexibility',45,'easy','Make an interaction concept concrete as a sequence of scenes.','An initial idea about users and their interaction with a product or service.',[
'Set the scene::Define subject, setting, time and characters.',
'Choose the message::Define the story and a clear message; the source suggests roughly 5–12 panels.',
'Sketch the sequence::Place events on a timeline before detailing; use panel size and spacing for emphasis.',
'Complete the storyboard::Add short complementary captions and a clear visual hierarchy.'
],materials='Paper/drawing tools or a storyboard canvas',note='Keep the number of panels proportionate to the message; captions should add information rather than duplicate each image.')
add('written-scenario',148,155,'diverging','define develop iterate','frame flexibility',50,'medium','Describe a use situation that stakeholders can review and improve.','Research about intended users, their goals and a real or intended context.',[
'Define scope::Set the scenario’s aim, length, number and context.',
'Define actors and trigger::Identify user goals and the event that starts the interaction.',
'Write the narrative::Choose a style, describe interactions, add useful dialogue and a title.',
'Review and iterate::Test promising scenarios with stakeholders and rewrite until they serve the agreed aim.'
],note='Distinguish descriptions of current reality from proposals for an intended future.')
add('design-drawing-to-define',150,157,'reverging','define','frame',45,'medium','Communicate agreed design boundaries and starting points visually.','Research conclusions, agreed brief, requirements and open design questions.',[
'Identify agreed elements::Select relevant conclusions and distinguish fixed boundaries from what remains open.',
'Visualise the brief::Draw the journey, vision, style or direction needed to clarify the assignment.',
'Prepare for discussion::Refine layout, annotation and colour enough for stakeholders to understand and agree the starting points.'
],materials='Drawing tools and brief documentation',note='Facilitator grouping of non-numbered guidance. Avoid resolving details prematurely or promising a finished solution through an early illustration.')
# Develop and Deliver
add('analogies-metaphors',154,161,'diverging','develop iterate','flexibility fluency',40,'medium','Transfer useful relationships or expressive qualities from another domain.','A framed problem or intended experiential quality.',[
'Frame the aim::For an analogy, state the problem; for a metaphor, state the quality of experience to convey.',
'Search other domains::Find solved analogous problems or concrete entities that express the desired quality.',
'Abstract and transform::Extract relationships for analogies or expressive properties for metaphors; transform them to fit the new design’s constraints.'
],note='Do not merely copy surface features when using analogies; seek transferable relationships.')
add('biomimicry',156,163,'diverging','develop iterate','flexibility fluency',75,'difficult','Use biological strategies to inspire and evaluate design alternatives.','A current system, design challenge and access to reliable biological knowledge.',[
'Evaluate and scope::Assess the current system using ecosystem principles; define context and function and translate them into biological terms.',
'Discover models::Research biological examples that address the relevant functions.',
'Create alternatives::Brainstorm how to emulate useful strategies and select possibilities.',
'Evaluate again::Assess the new solutions against ecosystem principles and iterate.'
],materials='Biological research sources and design tools',note='Biological research and expert consultation may be necessary before ideation; superficial resemblance is not sufficient.')
add('synectics',159,165,'diverging','develop iterate','flexibility fluency',90,'difficult','Use analogy excursions to develop unfamiliar solutions to a framed problem.','A preliminary problem statement and access to the problem owner.',[
'Understand the problem::Have the owner explain it; analyse and restate a single concrete target.',
'Purge known ideas::Capture immediate and familiar solutions before moving beyond them.',
'Explore an analogy::Use personal, direct, symbolic or fantasy analogies and explore their problems and solutions.',
'Force-fit solutions::Translate ideas from the analogous situation back to the target and record new proposals.',
'Evaluate::Use an explicit review method such as itemised response to select directions for development.'
],note='The source describes a demanding method that needs experienced facilitation, particularly with inexperienced participants.')
add('brainstorming-brainwriting',158,167,'diverging','define develop iterate','fluency flexibility',45,'easy','Generate, organise and review a broad set of ideas.','A clear concrete challenge framed as a How-To question.',[
'Appraise the task::Clarify the target with the problem owner; explain deferred judgment, free association, building on ideas and quantity.',
'Generate ideas::For brainstorming, speak ideas while a facilitator captures them; for brainwriting, write silently and collect notes.',
'Regroup::Review and cluster ideas; decide whether another generation round is needed.',
'Select and reflect::Agree selection criteria, identify promising ideas and reflect on whether the method achieved its purpose.'
],note='Source participant guidance: 4–15. Protect quieter voices and avoid evaluating during divergence.',group=(4,15))
add('evr-decision-matrix',172,179,'converging','develop deliver iterate','select',45,'medium','Compare product value and environmental burden against a reference.','Product alternatives, a reference product and value/eco-burden evidence.',[
'Rank alternatives::Assess relative value and environmental burden; use a rough life-cycle calculation where possible.',
'Characterise options::Choose a further relevant issue such as market volume or implementation difficulty.',
'Plot the matrix::Put eco-burden on the vertical axis and willingness-to-pay value on the horizontal axis; position and label alternatives around the reference.',
'Discuss and choose::Examine trade-offs and identify attractive solutions with high value and low burden.'
],note='Distinguish estimated value and burden from measured evidence; choose and explain the meaning of any additional visual coding.')
add('value-ir-pmi',177,183,'reverging','develop iterate','understand select',35,'easy','Review advantages, limitations and distinctive aspects without killing early ideas.','A manageable set of about 5–10 early ideas or principal solutions.',[
'List positives::For each idea, record useful or promising features.',
'List limitations::Record what needs improvement or may not work.',
'Find distinctive qualities::Identify unique elements for vALUe or interesting elements for IR/PMI.',
'Choose next actions::Decide how to develop positives, overcome limits, combine ideas or explore further.'
],note='This supports early understanding and development; it is not a final ranking against independent requirements.')
add('storytelling',182,189,'converging','develop deliver iterate','understand select',90,'medium','Obtain participant feedback on an idea through a carefully controlled story.','Ideas to evaluate, research questions and intended participants.',[
'Plan the evaluation::Decide which ideas, input, audience and story format are needed.',
'Prepare stories and questions::Write comparable stories and questions; keep visuals simple and consistent.',
'Present and ask::Invite participants, let them read or watch attentively, and gather opinions through interview or survey.',
'Analyse and improve::Interpret responses, revise the idea and story, and discuss the changes with stakeholders.'
],note='Rich detail or emotional framing can bias evaluation; stories are representations rather than proof of real-world behaviour.',stages=[('prepare','Prepare stories',[0,1],'Recruit and schedule respondents before evaluation.'),('evaluate','Evaluate with participants',[2],'Budget each participant encounter and survey response period separately.'),('interpret','Interpret feedback',[3],'Bring actual responses to the analysis session.')])
add('usage-analytics',184,191,'reverging','discover develop deliver iterate','understand',120,'difficult','Develop repeatable analysis of product-use data to inform decisions.','A knowledge need and feasible access to relevant usage data.',[
'Define data needs::Identify the knowledge gap and data items that could address it.',
'Collect data::Choose and implement sensors, reports and storage appropriate to the product.',
'Prototype analysis::Visualise patterns and iteratively test processing techniques and meaningful features.',
'Implement and repeat::Consolidate the processing pipeline and perform analytics repeatedly to support decisions.'
],materials='Product instrumentation, data storage and analytics software',note='Requires data engineering and analysis competence. Continuous data collection cannot be completed by a single workshop.',stages=[('prepare','Define and instrument analytics',[0,1],'Implement and validate instrumentation, then collect enough real usage data.'),('analyse','Prototype analytics',[2],'Prepare and inspect data before analysis; iterate collection when necessary.'),('operate','Implement repeatable analytics',[3],'Deployment and ongoing observation continue beyond session time.')])
add('comfort-evaluation',186,193,'converging','develop deliver iterate','understand select',120,'difficult','Evaluate comfort and discomfort under realistic use conditions.','Products for comparison, an appropriate sample and a clear evaluation focus.',[
'Choose the assessment::Define the focus and select comfort, discomfort or both; record expectations before use.',
'Prepare comparable use::Use the same relevant activities and suitable duration across products and participants.',
'Collect experience::Use the appropriate discomfort/comfort scales or body map and consider physical, social and environmental context.',
'Interpret differences::Compare responses across participants and products and identify possible redesign areas.'
],materials='Appropriate comfort scales; LPD body map where applicable; products and use setting',note='Source warns that standard LPD assessment needs at least an hour of exposure to reveal discomfort. Brief red/green body-marking is a simpler adaptation, not equivalent evidence. Avoid concluding comfort from absence of discomfort.',stages=[('prepare','Prepare comfort study',[0,1],'Arrange suitable products, respondents and realistic use duration before testing.'),('evaluate','Evaluate and interpret comfort',[2,3],'Allow at least one hour of exposure for standard LPD plus briefing and analysis; exposure time must not be compressed.')])
# The combined PrEmo index has an overview but no reproducible card protocol in this scan.
add('premo-photo-elicitation',188,195,'unclassified','discover develop deliver','understand select',60,'difficult','Understand emotional responses using a pictorial instrument or image-supported interview.','A defined stimulus, participants and the actual PrEmo instrument or photo-elicitation protocol.',[],materials='PrEmo card set or appropriate visual prompts',note='Needs verification: the page explains PrEmo and photo-elicitation but does not supply the instrument, response/scoring protocol or a full interview procedure. Obtain the cited instrument guidance before scheduling. These are two approaches, not interchangeable steps of one method.')
records[-1]['verifiedProcedure']=False
records[-1]['defaultMinutes']=None
records[-1]['metadataOrigin']='missing'
records[-1]['sourceRecord']['planningEstimate']='No runnable duration assigned: full instrument/protocol needs verification.'
add('role-playing',190,197,'diverging','develop iterate','understand flexibility',50,'medium','Explore interactions by acting them out and reflecting on the recordings.','An initial interaction idea and intended actor goals.',[
'Prepare the scene::Define actors, goals and sequence; gather props and arrange recording.',
'Assign and enact::Divide roles, act expressively and think aloud about motivations.',
'Vary and repeat::Change narrative or setting and enact different sequences.',
'Review records::Watch recordings, transcribe relevant moments and translate them into insights.'
],materials='Props, suitable space and recording tools',note='Role-play informs concepts; designers acting a role do not substitute for evidence from intended users.')
add('product-usability-evaluation',192,199,'converging','develop deliver iterate','understand select',120,'difficult','Identify usability issues and requirements through observed product use.','A product representation, intended users and realistic use context.',[
'Define use and assumptions::Storyboard expected use; identify what to evaluate and assumptions about perception, understanding and operation.',
'Plan the research::Formulate open questions and prepare representations, environment, instructions and recording.',
'Conduct evaluation::Brief participants including privacy, then observe and record intended and unintended use.',
'Analyse and redesign::Summarise issues qualitatively or quantitatively as appropriate; communicate redesign requirements.'
],materials='Prototype/storyboard, test environment and recording tools',note='Research setup and participant recruitment precede testing; informal team review is not equivalent to user evaluation. Numeric sample guidance in the scan is ambiguous and is not encoded as a hard constraint. Results apply to tested functionality only.',stages=[('prepare','Prepare usability study',[0,1],'Build the required representation and arrange participants before testing.'),('evaluate','Observe product use',[2],'Allocate actual user testing time and prepare records before analysis.'),('analyse','Interpret and redesign',[3],'Base redesign requirements on observed evidence.')])
add('product-concept-evaluation',195,201,'converging','develop deliver iterate','select understand',120,'difficult','Gather structured judgments on concepts to guide selection or improvement.','Concepts, an evaluation purpose and suitable respondents.',[
'Design the evaluation::State the aim and format; prepare comparable concept representations.',
'Plan and recruit::Specify respondents, questions, test setting, recording and analysis, then invite participants.',
'Run the evaluation::Set up the environment and collect judgments using the planned approach.',
'Analyse and report::Present concise findings and implications for concept improvement or decisions.'
],materials='Concept representations, evaluation guide and recording tools',note='Respondents judge representations of unfinished products. Re-evaluate later as concepts become concrete.',stages=[('prepare','Prepare concept evaluation',[0,1],'Create representations and recruit appropriate respondents.'),('evaluate','Collect concept feedback',[2],'Budget participant encounters separately from preparation and analysis.'),('analyse','Analyse concept feedback',[3],'Use actual feedback; explain uncertainty of evaluating unfinished designs.')])
add('cost-price-estimation',196,203,'converging','develop deliver','select understand',60,'difficult','Make the assumptions and major cost components of a design explicit.','A sufficiently defined concept, production volume and current cost evidence.',[
'Compare alternatives::Use similar products to examine likely effects of materials, labour, finishing and functionality.',
'Estimate production costs::Calculate materials and manufacturing for the expected batch size, distinguishing fixed and per-unit costs.',
'Build the price chain::Include packaging, overheads, selling, transport, margins and applicable taxes as relevant.',
'Review assumptions::Compare the estimate with market examples and identify costly design choices for revision.'
],materials='Spreadsheet and current supplier/manufacturing data',note='Facilitator grouping of qualitative and quantitative source guidance. Source example prices, margins and taxes are historical illustrations; obtain current project-specific values.')
add('prototype-reflection-cards',198,205,'reverging','develop deliver iterate','understand frame',25,'easy','Record what a prototype activity taught and what to do next.','A completed prototype trial and its records.',[
'Document the trial::Briefly describe what was tried and add a photo or drawing.',
'Reflect on learning::Review people, technology and organisation, particularly unexpected findings.',
'Distinguish learning types::Identify new insights, new know-how and ideas for subsequent action.',
'Summarise and retain::Record the three most important learnings and a process reflection; keep cards chronologically for later review.'
],materials='Reflection card or equivalent structured document',note='The prototype activity must happen before reflection. The source says a card may take 10–15 minutes; the 25-minute estimate includes team discussion. Keep design-detail documentation separately.')
add('cinematic-prototyping',200,207,'diverging','develop iterate','flexibility understand',180,'difficult','Explore an interactive object and communicate its use through a short film.','An interactive-object idea and access to making and filming tools.',[
'Concept::Describe functions and state changes; storyboard the intended user, context and effects.',
'Embody::Make simple mock-ups and explore form, material, size, sound and expressiveness.',
'Enact::Animate the object through human control and explore how its behaviour is understood in use.',
'Produce::Detail the storyboard and props, arrange location and lighting, rehearse and film scenes, then edit with suitable sound.'
],materials='Mock-up materials, motion-control props, camera and editing tools',note='The source defines four consecutive phases. The estimate is active team planning/exploration; fabrication and film production may require substantial additional time.',stages=[('concept','Concept',[0],'Prepare a state-change diagram and initial storyboard.'),('embody','Embodiment',[1],'Build usable mock-ups and explore sounds before enactment.'),('enact','Enactment',[2],'Rehearse a workable way to animate the object before filming.'),('produce','Film production',[3],'Location preparation, filming and editing are real production work; schedule them explicitly outside a short workshop if needed.')])
add('design-drawing-to-develop',202,209,'diverging','develop iterate','fluency flexibility',40,'easy','Develop alternatives through iterative visual thinking.','A design challenge or partial idea.',[
'Warm up visually::Start with simple shapes, thoughts and partial solutions.',
'Explore alternatives::Draw successive variations and elaborate ideas; use transformation prompts when useful.',
'Share and develop::Show sketches to peers, draw during group ideation and use feedback or rough models to extend ideas.'
],materials='Paper and drawing tools or tablet; optional rough model materials',note='Facilitator grouping of non-numbered source guidance. Share unfinished sketches; polishing too early can limit exploration.')
add('experience-prototyping',207,211,'diverging','develop iterate','understand flexibility',90,'medium','Explore how people experience a proposed interaction in context.','An intended experience and access to its context or a feasible simulation.',[
'Define the situation::Visit or describe the context, specify the desired experience and list required people, props and devices.',
'Enable the experience::Put low-fidelity prototypes into the setting, try them and iterate toward the intended experience.',
'Study experience::Use appropriate research methods to understand responses and investigate findings that challenge assumptions.'
],materials='Prototypes, props and a realistic or simulated setting',note='Not every contextual variable can be simulated. Identify the dimensions driving the design and state what the setup omits.',stages=[('prepare','Define and prepare the experience',[0],'Arrange the setting, people and essential props.'),('try','Explore the prototype',[1],'Build or revise prototypes before studying user experience.'),('study','Study experience',[2],'Arrange participant research and use actual observations; simulation cannot reproduce every real-world condition.')])
add('wizard-of-oz',205,213,'diverging','develop iterate','understand flexibility',90,'difficult','Explore an interactive concept with a human simulating unfinished functionality.','An interaction concept and a feasible human-operated prototype.',[
'Prepare the simulation::Create a believable interface and a suitable hidden or inconspicuous operator position with effective controls.',
'Rehearse responses::Write scripts for likely situations and train the operator to respond promptly without interrupting use.',
'Try and reflect::Let people interact with the simulation; note operator difficulties as challenges for the eventual product.'
],materials='Prototype interface, operator controls and agreed research setup',note='Facilitator grouping of the source’s non-numbered guidance. Arrange appropriate consent and debriefing for simulated functionality; the simulation does not prove technical feasibility.',stages=[('prepare','Build and rehearse simulation',[0,1],'Build controls and rehearse before participant encounters.'),('try','Try the simulated interaction',[2],'Schedule actual participant sessions and debriefing; investigate technical challenges independently.')])
add('design-drawing-to-deliver',208,215,'reverging','deliver','frame select',60,'medium','Communicate the design features needed for a final presentation or development handoff.','A developed proposal and clear presentation purpose.',[
'Choose the message::Select features relevant to project criteria and the audience.',
'Select views::Choose viewpoints and perspective that explain interaction, mechanisms or assembly clearly.',
'Compose the delivery::Integrate drawings, annotation and visual emphasis into the appropriate presentation medium.'
],materials='Drawing/rendering tools and presentation medium',note='Facilitator grouping of non-numbered guidance. Drawings support communication; ergonomic conclusions require appropriate models and use testing.')
add('3d-physical-models',211,217,'diverging','develop deliver iterate','understand flexibility',90,'medium','Build an appropriate physical representation to explore, communicate or test a design.','A concept and a clear reason for making a model.',[
'Set the purpose::Decide whether the model supports idea exploration, communication or testing a principle.',
'Choose fidelity::Select required detail and materials before devising the build plan.',
'Build and iterate::Use simple sketch models for early exploration; use a detailed plan for working prototypes or presentation models.'
],materials='Materials and fabrication tools appropriate to the model’s purpose',note='The estimate suits a simple model exercise. Detailed fabrication, curing and specialist workshop access require separate scheduling; a visual mock-up cannot verify unimplemented functionality.')
add('technical-documentation',212,219,'organisation','develop deliver','understand',120,'difficult','Develop consistent digital models and documentation for manufacture and communication.','A product concept, CAD skills and relevant manufacturing requirements.',[
'Model the concept::Create a parametric model and use it to investigate mechanisms where needed.',
'Develop materialisation::Choose materials, examine manufacturing behaviour and perform relevant engineering analyses.',
'Document the design::Evolve the model and produce technical drawings using applicable standards and tolerances.',
'Support production and communication::Use verified models for production tooling and prepare exploded views, renderings or assembly information.'
],materials='CAD tools, engineering data and applicable drawing standards',note='The source spans a design project, not a single short workshop. Specialist engineering and manufacturing validation remain necessary.',stages=[('concept','Concept model',[0],'Develop the concept sufficiently for engineering analysis.'),('engineer','Materialisation and analysis',[1],'Complete required material research, calculations and manufacturing checks; these may take multiple sessions.'),('document','Technical handoff',[2,3],'Verify drawing standards and tolerances before releasing production data.')])

out=root/'lib/recovered-methods.json'
out.write_text(json.dumps(records,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
# The index includes aliases for the eight already implemented catalogue records.
originals={'How-Tos':(168,175,'delft-how-tos'),'Braindrawing':(162,169,'delft-braindrawing'),'Morphological Chart':(164,171,'delft-morphological-chart'),'SCAMPER':(166,173,'delft-scamper'),'C-Box':(174,181,'delft-c-box'),'Harris Profile':(170,177,'delft-harris-profile'),'Datum Method':(178,185,'delft-datum'),'Weighted Objectives':(180,187,'delft-weighted-objectives')}
byid={m['id']:m for m in records}
assert len(byid)==len(records)
assert all(x['id'] in byid or x['name'] in originals for x in index if x['id'].startswith('index-delft-'))
for m in records:
    assert m['verifiedProcedure']==bool(m['steps'])
    for stage in m.get('stages',[]):
        assert all(0<=n<len(m['steps']) for n in stage['stepIndices'])
road=[x for x in index if x['id'].startswith('index-roadmap-')]
text=f'''# Method catalogue coverage audit

Audit date: 14 October 2026. Scope: all {len(index)} indexed records in `lib/discovery.json`, including the eight Delft index aliases already implemented in `lib/catalogue.ts`.

## Result and interpretation

- Delft: {len(records)-1} newly recovered runnable procedure summaries, eight existing procedures preserved, and one combined instrument entry needing verification (PrEmo & Photo-Elicitation).
- Road Map: {len(road)} entries remain **source unavailable**. The supplied 30-page preview ends before the method catalogue; a title in a contents list is not a procedure. Similarly named Delft methods have not been copied into Road Map records.
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
'''
for x in index:
    if not x['id'].startswith('index-delft-'):continue
    if x['name'] in originals:
        pdf,printed,canonical=originals[x['name']]
        text+=f'| `{x["id"]}` | {x["name"]} | Recovered (existing) | Printed p. {printed}; PDF p. {pdf}; canonical ID `{canonical}` preserved. |\n'
    else:
        m=byid[x['id']]
        status='Recovered' if m['verifiedProcedure'] else 'Needs verification'
        note=m['sourceRecord']['sourceScope']
        if not m['verifiedProcedure']:note+=' Instrument and administration/scoring protocol absent; unavailable for scheduling.'
        elif 'actual checklist' in m['sourceRecord']['consideration']:note+=' Bring the actual Ecodesign Checklist.'
        elif 'actual Cultura' in m['sourceRecord']['consideration']:note+=' Bring the Cultura Question Card Set and Canvas.'
        elif 'project-value blueprint' in m['sourceRecord']['consideration']:note+=' Bring the referenced project-value blueprint.'
        text+=f'| `{x["id"]}` | {x["name"]} | {status} | {note} |\n'
text+='\n## Road Map entry-by-entry coverage\n\n| Existing index ID | Method | Status | Required next source |\n|---|---|---|---|\n'
for x in road:text+=f'| `{x["id"]}` | {x["name"]} | Source unavailable | Full named method passage; contents alone are insufficient. |\n'
text+='''
## Remaining work before specialist facilitation

Obtain the full Road Map method pages and the PrEmo instrument/protocol. Verify external toolkit editions for Cultura, Ecodesign Checklist and Project Value Modelling. Pilot recovered activities with the intended group and revise facilitator estimates through the metadata editor. For research activities, plan participant access, study duration and data preparation explicitly. For engineering, analytics and quantitative research, involve appropriate expertise rather than treating a concise card as certification.

The procedure source and estimated planning guidance are separate fields. Persisted user metadata must override defaults without changing the source-backed procedure or hard participant constraints. Demo presets remain separate. Catalogue recovery does not establish copyright permission to redistribute full book scans; the app uses concise paraphrases and citations rather than page images.
'''
(root/'docs/METHOD-COVERAGE.md').write_text(text,encoding='utf-8')
print(f'Wrote {len(records)} Delft records ({sum(x["verifiedProcedure"] for x in records)} runnable) and audited {len(index)} index entries.')
