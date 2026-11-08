import { it } from 'node:test';
import assert from 'node:assert/strict';
import { blankProject, projectGoalSchema, validateGoalReferences } from '../lib/projects';
import { allSourceMethods,withFacilitatorEstimates } from '../lib/catalogue';
import { createLocalProject,exportProject,importProject,importProjectFile,localKey,planLocalProgramme,readLocalProjects,saveLocalProjects } from '../lib/local-projects';
import { addEmptyGoalSession,appendProgrammeGoal,createProgrammeProject,groupSessionsByWeek,initialSessionMinutes,insertGoalSession,nextSessionId,programmeInputSchema,removeGoalSession,reorderGoalSession,type ProgrammeInput } from '../lib/programme';
const catalogue=withFacilitatorEstimates(allSourceMethods);
it('projects round-trip through browser storage without network access',()=>{let raw:string|null=null;const storage={getItem:()=>raw,setItem:(_key:string,value:string)=>{raw=value;}};const project=createLocalProject(blankProject('Local'));saveLocalProjects(storage,'test',[project],null);assert.deepEqual(readLocalProjects(raw),[project]);});
it('stale tabs cannot silently overwrite saved projects',()=>{const storage={getItem:()=> 'newer',setItem:()=>assert.fail('must not write')};assert.throws(()=>saveLocalProjects(storage,'key',[],null),/another tab/);});
it('quota failures remain failures and existing browser data is untouched',()=>{const raw:string|null=null;const storage={getItem:()=>raw,setItem:()=>{throw new Error('quota');}};assert.throws(()=>saveLocalProjects(storage,'key',[],null),/quota/);assert.equal(raw,null);});
it('malformed storage is rejected instead of being replaced with an empty store',()=>{assert.throws(()=>readLocalProjects('{bad'));assert.deepEqual(readLocalProjects(null),[]);assert.notEqual(localKey('first'),localKey('second'));});
it('export/import creates a distinct project preserving agendas and outcomes',()=>{const original=planLocalProgramme(createLocalProject(blankProject('Portable')),catalogue);original.sessions[0].status='completed';original.sessions[0].completion={outcomes:'Ideas',decisions:'Test',questions:'Why?',completedAt:'now'};const copy=importProject(exportProject(original));assert.notEqual(copy.id,original.id);assert.deepEqual(copy.sessions,JSON.parse(JSON.stringify(original.sessions)));});
it('imports reject invalid or unrelated JSON',()=>{assert.throws(()=>importProject('{}'));assert.throws(()=>importProject(JSON.stringify({format:'session-studio-project',version:1,project:{name:'broken'}})));});
it('rule-based programmes preserve completed sessions and respect unequal budgets',()=>{const p=createLocalProject(blankProject('Programme'));const first=planLocalProgramme(p,catalogue);first.sessions[0].status='completed';first.sessions[0].completion={outcomes:'Done',decisions:'',questions:'',completedAt:'now'};const other=createLocalProject(blankProject('Next')).sessions[0];other.intake.minutes=60;first.sessions.push(other);const result=planLocalProgramme(first,catalogue);assert.deepEqual(result.sessions[0],first.sessions[0]);assert.equal(result.sessions[1].plan!.intake.minutes,60);assert(result.sessions[1].plan!.activities.reduce((n,a)=>n+a.steps.reduce((v,s)=>v+s.minutes,0),0)<=60);});
it('infeasible sessions preserve existing work and explain the gap',()=>{const p=createLocalProject(blankProject('Programme'));p.sessions[0].intake.minutes=1;const result=planLocalProgramme(p,catalogue);assert(result.uncovered.length);assert.deepEqual(result.sessions,p.sessions);});

it('browser backups restore all projects as new copies',()=>{const projects=[createLocalProject(blankProject('One')),createLocalProject(blankProject('Two'))];const restored=importProjectFile(JSON.stringify({version:1,projects}));assert.deepEqual(restored.map(p=>p.name),['One','Two']);assert(restored.every((p,i)=>p.id!==projects[i].id));});

