'use client';
import { useEffect, useId, useRef, useState, type DragEvent } from 'react';
import { CheckCircle2, Clock3, Coffee, Flag, GripVertical, Layers, Lightbulb, Play, Trash2 } from 'lucide-react';
import { activityMinutes, totalMinutes } from '@/lib/engine';
import type { Session } from '@/lib/projects';
import type { Activity } from '@/lib/types';
import './programme-session-card.css';

const dragType='application/session-studio-session';
let draggedSessionId:string|null=null;
let dragClickSuppressedUntil=0;
type InsertionTarget={element:HTMLElement;beforeId:string|null;side:'before'|'after';label:string};
export interface ProgrammeSessionCardProps {
 session:Session;index:number;next:boolean;running?:boolean;sessions:Session[];
 onOpen:()=>void;onStart:()=>void;onRemove:()=>void;onReorder:(id:string,index:number)=>void;onInsert:(id:string,beforeId:string|null)=>void;
}
function ActivityIcon({activity}:{activity:Activity}){
 if(activity.category==='resting'||['break','energizer'].includes(activity.methodId))return <Coffee size={13}/>;
 if(activity.operational)return <Flag size={13}/>;
 return activity.category==='diverging'?<Lightbulb size={13}/>:<Layers size={13}/>;
}
export default function ProgrammeSessionCard({session,index,next,running=false,sessions,onOpen,onStart,onRemove,onReorder,onInsert}:ProgrammeSessionCardProps){
 const [detailsOpen,setDetailsOpen]=useState(false),[moveOpen,setMoveOpen]=useState(false),[dragging,setDragging]=useState(false);
 const card=useRef<HTMLElement>(null),grip=useRef<HTMLButtonElement>(null),allowDrag=useRef(true),detailsId=useId(),moveId=useId();
 const gesture=useRef<{x:number;y:number;moving:boolean}|null>(null),suppressClick=useRef(false),cue=useRef<InsertionTarget|null>(null);
 const completed=session.status==='completed',activities=session.plan?.activities??[],title=session.title;
 function clearCue(){if(cue.current){cue.current.element.classList.remove('is-insert-before','is-insert-after');delete cue.current.element.dataset.insertLabel;}cue.current=null;}
 function showCue(target:InsertionTarget|null){clearCue();if(target){target.element.classList.add(`is-insert-${target.side}`);target.element.dataset.insertLabel=target.label;cue.current=target;}}
 function insertionAt(x:number,y:number):InsertionTarget|null{
  if(completed)return null;
  const grid=card.current?.closest<HTMLElement>('.programme-goal-grid');if(!grid)return null;
  const bounds=grid.getBoundingClientRect();if(x<bounds.left||x>bounds.right||y<bounds.top||y>bounds.bottom)return null;
  const cards=Array.from(grid.querySelectorAll<HTMLElement>('.programme-session-card[data-session-id]')).filter(element=>sessions.some(s=>s.id===element.dataset.sessionId));
  const hit=document.elementFromPoint(x,y)?.closest<HTMLElement>('.programme-session-card[data-session-id]');
  let target=hit&&cards.includes(hit)?hit:null;
  if(!target){let nearest=Infinity;for(const candidate of cards){const rect=candidate.getBoundingClientRect(),distance=Math.hypot(Math.max(rect.left-x,0,x-rect.right),Math.max(rect.top-y,0,y-rect.bottom));if(distance<nearest){nearest=distance;target=candidate;}}}
  const position=sessions.findIndex(s=>s.id===target?.dataset.sessionId),item=sessions[position];
  if(!target||!item||item.status==='completed'||item.id===session.id)return null;
  const rect=target.getBoundingClientRect(),side=x<rect.left+rect.width/2?'before':'after';
  const beforeId=side==='before'?item.id:sessions[position+1]?.id??null;
  if(beforeId===session.id)return null;
  return {element:target,beforeId,side,label:`Insert ${title} ${side} ${item.title}`};
 }
 useEffect(()=>{
  const over=(event:globalThis.DragEvent)=>{if(draggedSessionId!==session.id)return;const target=insertionAt(event.clientX,event.clientY);showCue(target);if(target){event.preventDefault();if(event.dataTransfer)event.dataTransfer.dropEffect='move';}};
  const drop=(event:globalThis.DragEvent)=>{if(draggedSessionId!==session.id)return;event.preventDefault();const target=insertionAt(event.clientX,event.clientY);draggedSessionId=null;dragClickSuppressedUntil=Date.now()+350;clearCue();setDragging(false);if(target)onInsert(session.id,target.beforeId);};
  const end=()=>{clearCue();setDragging(false);};
  window.addEventListener('dragover',over);window.addEventListener('drop',drop);window.addEventListener('dragend',end);
  return()=>{window.removeEventListener('dragover',over);window.removeEventListener('drop',drop);window.removeEventListener('dragend',end);};
 });
 useEffect(()=>{const marker=cue;return()=>{marker.current?.element.classList.remove('is-insert-before','is-insert-after');if(marker.current)delete marker.current.element.dataset.insertLabel;};},[]);
 function clearPointer(){clearCue();gesture.current=null;setDragging(false);}
 function startDrag(event:DragEvent<HTMLElement>){
  if(completed||!allowDrag.current){event.preventDefault();return;}
  event.stopPropagation();draggedSessionId=session.id;setDragging(true);setMoveOpen(false);
  event.dataTransfer.setData(dragType,session.id);event.dataTransfer.effectAllowed='move';
 }
 function endDrag(){draggedSessionId=null;clearCue();setDragging(false);allowDrag.current=true;}
 return <article ref={card} className={`programme-session-card ${completed?'is-completed':next?'is-next':''} ${detailsOpen?'is-expanded':''} ${dragging?'is-dragging':''}`} draggable={!completed} data-session-id={session.id} data-index={index} data-completed={completed}
  aria-label={`${title}${completed?', completed':next?', next session':''}`}
  onPointerDownCapture={event=>{const target=event.target as HTMLElement;allowDrag.current=!target.closest('button,input,select,textarea,a,summary,label,[data-session-no-drag]');}}
  onDragStart={startDrag} onDragEnd={endDrag}>
  <header className="programme-card-heading"><h3>{title}</h3><span className="programme-card-status">{completed?<><CheckCircle2 size={14}/>Completed</>:running?'In progress':next?'Next':session.status==='approved'?'Plan confirmed':'Planned'}</span></header>
  <button type="button" className="programme-card-plan-preview" disabled={completed} aria-label={`Open ${title} plan`} onClick={event=>{if(Date.now()<dragClickSuppressedUntil){event.preventDefault();return;}onOpen();}}>
  <span className="programme-card-duration"><Clock3 size={13}/><span>{session.intake.minutes} min available{session.plan?` · ${totalMinutes(session.plan)} min planned`:''}</span></span>
  <span className="programme-card-preview">{activities.slice(0,5).map(activity=><span key={activity.instanceId} className={`programme-card-preview-item ${activity.category}`}><ActivityIcon activity={activity}/><span>{activity.name}</span></span>)}</span>
  {!activities.length?<span className="programme-card-empty">Empty agenda — add activities</span>:activities.length>5?<small className="programme-card-more">+{activities.length-5} more activities</small>:null}<span className="programme-card-preview-action">{completed?'History coming later':'Open session plan →'}</span></button>
  {completed?<p className="programme-card-locked">History coming later</p>:<>
   <div className="programme-card-actions"><button type="button" className="text-button" aria-expanded={detailsOpen} aria-controls={detailsOpen?detailsId:undefined} onClick={()=>setDetailsOpen(value=>!value)}>{detailsOpen?'Hide details':'Show details'}</button></div>
   {detailsOpen?<div id={detailsId} className="programme-card-details" data-session-no-drag>
    {session.purpose?<p>{session.purpose}</p>:null}{activities.length?<ol>{activities.map(activity=><li key={activity.instanceId}><div className="programme-card-activity-title"><strong>{activity.name}</strong><span>{activityMinutes(activity)} min</span></div><p>{activity.takeaway}</p>
     <details><summary>Activity guidance</summary>{activity.input?<p><strong>Start with:</strong> {activity.input}</p>:null}{activity.materials?<p><strong>Materials:</strong> {activity.materials}</p>:null}<ol>{activity.steps.map((step,stepIndex)=><li key={stepIndex}><strong>{step.title} · {step.minutes} min</strong><p>{step.summary}</p><p>{step.detail}</p></li>)}</ol><p className="programme-card-source">{activity.source}</p></details>
    </li>)}</ol>:<p>Add activities in the session editor.</p>}
   </div>:null}
   {next||running?<button type="button" className="button primary programme-card-start" onClick={onStart}><Play size={15}/>{running?'Resume session':'Start session'}</button>:null}
   <div className="programme-card-controls"><button ref={grip} type="button" className="icon-button programme-card-grip" data-session-grip draggable={false} aria-label={`Drag ${title} to reorder, or choose a position`} title="Drag to insert between sessions, or click to choose a position" aria-expanded={moveOpen} aria-controls={moveOpen?moveId:undefined}
    onPointerDown={event=>{if(event.button!==0)return;suppressClick.current=false;event.currentTarget.setPointerCapture(event.pointerId);gesture.current={x:event.clientX,y:event.clientY,moving:false};}}
    onPointerMove={event=>{const current=gesture.current;if(!current)return;if(!current.moving&&Math.hypot(event.clientX-current.x,event.clientY-current.y)>6){current.moving=true;setDragging(true);setMoveOpen(false);}if(!current.moving)return;event.preventDefault();showCue(insertionAt(event.clientX,event.clientY));}}
    onPointerUp={event=>{const moving=gesture.current?.moving,target=moving?insertionAt(event.clientX,event.clientY):null;if(moving){suppressClick.current=true;dragClickSuppressedUntil=Date.now()+350;}clearPointer();if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);if(target)onInsert(session.id,target.beforeId);}}
    onPointerCancel={()=>{suppressClick.current=!!gesture.current?.moving;clearPointer();}} onLostPointerCapture={clearPointer}
    onClick={event=>{if(suppressClick.current){event.preventDefault();suppressClick.current=false;return;}setMoveOpen(value=>!value);}}><GripVertical size={17}/></button><span className="programme-card-drag-hint">{dragging?'Moving session':'Drag to insert'}</span><button type="button" className="icon-button programme-card-remove" aria-label={`Remove ${title}`} onClick={onRemove}><Trash2 size={16}/></button></div>
   {moveOpen?<div id={moveId} className="programme-card-move" data-session-no-drag><label>Move session to position<select autoFocus aria-label={`Move ${title} to position`} value={index} onChange={event=>{const target=Number(event.target.value);if(target!==index&&sessions[target]?.status!=='completed')onReorder(session.id,target);setMoveOpen(false);grip.current?.focus();}} onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();setMoveOpen(false);grip.current?.focus();}}}>{sessions.map((item,position)=><option key={item.id} value={position} disabled={item.status==='completed'}>{position+1} · {item.title}{item.status==='completed'?' · completed':''}{item.id===session.id?' · current':''}</option>)}</select></label><button type="button" className="text-button" onClick={()=>{setMoveOpen(false);grip.current?.focus();}}>Cancel</button></div>:null}
  </>}
 </article>;
}
