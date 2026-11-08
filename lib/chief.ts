import type { Activity, Alternatives, Intake, Method, Plan, PlanningKnowledge } from './types';
import { alternatives, generatePlan, totalMinutes } from './engine';
/** A real Session Chief adapter must return grounded methods; the app retains its constraint rules. */
export interface PlanningService {
 generatePlan(intake:Intake,catalogue:Method[],demo:boolean,knowledge?:PlanningKnowledge):Promise<Plan>;
 listAlternatives(plan:Plan,target:Activity,catalogue:Method[]):Promise<Alternatives>;
 rebuildWithPinnedMethod(intake:Intake,catalogue:Method[],demo:boolean,methodId:string,knowledge?:PlanningKnowledge):Promise<Plan>;
}
export const sampleChief:PlanningService={
 async generatePlan(i,c,d){return generatePlan(i,c,d);},
 async listAlternatives(p,t,c){return alternatives(c,t,p.intake,totalMinutes(p));},
 async rebuildWithPinnedMethod(i,c,d,id){return generatePlan(i,c,d,id);},
};
