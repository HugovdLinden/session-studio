import { z } from 'zod';
import { allSourceMethods, withDemoRatings, withFacilitatorEstimates } from './catalogue';
import { generatePlan } from './engine';
import { projectSchema, migrateProjectData, validateGoalReferences, validateProjectChange, type Project, type ProjectData } from './projects';
import type { Method } from './types';
export const localProjectSchema=projectSchema.extend({id:z.string().uuid(),revision:z.number().int().min(1),updatedAt:z.string()});
const storeSchema=z.object({version:z.union([z.literal(1),z.literal(2)]),projects:z.array(localProjectSchema).max(100)});
export const localKey=(userId:string)=>`session-studio-local-projects-v1:${userId}`;
export function readLocalProjects(raw:string|null):Project[]{return raw===null?[]:storeSchema.parse(JSON.parse(raw)).projects.map(project=>{const migrated={...project,...migrateProjectData(project)};validateGoalReferences(migrated);return migrated;});}
export function saveLocalProjects(storage:Pick<Storage,'getItem'|'setItem'>,key:string,projects:Project[],expected:string|null):string {
 if(storage.getItem(key)!==expected)throw new Error('Projects changed in another tab. Export your edits, then reload the saved projects.');
 const migrated=projects.map(project=>{const result={...project,...migrateProjectData(project)};validateGoalReferences(result);return result;});
 const data=JSON.stringify(storeSchema.parse({version:2,projects:migrated}));storage.setItem(key,data);return data;
}
export function createLocalProject(data:ProjectData):Project {const migrated=migrateProjectData(data);validateGoalReferences(migrated);return {...migrated,id:crypto.randomUUID(),revision:1,updatedAt:new Date().toISOString()};}
export function exportProject(project:Project):string {const migrated=migrateProjectData(project);validateGoalReferences(migrated);return JSON.stringify({format:'session-studio-project',version:2,project:migrated},null,2);}
export function importProject(text:string):Project {
 if(text.length>5*1024*1024)throw new Error('Choose a Session Studio JSON export smaller than 5 MB.');
 const file=z.object({format:z.literal('session-studio-project'),version:z.union([z.literal(1),z.literal(2)]),project:projectSchema}).parse(JSON.parse(text));
 file.project=migrateProjectData(file.project);validateGoalReferences(file.project);
 const catalogue=withFacilitatorEstimates(withDemoRatings(allSourceMethods));
 // Imports may contain completed sessions; verify them as newly supplied content.
 validateProjectChange({...file.project,sessions:[]},file.project,catalogue,true);
 return createLocalProject({...file.project,workspace:null,workspaceCopyFrom:file.project.workspace?.boardId??file.project.workspaceCopyFrom});
}
export function planLocalProgramme(project:Project,catalogue:Method[],sessionId?:string):Project {
 const effective=project.demo?withDemoRatings(catalogue):catalogue,uncovered:string[]=[];
 const sessions=project.sessions.map(s=>{
  if(s.status==='completed'||sessionId&&s.id!==sessionId)return s;
  try{const plan=generatePlan(s.intake,effective,project.demo);return {...s,plan,status:'draft' as const,purpose:'Rule-based agenda for this session. Review prerequisites and preparation yourself.',expectedOutputs:plan.activities.filter(a=>!a.operational).map(a=>a.takeaway).filter(Boolean).join(' ')};}
  catch(e){uncovered.push(`${s.title}: ${(e as Error).message}`);return s;}
 });
 if(uncovered.length&&sessionId)throw new Error(uncovered.join(' '));
 return {...project,sessions,uncovered};
}

export function importProjectFile(text:string):Project[]{
 if(text.length>5*1024*1024)throw new Error('Choose a JSON export smaller than 5 MB.');
 const value=JSON.parse(text);
 return value.format==='session-studio-project'?[importProject(text)]:readLocalProjects(text).map(p=>importProject(exportProject(p)));
}