function setup(overrides:Partial<ProgrammeInput>={}):ProgrammeInput {return {goal:'Find and test a useful campus service',diamonds:[{id:'first',phases:['discover','define']},{id:'second',phases:['develop','deliver']}],participants:4,level:'bachelor',hours:14,timeMode:'weekly',weeks:4,sessionsPerWeek:3,sessionCount:12,countMode:'calculated',...overrides};}
it('version 1 storage migrates deterministically without changing sessions, identities or completion',()=>{
 const original=planLocalProgramme(createLocalProject(blankProject('Legacy')),catalogue);original.sessions[0].status='completed';original.sessions[0].completion={outcomes:'Keep this',decisions:'Agreed',questions:'Later',completedAt:'then'};
 const legacy=Object.fromEntries(Object.entries(original).filter(([key])=>key!=='goals'));const raw=JSON.stringify({version:1,projects:[legacy]});
 const migrated=readLocalProjects(raw)[0],again=readLocalProjects(raw)[0];
 assert.equal(migrated.id,original.id);assert.deepEqual(migrated.sessions,JSON.parse(JSON.stringify(original.sessions)));assert.deepEqual(migrated.goals,again.goals);assert.deepEqual(migrated.goals[0].sessionIds,original.sessions.map(s=>s.id));assert.equal(migrated.goals[0].setup,undefined);
 let saved=raw;const storage={getItem:()=>saved,setItem:(_key:string,value:string)=>{saved=value;}};saveLocalProjects(storage,'same-key',[migrated],raw);assert.equal(JSON.parse(saved).version,2);assert.deepEqual(readLocalProjects(saved)[0],migrated);
});
it('initial availability includes session organisation and never creates a tracked total',()=>{
 const input=setup();assert.equal(initialSessionMinutes(input),280);const p=createProgrammeProject('Study','Context',input,catalogue);
 assert(p.sessions.every(s=>s.intake.minutes===280));assert.deepEqual(p.goals[0].setup,input);assert(!('remainingMinutes' in p));assert(!('totalMinutes' in p.goals[0]));
 const inputCopy=structuredClone(input);inputCopy.diamonds[0].phases=[];assert(p.goals[0].diamonds[0].phases.length>0);
});
it('manual totals remain authoritative without weeks or frequency',()=>{
 const input=setup({timeMode:'total',hours:2,weeks:null,sessionsPerWeek:null,sessionCount:3,countMode:'manual'});
 assert(programmeInputSchema.safeParse(input).success);assert.equal(initialSessionMinutes(input),40);
 assert(programmeInputSchema.safeParse({...input,weeks:7,sessionsPerWeek:4}).success);
 assert(!programmeInputSchema.safeParse({...input,countMode:'calculated'}).success);
 assert(!programmeInputSchema.safeParse({...input,hours:0.1}).success);
});
it('phase cycle identities survive repeated Develop/Deliver progression and exports',()=>{
 const input=setup({diamonds:[{id:'first',phases:[]},{id:'second',phases:['develop','deliver']},{id:'third',phases:['develop','deliver']}],sessionCount:4,countMode:'manual',hours:6,timeMode:'total'});
 const p=createLocalProject(createProgrammeProject('Repeated','',input,catalogue));
 assert.deepEqual(p.sessions.map(s=>[s.phaseCycleId,s.intake.phase]),[['second','develop'],['second','deliver'],['third','develop'],['third','deliver']]);
 assert.deepEqual(importProject(exportProject(p)).goals,p.goals);
 assert(!programmeInputSchema.safeParse({...input,diamonds:[{id:'first',phases:[]},{id:'second',phases:['discover']}]}).success);
 assert(!programmeInputSchema.safeParse({...input,diamonds:[{id:'same',phases:['discover']},{id:'same',phases:['deliver']}]}).success);
});
it('adding a goal preserves existing completed work and supports more than twelve sessions',()=>{
 const p=createProgrammeProject('Study','Context',setup(),catalogue);p.sessions[0].status='completed';p.sessions[0].completion={outcomes:'Done',decisions:'',questions:'',completedAt:'now'};
 const before=structuredClone(p),next=appendProgrammeGoal(p,setup({goal:'Next goal',sessionCount:4,countMode:'manual',timeMode:'total',hours:6}),catalogue);
 assert.equal(next.sessions.length,16);assert.equal(next.goals.length,2);assert.deepEqual(next.sessions.slice(0,12),before.sessions);assert.deepEqual(next.goals[0],before.goals[0]);assert.deepEqual(p,before);
 const stored=createLocalProject(next);assert.equal(readLocalProjects(JSON.stringify({version:2,projects:[stored]}))[0].sessions.length,16);
});
it('session deletion uses the remaining count including additions and protects completed sessions',()=>{
 let p=createProgrammeProject('Study','',setup(),catalogue);const goal=p.goals[0].id;
 p=addEmptyGoalSession(addEmptyGoalSession(p,goal,80),goal,75);assert.equal(p.sessions.at(-1)!.plan!.version,1);assert.deepEqual(p.sessions.at(-1)!.plan!.activities,[]);
 const protectedId=p.sessions[0].id;p.sessions[0].status='completed';p.sessions[0].completion={outcomes:'Done',decisions:'',questions:'',completedAt:'now'};
 assert.throws(()=>removeGoalSession(p,goal,protectedId),/Completed/);
 for(let count=0;count<8;count++)p=removeGoalSession(p,goal,p.sessions[1].id);
 assert.equal(p.sessions.length,6);assert.equal(p.goals[0].initialSessionCount,12);assert.throws(()=>removeGoalSession(p,goal,p.sessions[1].id),/half/);
});
it('reordering session cards updates editor order and selects only the first unfinished globally',()=>{
 let p=createProgrammeProject('Study','',setup({sessionCount:3,countMode:'manual',timeMode:'total',hours:6}),catalogue);const goal=p.goals[0].id,ids=p.sessions.map(s=>s.id);
 p.sessions[0].status='completed';p.sessions[0].completion={outcomes:'Done',decisions:'',questions:'',completedAt:'now'};
 p=reorderGoalSession(p,goal,ids[2],1);assert.deepEqual(p.goals[0].sessionIds,[ids[0],ids[2],ids[1]]);assert.deepEqual(p.sessions.map(s=>s.id),p.goals[0].sessionIds);assert.equal(nextSessionId(p),ids[2]);
 assert.throws(()=>reorderGoalSession(p,goal,ids[0],2),/Completed/);assert.throws(()=>reorderGoalSession(p,goal,ids[1],3),/position/);
});
it('Next remains the approved unfinished session and then advances across goals',()=>{
 let p=createProgrammeProject('Study','',setup({sessionCount:2,countMode:'manual',timeMode:'total',hours:3}),catalogue);
 p=appendProgrammeGoal(p,setup({goal:'Another goal',sessionCount:2,countMode:'manual',timeMode:'total',hours:3}),catalogue);
 p.sessions[0].status='approved';assert.equal(nextSessionId(p),p.sessions[0].id);
 for(const s of p.sessions.slice(0,2)){s.status='completed';s.completion={outcomes:'Done',decisions:'',questions:'',completedAt:'now'};}
 assert.equal(nextSessionId(p),p.goals[1].sessionIds[0]);
 for(const s of p.sessions){s.status='completed';s.completion={outcomes:'Done',decisions:'',questions:'',completedAt:'now'};}
 assert.equal(nextSessionId(p),null);
});
it('storage rejects dangling or multiply assigned goal sessions instead of dropping work',()=>{
 const p=createLocalProject(blankProject('Study'));
 const repeated={...p,goals:[...p.goals,{...p.goals[0],id:'another-goal'}]};
 assert.throws(()=>readLocalProjects(JSON.stringify({version:2,projects:[repeated]})),/exactly one goal/);
 const foreign={...p,sessions:[{...p.sessions[0],phaseCycleId:'absent'}]};
 assert.throws(()=>readLocalProjects(JSON.stringify({version:2,projects:[foreign]})),/outside its goal/);
});
it('removal preserves prerequisites referenced by completed work',()=>{
 const p=createProgrammeProject('Study','',setup({sessionCount:2,countMode:'manual',timeMode:'total',hours:3}),catalogue);
 p.sessions[1].status='completed';p.sessions[1].dependsOn=[p.sessions[0].id];p.sessions[1].completion={outcomes:'Done',decisions:'',questions:'',completedAt:'now'};
 assert.throws(()=>removeGoalSession(p,p.goals[0].id,p.sessions[0].id),/prerequisite of completed/);
});
it('week grouping retains all requested week dividers including empty weeks',()=>{
 const sessions=Object.freeze([Object.freeze({id:'first'}),Object.freeze({id:'second'})]);
 const groups=groupSessionsByWeek(sessions,4);
 assert.deepEqual(groups.map(group=>group.week),[1,2,3,4]);
 assert.deepEqual(groups.map(group=>group.sessions.length),[1,0,1,0]);
 assert.deepEqual(groups.map(group=>group.startIndex),[0,1,1,2]);
 assert.deepEqual(groups.flatMap(group=>group.sessions),sessions);
 assert.equal(groups[0].sessions[0],sessions[0]);assert.equal(groups[2].sessions[0],sessions[1]);
 assert.equal(groupSessionsByWeek([],4).length,4);
});
it('week grouping preserves four-week fifteen-session distribution and absolute reorder indices',()=>{
 const sessions=Array.from({length:15},(_,id)=>({id})),groups=groupSessionsByWeek(sessions,4);
 assert.deepEqual(groups.map(group=>group.sessions.length),[4,4,4,3]);
 assert.deepEqual(groups.map(group=>group.startIndex),[0,4,8,12]);
 assert.deepEqual(groups.flatMap(group=>group.sessions.map((session,offset)=>[session.id,group.startIndex+offset])),sessions.map((session,index)=>[session.id,index]));
 const reordered=[sessions[14],...sessions.slice(0,14)];assert.deepEqual(groupSessionsByWeek(reordered,4).flatMap(group=>group.sessions),reordered);
 assert.deepEqual(groupSessionsByWeek(sessions,null),[{week:null,startIndex:0,sessions}]);
 assert.throws(()=>groupSessionsByWeek(sessions,0),/weeks/);
});
it('inserting Session 12 between 7 and 8 transfers only its week membership and preserves edited agendas',()=>{
 const original=createProgrammeProject('Study','',setup(),catalogue),goalId=original.goals[0].id,ids=original.sessions.map(s=>s.id);
 original.sessions[11].plan!.activities[0].steps[0].minutes+=7;
 const before=structuredClone(original),moved=insertGoalSession(original,goalId,ids[11],ids[7]),goal=moved.goals[0];
 assert.deepEqual(goal.weekSessionCounts,[3,3,4,2]);
 const groups=groupSessionsByWeek(moved.sessions,goal.weeks,goal.weekSessionCounts);
 assert.deepEqual(groups.map(group=>group.sessions.map(s=>s.title)),[['Session 1','Session 2','Session 3'],['Session 4','Session 5','Session 6'],['Session 7','Session 12','Session 8','Session 9'],['Session 10','Session 11']]);
 assert.equal(moved.sessions.length,12);assert.equal(new Set(moved.sessions.map(s=>s.id)).size,12);
 for(const session of moved.sessions)assert.deepEqual(session,before.sessions.find(s=>s.id===session.id));
 assert.deepEqual(original,before);
 const restored=insertGoalSession(moved,goalId,ids[11],null);
 assert.deepEqual(restored.sessions,before.sessions);assert.deepEqual(restored.goals[0].weekSessionCounts,[3,3,3,3]);
 const project=createLocalProject(moved),raw=JSON.stringify({version:2,projects:[project]});
 assert.deepEqual(readLocalProjects(raw)[0],JSON.parse(JSON.stringify(project)));
 assert.deepEqual(importProject(exportProject(project)).goals,project.goals);
});
it('gap insertion handles forward, backward and first-of-week boundaries without rebalancing',()=>{
 const original=createProgrammeProject('Study','',setup(),catalogue),goalId=original.goals[0].id,ids=original.sessions.map(s=>s.id);
 const forward=insertGoalSession(original,goalId,ids[0],ids[3]);
 assert.deepEqual(forward.goals[0].weekSessionCounts,[2,4,3,3]);
 assert.deepEqual(groupSessionsByWeek(forward.sessions,4,forward.goals[0].weekSessionCounts).map(group=>group.sessions.map(s=>s.id)),[ids.slice(1,3),[ids[0],...ids.slice(3,6)],ids.slice(6,9),ids.slice(9)]);
 const backward=insertGoalSession(original,goalId,ids[11],ids[0]);
 assert.deepEqual(backward.goals[0].weekSessionCounts,[4,3,3,2]);assert.deepEqual(backward.sessions.map(s=>s.id),[ids[11],...ids.slice(0,11)]);
 const sameWeek=insertGoalSession(original,goalId,ids[2],ids[0]);assert.deepEqual(sameWeek.goals[0].weekSessionCounts,[3,3,3,3]);
 assert.equal(insertGoalSession(original,goalId,ids[2],ids[2]),original);
 const finalIndex=reorderGoalSession(original,goalId,ids[0],7);
 assert.equal(finalIndex.sessions[7].id,ids[0]);assert.deepEqual(finalIndex.goals[0].weekSessionCounts,[2,3,4,3]);
 const sameWeekFinal=reorderGoalSession(original,goalId,ids[0],2);
 assert.equal(sameWeekFinal.sessions[2].id,ids[0]);assert.deepEqual(sameWeekFinal.goals[0].weekSessionCounts,[3,3,3,3]);
 const forwardWeekEnd=reorderGoalSession(original,goalId,ids[0],5);
 assert.equal(forwardWeekEnd.sessions[5].id,ids[0]);assert.deepEqual(forwardWeekEnd.goals[0].weekSessionCounts,[2,4,3,3]);
 const sparse=createProgrammeProject('Sparse','',setup({sessionCount:2,countMode:'manual',hours:3,timeMode:'total'}),catalogue),sparseIds=sparse.sessions.map(s=>s.id);
 const emptied=insertGoalSession(sparse,sparse.goals[0].id,sparseIds[0],sparseIds[1]);assert.deepEqual(emptied.goals[0].weekSessionCounts,[0,0,2,0]);
 const appended=insertGoalSession(emptied,emptied.goals[0].id,sparseIds[0],null);assert.deepEqual(appended.goals[0].weekSessionCounts,[0,0,1,1]);
 assert.throws(()=>insertGoalSession(original,goalId,ids[0],crypto.randomUUID()),/same goal/);
 original.sessions[0].status='completed';assert.throws(()=>insertGoalSession(original,goalId,ids[0],null),/Completed/);
});
it('adding and removing sessions preserve existing weeks and allocate unique numbered titles',()=>{
 let p=createProgrammeProject('Study','',setup(),catalogue);const goalId=p.goals[0].id,removed=p.sessions[4].id;
 p=removeGoalSession(p,goalId,removed);assert.deepEqual(p.goals[0].weekSessionCounts,[3,2,3,3]);
 p=addEmptyGoalSession(p,goalId);assert.equal(p.sessions.at(-1)!.title,'Session 13');assert.deepEqual(p.goals[0].weekSessionCounts,[3,2,3,4]);
 assert.equal(new Set(p.sessions.map(s=>s.title)).size,p.sessions.length);
 p=removeGoalSession(p,goalId,p.sessions.at(-1)!.id);assert.deepEqual(p.goals[0].weekSessionCounts,[3,2,3,3]);
 const noWeeks=createProgrammeProject('No weeks','',setup({weeks:null,sessionsPerWeek:null,sessionCount:3,countMode:'manual',hours:6,timeMode:'total'}),catalogue);
 assert.equal(addEmptyGoalSession(noWeeks,noWeeks.goals[0].id).goals[0].weekSessionCounts,undefined);
});
it('week counts reject malformed persistence and grouping rather than dropping sessions',()=>{
 const p=createProgrammeProject('Study','',setup(),catalogue),goal=p.goals[0];
 assert(projectGoalSchema.safeParse(goal).success);
 for(const counts of [[3,3,3], [3,3,3,2], [3,3,3,3.5], [3,3,-1,7]]){
  assert(!projectGoalSchema.safeParse({...goal,weekSessionCounts:counts}).success);
  assert.throws(()=>groupSessionsByWeek(p.sessions,4,counts),/Week session counts/);
  assert.throws(()=>validateGoalReferences({...p,goals:[{...goal,weekSessionCounts:counts}]}),/Week session counts/);
 }
 assert(!projectGoalSchema.safeParse({...goal,weeks:null,weekSessionCounts:[12]}).success);
 assert.throws(()=>groupSessionsByWeek(p.sessions,null,[12]),/Week session counts/);
});

// Workspace links are never reused by a portable project copy.
it('project imports isolate online workspaces',()=>{const project=createLocalProject(blankProject('Workspace'));project.workspace={boardId:'abcdefghijklmnopqrstuv'};const copy=importProject(exportProject(project));assert.equal(copy.workspace,null);assert.equal(copy.workspaceCopyFrom,project.workspace.boardId);assert.equal(readLocalProjects(JSON.stringify({version:2,projects:[project]}))[0].workspace?.boardId,project.workspace.boardId);});

