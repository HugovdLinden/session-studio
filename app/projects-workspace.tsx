'use client';
import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, CheckCircle2, Download, Library, Plus, Upload, X } from 'lucide-react';
import Studio from './studio';
import { ensureWorkspace } from '@/lib/workspace-client';
import { runPath } from '@/lib/board';
import { readRunProgress, runKey, runProgressKey } from '@/lib/board-client';
import { Home } from './home';
import { BrandMark } from './brand-mark';
import ProjectIntake from './project-intake';
import ProgrammeSessionCard from './programme-session-card';
import type { GerdContext } from './gerd';
import { applyCompanionEdits, type CompanionChangeRequest } from '@/lib/companion';
import { activityMinutes, minimum } from '@/lib/engine';
import './project-planner.css';
import { dependencyIssues, moveBlock, validateProjectChange, type Project, type ProjectData, type ProjectGoal, type Session } from '@/lib/projects';
import { createLocalProject, exportProject, importProjectFile, localKey, readLocalProjects, saveLocalProjects } from '@/lib/local-projects';
import { createProgrammeProject, addEmptyGoalSession, removeGoalSession, reorderGoalSession, insertGoalSession, nextSessionId, groupSessionsByWeek, type ProgrammeInput } from '@/lib/programme';
import { generatePlan } from '@/lib/engine';
import { withDemoRatings } from '@/lib/catalogue';
import type { Intake, Method, Plan } from '@/lib/types';

