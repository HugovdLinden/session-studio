'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, Clock3, Download, FileText, LayoutGrid, Pause, PenLine, Play, RotateCcw, StickyNote } from 'lucide-react';
import type { Board, BoardItem, BoardTemplate } from '@/lib/board';
import { beforeSection, fileUrl, projectPath } from '@/lib/board';
import { json, markRunProgress, request } from '@/lib/board-client';
import { completeRunnerSession } from '@/lib/runner-completion';
import { createActivityTimer, recordedSessionSeconds, restoreRunnerView } from '@/lib/runner-state';
import { localKey, readLocalProjects } from '@/lib/local-projects';
import { activityMinutes } from '@/lib/engine';
import { downloadBlankTemplatePdf, downloadBoardPdf } from '@/lib/pdf';
import type { MethodTemplate, TemplateData } from '@/lib/templates';
import { hasContent, templateFor } from '@/lib/templates';
import type { Activity } from '@/lib/types';
import { goalLabels, phaseLabels } from '@/lib/types';
import { TemplateFields } from './template-form';
import { DropUpload, StepQr } from './uploader';

const categoryLabels={diverging:'Diverging',reverging:'Reverging',converging:'Converging',resting:'Resting',organisation:'Session step',unclassified:'Not yet categorised'};
const clock=(seconds:number)=>`${Math.floor(Math.max(0,seconds)/60)}:${String(Math.floor(Math.max(0,seconds)%60)).padStart(2,'0')}`;
type Data={board:Board;items:BoardItem[];templates:BoardTemplate[]};
type Save={status:'saving'|'saved'|'error';message?:string};

function SectionFeed({boardId,items}:{boardId:string;items:BoardItem[]}) {
 if(!items.length)return <p className="feed-empty">Nothing uploaded here yet.</p>;
 return <ul className="section-feed">{[...items].reverse().slice(0,12).map(i=><li key={i.id} title={i.text||i.fileName||''}>{i.kind==='photo'?<img src={fileUrl(boardId,i.id)} alt={i.text||'Photo'}/>:i.kind==='file'?<span className="feed-chip"><FileText size={16}/>{i.fileName}</span>:<span className="feed-chip note"><StickyNote size={16}/>{i.text}</span>}</li>)}</ul>;
}

// Countdown for the current block, kept per step so moving back and forth does not reset it.
// Rendered with key={storageKey}, so each step starts from its own saved state.
// Step numbers shown in the header: the first and last step, the current step with its neighbours, and "…" for the rest, so the bar stays on one line.
function stepWindow(total:number,stage:number):(number|string)[]{
 if(total<=7)return Array.from({length:total},(_,i)=>i);
 const centre=Math.min(Math.max(stage,0),total-1),from=Math.max(0,Math.min(centre-1,total-3));
 const shown=[...new Set([0,from,from+1,from+2,total-1])].sort((a,b)=>a-b);const out:(number|string)[]=[];
 // A gap hiding a single step shows that step instead.
 shown.forEach((n,k)=>{const prev=shown[k-1];if(k>0&&n-prev===2)out.push(n-1);else if(k>0&&n-prev>2)out.push(`gap-${prev}`);out.push(n);});
 return out;
}

