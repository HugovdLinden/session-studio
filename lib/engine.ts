import type { Activity, Alternatives, Intake, Method, Plan } from './types';
import { stageDefault, stageMinimum } from './method-stages';
import { isReady } from './catalogue';
export function minimum(m: {defaultMinutes:number|null;minimumMinutes?:number}) { return Math.max(m.minimumMinutes??0,Math.ceil((m.defaultMinutes??0)*0.6)); }
export function activityMinutes(a: Activity) { return a.steps.reduce((n,s)=>n+s.minutes,0); }
export function totalMinutes(p: Pick<Plan,'activities'>) { return p.activities.reduce((n,a)=>n+activityMinutes(a),0); }
export function groupFits(m: {minParticipants:number|null;maxParticipants:number|null},count:number) { return m.minParticipants!==null && count>=m.minParticipants && (m.maxParticipants===null || count<=m.maxParticipants); }
export function alignment(i: Intake): string|null {
 const allowed={discover:['understand','flexibility'],define:['understand','frame','select'],develop:['fluency','flexibility'],deliver:['select'],iterate:['understand','frame','fluency','flexibility','select']};
 return allowed[i.phase].includes(i.goal)?null:'This goal is unusual for this project phase. Consider changing the goal or phase, or continue with your chosen goal.';
}
export function allocate(total:number,weights:number[]): number[] {
 if(!weights.length)return [];
 if(total<weights.length)throw new Error('Allow at least one minute per step.');
 const positive=weights.map(w=>Math.max(1,w));const raw=weights.map(()=>0);let remaining=total;let active=positive.map((_,i)=>i);
 while(active.length){const sum=active.reduce((n,i)=>n+positive[i],0);const small=active.filter(i=>remaining*positive[i]/sum<1);if(!small.length){for(const i of active)raw[i]=remaining*positive[i]/sum;break;}for(const i of small){raw[i]=1;remaining--;}active=active.filter(i=>!small.includes(i));}
 const result=raw.map(x=>Math.floor(x));
 let left=total-result.reduce((a,b)=>a+b,0); const order=raw.map((x,i)=>({i,f:x-Math.floor(x)})).sort((a,b)=>b.f-a.f||a.i-b.i);
 for(let j=0;left>0;j++,left--)result[order[j%order.length].i]++;
 return result;
}
export function fromMethod(m: Method,minutes=m.defaultMinutes!,instanceId=crypto.randomUUID()): Activity {
 if(!isReady(m))throw new Error('Complete the method metadata and procedure before using it.');
 const times=allocate(Math.max(minutes,minimum(m),m.steps.length),m.steps.map(()=>1));
 return {instanceId,methodId:m.id,name:m.name,category:m.category,takeaway:m.takeaway,input:m.input,materials:m.materials,source:m.source,defaultMinutes:m.defaultMinutes!,minParticipants:m.minParticipants!,maxParticipants:m.maxParticipants,operational:false,steps:m.steps.map((s,i)=>({...s,minutes:times[i]}))};
}
export function fromMethodStages(m:Method):Activity[] {
 const run=crypto.randomUUID();
 if(!m.stages?.length)return [fromMethod(m)];
 return m.stages.map(stage=>{
  const duration=stageDefault(m,stage), times=allocate(duration,stage.stepIndices.map(()=>1));
  return {...fromMethod(m),name:`${m.name} · ${stage.title}`,defaultMinutes:duration,minimumMinutes:stageMinimum(m,stage),stageId:stage.id,methodRunId:run,requiresStageIds:stage.requiresStageIds,betweenSessionNote:stage.betweenSessionNote,
   steps:stage.stepIndices.map((index,i)=>({...m.steps[index],minutes:times[i]}))};
 });
}
function operation(id:string,name:string,minutes:number,summary:string,category:Activity['category']='organisation'):Activity {
 return {instanceId:crypto.randomUUID(),methodId:id,name,category,takeaway:summary,input:'',materials:'',source:'Session Studio · facilitator organisation suggestion',defaultMinutes:minutes,minParticipants:1,maxParticipants:null,operational:true,steps:[{title:name,summary,detail:'This is original session organisation guidance, not a recovered book method. Adjust it for your group.',minutes}]};
}
export const sessionSteps = [
 {id:'intro',name:'Introduction',minutes:5,summary:'Agree on the session goal, required output and working agreements.'},
 {id:'icebreaker',name:'Icebreaker',minutes:5,summary:'Invite each person to share their name and one small hope for the session. Allow anyone to pass; briefly note common hopes before starting.'},
 {id:'purge',name:'Initial idea purge',minutes:5,summary:'Capture obvious initial ideas before exploring further.'},
 {id:'break',name:'Break',minutes:5,summary:'Step away from the work and return refreshed.'},
 {id:'energizer',name:'Energizer',minutes:3,summary:'Invite a brief stretch and reset attention.'},
 {id:'reflection',name:'Capture and reflect',minutes:5,summary:'Capture useful outcomes and open questions.'},
 {id:'closing',name:'Wrap-up and closing',minutes:5,summary:'Agree on next steps, responsibilities and where to keep outputs.'},
] as const;
export function fromSessionStep(id:string,instanceId?:string):Activity {
 const s=sessionSteps.find(s=>s.id===id);if(!s)throw new Error('Unknown session step.');
 const activity=operation(s.id,s.name,s.minutes,s.summary,s.id==='break'||s.id==='energizer'?'resting':'organisation');
 return instanceId?{...activity,instanceId}:activity;
}
export function insertActivity(plan:Plan,index:number,activity:Activity):Plan {
 if(!Number.isInteger(index)||index<0||index>plan.activities.length)throw new Error('Choose an existing insertion slot.');
 if(plan.activities.length>=100)throw new Error('Keep the agenda to 100 blocks or fewer.');
 if(plan.activities.some(a=>a.instanceId===activity.instanceId))throw new Error('A new block needs its own identity.');
 return {...plan,version:plan.version+1,activities:[...plan.activities.slice(0,index),activity,...plan.activities.slice(index)]};
}
export function removeActivity(plan:Plan,instanceId:string):Plan {
 if(!plan.activities.some(a=>a.instanceId===instanceId))throw new Error('This block is no longer in the agenda.');
 return {...plan,version:plan.version+1,activities:plan.activities.filter(a=>a.instanceId!==instanceId)};
}
function eligible(m:Method,i:Intake) { return isReady(m)&&groupFits(m,i.participants)&&(i.level!=='novice'||m.difficulty==='easy'); }
export function additions(methods:Method[],i:Intake,planTotal:number):Alternatives {
 if(i.level==='master')return {recommended:[],available:methods,explanation:'Add from the whole method library. No recommendations at Expert level.'};
 const category=i.goal==='select'?'converging':i.goal==='understand'?'reverging':'diverging';
 const pool=methods.filter(m=>m.category===category);
 const recommended=pool.filter(m=>eligible(m,i)&&m.phases.includes(i.phase)&&m.goals.includes(i.goal)&&(i.level!=='novice'||planTotal+m.defaultMinutes!<=i.minutes)).slice(0,3);
 return {recommended,available:i.level==='bachelor'?pool.filter(m=>!recommended.some(r=>r.id===m.id)):[],explanation:`${recommended.length} recommended additions for this goal.${i.level==='novice'?' Choices must fit the remaining time.':' Other methods in this category are also available.'}`};
}
export function alternatives(methods:Method[],target:Activity,i:Intake,planTotal=i.minutes):Alternatives {
 const others=methods.filter(m=>m.id!==target.methodId);
 const suitable=others.filter(m=>eligible(m,i)&&m.phases.includes(i.phase)&&m.goals.includes(i.goal));
 const ranked=suitable.sort((a,b)=>Number(b.category===target.category)-Number(a.category===target.category)||Number(b.goals.includes(i.goal))-Number(a.goals.includes(i.goal))||Math.abs(a.defaultMinutes!-activityMinutes(target))-Math.abs(b.defaultMinutes!-activityMinutes(target)));
 if(i.level==='master')return {recommended:[],available:others,explanation:'All categories. No recommendations at Expert level. Incomplete methods remain visible but cannot be used.'};
 const recommended=ranked.filter(m=>m.category===target.category&&(i.level!=='novice'||planTotal-activityMinutes(target)+m.defaultMinutes!<=i.minutes)).slice(0,3);
 return {recommended,available:i.level==='bachelor'?others.filter(m=>m.category===target.category&&!recommended.some(r=>r.id===m.id)):[],explanation:recommended.length<3?`Only ${recommended.length} suitable, complete alternatives are available. Add source procedures and metadata to unlock more.`:'Three alternatives selected for this session.'};
}
export function generatePlan(i:Intake,methods:Method[],demo:boolean,pinnedId?:string): Plan {
 if(pinnedId&&i.level==='novice')throw new Error('Pinned replanning is available for Intermediate and Expert designers. Novice alternatives stay within the session constraints.');
 const pin=pinnedId?methods.find(m=>m.id===pinnedId):undefined;
 if(pinnedId&&(!pin||!isReady(pin)))throw new Error('The chosen method is incomplete. Complete its metadata first.');
 if(pin?.stages?.length)throw new Error('Use programme planning for methods with research stages.');
 if(pin&&!groupFits(pin,i.participants))throw new Error(`The chosen method needs ${pin.minParticipants}–${pin.maxParticipants??'any number of'} participants. Your participant count remains ${i.participants}. Keep the edited plan or choose another method.`);
 const candidates=methods.filter(m=>!m.stages?.length&&eligible(m,i)&&m.phases.includes(i.phase)&&m.goals.includes(i.goal)).sort((a,b)=>Number(a.subtype!==i.goal)-Number(b.subtype!==i.goal)||(a.defaultMinutes!-b.defaultMinutes!));
 if(!pin&&!candidates.length)throw new Error('No complete method fits this phase, goal, experience and group yet. Complete suitable records in the library, change the intake, or try the demo with Develop / Generate more ideas.');
 let budget=i.minutes;
 const selected:Method[]=[];
 let purge=['fluency','flexibility'].includes(i.goal)&&budget>=40?5:0;
 if(pin){selected.push(pin);for(let pass=0;pass<4;pass++){budget=Math.max(budget,pin.defaultMinutes!+10+purge+(budget>=60?5:0)+(budget>=100?3:0));purge=['fluency','flexibility'].includes(i.goal)&&budget>=40?5:0;}}
 const intro=5,closing=5,breakCount=Math.floor(budget/60),breakTime=breakCount*5,energizerTime=budget>=100?3:0;
 const advised=(m:Method)=>m.id===pinnedId?m.defaultMinutes!:Math.ceil(m.defaultMinutes!*(i.level==='novice'?1.2:1));
 let room=budget-intro-closing-purge-breakTime-energizerTime;
 if(pin)room-=pin.defaultMinutes!;
 for(const m of candidates){if(selected.some(s=>s.id===m.id))continue;if(budget<=120&&selected.length>=3)break;if(advised(m)<=room){selected.push(m);room-=advised(m);}}
 if(!selected.length){const first=candidates.find(m=>Math.max(minimum(m),m.steps.length)<=room);if(!first){const shortest=candidates.slice().sort((a,b)=>Math.max(minimum(a),a.steps.length)-Math.max(minimum(b),b.steps.length))[0];throw new Error(`This session is too short. ${shortest.name} needs at least ${Math.max(minimum(shortest),shortest.steps.length)+10+purge+breakTime+energizerTime} minutes including session organisation. Increase the available time.`);}selected.push(first);room-=Math.min(advised(first),room);}
 let activities:Activity[]=[operation('intro','Introduction',intro,'Agree on the session goal, required output and working agreements.')];
 if(purge)activities.push(operation('purge','Initial idea purge',purge,'Capture obvious initial ideas so the group can move beyond its first responses.'));
 // Reserve separate rest blocks rather than padding a long session with reflection.
 const actualBreaks=Math.min(breakCount,selected.length);
 let remaining=budget-intro-closing-purge-actualBreaks*5-energizerTime;
 let work=selected.map(m=>{const activity=fromMethod(m,Math.min(advised(m),remaining));remaining-=activityMinutes(activity);return activity;});
 // These are adjustable estimates for the existing documented steps, not new source guidance.
 if(remaining>10){const extra=remaining-10;const targets=work.map((a,index)=>({a,index})).filter(({a})=>a.methodId!==pinnedId);const recipients=targets.length?targets:work.map((a,index)=>({a,index}));const shares=allocate(extra+recipients.length,recipients.map(({a})=>activityMinutes(a))).map(n=>n-1);for(const [index,target] of recipients.entries())work[target.index]=setActivityTime(target.a,activityMinutes(target.a)+shares[index]);remaining-=extra;}
 // Choose distinct boundaries nearest to evenly spaced elapsed-work targets.
 const workTotal=work.reduce((n,a)=>n+activityMinutes(a),0),restAfter=new Set<number>();let elapsed=0;
 const boundaries=work.map((a,index)=>({index,elapsed:elapsed+=activityMinutes(a)}));
 for(let n=1;n<=actualBreaks;n++){const target=workTotal*n/(actualBreaks+1);const boundary=boundaries.filter(b=>!restAfter.has(b.index)).sort((a,b)=>Math.abs(a.elapsed-target)-Math.abs(b.elapsed-target))[0];restAfter.add(boundary.index);}
 for(const [index,activity] of work.entries()){activities.push(activity);if(restAfter.has(index))activities.push(operation('break','Break',5,'Step away from the work and return refreshed.','resting'));if(energizerTime&&index===Math.floor((work.length-1)/2))activities.push(operation('energizer','Energizer',energizerTime,'Invite a brief stretch and reset attention before continuing.','resting'));}
 if(remaining>0)activities.push(operation('reflection','Capture and reflect',remaining,'Capture useful outcomes, open questions and what needs further work.'));
 activities.push(operation('closing','Wrap-up and closing',closing,'Agree on next steps, responsibilities and where to keep the session outputs.'));
 return {id:crypto.randomUUID(),version:1,intake:{...i,minutes:budget},activities,demo,generatedAt:new Date().toISOString(),acceptedWarnings:[],pinnedMethodId:pinnedId};
}
export function setActivityTime(a:Activity,total:number):Activity { const floor=a.operational?1:Math.max(minimum(a),a.steps.length);if(!Number.isInteger(total)||total<floor||total>720)throw new Error(`Use ${floor}–720 whole minutes.${a.operational?'':' The minimum is 60% of the catalogue default.'}`);const times=allocate(total,a.steps.map(s=>s.minutes));return {...a,steps:a.steps.map((s,i)=>({...s,minutes:times[i]}))}; }
export function setStepTime(a:Activity,index:number,value:number):Activity { if(!Number.isInteger(value)||value<1||value>720)throw new Error('Use 1–720 whole minutes.');const steps=a.steps.map((s,i)=>i===index?{...s,minutes:value}:s);const updated={...a,steps};if(!a.operational&&activityMinutes(updated)<minimum(a))throw new Error(`Keep this method at ${minimum(a)} minutes or more (60% of its catalogue default).`);return updated; }
export function replacementWarnings(p:Plan,a:Activity):string[] { const warnings:string[]=[];const over=totalMinutes(p)-p.intake.minutes;if(over>30)warnings.push(`The plan is ${over} minutes longer than your ${p.intake.minutes}-minute budget.`);if(!groupFits(a,p.intake.participants))warnings.push(`${a.name} supports ${a.minParticipants}–${a.maxParticipants??'unlimited'} participants; the intake has ${p.intake.participants}.`);return warnings; }
