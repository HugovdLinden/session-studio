'use client';
import { useRef } from 'react';
import { ChevronDown, GripVertical, Plus } from 'lucide-react';
import { sessionSteps } from '@/lib/engine';

export function AddSlot({index,selected,onOpen,onDrop}:{index:number;selected:boolean;onOpen:()=>void;onDrop:(id:string)=>void}) {
 return <div className={`add-slot ${selected?'selected':''}`} data-insertion-index={index} onDragOver={e=>{e.preventDefault();e.dataTransfer.dropEffect=e.dataTransfer.effectAllowed==='move'?'move':'copy';}} onDrop={e=>{e.preventDefault();onDrop(e.dataTransfer.getData('text/plain'));}}><button className="add-slot-button" onClick={onOpen} aria-label={`Add block at position ${index+1}`}><Plus size={18}/><span>Add block</span></button>{selected?<span>Drop a method or session step here</span>:null}</div>;
}
export function SessionStepChoices({onChoose}:{onChoose:(id:string)=>void}) {
 return <><p className="drawer-help">Session organisation blocks, with facilitator estimates. These are steps, not book methods.</p>{sessionSteps.map(s=><article className="candidate" key={s.id} draggable onDragStart={e=>{e.dataTransfer.setData('text/plain','session-step:'+s.id);e.dataTransfer.effectAllowed='copy';}}><div className="candidate-top"><span className="badge organisation">Session step</span><GripVertical size={16}/></div><details><summary><div><h3>{s.name}</h3><p>{s.summary}</p></div><ChevronDown size={18}/></summary><p className="detail-copy">Original facilitator logistics. Adapt to the group; timing can be changed after placement. This is not a recovered book procedure.</p></details><div className="candidate-footer"><span className="duration">{s.minutes} min</span><button className="button small" onClick={()=>onChoose('session-step:'+s.id)}>Use step</button></div></article>)}</>;
}

/** Pointer capture supports mouse and touch without relying on native HTML drag behavior. */
export function AgendaMoveHandle({sessionId,blockId,name,onMove}:{sessionId:string;blockId:string;name:string;onMove:(from:string,block:string,to:string,index:number)=>void}){
 const gesture=useRef<{x:number;y:number;moving:boolean;target:HTMLElement|null}|null>(null);
 function targetAt(x:number,y:number){return document.elementFromPoint(x,y)?.closest<HTMLElement>('[data-insertion-index], [data-move-session-id]')??null;}
 function clear(){gesture.current?.target?.classList.remove('move-drop-target');gesture.current=null;}
 return <button type="button" className="icon-button agenda-drag-handle" aria-label={`Drag ${name}`} title="Drag to an Add block position or another session"
  onPointerDown={e=>{if(e.button!==0)return;e.currentTarget.setPointerCapture(e.pointerId);gesture.current={x:e.clientX,y:e.clientY,moving:false,target:null};}}
  onPointerMove={e=>{const g=gesture.current;if(!g)return;if(Math.hypot(e.clientX-g.x,e.clientY-g.y)>6)g.moving=true;if(!g.moving)return;const target=targetAt(e.clientX,e.clientY);if(target!==g.target){g.target?.classList.remove('move-drop-target');target?.classList.add('move-drop-target');g.target=target;}}}
  onPointerUp={e=>{const g=gesture.current,target=targetAt(e.clientX,e.clientY);if(g?.moving&&target){const to=target.dataset.moveSessionId??target.closest<HTMLElement>('[data-session-id]')?.dataset.sessionId;const index=Number(target.dataset.moveLength??target.dataset.insertionIndex);if(to&&Number.isInteger(index))onMove(sessionId,blockId,to,index);}clear();}}
  onPointerCancel={clear} onLostPointerCapture={clear}><GripVertical size={18}/></button>;
}
