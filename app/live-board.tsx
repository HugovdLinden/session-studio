'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ChevronDown, ClipboardList, Download, FileText, LayoutGrid, List, Maximize2, MessageSquare, Minus, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import type { Board, BoardItem, BoardSection, BoardSession, BoardTemplate } from '@/lib/board';
import { fileUrl, limits, projectPath, sectionNumber, timeLabel } from '@/lib/board';
import { downloadBoardPdf, downloadName, downloadPng } from '@/lib/pdf';
import type { MethodTemplate } from '@/lib/templates';
import { templateFor } from '@/lib/templates';
import { TemplateFields } from './template-form';
import { json, nameKey, remember, remembered, request } from '@/lib/board-client';

const categoryLabels={diverging:'Diverging',reverging:'Reverging',converging:'Converging',resting:'Resting',organisation:'Session step',unclassified:'Not yet categorised'};
const clamp=(n:number,min:number,max:number)=>Math.min(max,Math.max(min,n));
type View={x:number;y:number;scale:number};
type FilledTemplate={template:MethodTemplate;saved:BoardTemplate};
const templateStatus=(t:BoardTemplate)=>t.mode==='manual'?(t.completedAt?'Done on paper':'Working on paper'):t.completedAt?'Complete':'In progress';

function Logo(){return <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 44 26"><path d="M2 13 12 3 22 13 12 23ZM22 13 32 3 42 13 32 23Z" fill="none" stroke="currentColor" strokeWidth="2.4"/></svg></span>;}

function ItemCard({boardId,item,section,eager,onOpen}:{boardId:string;item:BoardItem;section:BoardSection;eager:boolean;onOpen:()=>void}) {
 const label=item.kind==='photo'?(item.text||`Photo in ${section.name}`):item.kind==='file'?(item.fileName??'Document'):item.text;
 return <button className={`board-card ${item.kind}`} onClick={onOpen} aria-label={`Open ${item.kind}: ${label.slice(0,80)}`}>
  {item.kind==='photo'?<img src={fileUrl(boardId,item.id)} alt={label} width={item.width??undefined} height={item.height??undefined} loading={eager?'eager':'lazy'} draggable={false}/>:null}
  {item.kind==='file'?<span className="file-name"><FileText size={18}/>{item.fileName??'Document'}</span>:null}
  {item.text?<p className={item.kind==='note'?'note-text':'caption'}>{item.text}</p>:null}
  <span className="card-meta"><span>{item.author||'Anonymous'} · {timeLabel(item.createdAt)}</span>{item.comments.length?<span className="comment-count"><MessageSquare size={13}/>{item.comments.length}</span>:null}</span>
  {item.comments.length?<span className="print-comments">{item.comments.map(c=><span key={c.id}><strong>{c.author||'Anonymous'}:</strong> {c.body}</span>)}</span>:null}
 </button>;
}

function Frame({boardId,section,items,filled,live,expanded,onOpen,onOpenTemplate}:{boardId:string;section:BoardSection;items:BoardItem[];filled?:FilledTemplate;live:boolean;expanded:boolean;onOpen:(id:string)=>void;onOpenTemplate:()=>void}) {
 return <section className={`board-frame ${live?'live':''}`} aria-labelledby={`frame-${section.id}`}>
  <header className="frame-head"><span className="frame-index">{sectionNumber(section)}</span><div><span className={`badge ${section.category}`}>{categoryLabels[section.category]}</span>{live?<span className="live-pill">Live now</span>:null}<h2 id={`frame-${section.id}`}>{section.name}</h2></div><span className="frame-count">{items.length} {items.length===1?'item':'items'}</span></header>
  {filled?expanded&&filled.saved.mode==='digital'?<div className="template-box"><h3><ClipboardList size={16}/>{filled.template.title}<span className={`template-status ${filled.saved.completedAt?'done':''}`}>{templateStatus(filled.saved)}</span></h3><TemplateFields template={filled.template} data={filled.saved.data} readonly/></div>
   :<button className="template-card" onClick={onOpenTemplate} disabled={filled.saved.mode==='manual'}><ClipboardList size={18}/><span><strong>{filled.template.title}</strong><small>{filled.saved.mode==='manual'?'Done on paper; see the photos in this frame.':'Open the filled-in template'}</small></span><span className={`template-status ${filled.saved.completedAt?'done':''}`}>{filled.saved.completedAt?<CheckCircle2 size={14}/>:null}{templateStatus(filled.saved)}</span></button>:null}
  {items.length?<div className="frame-items">{items.map(i=><ItemCard key={i.id} boardId={boardId} item={i} section={section} eager={expanded} onOpen={()=>onOpen(i.id)}/>)}</div>:!filled?<p className="frame-empty">Nothing added yet.</p>:null}
 </section>;
}

// A white frame around one session (or the before/general areas), holding its activity boxes as in Miro.
function SessionFrame({title,meta,children}:{title:string;meta:string;children:React.ReactNode}) {
 return <section className="session-frame" aria-label={title}><header className="session-frame-head"><h2>{title}</h2><span>{meta}</span></header><div className="session-frame-grid">{children}</div></section>;
}

// Pan and zoom only: nothing on the board can be moved or resized.
function Canvas({children,ready}:{children:React.ReactNode;ready:boolean}) {
 const viewport=useRef<HTMLDivElement>(null),plane=useRef<HTMLDivElement>(null);
 const [view,setView]=useState<View>({x:48,y:48,scale:1});const fitted=useRef(false);
 const pointers=useRef(new Map<number,{x:number;y:number}>());const gesture=useRef({moved:false,startX:0,startY:0,distance:0});
 const zoomAt=useCallback((factor:number,cx:number,cy:number)=>setView(v=>{const scale=clamp(v.scale*factor,.15,3);const k=scale/v.scale;return {scale,x:cx-(cx-v.x)*k,y:cy-(cy-v.y)*k};}),[]);
 const zoomCentre=(factor:number)=>{const vp=viewport.current;if(vp)zoomAt(factor,vp.clientWidth/2,vp.clientHeight/2);};
 // fit() shows the whole board; fit(true), used on opening, fits only its width so the first sessions are readable on large boards.
 const fit=useCallback((widthOnly=false)=>{const vp=viewport.current,pl=plane.current;if(!vp||!pl)return;const pad=48,w=pl.offsetWidth,h=pl.offsetHeight;const across=(vp.clientWidth-pad*2)/w;const scale=clamp(Math.min(across,widthOnly?1:(vp.clientHeight-pad*2)/h,1),.15,1);setView({scale,x:Math.max(pad,(vp.clientWidth-w*scale)/2),y:pad});},[]);
 useEffect(()=>{if(ready&&!fitted.current){fitted.current=true;fit(true);}},[ready,fit]);
 useEffect(()=>{const vp=viewport.current;if(!vp)return;
  // Trackpad pinch arrives as ctrl+wheel; a plain wheel or two-finger scroll pans, as in Miro.
  const wheel=(e:WheelEvent)=>{e.preventDefault();const r=vp.getBoundingClientRect();if(e.ctrlKey||e.metaKey)zoomAt(Math.exp(-e.deltaY*.01),e.clientX-r.left,e.clientY-r.top);else setView(v=>({...v,x:v.x-e.deltaX,y:v.y-e.deltaY}));};
  vp.addEventListener('wheel',wheel,{passive:false});return()=>vp.removeEventListener('wheel',wheel);},[zoomAt]);
 function down(e:React.PointerEvent){if(e.pointerType==='mouse'&&e.button!==0)return;pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.current.size===1)gesture.current={moved:false,startX:e.clientX,startY:e.clientY,distance:0};}
 function move(e:React.PointerEvent){const p=pointers.current,prev=p.get(e.pointerId);if(!prev)return;if(e.pointerType==='mouse'&&!e.buttons){up(e);return;}p.set(e.pointerId,{x:e.clientX,y:e.clientY});const g=gesture.current;
  if(p.size===1){if(!g.moved&&Math.hypot(e.clientX-g.startX,e.clientY-g.startY)<5)return;if(!g.moved){g.moved=true;viewport.current?.setPointerCapture(e.pointerId);}setView(v=>({...v,x:v.x+e.clientX-prev.x,y:v.y+e.clientY-prev.y}));}
  else if(p.size===2){g.moved=true;const [a,b]=[...p.values()];const distance=Math.hypot(a.x-b.x,a.y-b.y);const r=viewport.current!.getBoundingClientRect();if(g.distance)zoomAt(distance/g.distance,(a.x+b.x)/2-r.left,(a.y+b.y)/2-r.top);g.distance=distance;}}
 function up(e:React.PointerEvent){pointers.current.delete(e.pointerId);if(pointers.current.size<2)gesture.current.distance=0;}
 function key(e:React.KeyboardEvent){if(e.target!==viewport.current)return;const step=80,moves:Record<string,[number,number]>={ArrowLeft:[step,0],ArrowRight:[-step,0],ArrowUp:[0,step],ArrowDown:[0,-step]};
  if(moves[e.key]){e.preventDefault();const [dx,dy]=moves[e.key];setView(v=>({...v,x:v.x+dx,y:v.y+dy}));}else if(e.key==='+'||e.key==='=')zoomCentre(1.2);else if(e.key==='-')zoomCentre(1/1.2);else if(e.key==='0')fit();}
 return <div className="board-stage">
  <div className="board-viewport" ref={viewport} tabIndex={0} aria-label="Session board. Drag or use arrow keys to move around; plus and minus zoom; 0 fits the board." onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={up} onKeyDown={key} onClickCapture={e=>{if(gesture.current.moved){e.stopPropagation();e.preventDefault();gesture.current.moved=false;}}}>
   <div className="board-plane" ref={plane} style={{transform:`translate(${view.x}px,${view.y}px) scale(${view.scale})`}}>{children}</div>
  </div>
  <div className="zoom-controls" role="group" aria-label="Zoom"><button className="icon-button" aria-label="Zoom out" onClick={()=>zoomCentre(1/1.2)}><Minus size={18}/></button><button className="zoom-level" aria-label="Reset zoom to 100%" onClick={()=>setView(v=>({...v,scale:1}))}>{Math.round(view.scale*100)}%</button><button className="icon-button" aria-label="Zoom in" onClick={()=>zoomCentre(1.2)}><Plus size={18}/></button><button className="icon-button" aria-label="Fit the whole board" title="Fit board" onClick={()=>fit()}><Maximize2 size={17}/></button></div>
 </div>;
}

