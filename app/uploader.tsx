'use client';
import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { CheckCircle2, Copy, FileText, LoaderCircle, RotateCcw, StickyNote, Upload as UploadIcon } from 'lucide-react';
import { documentTypes, limits, uploadPath } from '@/lib/board';
import { isLoopback, nameKey, remember, remembered, request } from '@/lib/board-client';

// Shared by the phone upload page and the session runner (start page and step pages).
type Upload={key:string;label:string;preview?:string;icon?:'note'|'file';sectionName:string;status:'preparing'|'uploading'|'done'|'failed';message?:string;retryable?:boolean};
const maxEdge=2000;
// Local list keys only; support environments without crypto.randomUUID.
let uploadCount=0;const nextKey=()=>`upload-${++uploadCount}`;

// Phone photos are often 5–10 MB; shrink them before upload. iOS hands HEIC over as JPEG.
async function preparePhoto(file:File):Promise<{blob:Blob;width:number;height:number}> {
 const url=URL.createObjectURL(file);
 try{
  // The load event, not image.decode(): decode() can stay pending indefinitely in background tabs.
  const image=new Image();
  const loaded=await Promise.race([new Promise<boolean>(resolve=>{image.onload=()=>resolve(true);image.onerror=()=>resolve(false);image.src=url;}),new Promise<boolean>(resolve=>setTimeout(()=>resolve(false),20000))]);
  if(!loaded||!image.naturalWidth)throw new Error('This photo format cannot be read here. Try a JPEG or PNG.');
  const scale=Math.min(1,maxEdge/Math.max(image.naturalWidth,image.naturalHeight));const width=Math.round(image.naturalWidth*scale),height=Math.round(image.naturalHeight*scale);
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;canvas.getContext('2d')!.drawImage(image,0,0,width,height);
  const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/jpeg',.85));
  if(!blob)throw new Error('This photo could not be prepared. Please try again.');
  return {blob,width,height};
 }finally{URL.revokeObjectURL(url);}
}

export function useUploader(boardId:string,onUploaded?:()=>void) {
 const [uploads,setUploads]=useState<Upload[]>([]);const pending=useRef(new Map<string,FormData>());
 const update=(key:string,patch:Partial<Upload>)=>setUploads(list=>list.map(u=>u.key===key?{...u,...patch}:u));
 async function send(key:string){const form=pending.current.get(key);if(!form)return;update(key,{status:'uploading',message:undefined});try{await request(`/api/boards/${boardId}/items`,{method:'POST',body:form});pending.current.delete(key);update(key,{status:'done'});onUploaded?.();}catch(e){update(key,{status:'failed',message:(e as Error).message,retryable:true});}}
 function base(sectionId:string,kind:'photo'|'note'|'file',text:string){const author=remembered(nameKey);const form=new FormData();form.set('section',sectionId);form.set('kind',kind);form.set('text',text);form.set('author',author);return form;}
 async function addFiles(files:FileList|File[]|null,section:{id:string;name:string},caption=''){if(!files)return;const text=caption.trim();
  for(const file of Array.from(files)){const key=nextKey();const isDocument=documentTypes.includes(file.type);
   setUploads(list=>[{key,label:text||file.name||'Photo',icon:isDocument?'file':undefined,sectionName:section.name,status:'preparing'},...list]);
   try{
    if(isDocument){if(file.size>limits.fileBytes)throw new Error('This PDF is larger than 20 MB.');const form=base(section.id,'file',text);form.set('file',file,file.name);pending.current.set(key,form);}
    else if(file.type.startsWith('image/')||!file.type){const photo=await preparePhoto(file);const form=base(section.id,'photo',text);form.set('file',photo.blob,'photo.jpg');form.set('width',String(photo.width));form.set('height',String(photo.height));pending.current.set(key,form);update(key,{preview:URL.createObjectURL(photo.blob)});}
    else throw new Error('Add photos or PDF documents.');
    await send(key);
   }catch(e){update(key,{status:'failed',message:(e as Error).message});}}}
 async function addNote(text:string,section:{id:string;name:string}){if(!text.trim())return;const key=nextKey();pending.current.set(key,base(section.id,'note',text.trim()));setUploads(list=>[{key,label:text.trim(),icon:'note',sectionName:section.name,status:'uploading'},...list]);await send(key);}
 return {uploads,addFiles,addNote,retry:(key:string)=>void send(key)};
}

