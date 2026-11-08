export type UiAction={kind:'ui_click'|'ui_fill'|'ui_select';target:string;value:string};
export interface UiControl {target:string;kind:string;label:string;value:string;options?:{value:string;label:string}[];min?:string;max?:string}
export interface UiSnapshot {id:string;screen:string;observations?:string;controls:UiControl[]}
const ids=new WeakMap<Element,string>();let sequence=0;
let saved:{snapshot:UiSnapshot;elements:Map<string,HTMLElement>;fingerprint:string}|null=null;
function visible(element:HTMLElement){return element.getClientRects().length>0&&!element.closest('[data-companion-root],[hidden],[inert],[aria-hidden="true"]')&&getComputedStyle(element).visibility!=='hidden';}
function labelOf(element:HTMLElement){
 const field=element as HTMLInputElement;
 return (element.getAttribute('aria-label')||Array.from(field.labels??[]).map(l=>l.textContent).join(' ')||element.getAttribute('placeholder')||element.textContent||'').replace(/\s+/g,' ').trim().slice(0,240);
}
function collect(){
 const dialog=Array.from(document.querySelectorAll<HTMLDialogElement>('dialog[open]')).at(-1);
 const root=dialog??document;const elements=new Map<string,HTMLElement>(),controls:UiControl[]=[];
 for(const element of Array.from(root.querySelectorAll<HTMLElement>('button,input,textarea,select,summary,a[href]'))){
  if(controls.length>=180||!visible(element)||(element as HTMLButtonElement).disabled)continue;
  if(element instanceof HTMLInputElement&&(['password','file','hidden'].includes(element.type)||element.readOnly)||element instanceof HTMLTextAreaElement&&element.readOnly)continue;
  if(element instanceof HTMLAnchorElement&&new URL(element.href,location.href).origin!==location.origin)continue;
  let target=ids.get(element);if(!target){target=`ui-${++sequence}`;ids.set(element,target);}
  const isField=element instanceof HTMLInputElement||element instanceof HTMLTextAreaElement||element instanceof HTMLSelectElement;
  const item:UiControl={target,kind:element.tagName.toLowerCase()+(element instanceof HTMLInputElement?`:${element.type}`:''),label:labelOf(element),value:isField?element.value:element.getAttribute('aria-pressed')??''};
  if(element instanceof HTMLInputElement&&['checkbox','radio'].includes(element.type))item.value=String(element.checked);
  if(element instanceof HTMLSelectElement)item.options=Array.from(element.options).slice(0,60).map(o=>({value:o.value,label:o.label}));
  if(element instanceof HTMLInputElement){if(element.min)item.min=element.min;if(element.max)item.max=element.max;}
  elements.set(target,element as unknown as HTMLElement);controls.push(item);
 }
 return{elements,controls};
}
export function captureUi():UiSnapshot{
 const {elements,controls}=collect();const snapshot={id:crypto.randomUUID(),screen:(document.querySelector('dialog[open] h2')?.textContent||document.querySelector('.programme-intake-heading h2')?.textContent||document.querySelector('main h1,main h2')?.textContent||document.title).slice(0,240),observations:readUiObservations(),controls};
 saved={snapshot,elements,fingerprint:JSON.stringify(controls)};return snapshot;
}
export function readUiObservations(){
 const nodes=Array.from(document.querySelectorAll<HTMLElement>('main h1,main h2,main [role="alert"],main [role="status"],.programme-intake .notice,.programme-intake .programme-helper,.programme-intake .programme-duration-preview,.programme-phase-tags,dialog[open] [role="alert"],dialog[open] [role="status"]')).filter(visible);
 const lines=nodes.map(el=>(el.textContent??'').replace(/\s+/g,' ').trim()).filter(Boolean);
 for(const el of Array.from(document.querySelectorAll<HTMLInputElement>('form.programme-intake input,form.programme-intake textarea'))){if(visible(el)&&!el.validity.valid)lines.push(`Invalid field: ${labelOf(el)}: ${el.validationMessage}`);}
 const cards=document.querySelectorAll('.programme-session-card,.goal-session-card');if(cards.length)lines.push(`Project overview session cards: ${cards.length}`);
 if(document.querySelector('.programme-intake[aria-busy="true"]'))lines.push('Planning is still being generated.');
 return Array.from(new Set(lines)).join('\n').slice(0,8000);
}
export async function runUiActions(actions:UiAction[],snapshotId:string){
 const original=saved;if(!original||original.snapshot.id!==snapshotId||JSON.stringify(collect().controls)!==original.fingerprint)throw new Error('The page changed while I was replying. Please ask again on the current screen.');
 if(actions.length>20)throw new Error('Too many actions in one step.');
 // Validate the complete batch before touching any controls.
 for(const action of actions){const el=original.elements.get(action.target);if(!el||!el.isConnected||!visible(el))throw new Error('That control is no longer available.');
  if(action.kind==='ui_fill'&&(!(el instanceof HTMLInputElement||el instanceof HTMLTextAreaElement)||el instanceof HTMLInputElement&&['checkbox','radio','button','submit','reset'].includes(el.type)))throw new Error('This control cannot accept typed text.');
  if(action.kind==='ui_select'&&(!(el instanceof HTMLSelectElement)||!Array.from(el.options).some(o=>o.value===action.value)))throw new Error('Choose an available option.');
 }
 let count=0;
 for(const action of actions){const el=original.elements.get(action.target)!;if(!el.isConnected||!visible(el))throw new Error('The next control moved to a different screen. I need a fresh view to continue.');
  el.scrollIntoView({block:'nearest',behavior:'instant'});el.focus({preventScroll:true});
  if(action.kind==='ui_click')el.click();
  else{const prototype=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:el instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(prototype,'value')!.set!.call(el,action.value);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}
  count++;await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
 }
 const deadline=Date.now()+20000;
 while(document.querySelector('.programme-intake[aria-busy="true"]')&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,200));
 return`${count} website action${count===1?'':'s'} performed. Read the fresh controls and observations to verify the requested goal, phases, field values and generated planning.\n${readUiObservations()}`.slice(0,4000);
}
