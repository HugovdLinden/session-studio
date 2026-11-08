'use client';
import { useCallback, useEffect, useState } from 'react';
import { Camera, ImagePlus, Radio, StickyNote } from 'lucide-react';
import type { Board } from '@/lib/board';
import { limits, sectionNumber } from '@/lib/board';
import { nameKey, remember, remembered, request } from '@/lib/board-client';
import { UploadList, useUploader } from './uploader';

// Section priority: a step QR code (?section=), then the uploader's own choice, then the live step.
export default function BoardUpload({id}:{id:string}) {
 const sectionKey=`session-studio-upload-section:${id}`;
 const [board,setBoard]=useState<Board|null>(null);const [error,setError]=useState('');const [section,setSection]=useState('');const [author,setAuthor]=useState('');const [caption,setCaption]=useState('');const [note,setNote]=useState('');
 const [picking,setPicking]=useState(true);const {uploads,addFiles,addNote,retry}=useUploader(id);
 const loadMeta=useCallback(()=>request<{board:Board}>(`/api/boards/${id}?meta=1`).then(d=>{setBoard(d.board);return d.board;}),[id]);
 useEffect(()=>{void loadMeta().then(b=>{setAuthor(remembered(nameKey));const has=(s:string|null)=>!!s&&b.sections.some(x=>x.id===s);
  const fromLink=new URLSearchParams(window.location.search).get('section'),saved=remembered(sectionKey);
  const pick=has(fromLink)?fromLink!:has(saved)?saved:has(b.currentSectionId)?b.currentSectionId!:'';
  if(pick){setSection(pick);setPicking(false);if(pick===fromLink)remember(sectionKey,pick);}}).catch(e=>setError((e as Error).message));},[loadMeta,sectionKey]);
 // Notice when the facilitator moves on, so later uploads can follow the live step.
 useEffect(()=>{const t=setInterval(()=>{if(document.visibilityState==='visible')void loadMeta().catch(()=>{});},15000);return()=>clearInterval(t);},[loadMeta]);
 useEffect(()=>{if(board)document.title=`Add to ${board.name}`;},[board]);
 const current=board?.sections.find(s=>s.id===section);const live=board?.sections.find(s=>s.id===board.currentSectionId);
 function choose(value:string){setSection(value);remember(sectionKey,value);setPicking(false);}
 if(!board)return <main className="upload-page">{error?<p className="notice danger" role="alert">{error}</p>:<p className="muted">Opening the session board…</p>}</main>;
 return <main className="upload-page">
  <header className="upload-head"><p className="upload-brand">Session Studio</p><h1>Add to {board.name}</h1><p>Your photos, notes and PDFs go straight onto the shared session board.</p></header>
  {live&&current&&live.id!==current.id&&!picking?<div className="live-banner" role="status"><Radio size={18}/><span>The session is now at <strong>{live.name}</strong>.</span><button className="button small" onClick={()=>choose(live.id)}>Switch</button></div>:null}
  {picking||!current?<fieldset className="upload-step"><legend><span>1</span>Which part of the session is this from?</legend><div className="section-choices">{board.sections.map(s=><label key={s.id} className={section===s.id?'selected':''}><input type="radio" name="section" value={s.id} checked={section===s.id} onChange={()=>choose(s.id)}/><span className="section-number">{sectionNumber(s)}</span><strong>{s.name}</strong>{s.id===board.currentSectionId?<span className="live-pill">Live</span>:null}</label>)}</div></fieldset>
  :<section className="upload-step section-summary"><h2><span>1</span>Session part</h2><div><span className="section-number">{sectionNumber(current)}</span><strong>{current.name}</strong><button className="button small" onClick={()=>setPicking(true)}>Change</button></div></section>}
  <section className="upload-step" aria-labelledby="add-title"><h2 id="add-title"><span>2</span>Add photos, PDFs or a note</h2>
   {!current?<p className="notice warning">Choose a section above first.</p>:null}
   <label className="field"><span>Caption for the next upload <span className="optional">optional</span></span><input maxLength={limits.text} value={caption} onChange={e=>setCaption(e.target.value)} disabled={!current}/></label>
   <div className="photo-buttons"><label className={`button primary ${!current?'disabled':''}`}><Camera size={20}/>Take photo<input type="file" accept="image/*" capture="environment" disabled={!current} onChange={e=>{if(current)void addFiles(e.target.files,current,caption);setCaption('');e.target.value='';}}/></label><label className={`button ${!current?'disabled':''}`}><ImagePlus size={20}/>Choose files<input type="file" accept="image/*,application/pdf" multiple disabled={!current} onChange={e=>{if(current)void addFiles(e.target.files,current,caption);setCaption('');e.target.value='';}}/></label></div>
   <form className="note-form" onSubmit={e=>{e.preventDefault();if(current)void addNote(note,current);setNote('');}}><label className="field">Note<textarea rows={3} maxLength={limits.text} value={note} onChange={e=>setNote(e.target.value)} disabled={!current} placeholder="An idea, a quote, an observation…"/></label><button className="button" disabled={!current||!note.trim()}><StickyNote size={18}/>Add note</button></form>
  </section>
  <section className="upload-step"><label className="field"><span>Your name <span className="optional">optional, shown with your uploads</span></span><input maxLength={limits.author} value={author} onChange={e=>{setAuthor(e.target.value);remember(nameKey,e.target.value.trim());}} autoComplete="name"/></label></section>
  {uploads.length?<section className="upload-step"><h2>Your uploads</h2><UploadList uploads={uploads} onRetry={retry}/></section>:null}
  <p className="upload-foot"><a className="text-button" href={`/board/${id}`}>Open the session board</a></p>
 </main>;
}
