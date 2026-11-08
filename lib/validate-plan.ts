import { planSchema } from './validation';
import { activityMinutes, groupFits, minimum, totalMinutes } from './engine';
import { isReady } from './catalogue';
import type { Intake, Method, Plan } from './types';
/** The same guard must stay in place when a live Chief adapter replaces the sample service. */
export function validateGeneratedPlan(value:unknown,intake:Intake,catalogue:Method[],pinnedId?:string):Plan {
 const plan=planSchema.parse(value);
 if(plan.intake.participants!==intake.participants)throw new Error('The planner changed the participant count. The previous draft is preserved.');
 for(const key of ['name','description','phase','goal','level'] as const)if(plan.intake[key]!==intake[key])throw new Error('The planner changed confirmed intake information.');
 if(!pinnedId&&plan.intake.minutes!==intake.minutes)throw new Error('The generated plan changed the available time.');
 if(pinnedId&&plan.intake.minutes<intake.minutes)throw new Error('A pinned rebuild cannot reduce available time.');
 if(totalMinutes(plan)!==plan.intake.minutes)throw new Error('The generated plan does not fit its available time.');
 for(const a of plan.activities){if(a.operational){if(!['intro','icebreaker','purge','break','energizer','reflection','closing'].includes(a.methodId))throw new Error('An unknown session step was returned.');continue;}const m=catalogue.find(m=>m.id===a.methodId);if(!m||!isReady(m))throw new Error('An incomplete or unknown method was returned.');if(!groupFits(m,intake.participants)||activityMinutes(a)<Math.max(minimum(m),m.steps.length)||a.defaultMinutes!==m.defaultMinutes)throw new Error('A method violates the timing or participant rules.');if(a.methodId!==pinnedId&&(!m.phases.includes(intake.phase)||!m.goals.includes(intake.goal)))throw new Error('A method does not fit the intake.');if(intake.level==='novice'&&m.difficulty!=='easy')throw new Error('A method is too difficult for this experience level.');if(a.name!==m.name||a.category!==m.category||a.source!==m.source||a.minParticipants!==m.minParticipants||a.maxParticipants!==m.maxParticipants)throw new Error('The planner changed catalogue identity or constraints.');if(a.steps.length!==m.steps.length||a.steps.some((s,i)=>s.title!==m.steps[i].title||s.summary!==m.steps[i].summary))throw new Error('The planner returned steps that are not grounded in the catalogue.');}
 if(pinnedId&&!plan.activities.some(a=>a.methodId===pinnedId))throw new Error('The new plan did not retain the pinned method.');
 return plan;
}
