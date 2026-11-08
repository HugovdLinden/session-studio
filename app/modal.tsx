'use client';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
export function Modal({title,children,onClose,closable=true}:{title:string;children:React.ReactNode;onClose:()=>void;closable?:boolean}) {
 const ref=useRef<HTMLDialogElement>(null);useEffect(()=>{const active=document.activeElement as HTMLElement;const dialog=ref.current;dialog?.showModal();return()=>{dialog?.close();active?.focus();};},[]);
 return <dialog className="modal" ref={ref} aria-labelledby="modal-title" onCancel={e=>{e.preventDefault();if(closable)onClose();}}><div className="modal-title"><h2 id="modal-title">{title}</h2>{closable?<button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={20}/></button>:null}</div>{children}</dialog>;
}
