import { stageMinimum } from './method-stages';
import { isReady } from './catalogue';
import { z } from 'zod';
import { intakeSchema, planSchema } from './validation';
import { activityMinutes, groupFits, minimum, totalMinutes } from './engine';
import type { Method } from './types';

export const phaseCycleSchema=z.object({id:z.string().min(1).max(200),phases:z.array(z.enum(['discover','define','develop','deliver','iterate'])).max(5)});
export type PhaseCycle=z.infer<typeof phaseCycleSchema>;
export const programmeInputSchema=z.object({
 goal:z.string().trim().min(1).max(2000),diamonds:z.array(phaseCycleSchema).min(1).max(30),participants:z.number().int().min(1).max(100),level:z.enum(['novice','bachelor','master']),
 hours:z.number().finite().positive().max(1440),timeMode:z.enum(['weekly','total']),weeks:z.number().int().min(1).max(520).nullable(),sessionsPerWeek:z.number().int().min(1).max(120).nullable(),sessionCount:z.number().int().min(1).max(120),countMode:z.enum(['calculated','manual']),
}).superRefine((input,ctx)=>{
 if(!input.diamonds.some(d=>d.phases.length))ctx.addIssue({code:'custom',path:['diamonds'],message:'Select at least one phase.'});
 if(new Set(input.diamonds.map(d=>d.id)).size!==input.diamonds.length)ctx.addIssue({code:'custom',path:['diamonds'],message:'Each diamond needs its own identity.'});
 for(const [index,diamond] of input.diamonds.entries()){
  if(new Set(diamond.phases).size!==diamond.phases.length)ctx.addIssue({code:'custom',path:['diamonds',index],message:'Select each phase once per diamond.'});
  if(diamond.phases.some(phase=>index===0?!['discover','define'].includes(phase):!['develop','deliver'].includes(phase)))ctx.addIssue({code:'custom',path:['diamonds',index],message:'The first diamond contains Discover/Define; later cycles contain Develop/Deliver.'});
 }
 if(input.countMode==='calculated'&&(input.weeks===null||input.sessionsPerWeek===null||input.weeks*input.sessionsPerWeek!==input.sessionCount))ctx.addIssue({code:'custom',path:['sessionCount'],message:'Recalculate the count or enter a manual total.'});
 const minutes=initialSessionMinutes(input);
 if(minutes<10||minutes>720)ctx.addIssue({code:'custom',path:['hours'],message:'The initial availability must allow 10–720 minutes per session, including breaks.'});
});
export type ProgrammeInput=z.infer<typeof programmeInputSchema>;
/** Initialization only; availability is never maintained as a remaining project budget. */
export function initialSessionMinutes(input:Pick<ProgrammeInput,'hours'|'timeMode'|'weeks'|'sessionCount'>):number {return Math.round(input.hours*60*(input.timeMode==='weekly'?(input.weeks??1):1)/input.sessionCount);}
export const projectGoalSchema=z.object({id:z.string().min(1).max(200),title:z.string().trim().min(1).max(2000),diamonds:z.array(phaseCycleSchema).min(1).max(30),sessionIds:z.array(z.string().uuid()).min(1).max(120),initialSessionCount:z.number().int().min(1).max(120),weeks:z.number().int().min(1).max(520).nullable(),weekSessionCounts:z.array(z.number().int().min(0).max(120)).max(520).optional(),sessionsPerWeek:z.number().int().min(1).max(120).nullable(),setup:programmeInputSchema.optional()}).superRefine((goal,ctx)=>{
 if(goal.weekSessionCounts!==undefined&&(goal.weeks===null||goal.weekSessionCounts.length!==goal.weeks||goal.weekSessionCounts.reduce((sum,count)=>sum+count,0)!==goal.sessionIds.length))ctx.addIssue({code:'custom',path:['weekSessionCounts'],message:'Week session counts must match the weeks and include every session.'});
});
export type ProjectGoal=z.infer<typeof projectGoalSchema>;

