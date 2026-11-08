import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
// Project workspace API checks. Run with the dev server up (npm run db:migrate:local, npm run dev):
//   node tests/board-api-test.mjs
// Uses the local Sites sign-in cookie; writes disposable test boards to the local database only.
const base=process.env.SESSION_STUDIO_URL??'http://127.0.0.1:5173';
const signedIn={Cookie:'__sites_local_auth=1',Origin:base};
async function send(path,body,method='POST',headers=signedIn){const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...headers},body:body===undefined?undefined:JSON.stringify(body)});const text=await response.text();let data;try{data=JSON.parse(text);}catch{data={error:text};}return {status:response.status,data};}
const get=(path,headers=signedIn)=>fetch(base+path,{headers});
async function upload(path,fields,file,headers=signedIn){const form=new FormData();for(const [k,v] of Object.entries(fields))form.set(k,v);if(file)form.set('file',file,file.name??'photo');const response=await fetch(base+path,{method:'POST',body:form,headers});return {status:response.status,data:await response.json().catch(()=>({}))};}
const png=new Blob([Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='),c=>c.charCodeAt(0))],{type:'image/png'});
const intake={name:'Workspace fixture',description:'',phase:'develop',goal:'fluency',minutes:90,participants:4,level:'bachelor'};
const {data:{plan}}=await send('/api/plan',{intake,demo:true});assert(plan?.activities?.length,'the planner must return an agenda');
const projectId=randomUUID(),s1=randomUUID(),s2=randomUUID();
const project=(sessions)=>({projectId,name:'Workspace fixture',description:'Disposable test project',sessions});
const first={id:s1,title:'Session 1',status:'approved',intake,plan},second={id:s2,title:'Session 2',status:'draft',intake,plan:null};

// Sign-in and origin boundaries (Sites enforces the invited-user list in production).
assert.equal((await send('/api/boards',{projectId,name:'x'},'POST',{Origin:base})).status,401);
assert.equal((await send('/api/boards',{projectId,name:'x'},'POST',{Cookie:signedIn.Cookie,Origin:'https://unrelated.example'})).status,403);
assert.equal((await send('/api/boards',{projectId,name:'x'},'POST',{Cookie:signedIn.Cookie})).status,403);

const created=await send('/api/boards',{projectId,name:'Workspace fixture'});assert.equal(created.status,200);const id=created.data.id;assert.match(id,/^[A-Za-z0-9_-]{22}$/);
assert.equal((await get(`/api/boards/${id}`,{})).status,401);
let synced=await send(`/api/boards/${id}/project`,project([first,second]),'PUT');assert.equal(synced.status,200);
let board=synced.data.board;assert.equal(board.projectId,projectId);assert.deepEqual(board.sessions.map(s=>s.id),[s1,s2]);
assert.deepEqual(board.sections.map(s=>s.name),['Before the session',...plan.activities.map(a=>a.name),'General']);
assert(board.sections.slice(1,-1).every(s=>s.sessionId===s1&&s.sessionTitle==='Session 1'));
assert.equal((await send(`/api/boards/${id}/project`,{...project([first]),projectId:randomUUID()},'PUT')).status,409);

// Uploads, comments and templates attach to stable block IDs.
const block=plan.activities.find(a=>!a.operational),step=plan.activities.find(a=>a.operational);
const photo=await upload(`/api/boards/${id}/items`,{section:block.instanceId,kind:'photo',text:'Sketch',author:'Tester'},png);assert.equal(photo.status,201);
assert.equal((await upload(`/api/boards/${id}/items`,{section:block.instanceId,kind:'note',text:'x'},undefined,{Origin:base})).status,401);
const note=await upload(`/api/boards/${id}/items`,{section:'before',kind:'note',text:'Brief'});assert.equal(note.status,201);
assert.equal((await send(`/api/boards/${id}/items/${photo.data.id}/comments`,{body:'Nice'})).status,201);
assert.equal((await send(`/api/boards/${id}/templates/${block.instanceId}`,{mode:'digital',data:{target:'Flat kettle'},completed:true},'PUT')).status,200);
assert.equal((await send(`/api/boards/${id}/templates/${step.instanceId}`,{mode:'digital',data:{},completed:false},'PUT')).status,400);
const file=await get(`/api/boards/${id}/files/${photo.data.id}`);assert.equal(file.status,200);assert.equal(file.headers.get('content-type'),'image/png');
assert.equal((await get(`/api/boards/${id}/files/${photo.data.id}`,{})).status,401);

// Moving the block into session 2 keeps its frame, uploads and template.
const moved={...plan,activities:plan.activities.filter(a=>a.instanceId!==block.instanceId)};
synced=await send(`/api/boards/${id}/project`,project([{...first,plan:moved},{...second,plan:{...plan,id:randomUUID(),activities:[block]}}]),'PUT');assert.equal(synced.status,200);
board=synced.data.board;assert.equal(board.sections.find(s=>s.id===block.instanceId).sessionId,s2);
let full=await (await get(`/api/boards/${id}`)).json();assert.equal(full.items.find(i=>i.id===photo.data.id).sectionId,block.instanceId);assert.equal(full.templates[0].sectionId,block.instanceId);
// Removing the block keeps its upload (moved to General) and its template.
await send(`/api/boards/${id}/project`,project([{...first,plan:moved},second]),'PUT');
full=await (await get(`/api/boards/${id}`)).json();assert.equal(full.items.find(i=>i.id===photo.data.id).sectionId,'general');assert.equal(full.templates.length,1);

// Imported copies get a separate workspace; edits to the copy never reach the original.
const copyProject=randomUUID();const copied=await send(`/api/boards/${id}/copy`,{projectId:copyProject});assert.equal(copied.status,200);const copyId=copied.data.id;assert.notEqual(copyId,id);
let copy=await (await get(`/api/boards/${copyId}`)).json();assert.equal(copy.board.projectId,copyProject);assert.equal(copy.items.length,full.items.length);assert.equal(copy.templates.length,1);
assert(copy.items.every(i=>!full.items.some(o=>o.id===i.id)));
const copyPhoto=copy.items.find(i=>i.kind==='photo');assert.equal((await get(`/api/boards/${copyId}/files/${copyPhoto.id}`)).status,200);
await send(`/api/boards/${copyId}/items/${copyPhoto.id}`,{removed:true},'PATCH');await upload(`/api/boards/${copyId}/items`,{section:'before',kind:'note',text:'Only in the copy'});
const original=await (await get(`/api/boards/${id}`)).json();assert.equal(original.items.length,full.items.length);assert(!original.items.find(i=>i.id===photo.data.id).deletedAt);
assert.equal((await send(`/api/boards/${copyId}/project`,project([first]),'PUT')).status,409);

// Older single-plan boards still open.
assert.equal((await get(`/api/boards/AAAAAAAAAAAAAAAAAAAAAA`)).status,404);
console.log('Workspace API checks passed: sign-in and origin boundaries, project/session sync, stable block references, uploads, comments, templates, imported copies.');