function ItemDetail({board,item,onClose,onRemove,onComment}:{board:Board;item:BoardItem;onClose:()=>void;onRemove:()=>void;onComment:(author:string,body:string)=>Promise<void>}) {
 const section=board.sections.find(s=>s.id===item.sectionId);const [author,setAuthor]=useState(()=>remembered(nameKey));const [body,setBody]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 useEffect(()=>{document.getElementById('detail-close')?.focus();},[item.id]);
 async function submit(e:React.FormEvent){e.preventDefault();if(!body.trim())return;setBusy(true);setError('');try{remember(nameKey,author.trim());await onComment(author,body);setBody('');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <aside className="board-drawer" aria-label="Item details" onKeyDown={e=>{if(e.key==='Escape')onClose();}}>
  <div className="drawer-heading"><div><h2>{item.kind==='photo'?'Photo':item.kind==='file'?'Document':'Note'}</h2><p>{section?.name??'Unknown section'} · {item.author||'Anonymous'} · {timeLabel(item.createdAt)}</p></div><button id="detail-close" className="icon-button" aria-label="Close details" onClick={onClose}><X size={20}/></button></div>
  <div className="drawer-body">
   {item.kind==='photo'?<a href={fileUrl(board.id,item.id)} target="_blank" rel="noopener" className="detail-photo"><img src={fileUrl(board.id,item.id)} alt={item.text||`Photo in ${section?.name}`}/></a>:null}
   {item.kind==='file'?<a className="button detail-file" href={fileUrl(board.id,item.id)} download={item.fileName??undefined}><FileText size={18}/>Download {item.fileName??'document'} (PDF)</a>:null}
   {item.kind==='photo'?<button className="button detail-file" onClick={()=>void downloadPng(fileUrl(board.id,item.id),downloadName(board.name,section?.name??'',item.text||'photo')).catch(e=>setError((e as Error).message))}><Download size={18}/>Download photo (PNG)</button>:null}
   {item.text?<p className={item.kind==='note'?'detail-note':'detail-caption'}>{item.text}</p>:null}
   <button className="button danger-button" onClick={onRemove}><Trash2 size={16}/>Delete from board</button>
   <section className="comments" aria-labelledby="comments-title"><h3 id="comments-title">Comments {item.comments.length?`(${item.comments.length})`:''}</h3>
    {item.comments.length?<ol>{item.comments.map(c=><li key={c.id}><strong>{c.author||'Anonymous'}</strong><span>{timeLabel(c.createdAt)}</span><p>{c.body}</p></li>)}</ol>:<p className="muted">No comments yet.</p>}
    <form onSubmit={submit} className="comment-form"><label className="field"><span>Your name <span className="optional">optional</span></span><input maxLength={limits.author} value={author} onChange={e=>setAuthor(e.target.value)} autoComplete="name"/></label><label className="field">Comment<textarea required rows={3} maxLength={limits.comment} value={body} onChange={e=>setBody(e.target.value)}/></label>{error?<p className="notice danger" role="alert">{error}</p>:null}<button className="button primary" disabled={busy||!body.trim()}>{busy?'Posting…':'Post comment'}</button></form>
   </section>
  </div>
 </aside>;
}

// Less frequent actions live in one menu so the toolbar never wraps.
function ExportMenu({busy,onDownload}:{busy:string|null;onDownload:()=>void}) {
 const [open,setOpen]=useState(false);const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(!open)return;const away=(e:PointerEvent)=>{if(!ref.current?.contains(e.target as Node))setOpen(false);};const key=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false);};document.addEventListener('pointerdown',away);document.addEventListener('keydown',key);return()=>{document.removeEventListener('pointerdown',away);document.removeEventListener('keydown',key);};},[open]);
 return <div className="menu" ref={ref}><button className="button small" aria-haspopup="menu" aria-expanded={open} onClick={()=>setOpen(!open)} disabled={!!busy} title="Export"><Download size={16}/><span className="label">{busy??'Export'}</span><ChevronDown size={14}/></button>
  {open?<div className="menu-list" role="menu"><button role="menuitem" onClick={()=>{setOpen(false);onDownload();}}><FileText size={16}/><span><strong>Download board (PDF)</strong><small>Every section with its template, photos, notes and comments</small></span></button><p className="menu-note">Photos download as PNG and uploaded PDFs as PDF from each item.</p></div>:null}</div>;
}