export function UploadList({uploads,onRetry}:{uploads:Upload[];onRetry:(key:string)=>void}) {
 return <ul className="upload-list" aria-live="polite">{uploads.map(u=><li key={u.key}>{u.preview?<img src={u.preview} alt=""/>:<span className="upload-thumb">{u.icon==='file'?<FileText size={18}/>:<StickyNote size={18}/>}</span>}<div><strong>{u.label}</strong><small>{u.status==='done'?`Added to ${u.sectionName}`:u.status==='failed'?u.message:u.status==='preparing'?'Preparing…':'Uploading…'}</small></div>{u.status==='done'?<CheckCircle2 className="upload-ok" size={20} aria-label="Added"/>:u.status==='failed'?u.retryable?<button className="button small" onClick={()=>onRetry(u.key)}><RotateCcw size={14}/>Retry</button>:null:<LoaderCircle className="spin" size={20} aria-label="In progress"/>}</li>)}</ul>;
}

// Desktop upload into one fixed section: drop or choose photos and PDFs, or write a note.
export function DropUpload({boardId,section,onUploaded,compact=false}:{boardId:string;section:{id:string;name:string};onUploaded?:()=>void;compact?:boolean}) {
 const {uploads,addFiles,addNote,retry}=useUploader(boardId,onUploaded);const [over,setOver]=useState(false);const [note,setNote]=useState('');const [author,setAuthor]=useState(()=>remembered(nameKey));
 return <div className={`drop-upload ${compact?'compact':''}`}>
  <label className={`dropzone ${over?'over':''}`} onDragOver={e=>{e.preventDefault();setOver(true);}} onDragLeave={()=>setOver(false)} onDrop={e=>{e.preventDefault();setOver(false);void addFiles(e.dataTransfer.files,section);}}>
   <UploadIcon size={22}/><strong>Drop photos or PDFs here</strong><span>or click to choose files from this computer</span>
   <input type="file" accept="image/*,application/pdf" multiple onChange={e=>{void addFiles(e.target.files,section);e.target.value='';}}/>
  </label>
  <form className="note-form" onSubmit={e=>{e.preventDefault();void addNote(note,section);setNote('');}}><label className="field">Note<textarea rows={compact?2:3} maxLength={limits.text} value={note} onChange={e=>setNote(e.target.value)} placeholder="A brief, a research insight, a question to bring…"/></label>
   <div className="note-actions"><label className="field inline-field"><span>Your name <span className="optional">optional</span></span><input maxLength={limits.author} value={author} onChange={e=>{setAuthor(e.target.value);remember(nameKey,e.target.value.trim());}} autoComplete="name"/></label><button className="button" disabled={!note.trim()}><StickyNote size={18}/>Add note</button></div></form>
  {uploads.length?<UploadList uploads={uploads} onRetry={retry}/>:null}
 </div>;
}

// QR code and link that send phone uploads straight to one section.
export function StepQr({boardId,section,label}:{boardId:string;section:{id:string;name:string};label:string}) {
 // Client-only: it is shown after the board has loaded. Render with key={section.id}.
 const [svg,setSvg]=useState('');const [copied,setCopied]=useState(false);const url=typeof window==='undefined'?'':window.location.origin+uploadPath(boardId,section.id);
 useEffect(()=>{if(url)void QRCode.toString(url,{type:'svg',margin:1,errorCorrectionLevel:'M'}).then(setSvg);},[url]);
 return <div className="step-qr"><h3>{label}</h3><div className="qr-code" role="img" aria-label={`QR code: add photos, PDFs and notes to ${section.name}`} dangerouslySetInnerHTML={{__html:svg}}/><p>Scan to add photos, PDFs or notes to <strong>{section.name}</strong>.</p>
  {url&&isLoopback()?<p className="notice warning"><span>Phone uploads require a hosted preview and sign-in with an invited account. This local preview cannot be opened from a phone.</span></p>:null}
  <div className="qr-buttons"><button className="button small" onClick={()=>{void navigator.clipboard?.writeText(url).then(()=>setCopied(true));}}><Copy size={14}/>{copied?'Link copied':'Copy link'}</button></div></div>;
}