export const sessionSchema = z.object({
  id: z.string().uuid(), title: z.string().max(160), purpose: z.string().max(2000).default(''),
  expectedOutputs: z.string().max(2000).default(''), dependsOn: z.array(z.string()).max(120).default([]),
  intake: intakeSchema, plan: planSchema.nullable(), status: z.enum(['draft','approved','completed']),
  phaseCycleId:z.string().min(1).max(200).optional(),
  completion: z.object({outcomes:z.string().max(8000),decisions:z.string().max(8000),questions:z.string().max(8000),completedAt:z.string(),workspace:z.object({boardId:z.string().max(40),capturedAt:z.string(),items:z.number().int().min(0),summary:z.string().max(20000)}).nullish()}).nullable().default(null),
});
const boardId=z.string().regex(/^[A-Za-z0-9_-]{22}$/);
export const projectSchema = z.object({
  workspace:z.object({boardId}).nullable().default(null),workspaceCopyFrom:boardId.nullable().default(null),
  name:z.string().trim().min(1).max(120), description:z.string().max(1500), completedWork:z.string().max(8000), desiredOutcome:z.string().max(8000),
  demo:z.boolean(),
  sessions:z.array(sessionSchema).min(1).max(120), uncovered:z.array(z.string()).max(120),goals:z.array(projectGoalSchema).max(120).default([]),
});
export type ProjectData=z.infer<typeof projectSchema>;
export type Session=z.infer<typeof sessionSchema>;
export type Project=ProjectData & {id:string;revision:number;updatedAt:string};
export const defaultIntake={name:'New project',description:'',phase:'develop',goal:'fluency',minutes:90,participants:4,level:'bachelor'} as const;
export function newSession(name:string):Session {return {id:crypto.randomUUID(),title:name,purpose:'',expectedOutputs:'',dependsOn:[],intake:{...defaultIntake,name},plan:null,status:'draft',completion:null};}
/** A deterministic grouping migration: never regenerate or rewrite saved sessions. */
export function migrateProjectData(value:unknown):ProjectData {
 const data=projectSchema.parse(value);
 if(data.goals.length)return data;
 const first=data.sessions[0];
 return {...data,goals:[{id:`legacy-goal-${first.id}`,title:data.desiredOutcome.trim()||'Existing goal',diamonds:[{id:`legacy-cycle-${first.id}`,phases:[...new Set(data.sessions.map(s=>s.intake.phase))]}],sessionIds:data.sessions.map(s=>s.id),initialSessionCount:data.sessions.length,weeks:null,sessionsPerWeek:null}]};
}
export function validateGoalReferences(project:ProjectData):void {
 const known=new Set(project.sessions.map(s=>s.id)),assigned=new Set<string>(),goals=new Set<string>();
 if(known.size!==project.sessions.length)throw new Error('Duplicate session identifiers.');
 for(const goal of project.goals){
  if(goal.weekSessionCounts!==undefined&&(goal.weeks===null||goal.weekSessionCounts.length!==goal.weeks||goal.weekSessionCounts.some(count=>!Number.isInteger(count)||count<0)||goal.weekSessionCounts.reduce((sum,count)=>sum+count,0)!==goal.sessionIds.length))throw new Error('Week session counts must match the weeks and include every session.');
  if(goals.has(goal.id))throw new Error('Duplicate goal identifiers.');goals.add(goal.id);
  if(new Set(goal.diamonds.map(d=>d.id)).size!==goal.diamonds.length)throw new Error('Duplicate phase cycle identifiers.');
  for(const id of goal.sessionIds){
   if(!known.has(id)||assigned.has(id))throw new Error('Each session must belong to exactly one goal.');assigned.add(id);
   const session=project.sessions.find(s=>s.id===id)!;
   if(session.phaseCycleId){const cycle=goal.diamonds.find(d=>d.id===session.phaseCycleId);if(!cycle)throw new Error('A session refers to a phase cycle outside its goal.');if(!cycle.phases.includes(session.intake.phase))throw new Error('A session phase is not selected in its phase cycle.');}
  }
 }
 if(assigned.size!==known.size)throw new Error('Each session must belong to exactly one goal.');
}
export function blankProject(name:string):ProjectData {return migrateProjectData({name,description:'',completedWork:'',desiredOutcome:'',demo:false,sessions:[{...newSession('Session 1'),intake:{...defaultIntake,name}}],uncovered:[]});}

