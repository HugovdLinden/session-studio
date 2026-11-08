'use client';
import {useEffect,useState} from 'react';
export type PetMood='idle'|'listening'|'thinking'|'speaking'|'error';
const states:Record<PetMood,{row:number;frames:number;delay:number}>={idle:{row:0,frames:6,delay:850},listening:{row:6,frames:6,delay:650},thinking:{row:7,frames:6,delay:600},speaking:{row:3,frames:4,delay:800},error:{row:5,frames:8,delay:650}};
export function CompanionPet({mood='idle',small=false}:{mood?:PetMood;small?:boolean}){
 const [frame,setFrame]=useState(0),[reduced,setReduced]=useState(false);const state=states[mood];
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(media.matches);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
 useEffect(()=>{setFrame(0);if(reduced)return;const interval=setInterval(()=>setFrame(f=>(f+1)%state.frames),state.delay);return()=>clearInterval(interval);},[mood,reduced,state.frames,state.delay]);
 const scale=small ? 0.25 : 0.5;
 return <span className="companion-sprite" aria-hidden="true" style={{width:192*scale,height:208*scale,backgroundImage:'url(/images/codex-companion.webp)',backgroundSize:`${1536*scale}px ${1872*scale}px`,backgroundPosition:`${-frame*192*scale}px ${-state.row*208*scale}px`}}/>;
}
