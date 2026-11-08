// Browser helpers shared by the live board, the phone upload page and the QR sheet.
export async function request<T>(url:string,init?:RequestInit):Promise<T> { const response=await fetch(url,init);const data=await response.json().catch(()=>({error:'The service could not answer. Please retry.'})) as T & {error?:string};if(!response.ok)throw new Error(data.error||'Something went wrong. Please retry.');return data; }
export const json=(method:string,data:unknown):RequestInit=>({method,headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
export const nameKey='session-studio-name';
export function remembered(key:string){try{return localStorage.getItem(key)??'';}catch{return '';}}
export function remember(key:string,value:string){try{localStorage.setItem(key,value);}catch{/* private mode: the value just is not remembered */}}
// Phones cannot open the facilitator's loopback address.
export const isLoopback=()=>['localhost','127.0.0.1','[::1]'].includes(window.location.hostname);
// Progress is scoped to the signed-in planner account. Completion follows canonical save.
export type RunProgress={state:'in-progress'|'completed';at:string;projectId:string};
export const runProgressKey=(scope:string)=>`session-studio-run-progress:${scope}`;
export const runKey=(projectId:string,sessionId:string)=>`${projectId}:${sessionId}`;
export function readRunProgress(scope:string):Record<string,RunProgress>{try{const v=JSON.parse(localStorage.getItem(runProgressKey(scope))??'{}');return v&&typeof v==='object'?v:{};}catch{return {};}}
export function markRunProgress(sessionId:string,state:RunProgress['state'],projectId:string,scope:string){const all=readRunProgress(scope),k=runKey(projectId,sessionId);const was=all[k]?.state;if(was==='completed'||was===state)return;all[k]={state,at:new Date().toISOString(),projectId};localStorage.setItem(runProgressKey(scope),JSON.stringify(all));}