function download(text:string,name:string){const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function Panel({title,children,onClose,className=''}:{title:string;children:ReactNode;onClose:()=>void;className?:string}){
 const ref=useRef<HTMLDialogElement>(null),close=useRef(onClose),backdropPress=useRef(false);close.current=onClose;
 useEffect(()=>{const focused=document.activeElement as HTMLElement|null;ref.current?.showModal();const overflow=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=overflow;ref.current?.close();focused?.focus({preventScroll:true});};},[]);
 function outside(e:{clientX:number;clientY:number;target:EventTarget;currentTarget:HTMLDialogElement}){const b=e.currentTarget.getBoundingClientRect();return e.target===e.currentTarget&&(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom);}
 return <dialog ref={ref} className={`programme-dialog ${className}`} aria-label={title} onPointerDown={e=>{backdropPress.current=outside(e);}} onClick={e=>{if(backdropPress.current&&outside(e))close.current();backdropPress.current=false;}} onCancel={e=>{if(e.target!==e.currentTarget)return;e.preventDefault();close.current();}}><div className="programme-dialog-shell"><header className="programme-dialog-header"><h2>{title}</h2><button className="icon-button" aria-label="Close and save draft" onClick={onClose}><X size={22}/></button></header><div className="programme-dialog-body">{children}</div></div></dialog>;
}
function inputFor(goal:ProjectGoal,project:Project):ProgrammeInput{
 const session=project.sessions.find(s=>goal.sessionIds.includes(s.id))??project.sessions[0];
 const phases=goal.diamonds.flatMap(d=>d.phases);const diamonds=[{id:'legacy-problem',phases:phases.filter(p=>p==='discover'||p==='define')},{id:'legacy-solution',phases:phases.filter(p=>p==='develop'||p==='deliver')}];if(!diamonds.some(d=>d.phases.length))diamonds[1].phases=['develop','deliver'];
 return goal.setup??{goal:goal.title,diamonds,participants:session?.intake.participants??4,level:session?.intake.level??'bachelor',hours:1.5,timeMode:'total',weeks:goal.weeks,sessionsPerWeek:goal.sessionsPerWeek,sessionCount:goal.sessionIds.length,countMode:'manual'};
}
export default function ProjectsWorkspace({storageScope,onGerdContext}:{storageScope:string;onGerdContext?:(value:GerdContext|undefined)=>void}){
 const key=localKey(storageScope),[projects,setProjects]=useState<Project[]>([]),[activeId,setActiveId]=useState(''),[sessionId,setSessionId]=useState(''),[loaded,setLoaded]=useState(false);
 const [search,setSearch]=useState(''),[creating,setCreating]=useState(false),[library,setLibrary]=useState(false);
 const [methods,setMethods]=useState<Method[]>([]),[error,setError]=useState(''),[saveStatus,setSaveStatus]=useState('Saved in this browser'),[conflict,setConflict]=useState(false),[agendaKey,setAgendaKey]=useState(0);
 const [goalPanel,setGoalPanel]=useState<string|null>(null),[busy,setBusy]=useState(false),[facilitator,setFacilitator]=useState(false),[generation,setGeneration]=useState(''),[handoff,setHandoff]=useState<Plan|null>(null),[feedback,setFeedback]=useState(''),[startReady,setStartReady]=useState(false);
 const [workspaceBusy,setWorkspaceBusy]=useState(false),[runs,setRuns]=useState<ReturnType<typeof readRunProgress>>({});
 const pendingGoal=useRef('');
 useEffect(()=>{if(goalPanel||!pendingGoal.current)return;const id=pendingGoal.current;pendingGoal.current='';requestAnimationFrame(()=>{const heading=document.getElementById(`goal-${id}`);heading?.closest('section')?.scrollIntoView({block:'start'});heading?.focus({preventScroll:true});});},[goalPanel,projects]);
 const snapshot=useRef<string|null>(null),fileInput=useRef<HTMLInputElement>(null),dirty=useRef(false),currentProjects=useRef(projects);currentProjects.current=projects;
 const project=projects.find(p=>p.id===activeId),active=project?.sessions.find(s=>s.id===sessionId);
 const goal=project?.goals.find(g=>g.sessionIds.includes(sessionId));
 useEffect(()=>{if(!project){onGerdContext?.(undefined);return;}const next=active??project.sessions.find(s=>s.id===nextSessionId(project));const currentGoal=goal??project.goals.find(g=>next&&g.sessionIds.includes(next.id));onGerdContext?.({projectName:project.name,phase:next?.intake.phase??'',goal:currentGoal?.title??'',hasPlan:!!next?.plan,approved:next?.status==='approved',activities:next?.plan?.activities.slice(0,8).map(a=>a.name)??[],planner:{projectId:project.id,revision:project.revision,sessions:next?[{id:next.id,title:next.title,minutes:next.intake.minutes,status:next.status,activities:next.plan?.activities.map(a=>({id:a.instanceId,name:a.name,minutes:activityMinutes(a),minimum:Math.max(a.steps.length,a.operational?1:minimum(a))}))??[]}]:[]}});},[project,active,goal,onGerdContext]);
 async function loadCatalogue(){try{const response=await fetch('/api/catalogue');const data=await response.json() as {error?:string;methods:Method[]};if(!response.ok)throw new Error(data.error??'Could not load the library.');setMethods(data.methods);}catch(e){setError((e as Error).message);}}
 function reload(){try{const raw=localStorage.getItem(key);const saved=readLocalProjects(raw);snapshot.current=raw;currentProjects.current=saved;setProjects(saved);setLoaded(true);setConflict(false);dirty.current=false;setSaveStatus('Saved in this browser');setError('');setAgendaKey(k=>k+1);}catch{setError('Saved projects could not be read. Your stored data has not been overwritten. Export a backup before continuing.');setLoaded(false);}}
 useEffect(()=>{reload();void loadCatalogue();void fetch('/api/programme').then(r=>r.ok?r.json():null).then(v=>setFacilitator(!!(v as {configured?:boolean}|null)?.configured)).catch(()=>{});
  try{const query=new URLSearchParams(window.location.search),wanted=query.get('project');if(wanted){const p=currentProjects.current.find(x=>x.id===wanted);if(p){open(p);const wantedSession=query.get('session');if(wantedSession&&p.sessions.some(x=>x.id===wantedSession&&x.status!=='completed'))setSessionId(wantedSession);}window.history.replaceState(null,'',window.location.pathname);}}catch{/* Keep storage errors visible. */}
  setRuns(readRunProgress(storageScope));
  const change=(event:StorageEvent)=>{if(event.key===runProgressKey(storageScope)){setRuns(readRunProgress(storageScope));return;}if(event.key===key||event.key===null){setConflict(true);setError('Projects changed in another tab. Export your edits, then reload the saved projects.');}};
  const before=(event:BeforeUnloadEvent)=>{if(dirty.current){event.preventDefault();event.returnValue='';}};
  window.addEventListener('storage',change);window.addEventListener('beforeunload',before);return()=>{window.removeEventListener('storage',change);window.removeEventListener('beforeunload',before);};
 },[key]);
 function persist(next:Project[]){try{readLocalProjects(JSON.stringify({version:2,projects:next}));}catch(e){setError(`This edit could not be saved: ${(e as Error).message}`);return false;}currentProjects.current=next;setProjects(next);dirty.current=true;try{snapshot.current=saveLocalProjects(localStorage,key,next,snapshot.current);dirty.current=false;setSaveStatus('Saved in this browser');setError('');return true;}catch(e){setSaveStatus('Save failed — export a backup');setError((e as Error).message);return false;}}
 function edit(change:(p:Project)=>Project){const source=currentProjects.current.find(p=>p.id===activeId);if(!source||conflict)return false;try{const result=change(source);const next={...result,revision:source.revision+1,updatedAt:new Date().toISOString()};return persist(currentProjects.current.map(p=>p.id===next.id?next:p));}catch(e){setError((e as Error).message);return false;}}
 const companionUndo=useRef<{project:Project;afterRevision:number}|null>(null);
 useEffect(()=>{
  const apply=(event:Event)=>{const detail=(event as CustomEvent<CompanionChangeRequest>).detail;if(!detail?.done)return;
   const source=currentProjects.current.find(p=>p.id===activeId);if(!source||source.id!==detail.projectId||conflict||dirty.current){detail.done({ok:false,message:'Open the same project with no unsaved changes before applying this edit.'});return;}
   try{let result:Project;
    if(detail.undo){const saved=companionUndo.current;if(!saved||saved.project.id!==source.id||saved.afterRevision!==source.revision)throw new Error('The plan has changed since that edit. Undo is no longer available.');result=saved.project;}
    else{result=applyCompanionEdits(source,detail.revision,detail.actions);validateProjectChange(source,result,methods);}
    if(!edit(()=>result)){detail.done({ok:false,message:'The change could not be saved. Your planner shows its current save status.'});return;}
    companionUndo.current=detail.undo?null:{project:structuredClone(source),afterRevision:source.revision+1};
    setAgendaKey(k=>k+1);setHandoff(null);setFeedback(detail.undo?'Companion edit undone.':'Companion timing changes saved.');
    detail.done({ok:true,message:detail.undo?'Timing changes undone.':'Timing changes saved. You can undo this edit.',revision:source.revision+1});
   }catch(e){detail.done({ok:false,message:(e as Error).message});}
  };window.addEventListener('session-studio:companion-edit',apply);return()=>window.removeEventListener('session-studio:companion-edit',apply);
 },[activeId,conflict,methods,project]);
 function open(p:Project){setFeedback('');setActiveId(p.id);setSessionId('');setCreating(false);setLibrary(false);setGeneration('');setHandoff(null);window.scrollTo({top:0});}
 async function openWorkspace(runSessionId?:string){
  const source=currentProjects.current.find(p=>p.id===activeId);if(!source||conflict||dirty.current||workspaceBusy)return;
  if(runSessionId&&!source.sessions.some(s=>s.id===runSessionId&&s.status==='approved'&&s.plan?.activities.length)){setError('Confirm and save a nonempty session plan before starting.');return;}
  setWorkspaceBusy(true);setError('');
  try{const id=await ensureWorkspace(source);
   const latest=currentProjects.current.find(p=>p.id===source.id);if(!latest||latest.revision!==source.revision||localStorage.getItem(key)!==snapshot.current)throw new Error('The project changed while opening its workspace. Reload and try again.');
   if(source.workspace?.boardId!==id||source.workspaceCopyFrom){if(!edit(p=>({...p,workspace:{boardId:id},workspaceCopyFrom:null})))return;}
   window.location.assign(runSessionId?runPath(id,runSessionId):`/board/${id}`);
  }catch(e){setError(`Workspace: ${(e as Error).message}`);}finally{setWorkspaceBusy(false);}
 }
 function home(){setFeedback('');setActiveId('');setCreating(false);setGoalPanel(null);setSessionId('');setLibrary(false);setHandoff(null);window.scrollTo({top:0});}
 function add(p:Project){const saved=persist([...currentProjects.current,p]);if(saved)open(p);return saved;}
 function removeProject(project:Project){if(persist(currentProjects.current.filter(candidate=>candidate.id!==project.id))){setFeedback(`${project.name} was deleted.`);home();}}
 async function importFile(file:File){try{if(file.size>5*1024*1024)throw new Error('Choose a JSON export smaller than 5 MB.');const imported=importProjectFile(await file.text());if(!imported.length)throw new Error('This backup has no projects.');if(persist([...currentProjects.current,...imported]))open(imported[0]);}catch(e){setError(`Import failed: ${(e as Error).message}`);}finally{if(fileInput.current)fileInput.current.value='';}}
 async function buildProgramme(name:string,description:string,input:ProgrammeInput):Promise<ProjectData>{
  if(!facilitator){setGeneration('Local draft — the facilitator is not connected. Review the sequence and methods.');return createProgrammeProject(name,description,input,methods);}
  const response=await fetch('/api/programme',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,description,input})});const data=await response.json() as {error?:string;project?:ProjectData};if(!response.ok)throw new Error(data.error??'The facilitator could not make a programme. Your saved work is unchanged.');setGeneration('Programme proposed by the facilitator. Review each session before starting.');if(!data.project)throw new Error('The facilitator returned no programme.');return data.project;
 }
 async function submitIntake(name:string,description:string,input:ProgrammeInput){if(conflict)return;setBusy(true);setError('');try{if(project&&goalPanel==='new'&&project.sessions.length+input.sessionCount>120)throw new Error('Keep the project to 120 sessions or fewer. Your intake is still here to adjust.');const proposed=await buildProgramme(name,description,input);if(!project){add(createLocalProject(proposed));return;}
  if(goalPanel==='new'){
   const newGoal=proposed.goals[0];if(!edit(p=>({...p,sessions:[...p.sessions,...proposed.sessions],goals:[...p.goals,newGoal],uncovered:[...p.uncovered,...proposed.uncovered].slice(0,120)})))return;pendingGoal.current=newGoal.id;
  }else{
   const old=project.goals.find(g=>g.id===goalPanel);if(!old)throw new Error('Choose a goal to update.');
   const protectedIds=new Set(project.sessions.filter(s=>old.sessionIds.includes(s.id)&&s.status==='completed').map(s=>s.id));
   // Retain the prerequisites and staged method runs on which completed work rests.
   let grew=true;while(grew){grew=false;const retained=project.sessions.filter(s=>protectedIds.has(s.id));const dependencies=new Set(retained.flatMap(s=>s.dependsOn));const runs=new Set(retained.flatMap(s=>s.plan?.activities.map(a=>a.methodRunId).filter(Boolean)??[]));for(const s of project.sessions.filter(s=>old.sessionIds.includes(s.id)))if(!protectedIds.has(s.id)&&(dependencies.has(s.id)||s.plan?.activities.some(a=>a.methodRunId&&runs.has(a.methodRunId)))){protectedIds.add(s.id);grew=true;}}
   const completed=old.sessionIds.map(id=>project.sessions.find(s=>s.id===id)!).filter(s=>protectedIds.has(s.id));
   if(input.sessionCount<completed.length)throw new Error(`This goal contains ${completed.length} sessions protected by completed work. Choose at least that many sessions.`);
   if(old.sessionIds.some(id=>project.sessions.find(s=>s.id===id)?.plan)&&!confirm('Replace the unfinished sessions for this goal? Completed sessions and other goals will stay unchanged.'))return;
   const incoming=proposed.goals[0],remap=new Map(incoming.sessionIds.slice(0,completed.length).map((id,i)=>[id,completed[i].id]));
   const drafts=proposed.sessions.slice(completed.length).map(s=>({...s,dependsOn:s.dependsOn.map(id=>remap.get(id)??id)}));
   const cycles=incoming.diamonds.map(d=>({...d,phases:[...d.phases]}));
   for(const s of completed){if(!s.phaseCycleId)continue;const cycle=cycles.find(d=>d.id===s.phaseCycleId);if(cycle){if(!cycle.phases.includes(s.intake.phase))cycle.phases.push(s.intake.phase);}else{const oldCycle=old.diamonds.find(d=>d.id===s.phaseCycleId);if(oldCycle)cycles.push(oldCycle);}}
   const newGoal={...incoming,id:old.id,diamonds:cycles,sessionIds:[...completed.map(s=>s.id),...drafts.map(s=>s.id)]};
   if(!edit(p=>({...p,name,description,sessions:p.goals.flatMap(g=>g.id===old.id?[...completed,...drafts]:g.sessionIds.map(id=>p.sessions.find(s=>s.id===id)!)),goals:p.goals.map(g=>g.id===old.id?newGoal:g),uncovered:proposed.uncovered})))return;
  }setGoalPanel(null);
 }catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 function updatePlan(plan:Plan,approved:boolean){return edit(p=>{const currentGoal=p.goals.find(g=>g.sessionIds.includes(sessionId));const cycle=currentGoal?.diamonds.find(d=>d.phases.includes(plan.intake.phase));if(!cycle)throw new Error('Choose this phase in the goal intake before assigning it to a session.');const next={...p,sessions:p.sessions.map(s=>s.id===sessionId&&s.status!=='completed'?{...s,phaseCycleId:s.intake.phase===plan.intake.phase?s.phaseCycleId:cycle.id,intake:plan.intake,plan,status:approved?'approved' as const:'draft' as const}:s)};validateProjectChange(p,next,methods);return next;});}
 function move(from:string,block:string,to:string,index:number){edit(p=>({...p,sessions:moveBlock(p.sessions,from,block,to,index)}));setAgendaKey(k=>k+1);}
 function reorder(goalId:string,id:string,index:number){if(edit(p=>reorderGoalSession(p,goalId,id,index)))setFeedback('Session order saved.');}
 function openSession(s:Session){if(s.status==='completed')return;if(!s.plan){const plan:Plan={id:crypto.randomUUID(),version:1,intake:s.intake,activities:[],demo:project?.demo??false,generatedAt:new Date().toISOString(),acceptedWarnings:[]};if(!edit(p=>({...p,sessions:p.sessions.map(item=>item.id===s.id?{...item,plan}:item)})))return;}setHandoff(null);setStartReady(false);setSessionId(s.id);setAgendaKey(k=>k+1);setError('');}
 function addSession(goalId:string){let id='';const okay=edit(p=>{const next=addEmptyGoalSession(p,goalId);id=next.goals.find(g=>g.id===goalId)!.sessionIds.at(-1)!;return next;});if(okay&&id){setSessionId(id);setAgendaKey(k=>k+1);}}
 const errors=error?<div role="alert" className="notice danger"><p>{error}</p>{conflict?<button className="button" onClick={()=>{if(!dirty.current||confirm('Discard unsaved tab changes and reload? Export first to keep them.'))reload();}}>Reload saved projects</button>:<button className="button" onClick={()=>{if(!loaded)reload();else if(dirty.current)persist(currentProjects.current);else setError('');}}>Dismiss</button>}</div>:null;
 const backup=<button className="button small" onClick={()=>download(JSON.stringify({version:2,projects:currentProjects.current},null,2),'session-studio-browser-backup.json')}>Export browser backup</button>;
 const topbar=<header className="topbar"><button className="brand brand-home" aria-label="Session Studio — Home" onClick={home}><BrandMark/><span>Session Studio</span></button><nav aria-label="Main navigation"><button className="nav-button" onClick={()=>setLibrary(true)}><Library size={18}/>Method library</button><span className="private-label">Browser workspace</span></nav></header>;
 if(library)return <Studio libraryOnly onHome={()=>setLibrary(false)}/>;
 if(creating&&!project)return <div className="app">{topbar}<main className="programme-intake-page"><button className="text-button" onClick={home}><ArrowLeft size={16}/>All projects</button><ProjectIntake busy={busy||!methods.length||conflict} onSubmit={(n,d,i)=>void submitIntake(n,d,i)} onCancel={home} error={error}/></main></div>;
 if(!project)return <div className="app">{topbar}<Home projects={loaded?projects:null} search={search} onSearch={setSearch} busy={!loaded||conflict} onNew={()=>{setError('');setCreating(true);}} onContinue={open} onDelete={removeProject} backupTools={<>
 <p className="local-storage-note">Projects stay in this browser. Export regularly to back up or share your work.</p><div className="row-actions"><label className="button small"><Upload size={16}/>Import project / backup<input ref={fileInput} type="file" accept=".json,application/json" disabled={!loaded||conflict} onChange={e=>{const f=e.target.files?.[0];if(f)void importFile(f);}}/></label>{loaded?backup:<button className="button" onClick={()=>{const raw=localStorage.getItem(key);if(raw)download(raw,'session-studio-unreadable-backup.json');}}>Back up stored data</button>}</div>
 </>}>{errors}</Home><footer className="app-footer">Session Studio <span>Design the session. Then do the work.</span></footer></div>;
 const nextId=nextSessionId(project);
 return <div className="app programme-workspace">{topbar}<main className="programme-overview"><div className="programme-actions"><button className="text-button" onClick={home}><ArrowLeft size={16}/>All projects</button><button className="button small" onClick={()=>download(exportProject(project),`${project.name.replace(/[^a-z0-9_-]/gi,'-')}.json`)}><Download size={16}/>Export project</button><span className="save-status" role="status">{saveStatus}</span></div>
 <header className="programme-project-heading"><span className="eyebrow">Your design project</span><h1>{project.name}</h1>{project.description?<p>{project.description}</p>:null}</header>{errors}{generation?<p className="status-note" role="status">{generation}</p>:null}
 {feedback?<p className="status-note" role="status">{feedback}</p>:null}
 {project.uncovered.length?<details className="notice warning"><summary>Review planning gaps</summary><ul>{project.uncovered.map((message,i)=><li key={i}>{message}</li>)}</ul></details>:null}
 <section className="project-workspace-panel"><h2>Project workspace</h2><p>Collect photos, PDFs, notes and method templates while running your sessions.</p><p className="muted">Anyone with a workspace link can view, upload, comment and remove material.</p><button className="button" disabled={workspaceBusy||conflict||busy} onClick={()=>void openWorkspace()}>{workspaceBusy?'Opening…':project.workspaceCopyFrom?'Copy and open workspace':project.workspace?'Open workspace':'Create workspace'}</button></section>
 <fieldset className="project-fields" disabled={conflict||busy}>
 {project.goals.map((g,goalIndex)=>{const sessions=g.sessionIds.map(id=>project.sessions.find(s=>s.id===id)).filter((s):s is Session=>!!s);return <section className="programme-goal" key={g.id} aria-labelledby={`goal-${g.id}`}><header className="programme-goal-header"><div><span className="eyebrow">Goal {goalIndex+1}</span><h2 tabIndex={-1} id={`goal-${g.id}`}>{g.title}</h2><div className="programme-phase-tags">{g.diamonds.flatMap((d,i)=>d.phases.map(p=><span key={`${d.id}:${p}`}>{p.charAt(0).toUpperCase()+p.slice(1)}{i>1?` · cycle ${i}`:''}</span>))}</div></div><button className="button small" onClick={()=>{setError('');setGoalPanel(g.id);}}>Edit intake</button></header>
 <div className="programme-goal-grid">{groupSessionsByWeek(sessions,g.weeks,g.weekSessionCounts).map(group=><Fragment key={group.week??'all'}>
 {group.week!==null?<div className="programme-week-divider"><span>Week {group.week}</span></div>:null}{group.week!==null&&!group.sessions.length?<p className="muted" style={{gridColumn:'1 / -1'}}>No session planned</p>:null}{group.sessions.map((s,offset)=>{const i=group.startIndex+offset;return <ProgrammeSessionCard key={s.id} session={s} index={i} sessions={sessions} next={s.id===nextId} running={runs[runKey(project.id,s.id)]?.state==='in-progress'} onOpen={()=>openSession(s)} onStart={()=>{if(s.status==='approved'&&runs[runKey(project.id,s.id)]?.state==='in-progress'){void openWorkspace(s.id);return;}openSession(s);setFeedback('Review the session plan, then confirm it to start.');}} onReorder={(id,index)=>reorder(g.id,id,index)} onInsert={(id,beforeId)=>{if(edit(p=>insertGoalSession(p,g.id,id,beforeId)))setFeedback('Session inserted. Plans kept unchanged.');}} onRemove={()=>{if(s.plan?.activities.length&&!confirm(`Remove session ${i+1} and its draft agenda?`))return;edit(p=>removeGoalSession(p,g.id,s.id));}}/>;})}</Fragment>)}
 <button className="goal-session-card add-session-card" disabled={project.sessions.length>=120} onClick={()=>addSession(g.id)}><Plus size={26}/><strong>Add session</strong><span>Start with an empty agenda</span></button></div>
 </section>;})}
 <button className="programme-new-goal" onClick={()=>{setError('');setGoalPanel('new');}}><Plus size={18}/>New goal</button></fieldset>
 </main>
 {goalPanel?<Panel title={goalPanel==='new'?'Add another goal':'Edit project intake'} className="programme-goal-dialog" onClose={()=>{if(!busy)setGoalPanel(null);}}><ProjectIntake goalOnly={goalPanel==='new'} initialName={project.name} initialDescription={project.description} initial={goalPanel==='new'?{...inputFor(project.goals.at(-1)!,project),goal:'',diamonds:inputFor(project.goals.at(-1)!,project).diamonds.map(d=>({...d,phases:[]}))}:inputFor(project.goals.find(g=>g.id===goalPanel)!,project)} busy={busy||!methods.length} onSubmit={(n,d,i)=>void submitIntake(n,d,i)} onCancel={()=>{if(!busy)setGoalPanel(null);}} error={error}/></Panel>:null}
 {active&&goal?<Panel title={`${handoff?'Confirmed':'Planning'} · ${active.title}`} onClose={()=>{requestAnimationFrame(()=>{setSessionId('');setHandoff(null);});}}><div className="programme-editor-goal"><strong>{goal.title}</strong><span role="status">{saveStatus}</span></div>{errors}{handoff?<section className="programme-handoff"><CheckCircle2 size={36}/><h2>{startReady?'Your session is ready to start.':'Your session plan is confirmed and saved.'}</h2><p role="status">{startReady?'Your plan is saved. Opening the session runner…':'Changes are saved in this browser. Start your session to run the agenda with a QR code for each step.'}</p><div className="row-actions"><button className="button" onClick={()=>{setHandoff(null);setStartReady(false);setAgendaKey(k=>k+1);}}>Return to editing</button><button className="button primary" onClick={()=>{if(updatePlan(handoff,true)){setStartReady(true);window.dispatchEvent(new CustomEvent('session-studio:session-start-requested',{detail:{projectId:project.id,goalId:goal.id,sessionId:active.id,plan:handoff}}));void openWorkspace(active.id);}}} disabled={workspaceBusy}>{workspaceBusy?'Opening…':'Start session'}</button><button className="button" onClick={()=>{if(updatePlan(handoff,true)){setFeedback('Session changes saved.');setSessionId('');setHandoff(null);setStartReady(false);}}}>Save changes</button></div></section>:<Studio embedded saveError={error} key={`${active.id}:${agendaKey}`} session={active} sessions={project.sessions.filter(s=>goal.sessionIds.includes(s.id))} issues={dependencyIssues(project.sessions.filter(s=>goal.sessionIds.includes(s.id)))} onHome={home} onMove={move} onChange={updatePlan} onConfirm={plan=>{setStartReady(false);setHandoff(plan);window.dispatchEvent(new CustomEvent('session-studio:session-confirmed',{detail:{projectId:project.id,goalId:goal.id,sessionId:active.id,plan}}));}} onReplan={async(intake:Intake,demo:boolean,pinnedMethodId?:string)=>{const plan=generatePlan(intake,demo?withDemoRatings(methods):methods,demo,pinnedMethodId);return plan;}}/>}</Panel>:null}
 </div>;
}