function TemplateDrawer({section,filled,onClose}:{section:BoardSection;filled:FilledTemplate;onClose:()=>void}) {
 useEffect(()=>{document.getElementById('template-close')?.focus();},[]);
 return <aside className="board-drawer wide" aria-label="Method template" onKeyDown={e=>{if(e.key==='Escape')onClose();}}>
  <div className="drawer-heading"><div><h2>{filled.template.title}</h2><p>{section.name} · {templateStatus(filled.saved)} · updated {timeLabel(filled.saved.updatedAt)}</p></div><button id="template-close" className="icon-button" aria-label="Close template" onClick={onClose}><X size={20}/></button></div>
  <div className="drawer-body"><TemplateFields template={filled.template} data={filled.saved.data} readonly/><p className="muted small">Templates are filled in from the session runner; the board shows them read-only.</p></div>
 </aside>;
}

function RemovedPanel({board,items,onClose,onRestore}:{board:Board;items:BoardItem[];onClose:()=>void;onRestore:(id:string)=>void}) {
 useEffect(()=>{document.getElementById('removed-close')?.focus();},[]);
 return <aside className="board-drawer" aria-label="Deleted items" onKeyDown={e=>{if(e.key==='Escape')onClose();}}>
  <div className="drawer-heading"><div><h2>Deleted items</h2><p>Restore anything removed by mistake.</p></div><button id="removed-close" className="icon-button" aria-label="Close deleted items" onClick={onClose}><X size={20}/></button></div>
  <div className="drawer-body">{items.length?<ul className="removed-list">{items.map(i=><li key={i.id}>{i.kind==='photo'?<img src={fileUrl(board.id,i.id)} alt=""/>:<span className="removed-note">{(i.kind==='file'?i.fileName??'Document':i.text).slice(0,60)}</span>}<div><strong>{board.sections.find(s=>s.id===i.sectionId)?.name}</strong><small>{i.author||'Anonymous'} · {timeLabel(i.createdAt)}</small></div><button className="button small" onClick={()=>onRestore(i.id)}><RotateCcw size={14}/>Restore</button></li>)}</ul>:<p className="muted">Nothing has been deleted.</p>}</div>
 </aside>;
}

