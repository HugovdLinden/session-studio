import { localKey, readLocalProjects, saveLocalProjects } from './local-projects';
import { workspaceSummary } from './workspace-client';

// Only an explicit finish action writes canonical completion. Visiting the overview does not.
export async function completeRunnerSession({storageScope,projectId,sessionId,boardId}:{storageScope:string;projectId:string;sessionId:string;boardId:string}):Promise<{completedAt:string}>{
 const storage=window.localStorage,key=localKey(storageScope),expected=storage.getItem(key);
 const projects=readLocalProjects(expected),project=projects.find(p=>p.id===projectId),session=project?.sessions.find(s=>s.id===sessionId);
 if(!project||!session||project.workspace?.boardId!==boardId)throw new Error('Open this session from its saved project in this browser and account before finishing.');
 if(session.status==='completed'){
  if(!session.completion?.workspace||session.completion.workspace.boardId!==boardId)throw new Error('This session already has a completion record. Review it in the project.');
  return {completedAt:session.completion.completedAt};
 }
 if(session.status!=='approved'||!session.plan?.activities.length)throw new Error('Confirm and save a nonempty session plan before finishing.');
 const workspace=await workspaceSummary(boardId,session),completedAt=new Date().toISOString();
 const next=projects.map(p=>p.id!==projectId?p:{...p,revision:p.revision+1,updatedAt:completedAt,sessions:p.sessions.map(s=>s.id!==sessionId?s:{...s,status:'completed' as const,completion:{outcomes:'',decisions:'',questions:'',completedAt,workspace}})});
 const saved=saveLocalProjects(storage,key,next,expected);
 if(storage.getItem(key)!==saved)throw new Error('Completion could not be verified. Return to the project and check its saved status.');
 const verified=readLocalProjects(saved).find(p=>p.id===projectId)?.sessions.find(s=>s.id===sessionId);
 if(verified?.status!=='completed'||verified.completion?.completedAt!==completedAt||verified.completion.workspace?.boardId!==boardId)throw new Error('Completion could not be verified. Return to the project and check its saved status.');
 return {completedAt};
}
