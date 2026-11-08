'use client';
import { ArrowRight, Plus, ExternalLink } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { Project } from '@/lib/projects';
import { projectCardSummary } from '@/lib/project-card';
import './home-project-tools.css';

export function Home({projects,search,onSearch,busy,onNew,onContinue,onDelete,children,backupTools}:{projects:Project[]|null;search:string;onSearch:(value:string)=>void;busy:boolean;onNew:()=>void;onContinue:(project:Project)=>void;onDelete:(project:Project)=>void;children?:ReactNode;backupTools?:ReactNode}) {
 const [deleteCandidate,setDeleteCandidate]=useState<string|null>(null);
 const visible=projects?.filter(p=>(p.name+' '+p.description).toLowerCase().includes(search.toLowerCase()));
 return <main className="home-layout">
  <section className="home-projects" aria-labelledby="projects-title">
   <div className="projects-heading"><h1 id="projects-title">Your projects</h1><p>Continue a saved project or start something new.</p></div>
   {children}
   <label className="field project-search">Find a project<input type="search" value={search} onChange={e=>onSearch(e.target.value)} placeholder="Search projects"/></label>
   <div className="project-grid">
    <button className="project-card new-project" onClick={onNew} disabled={busy} aria-label="Add new project"><span className="new-project-icon"><Plus size={28}/></span><span className="project-title">Add new project</span><span>Tell us about your next design session.</span><ArrowRight className="project-arrow" size={20}/></button>
    {visible?.map(project=>{const summary=projectCardSummary(project);return <article className="project-card current-project shared-project-card" key={project.id}>
     <span className="project-miro-placeholder" title="Export to Miro — coming soon"><button type="button" className="icon-button" disabled aria-label={`Export ${project.name} to Miro — coming soon`}><ExternalLink size={16}/></button></span>
     <button className="project-open" onClick={()=>onContinue(project)} disabled={busy} aria-label={`Continue project ${project.name}`} aria-describedby={`project-preview-${project.id}`}>
      <span className="project-status">{summary.status}</span>
      <span className="project-title">{project.name}</span>
      <span className="project-progress" aria-label={`Current design phase: ${summary.phase??'Not selected'}`}>
       {(['discover','define','develop','deliver'] as const).map(phase=><span key={phase} className={summary.phase===phase?'active':undefined} aria-current={summary.phase===phase?'step':undefined}>{phase.charAt(0).toUpperCase()+phase.slice(1)}</span>)}
       {summary.phase==='iterate'?<span className="active" aria-current="step">Iterate</span>:null}
      </span>
      <span id={`project-preview-${project.id}`} className="project-status-preview"><span><strong>Latest</strong>{summary.latest}</span><span><strong>Next</strong>{summary.nextStep}</span></span>
      <span className="project-continue">Continue project <ArrowRight size={17}/></span>
      <small className="project-saved" title={`Updated ${new Date(project.updatedAt).toLocaleString()} · ${summary.completed}/${summary.total} sessions completed`}>Saved in this browser</small>
     </button>
     {deleteCandidate===project.id?<section className="project-delete-confirmation" role="alertdialog" aria-label={`Delete ${project.name}`}><p>Are you sure you want to delete this project?</p><div><button type="button" className="button small" onClick={()=>setDeleteCandidate(null)}>Cancel</button><button type="button" className="button small danger-button" onClick={()=>{onDelete(project);setDeleteCandidate(null);}}>Yes, delete this project</button></div></section>:<button type="button" className="project-delete" onClick={()=>setDeleteCandidate(project.id)} disabled={busy}>Delete this project</button>}
    </article>})}
   </div>
   {projects===null?<p role="status">Loading projects…</p>:!visible?.length?<p className="empty-state">{search.trim()?'No projects match your search.':'Add your first project to begin.'}</p>:null}
   {backupTools?<section className="home-backup-tools" aria-labelledby="home-backup-title"><h3 id="home-backup-title">Project backups</h3>{backupTools}</section>:null}
  </section>
 </main>;
}