export default function LiveBoard({id,backToRun}:{id:string;backToRun?:string}) {
 const [board,setBoard]=useState<Board|null>(null);const [items,setItems]=useState<BoardItem[]>([]);const [templates,setTemplates]=useState<BoardTemplate[]>([]);const [openTemplate,setOpenTemplate]=useState<string|null>(null);const [archive,setArchive]=useState<string|null>(null);const [error,setError]=useState('');const [missing,setMissing]=useState(false);
 const [view,setView]=useState<'canvas'|'list'>('canvas');const [selected,setSelected]=useState<string|null>(null);const [panel,setPanel]=useState<'removed'|null>(null);
 const [toast,setToast]=useState<{text:string;undo?:string}|null>(null);
 const load=useCallback(async()=>{try{const data=await request<{board:Board;items:BoardItem[];templates:BoardTemplate[]}>(`/api/boards/${id}`);setBoard(data.board);setItems(data.items);setTemplates(data.templates);setError('');}catch(e){const message=(e as Error).message;setError(message);if(/not be found|not valid/.test(message))setMissing(true);}},[id]);
 // Uploads arrive from phones: poll every 4 s while visible, every 20 s in the background.
 useEffect(()=>{if(missing)return;void load();let ticks=0;const timer=setInterval(()=>{ticks++;if(document.visibilityState==='visible'||ticks%5===0)void load();},4000);const visible=()=>{if(document.visibilityState==='visible')void load();};document.addEventListener('visibilitychange',visible);return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',visible);};},[load,missing]);
 useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(null),8000);return()=>clearTimeout(t);},[toast]);
 useEffect(()=>{if(board)document.title=`${board.name} · Session board`;},[board]);
 async function setRemoved(itemId:string,removed:boolean){const stamp=removed?new Date().toISOString():null;setItems(list=>list.map(i=>i.id===itemId?{...i,deletedAt:stamp}:i));try{await request(`/api/boards/${id}/items/${itemId}`,json('PATCH',{removed}));setToast(removed?{text:'Item deleted from the board.',undo:itemId}:{text:'Item restored.'});}catch(e){setToast({text:(e as Error).message});}void load();}
 async function comment(itemId:string,author:string,body:string){const c=await request<BoardItem['comments'][number]>(`/api/boards/${id}/items/${itemId}/comments`,json('POST',{author,body}));setItems(list=>list.map(i=>i.id===itemId?{...i,comments:[...i.comments,c]}:i));}
 async function download(){setArchive('Preparing PDF…');try{await downloadBoardPdf(board!,items,templates,(n,t)=>setArchive(`Adding photos ${n}/${t}…`));setArchive(null);}catch(e){setArchive(null);setToast({text:(e as Error).message||'The PDF could not be made. Please retry.'});}}
 if(!board)return <div className="board-app"><header className="topbar board-topbar"><Link className="brand" href="/"><Logo/><span>Session Studio</span></Link></header><main className="board-message">{error?<><p className="notice danger" role="alert">{error}</p>{!missing?<button className="button" onClick={()=>void load()}>Retry</button>:<Link className="button" href="/">Back to Session Studio</Link>}</>:<p className="muted">Loading the session board…</p>}</main></div>;
 const live=items.filter(i=>!i.deletedAt),removed=items.filter(i=>i.deletedAt).sort((a,b)=>b.deletedAt!.localeCompare(a.deletedAt!));const item=live.find(i=>i.id===selected);
 const filledFor=(sectionId:string):FilledTemplate|undefined=>{const a=board.activities.find(x=>x.instanceId===sectionId);const template=a&&templateFor(a);const saved=templates.find(t=>t.sectionId===sectionId);return template&&saved?{template,saved}:undefined;};
 const openSection=board.sections.find(s=>s.id===openTemplate);const openFilled=openTemplate?filledFor(openTemplate):undefined;
 const box=(s:BoardSection)=><Frame key={s.id} boardId={board.id} section={s} items={live.filter(i=>i.sectionId===s.id)} filled={filledFor(s.id)} live={s.id===board.currentSectionId&&!!board.startedAt} expanded={view==='list'} onOpen={itemId=>{setPanel(null);setOpenTemplate(null);setSelected(itemId);}} onOpenTemplate={()=>{setPanel(null);setSelected(null);setOpenTemplate(s.id);}}/>;
 const count=(sections:BoardSection[])=>{const n=live.filter(i=>sections.some(s=>s.id===i.sectionId)).length;return `${n} ${n===1?'item':'items'}`;};
 const before=board.sections.filter(s=>s.id==='before'),general=board.sections.filter(s=>s.id==='general');
 const sessionFrame=(session:BoardSession)=>{const sections=board.sections.filter(s=>s.sessionId===session.id);return sections.length?<SessionFrame key={session.id} title={session.title} meta={`${sections.length} ${sections.length===1?'activity':'activities'} · ${count(sections)}`}>{sections.map(box)}</SessionFrame>:null;};
 // General only holds uploads from blocks that were later removed from the plan, so it appears only when used.
 const frames=<>{before.length?<SessionFrame title="Before the session" meta={count(before)}>{before.map(box)}</SessionFrame>:null}{board.sessions.map(sessionFrame)}{general.length&&live.some(i=>i.sectionId==='general')?<SessionFrame title="General" meta={count(general)}>{general.map(box)}</SessionFrame>:null}</>;
 return <div className={`board-app view-${view} ${item||panel==='removed'||openFilled?'with-board-drawer':''}`}>
  <header className="topbar board-topbar"><div className="board-title"><a className="icon-button" href={backToRun??projectPath(board)} aria-label={backToRun?'Back to the session':'Back to the project'} title={backToRun?'Back to the session':'Back to the project'}><ArrowLeft size={20}/></a><div><p className="board-eyebrow">Project board</p><h1 title={board.name}>{board.name}</h1><p>{live.length} {live.length===1?'item':'items'} · {board.sections.length} sections{error?<span className="board-offline"> · Reconnecting…</span>:null}</p></div></div>
   <nav className="board-actions" aria-label="Board actions"><div className="view-toggle" role="group" aria-label="Layout"><button className="button small" aria-pressed={view==='canvas'} onClick={()=>setView('canvas')} title="Board view"><LayoutGrid size={16}/><span className="label">Board</span></button><button className="button small" aria-pressed={view==='list'} onClick={()=>setView('list')} title="List view"><List size={16}/><span className="label">List</span></button></div>
    <span className="toolbar-divider" aria-hidden="true"/>
    <button className={`button small icon-only ${panel==='removed'?'active':''}`} onClick={()=>{setSelected(null);setOpenTemplate(null);setPanel(panel==='removed'?null:'removed');}} aria-label={`Deleted items${removed.length?` (${removed.length})`:''}`} title="Deleted items"><Trash2 size={16}/>{removed.length?<span className="count">{removed.length}</span>:null}</button>
    <ExportMenu busy={archive} onDownload={()=>void download()}/></nav></header>
  {view==='canvas'?<Canvas ready>{frames}</Canvas>:<main className="board-list"><div className="print-heading"><h1>{board.name}</h1>{board.context?<p>{board.context}</p>:null}<p>Session documentation · {new Date(board.createdAt).toLocaleDateString()}</p></div>{frames}</main>}
  {item?<ItemDetail key={item.id} board={board} item={item} onClose={()=>setSelected(null)} onRemove={()=>{setSelected(null);void setRemoved(item.id,true);}} onComment={(a,b)=>comment(item.id,a,b)}/>:null}
  {openFilled&&openSection?<TemplateDrawer section={openSection} filled={openFilled} onClose={()=>setOpenTemplate(null)}/>:null}
  {panel==='removed'?<RemovedPanel board={board} items={removed} onClose={()=>setPanel(null)} onRestore={itemId=>void setRemoved(itemId,false)}/>:null}
  {toast?<div className="board-toast" role="status">{toast.text}{toast.undo?<button className="text-button" onClick={()=>{void setRemoved(toast.undo!,false);}}>Undo</button>:null}</div>:null}
 </div>;
}
