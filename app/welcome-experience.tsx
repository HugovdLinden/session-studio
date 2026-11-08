'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Library } from 'lucide-react';
import { BrandMark } from './brand-mark';
import ProjectsWorkspace from './projects-workspace';
import Studio from './studio';
import { GerdAssistant, type GerdContext } from './gerd';
import './welcome-experience.css';

export default function WelcomeExperience({storageScope}:{storageScope:string}){
 const [welcome,setWelcome]=useState(true),[library,setLibrary]=useState(false);
 const [motion,setMotion]=useState<'leaving'|'entering'|null>(null),[context,setContext]=useState<GerdContext>();
 const timers=useRef<ReturnType<typeof setTimeout>[]>([]),entering=useRef(false),entry=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(new URLSearchParams(window.location.search).has('project'))setWelcome(false);return()=>{timers.current.forEach(clearTimeout);};},[]);
 function proceed(){
  if(entering.current)return;entering.current=true;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const show=()=>{setWelcome(false);setMotion(reduced?null:'entering');window.scrollTo({top:0});
   requestAnimationFrame(()=>entry.current?.focus({preventScroll:true}));
   if(!reduced)timers.current.push(setTimeout(()=>setMotion(null),360));};
  if(reduced)show();else{setMotion('leaving');timers.current.push(setTimeout(show,260));}
 }
 return <>
  {welcome?library?<Studio libraryOnly onHome={()=>{setLibrary(false);proceed();}}/>:<div className="app welcome-experience">
   <header className="topbar"><button className="brand brand-home" aria-label="Session Studio — Home" onClick={proceed}><BrandMark/><span>Session Studio</span></button><nav aria-label="Main navigation"><button className="nav-button" onClick={()=>setLibrary(true)}><Library size={18}/>Method library</button><span className="private-label">Private workspace</span></nav></header>
   <div className={`welcome-screen-motion ${motion==='leaving'?'is-leaving':''}`} inert={motion==='leaving'?true:undefined}>
    <main className="welcome-layout"><section className="welcome-content" aria-labelledby="welcome-title"><div className="welcome-logo"><BrandMark/></div><h1 id="welcome-title">Session Studio</h1><p>Make space for better design work. Shape a session around your project, your team and the time you have. Explore methods, adjust the agenda and start when the plan feels right.</p><p className="home-facilitator">Make room for methods, breaks and time to reflect. Open Ask Gerd to explore your design companion.</p><button className="button primary welcome-proceed" onClick={proceed}>Proceed <ArrowRight size={18}/></button></section></main>
   </div><footer className="app-footer">Session Studio <span>Design the session. Then do the work.</span></footer>
  </div>:<div ref={entry} tabIndex={-1} aria-label="Session Studio workspace" className={`welcome-workspace-entry ${motion==='entering'?'is-entering':''}`}><ProjectsWorkspace storageScope={storageScope} onGerdContext={setContext}/></div>}
  <GerdAssistant context={context}/>
 </>;
}
