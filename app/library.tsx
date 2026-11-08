'use client';

import { useState } from 'react';

import { ArrowLeft, ChevronDown, Pencil } from 'lucide-react';

import { isReady } from '@/lib/catalogue';

import type { Method, PlanningKnowledge } from '@/lib/types';

import { MethodFilterBar } from './method-filters';

import { emptyFilters, matchesMethod, libraryPhases } from '@/lib/method-search';



export function KnowledgeLibrary({methods,knowledge,error,onRetry,onEdit,onBack,backLabel}:{methods:Method[];knowledge:PlanningKnowledge|null;error:string;onRetry:()=>void;onEdit:(id:string)=>void;onBack:()=>void;backLabel:string}) {

 const [view,setView]=useState<'methods'|'frameworks'|'guidance'>('methods');

 const [search,setSearch]=useState('');const [filters,setFilters]=useState({...emptyFilters});

 const match=(name:string)=>name.toLowerCase().includes(search.toLowerCase());

 const records=methods.filter(m=>matchesMethod(m,filters));

 const frameworks=knowledge?.frameworks.filter(f=>match(f.name))??[];

 return <main className="library-layout">

  <button className="text-button back" onClick={onBack}><ArrowLeft size={16}/>Back to {backLabel}</button>

  <div className="library-heading"><div><h1>Methods & approaches</h1><p>Knowledge from the lead creative-session facilitator skill.</p></div><span className="library-count">{methods.filter(isReady).length} ready / {methods.length} methods</span></div>

  <div className="knowledge-origin"><strong>Source-backed knowledge, with clear coverage</strong><p>{knowledge?.coverage.delft??'Loading the source catalogue…'}</p>{knowledge?<p>{knowledge.coverage.roadMap}</p>:null}<p>Models, approaches and perspectives guide reasoning. They are kept separate from timed methods; completing ratings does not recover a missing procedure.</p></div>

  {error?<p className="notice danger">{error}<button className="text-button" onClick={onRetry}>Retry</button></p>:null}

  <div className="library-views" aria-label="Library sections">{([['methods','Methods'],['frameworks','Models & approaches'],['guidance','Facilitation guidance']] as const).map(([key,label])=><button key={key} className="button" aria-pressed={view===key} onClick={()=>{setView(key);setSearch('');}}>{label}</button>)}</div>

  {view==='methods'?<MethodFilterBar value={filters} onChange={setFilters}/>:null}{view==='frameworks'?<label className="field library-search">Find a model or approach<input type="search" placeholder="Search models, approaches and perspectives" value={search} onChange={e=>setSearch(e.target.value)}/></label>:null}

  {view==='methods'?<>{libraryPhases.filter(([phase])=>!filters.phase||filters.phase===phase).map(([phase,label])=>{const group=records.filter(m=>m.phases.includes(phase));if(!group.length)return null;return <section className="phase-section" key={phase}><h2>{label}</h2><div className="library-table"><div className="library-table-head"><span>Method</span><span>Status</span><span>Ratings</span><span/></div>{group.map(m=><div className="library-record" key={m.id}><div><strong>{m.name}</strong><small>{m.source}</small><details className="source-record"><summary>Read source record <ChevronDown size={14}/></summary>{m.sourceRecord?<div><dl><dt>Purpose</dt><dd>{m.sourceRecord.fit}</dd><dt>Input</dt><dd>{m.sourceRecord.input||m.input}</dd><dt>Verified core summary</dt><dd>{m.sourceRecord.core}</dd>{m.sourceRecord.output?<><dt>Output</dt><dd>{m.sourceRecord.output}</dd></>:null}<dt>Considerations</dt><dd>{m.sourceRecord.consideration}</dd></dl>{m.sourceRecord.sourceGroup?<p>Source group/material guidance: {m.sourceRecord.sourceGroup}</p>:null}{m.sourceRecord.sourceScope?<p>Source scope: {m.sourceRecord.sourceScope}</p>:null}<p className="source-estimate"><strong>Facilitator judgment:</strong> {m.sourceRecord.planningEstimate}</p><p className="muted">Time, difficulty and unspecified group ranges are separate ratings, not book-prescribed facts.</p></div>:<div><p className="detail-copy">{m.takeaway}</p>{m.steps.length?<ol>{m.steps.map((step,i)=><li key={i}><strong>{step.title}</strong><p>{step.summary}</p><p>{step.detail}</p></li>)}</ol>:<p>Source instructions still need to be recovered or verified.</p>}</div>}</details></div><span className={`record-status ${isReady(m)?'ready':''}`}>{isReady(m)?'Ready':m.verifiedProcedure?'Needs ratings':'Procedure missing'}</span><span className="record-ratings">{m.defaultMinutes??'—'} min · {m.minParticipants??'—'}–{m.maxParticipants??'any'} people<br/>{m.difficulty??'Not rated'}{m.metadataOrigin==='estimate'?<small className="estimate-note">Facilitator estimates · editable</small>:null}</span><button className="button small" onClick={()=>onEdit(m.id)}><Pencil size={14}/>Edit</button></div>)}</div></section>;})}{!records.length?<p>{methods.length?'No method names match this search.':'Loading your library…'}</p>:null}</>:null}

  {view==='frameworks'?<div className="framework-list">{frameworks.map(f=><details className="framework-card" key={f.id}><summary><div><span className="framework-kind">{f.kind}</span><h2>{f.name}</h2><p>{f.status==='recovered'?'Recovered source guidance':'Name indexed · detailed guidance not recovered'}</p></div><ChevronDown size={20}/></summary><div className="framework-content"><p className="source-note">{f.source}</p>{f.status==='recovered'?<ul>{f.notes.map((note,i)=><li key={i}>{note}</li>)}</ul>:<p>This entry is available for discovery. Read its actual source text before using its principles or deriving a session sequence.</p>}<p className="muted">This is a {f.kind}, not a selectable timed workshop method.</p></div></details>)}{!frameworks.length?<p>{knowledge?'No entries match this search.':'Loading source knowledge…'}</p>:null}</div>:null}

  {view==='guidance'?<div className="framework-list"><p className="muted">These are facilitator recommendations from the skill. They do not automatically override your intake, timing or approval choices.</p>{knowledge?.guidance.map((g,i)=><details className="framework-card" key={i}><summary><div><span className="framework-kind">Facilitator guidance</span><h2>{g.title}</h2></div><ChevronDown size={20}/></summary><div className="framework-content">{g.notes.map((n,j)=><p key={j}>{n.replace(/^- /,'')}</p>)}<p className="source-note">{g.source} · planning estimates and adaptations, not book-prescribed rules</p></div></details>)}</div>:null}

 </main>;

}