function StepTimer({storageKey,minutes}:{storageKey:string;minutes:number}) {
 const [timer]=useState(()=>{let saved:unknown;try{saved=JSON.parse(localStorage.getItem(storageKey)??'null');}catch{/* new timer */}return createActivityTimer(minutes*60,saved);});
 const [display,setDisplay]=useState(timer.snapshot),[storageError,setStorageError]=useState(false);const manual=useRef(false);
 const persist=useCallback(()=>{setDisplay(timer.snapshot());try{localStorage.setItem(storageKey,JSON.stringify(timer.saved()));setStorageError(false);}catch{setStorageError(true);}},[timer,storageKey]);
 useEffect(()=>{timer.resume();persist();const tick=setInterval(()=>{timer.checkpoint();persist();},500);const leave=()=>{timer.pause();persist();};const back=()=>{if(!manual.current){timer.resume();persist();}};window.addEventListener('pagehide',leave);window.addEventListener('pageshow',back);return()=>{clearInterval(tick);leave();window.removeEventListener('pagehide',leave);window.removeEventListener('pageshow',back);};},[timer,persist]);
 return <div className="timer-wrap"><div className={`step-timer ${display.expired?'over':display.remaining<60?'soon':''}`} role="timer" aria-live="off"><Clock3 size={18}/><strong>{clock(Math.ceil(display.remaining))}</strong><span>{display.expired?'Time is up':`of ${minutes} min`}</span>
  <button className="icon-button" aria-label={display.running?'Pause timer':'Resume timer'} disabled={display.expired} onClick={()=>{manual.current=display.running;if(display.running)timer.pause();else timer.resume();persist();}}>{display.running?<Pause size={18}/>:<Play size={18}/>}</button>
  <button className="icon-button" aria-label="Reset timer" onClick={()=>{manual.current=true;timer.reset();persist();}}><RotateCcw size={16}/></button></div>{storageError?<p className="small notice warning">Timer progress could not be saved in this browser.</p>:null}</div>;
}

function Instructions({activity}:{activity:Activity}) {
 const ends=activity.steps.map((_,i)=>activity.steps.slice(0,i+1).reduce((n,s)=>n+s.minutes,0));
 return <ol className="runner-steps">{activity.steps.map((s,i)=>{const at=ends[i],start=at-s.minutes;return <li key={i}><span className="step-number">{i+1}</span><details><summary><strong>{s.title}</strong><span className="duration">{start}–{at} min</span><ChevronDown size={16}/><p>{s.summary}</p></summary><p className="detail-copy">{s.detail}</p></details></li>;})}</ol>;
}

function TemplatePanel({activity,template,saved,draft,save,onChange,onMode,onComplete,sessionName,disabled=false}:{disabled?:boolean;activity:Activity;template:MethodTemplate;saved?:BoardTemplate;draft:TemplateData;save?:Save;onChange:(id:string,v:TemplateData[string])=>void;onMode:(m:'digital'|'manual')=>void;onComplete:(done:boolean)=>void;sessionName:string}) {
 const mode=saved?.mode??'digital';const done=!!saved?.completedAt;
 const [paper,setPaper]=useState('');
 async function blank(){setPaper('Preparing…');try{await downloadBlankTemplatePdf(template,activity.name,sessionName);setPaper('');}catch(e){setPaper((e as Error).message||'The template could not be made.');}}
 return <section className="template-panel" aria-labelledby="template-title"><fieldset disabled={disabled} className="template-lock">
  <div className="template-panel-head"><div><h2 id="template-title">Complete the method</h2><p>{template.intro}</p></div>
   <div className="view-toggle" role="group" aria-label="How the group works"><button className="button small" aria-pressed={mode==='digital'} onClick={()=>onMode('digital')}><PenLine size={15}/>Fill in template</button><button className="button small" aria-pressed={mode==='manual'} onClick={()=>onMode('manual')}><FileText size={15}/>Do it on paper</button></div></div>
  {mode==='digital'?<><TemplateFields template={template} data={draft} onChange={onChange}/>
   <div className="template-actions"><span className={`save-state ${save?.status??''}`} role="status">{save?.status==='saving'?'Saving…':save?.status==='error'?save.message:saved?`Saved to the board${done?' · complete':''}`:'Changes save automatically'}</span><button className={`button ${done?'':'primary'}`} onClick={()=>onComplete(!done)} disabled={!done&&!hasContent(draft)}>{done?<><RotateCcw size={16}/>Reopen template</>:<><Check size={16}/>Mark template complete</>}</button></div></>
  :<div className="paper-mode"><p>Work on paper or a whiteboard, then photograph the result with the QR code. The photos go into this step’s frame on the board. Download the blank template to print it.</p><div className="template-actions"><button className="button" onClick={()=>void blank()} disabled={paper==='Preparing…'}><Download size={16}/>{paper==='Preparing…'?'Preparing PDF…':'Download blank template (PDF)'}</button>{paper&&paper!=='Preparing…'?<span className="save-state error">{paper}</span>:null}<button className={`button ${done?'':'primary'}`} onClick={()=>onComplete(!done)}>{done?<><RotateCcw size={16}/>Reopen</>:<><Check size={16}/>Mark as done</>}</button></div></div>}
 </fieldset></section>;
}

