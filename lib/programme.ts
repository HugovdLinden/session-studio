import { generatePlan } from './engine';
import { newSession, initialSessionMinutes, programmeInputSchema, validateGoalReferences, type ProgrammeInput, type PhaseCycle, type ProjectData, type ProjectGoal, type Session } from './projects';
import type { Goal, Method, Phase } from './types';

export { initialSessionMinutes, programmeInputSchema } from './projects';
export type { PhaseCycle, ProgrammeInput } from './projects';
/** Visual grouping only: preserve order and identities without assigning dates or mutating sessions. */
export function groupSessionsByWeek<T>(sessions:readonly T[],weeks:number|null,counts?:readonly number[]):{week:number|null;startIndex:number;sessions:T[]}[]{
 if(counts!==undefined&&(weeks===null||counts.length!==weeks||counts.some(count=>!Number.isInteger(count)||count<0)||counts.reduce((sum,count)=>sum+count,0)!==sessions.length))throw new Error('Week session counts must match the weeks and include every session.');
 if(weeks===null)return [{week:null,startIndex:0,sessions:sessions.slice()}];
 if(!Number.isInteger(weeks)||weeks<1||weeks>520)throw new Error('Choose between 1 and 520 weeks.');
 let cursor=0;
 return Array.from({length:weeks},(_,index)=>{
  const startIndex=counts?cursor:Math.ceil(index*sessions.length/weeks),endIndex=counts?startIndex+counts[index]:Math.ceil((index+1)*sessions.length/weeks);cursor=endIndex;
  return {week:index+1,startIndex,sessions:sessions.slice(startIndex,endIndex)};
 });
}
const phaseGoal:Record<Phase,Goal>={discover:'understand',define:'frame',develop:'fluency',deliver:'select',iterate:'flexibility'};
function selectedPhases(diamonds:PhaseCycle[]):{phase:Phase;cycleId:string}[]{
 return diamonds.flatMap(d=>(['discover','define','develop','deliver'] as Phase[]).filter(p=>d.phases.includes(p)).map(phase=>({phase,cycleId:d.id})));
}
/** Honest local scaffolding, not interpretation of the typed goal. Replaced by a server facilitator adapter. */
function draftGoal(name:string,description:string,input:ProgrammeInput,catalogue:Method[]):{goal:ProjectGoal;sessions:Session[];uncovered:string[]} {
 const phases=selectedPhases(input.diamonds),uncovered:string[]=[];
 const sessions=Array.from({length:input.sessionCount},(_,index)=>{
  const {phase,cycleId}=phases[Math.min(phases.length-1,Math.floor(index*phases.length/input.sessionCount))];
  const session=newSession(`Session ${index+1}`);
  session.phaseCycleId=cycleId;
  session.intake={name,description,phase,goal:phaseGoal[phase],minutes:initialSessionMinutes(input),participants:input.participants,level:input.level};
  session.purpose='Local draft based on selected phase order. The typed goal has not been interpreted by a facilitator.';
  try{session.plan=generatePlan(session.intake,catalogue,false);session.expectedOutputs=session.plan.activities.filter(a=>!a.operational).map(a=>a.takeaway).join(' ');}
  catch(error){uncovered.push(`Session ${index+1}: ${(error as Error).message}`);}
  return session;
 });
 if(phases.length>input.sessionCount)uncovered.push('The local draft has fewer sessions than selected phase segments. A facilitator must reconcile the selected phases with the requested session count.');
 return {goal:{id:crypto.randomUUID(),title:input.goal,diamonds:structuredClone(input.diamonds),sessionIds:sessions.map(s=>s.id),initialSessionCount:input.sessionCount,weeks:input.weeks,sessionsPerWeek:input.sessionsPerWeek,setup:structuredClone(input)},sessions,uncovered};
}
export function createProgrammeProject(name:string,description:string,value:ProgrammeInput,catalogue:Method[]):ProjectData {
 const input=programmeInputSchema.parse(value),draft=draftGoal(name,description,input,catalogue);
 return {workspace:null,workspaceCopyFrom:null,name,description,completedWork:'',desiredOutcome:'',demo:false,goals:[draft.goal],sessions:draft.sessions,uncovered:draft.uncovered};
}
export function appendProgrammeGoal<T extends ProjectData>(project:T,value:ProgrammeInput,catalogue:Method[]):T {
 const input=programmeInputSchema.parse(value);
 if(project.sessions.length+input.sessionCount>120)throw new Error('Keep a project to 120 sessions or fewer.');
 const draft=draftGoal(project.name,project.description,input,catalogue);
 return {...project,goals:[...project.goals,draft.goal],sessions:[...project.sessions,...draft.sessions],uncovered:[...project.uncovered,...draft.uncovered].slice(0,120)};
}
function findGoal(project:ProjectData,id:string):ProjectGoal {const goal=project.goals.find(g=>g.id===id);if(!goal)throw new Error('This goal no longer exists.');return goal;}
function weekCounts(goal:ProjectGoal):number[]|undefined {return goal.weeks===null?undefined:groupSessionsByWeek(goal.sessionIds,goal.weeks,goal.weekSessionCounts).map(group=>group.sessions.length);}
function weekAt(counts:readonly number[],index:number):number {let end=0;for(let week=0;week<counts.length;week++){end+=counts[week];if(index<end)return week;}throw new Error('The session has no week.');}
function applyGoalOrder<T extends ProjectData>(project:T,goals:ProjectGoal[],sessions:Session[]=project.sessions):T {
 const byId=new Map(sessions.map(s=>[s.id,s]));
 const next={...project,goals,sessions:goals.flatMap(g=>g.sessionIds.map(id=>byId.get(id)!))};
 validateGoalReferences(next);return next;
}
export function nextSessionId(project:ProjectData):string|null {
 const byId=new Map(project.sessions.map(s=>[s.id,s]));
 return project.goals.flatMap(g=>g.sessionIds).find(id=>byId.get(id)?.status!=='completed')??null;
}
export function removeGoalSession<T extends ProjectData>(project:T,goalId:string,sessionId:string):T {
 const goal=findGoal(project,goalId),session=project.sessions.find(s=>s.id===sessionId);
 if(!goal.sessionIds.includes(sessionId)||!session)throw new Error('This session does not belong to the goal.');
 if(session.status==='completed')throw new Error('Completed sessions cannot be removed.');
 if(goal.sessionIds.length-1<Math.ceil(goal.initialSessionCount/2))throw new Error('Keep at least half of the originally planned sessions, rounded up.');
 const removedStages=new Set((session.plan?.activities??[]).filter(a=>a.methodRunId&&a.stageId).map(a=>`${a.methodRunId}:${a.stageId}`));
 for(const completed of project.sessions.filter(s=>s.status==='completed')){
  if(completed.dependsOn.includes(sessionId)||(completed.plan?.activities??[]).some(a=>(a.requiresStageIds??[]).some(stage=>removedStages.has(`${a.methodRunId}:${stage}`))))throw new Error('This session is a prerequisite of completed work and cannot be removed.');
 }
 const counts=weekCounts(goal);if(counts)counts[weekAt(counts,goal.sessionIds.indexOf(sessionId))]--;
 return applyGoalOrder(project,project.goals.map(g=>g.id===goalId?{...g,sessionIds:g.sessionIds.filter(id=>id!==sessionId),...(counts?{weekSessionCounts:counts}:{})}:g),project.sessions.filter(s=>s.id!==sessionId));
}
/** Insert into a gap, assigning the moved session to the following session's week; null appends to the final week. */
export function insertGoalSession<T extends ProjectData>(project:T,goalId:string,sessionId:string,beforeId:string|null):T {
 return moveGoalSession(project,goalId,sessionId,beforeId);
}
function moveGoalSession<T extends ProjectData>(project:T,goalId:string,sessionId:string,beforeId:string|null,targetIndex?:number):T {
 const goal=findGoal(project,goalId),session=project.sessions.find(s=>s.id===sessionId);
 if(!goal.sessionIds.includes(sessionId)||!session)throw new Error('This session does not belong to the goal.');
 if(session.status==='completed')throw new Error('Completed sessions cannot be moved.');
 if(beforeId!==null&&!goal.sessionIds.includes(beforeId))throw new Error('Choose a session in the same goal.');
 if(beforeId===sessionId)return project;
 const counts=weekCounts(goal);
 if(counts){const sourceWeek=weekAt(counts,goal.sessionIds.indexOf(sessionId)),targetWeek=targetIndex!==undefined?weekAt(counts,targetIndex):beforeId===null?counts.length-1:weekAt(counts,goal.sessionIds.indexOf(beforeId));counts[sourceWeek]--;counts[targetWeek]++;}
 const ids=goal.sessionIds.filter(id=>id!==sessionId);ids.splice(beforeId===null?ids.length:ids.indexOf(beforeId),0,sessionId);
 return applyGoalOrder(project,project.goals.map(g=>g.id===goalId?{...g,sessionIds:ids,...(counts?{weekSessionCounts:counts}:{})}:g));
}
/** Target index is the final zero-based position in this goal, not an insertion slot. */
export function reorderGoalSession<T extends ProjectData>(project:T,goalId:string,sessionId:string,index:number):T {
 const goal=findGoal(project,goalId),session=project.sessions.find(s=>s.id===sessionId);
 if(!goal.sessionIds.includes(sessionId)||!session)throw new Error('This session does not belong to the goal.');
 if(session.status==='completed')throw new Error('Completed sessions cannot be moved.');
 if(!Number.isInteger(index)||index<0||index>=goal.sessionIds.length)throw new Error('Choose an existing session position.');
 if(goal.sessionIds.indexOf(sessionId)===index)return project;
 const ids=goal.sessionIds.filter(id=>id!==sessionId);
 return moveGoalSession(project,goalId,sessionId,ids[index]??null,index);
}
export function addEmptyGoalSession<T extends ProjectData>(project:T,goalId:string,minutes=90):T {
 const goal=findGoal(project,goalId);
 if(project.sessions.length>=120)throw new Error('Keep a project to 120 sessions or fewer.');
 if(!Number.isInteger(minutes)||minutes<10||minutes>720)throw new Error('Choose a session duration of 10–720 minutes.');
 const previous=project.sessions.find(s=>s.id===goal.sessionIds.at(-1))!;
 const nextNumber=1+Math.max(0,...project.sessions.filter(s=>goal.sessionIds.includes(s.id)).map(s=>Number(/^Session (\d+)$/.exec(s.title)?.[1]??0)));
 const session=newSession(`Session ${nextNumber}`);
 session.phaseCycleId=previous.phaseCycleId;
 session.intake={...previous.intake,minutes};
 session.plan={id:crypto.randomUUID(),version:1,intake:session.intake,activities:[],demo:project.demo,generatedAt:new Date().toISOString(),acceptedWarnings:[]};
 const counts=weekCounts(goal);if(counts)counts[counts.length-1]++;
 return applyGoalOrder(project,project.goals.map(g=>g.id===goalId?{...g,sessionIds:[...g.sessionIds,session.id],...(counts?{weekSessionCounts:counts}:{})}:g),[...project.sessions,session]);
}