export function dependencyIssues(sessions:Session[]):string[] {
  const errors:string[]=[];const seenSessions=new Set<string>();const seenStages=new Set<string>();const activityIds=new Set<string>();const stageSessions=new Map<string,string>();
  for(const s of sessions){
    for(const dependency of s.dependsOn)if(!seenSessions.has(dependency))errors.push(`${s.title}: its prerequisite session must come first.`);
    for(const a of s.plan?.activities??[]){
      if(activityIds.has(a.instanceId))errors.push('A block appears more than once.'); activityIds.add(a.instanceId);
      for(const dependency of a.requiresStageIds??[]){const key=`${a.methodRunId}:${dependency}`;if(!seenStages.has(key))errors.push(`${a.name}: complete the preceding method stage first.`);else if(stageSessions.get(key)===s.id)errors.push(`${a.name}: place this stage in a later session, after the required preparation or fieldwork.`);}
      if(a.stageId){const key=`${a.methodRunId}:${a.stageId}`;if(seenStages.has(key))errors.push(`${a.name}: duplicate method stage.`);seenStages.add(key);stageSessions.set(key,s.id);}
    }seenSessions.add(s.id);
  }return [...new Set(errors)];
}
export function moveBlock(sessions:Session[],fromId:string,blockId:string,toId:string,index:number):Session[]{
  const from=sessions.find(s=>s.id===fromId),to=sessions.find(s=>s.id===toId);
  if(!from?.plan||!to||from.status==='completed'||to.status==='completed')throw new Error('Choose two editable agendas.');
  const block=from.plan.activities.find(a=>a.instanceId===blockId);if(!block)throw new Error('The block no longer exists.');
  if(!Number.isInteger(index)||index<0||index>(to.plan?.activities.length??0))throw new Error('Invalid position.');
  if(fromId!==toId&&(to.plan?.activities.length??0)>=100)throw new Error('Keep each agenda to 100 blocks or fewer.');
  const old=from.plan.activities.findIndex(a=>a.instanceId===blockId);const dest=index-(fromId===toId&&old<index?1:0);
  return sessions.map(s=>{if(![fromId,toId].includes(s.id))return s;const plan=s.plan??{id:crypto.randomUUID(),version:0,intake:s.intake,activities:[],demo:from.plan!.demo,generatedAt:new Date().toISOString(),acceptedWarnings:[]};const activities=plan.activities.filter(a=>a.instanceId!==blockId);if(s.id===toId)activities.splice(dest,0,block);return {...s,status:'draft',plan:{...plan,version:plan.version+1,activities}};});
}
export function sessionWarnings(session:Session):string[]{
 if(!session.plan)return [];const warnings:string[]=[];
 const over=totalMinutes(session.plan)-session.intake.minutes;if(over>0)warnings.push(`${session.title}: ${over} minutes over budget.`);
 for(const a of session.plan.activities)if(!groupFits(a,session.intake.participants))warnings.push(`${a.name} does not fit ${session.intake.participants} participants.`);
 return warnings;
}
export function validateProjectChange(previous:ProjectData,next:ProjectData,catalogue:Method[],allowCompletion=false):void {
 validateGoalReferences(next);
 if(new Set(next.sessions.map(s=>s.id)).size!==next.sessions.length)throw new Error('Duplicate session identifiers.');
 for(const old of previous.sessions.filter(s=>s.status==='completed'))if(JSON.stringify(old)!==JSON.stringify(next.sessions.find(s=>s.id===old.id)))throw new Error('Completed sessions cannot be changed or removed.');
 const activityIds=new Set<string>(),runMethods=new Map<string,string>(),issuesBySession=new Map<string,string[]>();
 for(const session of next.sessions)for(const activity of session.plan?.activities??[]){
  if(activityIds.has(activity.instanceId))throw new Error('A block appears more than once.');activityIds.add(activity.instanceId);
  if(activity.methodRunId){const method=runMethods.get(activity.methodRunId);if(method&&method!==activity.methodId)throw new Error('A run mixes different methods.');runMethods.set(activity.methodRunId,activity.methodId);}
 }
 for(const goal of next.goals){
  const sessions=goal.sessionIds.map(id=>next.sessions.find(s=>s.id===id)!);
  const issues=dependencyIssues(sessions),runs=new Map<string,{method:Method;stages:Set<string>}>();
  for(const session of sessions)for(const activity of session.plan?.activities??[])if(activity.stageId&&activity.methodRunId){
   const method=catalogue.find(m=>m.id===activity.methodId);if(!method)throw new Error('Unknown staged method.');
   const run=runs.get(activity.methodRunId)??{method,stages:new Set<string>()};run.stages.add(activity.stageId);runs.set(activity.methodRunId,run);
  }
  for(const run of runs.values())if(run.method.stages?.some(stage=>!run.stages.has(stage.id)))issues.push(`${run.method.name}: include all required stages before confirming.`);
  for(const session of sessions)issuesBySession.set(session.id,issues);
 }

 for(const s of next.sessions){
  if(s.plan){if(JSON.stringify(s.plan.intake)!==JSON.stringify(s.intake))throw new Error('Agenda and session settings do not match.');
   for(const a of s.plan.activities){if(a.operational){if(!['intro','icebreaker','purge','break','energizer','reflection','closing'].includes(a.methodId))throw new Error('Unknown session step.');continue;}const m=catalogue.find(m=>m.id===a.methodId);if(!m)throw new Error('Unknown method.');const retained=previous.sessions.some(old=>old.plan?.activities.some(saved=>saved.instanceId===a.instanceId&&JSON.stringify(saved)===JSON.stringify(a)));if(retained)continue;if(!isReady(m))throw new Error('This method is incomplete.');
    if(a.stageId){const stage=m.stages?.find(t=>t.id===a.stageId);if(!stage||!a.methodRunId||JSON.stringify(a.requiresStageIds??[])!==JSON.stringify(stage.requiresStageIds))throw new Error('Invalid method stage.');if(activityMinutes(a)<stageMinimum(m,stage))throw new Error('A method stage is below its minimum duration.');}else if(m.stages?.length)throw new Error('Schedule the documented method stages separately.');
    if(activityMinutes(a)<(a.stageId?a.steps.length:Math.max(minimum(a),a.steps.length)))throw new Error('A method is below its minimum duration.');
   }
  }
  const old=previous.sessions.find(x=>x.id===s.id);if(s.status==='completed'&&old?.status!=='completed'&&!allowCompletion)throw new Error('Use the completion form to complete a session.');
  if(s.status!=='draft'&&old?.status!==s.status){if(!s.plan?.activities.length)throw new Error('An empty agenda cannot be confirmed.');const issues=issuesBySession.get(s.id)??[];if(issues.length)throw new Error(issues.join(' '));}
  if(s.status==='completed'&&!s.completion)throw new Error('Add a completion summary.');
 }
}

/** Import Sam's browser draft without changing the original browser storage. */
export function importLegacyProject(value:unknown):ProjectData {
 const legacy=z.object({intake:z.unknown().optional(),plan:z.unknown().optional(),approved:z.unknown().optional(),demo:z.boolean().optional()}).parse(value);
 const saved=legacy.approved??legacy.plan;
 if(saved!=null){
  const plan=planSchema.parse(saved),project=blankProject(plan.intake.name);
  project.demo=plan.demo;
  project.sessions=[{...newSession('Imported session'),intake:plan.intake,plan,status:legacy.approved?'approved':'draft'}];return migrateProjectData({...project,goals:[]});
 }
 const intake=intakeSchema.parse(legacy.intake),project=blankProject(intake.name);
 project.demo=legacy.demo??false;
 project.sessions=[{...newSession('Imported session'),intake}];return migrateProjectData({...project,goals:[]});
}