export default function SessionRunner({id,storageScope}:{id:string;storageScope:string}) {
 const [data,setData]=useState<Data|null>(null);const [error,setError]=useState('');const [stage,setStage]=useState<number|null>(null);
 const [drafts,setDrafts]=useState<Record<string,TemplateData>>({});const [saves,setSaves]=useState<Record<string,Save>>({});const timers=useRef(new Map<string,ReturnType<typeof setTimeout>>());
 type Body={mode:'digital'|'manual';data:TemplateData;completed:boolean};
 const pending=useRef(new Map<string,Body>()),writeChain=useRef<Promise<void>>(Promise.resolve()),generation=useRef(0),localBodies=useRef(new Map<string,Body>());
 const [archive,setArchive]=useState<{busy:boolean;text?:string}>({busy:false});
 const [sessionId,setSessionId]=useState(''),[visited,setVisited]=useState<string[]>([]),[completedAt,setCompletedAt]=useState(''),[completing,setCompleting]=useState(false),[navigating,setNavigating]=useState(false);
 const draftKey=`session-studio-runner-drafts:${storageScope}:${id}`;
 const viewKey=`session-studio-runner-view:${storageScope}:${id}:${sessionId}`;
 const load=useCallback(async()=>{const version=generation.current;try{const d=await request<Data>(`/api/boards/${id}`);setData(old=>({...d,templates:version===generation.current&&!pending.current.size?d.templates:old?.templates??d.templates}));return d;}catch(e){setError((e as Error).message);return null;}},[id]);
 useEffect(()=>{try{const recovered=JSON.parse(localStorage.getItem(draftKey)??'{}') as Record<string,Body>;for(const [section,body] of Object.entries(recovered)){if(body&&body.data&&(body.mode==='digital'||body.mode==='manual')){pending.current.set(section,body);localBodies.current.set(section,body);setDrafts(x=>({...x,[section]:body.data}));setSaves(x=>({...x,[section]:{status:'error',message:'Recovered unsaved changes. Retry saving.'}}));}}}catch{setError('Saved draft recovery could not be read.');}
  const before=(e:BeforeUnloadEvent)=>{if(pending.current.size){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',before);return()=>{window.removeEventListener('beforeunload',before);timers.current.forEach(clearTimeout);};},[draftKey]);
 useEffect(()=>{let active=true;void load().then(d=>{if(!d||!active)return;const ss=d.board.sessions.filter(s=>s.activities.length);const wanted=new URLSearchParams(window.location.search).get('session');
  const chosen=ss.find(s=>s.id===wanted)??ss.find(s=>s.activities.some(a=>a.instanceId===d.board.currentSectionId))??ss.find(s=>s.status!=='completed')??ss[0];
  setSessionId(chosen?.id??'');let at=chosen?chosen.activities.findIndex(a=>a.instanceId===d.board.currentSectionId):-1;
  try{const v=restoreRunnerView(JSON.parse(localStorage.getItem(`session-studio-runner-view:${storageScope}:${id}:${chosen?.id??''}`)??'null'),chosen?.activities.map(a=>a.instanceId)??[],at);at=v.stage;setVisited(v.visited);}catch{/* use live step */}
  try{const canonical=readLocalProjects(localStorage.getItem(localKey(storageScope))).find(p=>p.id===d.board.projectId)?.sessions.find(s=>s.id===chosen?.id);setCompletedAt(canonical?.status==='completed'?canonical.completion?.completedAt??'':'');}catch{setCompletedAt('');setError('The saved project status could not be read. Return to the project before completing the session.');}
  setStage(at>=0?at:-1);});return()=>{active=false;};},[load,id,storageScope]);
 useEffect(()=>{const t=setInterval(()=>{if(document.visibilityState==='visible')void load();},5000);return()=>clearInterval(t);},[load]);
 useEffect(()=>{if(!data||!sessionId||stage===null)return;const s=data.board.sessions.find(x=>x.id===sessionId);if(!s)return;const view=stage<0?'start':stage>=s.activities.length?'end':s.activities[stage].instanceId;const seen=view!=='start'&&view!=='end'&&!visited.includes(view)?[...visited,view]:visited;if(seen!==visited)setVisited(seen);try{localStorage.setItem(viewKey,JSON.stringify({view,visited:seen,completedAt}));if(data.board.projectId&&!completedAt&&s.status!=='completed')markRunProgress(sessionId,'in-progress',data.board.projectId,storageScope);}catch(e){setError(`Progress could not be saved: ${(e as Error).message}`);}},[data,sessionId,stage,viewKey,visited,completedAt,storageScope]);
 useEffect(()=>{if(data)document.title=`${data.board.name} · Run session`;},[data]);
 if(!data||stage===null)return <main className="runner-message">{error?<p className="notice danger" role="alert">{error}</p>:<p className="muted">Opening the session…</p>}</main>;
 const {board,items,templates}=data;const session=board.sessions.find(s=>s.id===sessionId);const acts=session?.activities??[];const live=items.filter(i=>!i.deletedAt);
 const before=board.sections.find(s=>s.id===beforeSection.id)??{...beforeSection,index:0};
 const planned=acts.reduce((n,a)=>n+activityMinutes(a),0);
 function rememberPending(){try{localStorage.setItem(draftKey,JSON.stringify(Object.fromEntries(pending.current)));}catch{setError('Draft backup could not be saved. Keep this page open until saving succeeds.');}}
 function flush(){timers.current.forEach(clearTimeout);timers.current.clear();const work=writeChain.current.catch(()=>{}).then(async()=>{while(pending.current.size){const [sectionId,body]=pending.current.entries().next().value!;setSaves(x=>({...x,[sectionId]:{status:'saving'}}));try{const t=await request<BoardTemplate>(`/api/boards/${id}/templates/${sectionId}`,json('PUT',body));generation.current++;if(pending.current.get(sectionId)===body){pending.current.delete(sectionId);setSaves(x=>({...x,[sectionId]:{status:'saved'}}));setData(d=>d?{...d,templates:[...d.templates.filter(x=>x.sectionId!==sectionId),t]}:d);}rememberPending();}catch(e){setSaves(x=>({...x,[sectionId]:{status:'error',message:(e as Error).message}}));throw e;}}});writeChain.current=work;return work;}
 async function go(next:number){if(navigating||completing)return;setNavigating(true);try{await flush();if(pending.current.size)await flush();const sectionId=next<0?beforeSection.id:next<acts.length?acts[next].instanceId:null;await request(`/api/boards/${id}/session`,json('PUT',{currentSectionId:sectionId}));setStage(next);window.scrollTo({top:0});setError('');await load();}catch(e){setError(`Could not continue: ${(e as Error).message}`);}finally{setNavigating(false);}}
 function persist(sectionId:string,patch:Partial<Pick<BoardTemplate,'mode'|'data'>>&{completed?:boolean},delay=700){const saved=templates.find(t=>t.sectionId===sectionId),prior=localBodies.current.get(sectionId);const body:Body={mode:patch.mode??prior?.mode??saved?.mode??'digital',data:patch.data??prior?.data??drafts[sectionId]??saved?.data??{},completed:patch.completed??prior?.completed??!!saved?.completedAt};generation.current++;pending.current.set(sectionId,body);localBodies.current.set(sectionId,body);rememberPending();clearTimeout(timers.current.get(sectionId));setSaves(x=>({...x,[sectionId]:{status:'saving'}}));timers.current.set(sectionId,setTimeout(()=>{void flush().catch(()=>{});},delay));}
 async function complete(){if(!board.projectId||completing)return;setCompleting(true);try{await flush();const result=await completeRunnerSession({storageScope,projectId:board.projectId,sessionId,boardId:id});setCompletedAt(result.completedAt);try{markRunProgress(sessionId,'completed',board.projectId,storageScope);setError('');}catch(e){setError(`Completion is saved, but the progress indicator could not be saved: ${(e as Error).message}`);}await load();}catch(e){setError(`Session completion could not be saved: ${(e as Error).message}`);}finally{setCompleting(false);}}
 async function followLink(event:React.MouseEvent<HTMLDivElement>){const link=(event.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');if(!link||event.defaultPrevented)return;if(completing||navigating){event.preventDefault();return;}if(!pending.current.size)return;event.preventDefault();try{await flush();if(pending.current.size)await flush();window.location.assign(link.href);}catch(e){setError(`Save your changes before leaving: ${(e as Error).message}`);}}
 async function download(){setArchive({busy:true,text:'Preparing PDF…'});try{const d=await load();if(!d)throw new Error('The board could not be loaded.');await downloadBoardPdf(d.board,d.items,d.templates,(n,t)=>setArchive({busy:true,text:`Adding photos ${n}/${t}…`}));setArchive({busy:false,text:'Download ready.'});}catch(e){setArchive({busy:false,text:(e as Error).message});}}
 const progress=<nav className="runner-progress" aria-label="Session steps"><button className={stage===-1?'current':''} onClick={()=>go(-1)} aria-label="Session start" aria-current={stage===-1?'step':undefined}>Start</button>{stepWindow(acts.length,stage).map(i=>typeof i==='string'?<span key={i} className="step-gap" aria-hidden="true">…</span>:<button key={acts[i].instanceId} className={`${i===stage?'current':''} ${visited.includes(acts[i].instanceId)?'done':''}`} onClick={()=>go(i)} aria-current={i===stage?'step':undefined} title={acts[i].name}><span>{i+1}</span><span className="sr-only">{acts[i].name}</span></button>)}<button className={stage===acts.length?'current':''} onClick={()=>void go(acts.length)} aria-label="Ending overview" title="Ending overview">End</button></nav>;
 const boardLink=`/board/${id}?from=run&session=${encodeURIComponent(sessionId)}`;
 const header=<header className="topbar runner-topbar"><div className="board-title"><a className="icon-button" href={projectPath(board)} aria-label="Back to the project" title="Back to the project"><ArrowLeft size={19}/></a><div><h1>{board.name}{session&&board.sessions.length>1?` · ${session.title}`:''}</h1><p>{stage<0?'Session start':stage>=acts.length?'Ending overview':`Step ${stage+1} of ${acts.length}`} · {planned} min planned</p></div></div>{progress}<a className="button small runner-board-link" href={boardLink}><LayoutGrid size={16}/><span>Project board</span></a></header>;
 const errorNote=<>{error?<p className="notice danger" role="alert">{error}</p>:null}{Object.values(saves).some(x=>x.status==='error')?<div className="notice warning"><span>Some template changes are waiting to save.</span><button className="button small" onClick={()=>void flush().catch(e=>setError((e as Error).message))}>Retry saving</button></div>:null}</>;

 if(stage<0)return <div className="runner" onClick={event=>void followLink(event)}>{header}<main className="runner-layout">
  <div className="runner-main"><p className="eyebrow">Session start</p><h2 className="runner-title">{board.name}</h2>{session?<p className="muted">{session.title} · {phaseLabels[session.intake.phase]} · {goalLabels[session.intake.goal]} · {session.intake.participants} participants · {planned} min</p>:null}{board.context?<p>{board.context}</p>:null}{errorNote}
   {completedAt?<p className="notice warning"><span>This session is completed in the planner. Its completion record keeps a fixed copy of what the workspace held then; later workspace changes do not alter it.</span></p>:null}
   <section className="runner-card"><h3>Agenda</h3><ol className="agenda-overview">{acts.map((a,i)=>{const start=acts.slice(0,i).reduce((n,x)=>n+activityMinutes(x),0);return <li key={a.instanceId}><span className="section-number">{String(i+1).padStart(2,'0')}</span><strong>{a.name}</strong><span className={`badge ${a.operational?'organisation':a.category}`}>{categoryLabels[a.operational?'organisation':a.category]}</span><span className="duration">{start}–{start+activityMinutes(a)} min</span>{templateFor(a)?<span className="has-template" title="Has a fill-in template"><PenLine size={14}/></span>:null}</li>;})}</ol></section>
   <section className="runner-card" aria-labelledby="before-title"><h3 id="before-title">Add material before the session</h3><p className="muted">Briefs, research or sketches: drop them here or scan the QR code.</p><DropUpload boardId={id} section={before} onUploaded={()=>void load()} compact/><h4 className="feed-title">Added so far ({live.filter(i=>i.sectionId===before.id).length})</h4><SectionFeed boardId={id} items={live.filter(i=>i.sectionId===before.id)}/></section>
  </div>
  <aside className="runner-side"><StepQr boardId={id} section={before} label="Scan to add material"/><button className="button primary start-button" onClick={()=>go(0)} disabled={!acts.length}><Play size={18}/>Start the session</button>{!acts.length?<p className="notice warning"><span>No agenda has reached this workspace yet. Make and confirm a session agenda in the planner, then open the workspace from there.</span></p>:null}</aside>
 </main></div>;

 if(stage>=acts.length){const ids=new Set(acts.map(a=>a.instanceId));const uploads=live.filter(i=>ids.has(i.sectionId));const comments=uploads.reduce((n,i)=>n+i.comments.length,0);const methodActs=acts.filter(a=>templateFor(a));const doneTemplates=methodActs.filter(a=>templates.find(t=>t.sectionId===a.instanceId)?.completedAt).length;
  const elapsed=recordedSessionSeconds(acts.map(a=>({id:a.instanceId,seconds:activityMinutes(a)*60})),activityId=>JSON.parse(localStorage.getItem(`session-studio-timer:${storageScope}:${id}:${sessionId}:${activityId}`)??'null'));
  return <div className="runner" onClick={event=>void followLink(event)}>{header}<main className="runner-layout single"><div className="runner-main"><span className="finish-icon">{completedAt?<CheckCircle2 size={40}/>:<FileText size={40}/>}</span><p className="eyebrow">{completedAt?'Session complete':'Ending overview'}</p><h2 className="runner-title">{session?.title??board.name}</h2>{errorNote}
   <dl className="session-summary"><div><dt>Steps visited</dt><dd>{acts.filter(a=>visited.includes(a.instanceId)).length} of {acts.length}</dd></div><div><dt>Planned time</dt><dd>{planned} min</dd></div><div title="Time recorded by activity timers; pauses and time away are excluded. Resetting a timer clears its recorded time."><dt>Elapsed time</dt><dd>{clock(Math.floor(elapsed))}</dd></div><div><dt>Uploads</dt><dd>{uploads.length}</dd></div><div><dt>Comments</dt><dd>{comments}</dd></div>{methodActs.length?<div><dt>Method templates complete</dt><dd>{doneTemplates} of {methodActs.length}</dd></div>:null}</dl>
   <p className="muted">{completedAt?'This session is marked complete in your project.':'Review the session, then complete it to save its record in your project.'} Its photos, notes and templates are on the project board.</p>
   {!completedAt?<button className="button primary" disabled={completing||!board.projectId||!acts.length} onClick={()=>void complete()}>{completing?'Saving completion...':'Complete session'}</button>:null}
   <div className="finish-actions"><a className="button primary" href={projectPath(board)}><ArrowLeft size={18}/>Back to the project</a><button className="button" onClick={()=>void download()} disabled={archive.busy}><Download size={18}/>{archive.busy?'Preparing PDF…':'Download the board (PDF)'}</button><a className="button" href={boardLink}><LayoutGrid size={18}/>Open the project board</a></div>{archive.text?<p className="muted" role="status">{archive.text}</p>:null}
   <button className="text-button" onClick={()=>go(acts.length-1)}><ArrowLeft size={16}/>Back to the last step</button>
  </div></main></div>;}

 const activity=acts[stage];const section=board.sections.find(s=>s.id===activity.instanceId)??{id:activity.instanceId,name:activity.name,category:activity.category,index:stage+1};
 const template=templateFor(activity);const serverSaved=templates.find(t=>t.sectionId===activity.instanceId);const optimistic=localBodies.current.get(activity.instanceId);const saved=optimistic?{...serverSaved,mode:optimistic.mode,completedAt:optimistic.completed?(serverSaved?.completedAt??'pending'):null} as BoardTemplate:serverSaved;const draft=drafts[activity.instanceId]??saved?.data??{};
 const sectionItems=live.filter(i=>i.sectionId===activity.instanceId);const next=acts[stage+1];
 return <div className="runner" onClick={event=>void followLink(event)}>{header}<main className="runner-layout">
  <div className="runner-main">
   <div className="step-head-row"><div><span className={`badge ${activity.operational?'organisation':activity.category}`}>{categoryLabels[activity.operational?'organisation':activity.category]}</span><h2 className="runner-title">{activity.name}</h2><p className="muted">{activity.takeaway}</p></div><StepTimer key={activity.instanceId} storageKey={`session-studio-timer:${storageScope}:${id}:${sessionId}:${activity.instanceId}`} minutes={activityMinutes(activity)}/></div>{errorNote}
   <section className="runner-card"><h3>How to run it</h3>{activity.input?<p className="small"><strong>Start with:</strong> {activity.input}</p>:null}{activity.materials?<p className="small"><strong>Materials:</strong> {activity.materials}</p>:null}<Instructions activity={activity}/><p className="source-note">{activity.source}</p></section>
   {template?<TemplatePanel key={activity.instanceId} activity={activity} template={template} saved={saved} disabled={navigating||completing} draft={draft} save={saves[activity.instanceId]} sessionName={board.name}
     onChange={(field,v)=>{const d={...draft,[field]:v};setDrafts(x=>({...x,[activity.instanceId]:d}));persist(activity.instanceId,{data:d});}}
     onMode={m=>persist(activity.instanceId,{mode:m,data:draft},0)} onComplete={done=>persist(activity.instanceId,{completed:done,data:draft},0)}/>:null}
   <section className="runner-card runner-uploads"><h3>Uploaded to this step ({sectionItems.length})</h3><SectionFeed boardId={id} items={sectionItems}/><details className="desktop-upload"><summary>Upload from this computer<ChevronDown size={16}/></summary><DropUpload boardId={id} section={section} onUploaded={()=>void load()} compact/></details><a className="text-button" href={boardLink}>Open the board</a></section>
   <nav className="step-nav" aria-label="Previous step"><button className="button" disabled={navigating||completing} onClick={()=>void go(stage-1)}><ArrowLeft size={16}/>{stage===0?'Session start':acts[stage-1].name}</button></nav>
  </div>
  <aside className="runner-side"><StepQr key={section.id} boardId={id} section={section} label="Upload to project workspace"/><button className="button primary start-button runner-next" disabled={navigating||completing} onClick={()=>void go(stage+1)}>{next?<>Next: {next.name}</>:'Finish session'}<ArrowRight size={16}/></button></aside>
 </main></div>;
}
