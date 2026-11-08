import { it } from 'node:test';
import assert from 'node:assert/strict';
import { allSourceMethods,sourceMethods,withDemoRatings } from '../lib/catalogue';
import { importLegacyProject,blankProject,newSession,moveBlock,dependencyIssues,validateProjectChange,sessionWarnings } from '../lib/projects';
import { fromMethodStages,generatePlan,activityMinutes,setActivityTime } from '../lib/engine';
import { matchesMethod,emptyFilters } from '../lib/method-search';
import { stageMinimum } from '../lib/method-stages';
import { planSchema } from '../lib/validation';
import { projectCardSummary } from '../lib/project-card';
const catalogue=withDemoRatings(allSourceMethods);
function project(){const p=blankProject('Study');p.demo=true;p.sessions[0].plan=generatePlan(p.sessions[0].intake,withDemoRatings(sourceMethods),true);return p;}
it('home card phases and next steps follow the goal session order after reordering',()=>{const p=project(),next={...newSession('Session 2'),intake:{...p.sessions[0].intake,phase:'define' as const}};p.sessions.push(next);p.goals[0].sessionIds=[next.id,p.sessions[0].id];const summary=projectCardSummary({...p,id:crypto.randomUUID(),revision:1,updatedAt:new Date().toISOString()});assert.equal(summary.phase,'define');assert.equal(summary.status,'Intake in progress');assert.match(summary.nextStep,/Session 2/);});
it('home cards distinguish confirmed next sessions from completed projects',()=>{const p=project();p.sessions[0].status='approved';const saved={...p,id:crypto.randomUUID(),revision:1,updatedAt:new Date().toISOString()};assert.equal(projectCardSummary(saved).status,'Session plan confirmed');assert.match(projectCardSummary(saved).latest,/confirmed plan/);p.sessions[0].status='completed';const summary=projectCardSummary(saved);assert.equal(summary.status,'Completed project');assert.match(summary.nextStep,/add a new goal/);assert.equal(summary.completed,1);});
it('legacy plans remain readable as one-session programmes',()=>{const p=project();assert(planSchema.safeParse(p.sessions[0].plan).success);validateProjectChange(p,p,catalogue);});
it('moves preserve every block field and never alter other blocks',()=>{const p=project(),a=p.sessions[0],b={...newSession('Second'),plan:structuredClone(a.plan)};b.plan!.activities=[];const block=a.plan!.activities[1];const moved=moveBlock([a,b],a.id,block.instanceId,b.id,0);assert.deepEqual(moved[1].plan!.activities[0],block);assert.equal(moved[0].plan!.activities.length,a.plan!.activities.length-1);assert.equal(moved[1].status,'draft');assert.throws(()=>moveBlock([{...a,status:'completed'},b],a.id,block.instanceId,b.id,0));});
it('same-session movement handles insertion positions in both directions',()=>{const p=project(),s=p.sessions[0],ids=s.plan!.activities.map(a=>a.instanceId);const moved=moveBlock([s],s.id,ids[0],s.id,ids.length)[0];assert.equal(moved.plan!.activities.at(-1)!.instanceId,ids[0]);assert.deepEqual(moveBlock([moved],s.id,ids[0],s.id,0)[0].plan!.activities.map(a=>a.instanceId),ids);});
it('completed sessions cannot be modified or completed via a generic patch',()=>{const p=project();assert.throws(()=>validateProjectChange(p,{...p,sessions:[{...p.sessions[0],status:'completed'}]},catalogue));const done={...p.sessions[0],status:'completed' as const,completion:{outcomes:'Done',decisions:'',questions:'',completedAt:'now'}};assert.throws(()=>validateProjectChange({...p,sessions:[done]},{...p,sessions:[{...done,title:'Changed'}]},catalogue),/Completed sessions/);});
it('source interview, focus-group, comfort and trend timings cannot be compressed',()=>{for(const [id,stageId,floor] of [['interviews','interview',60],['focus-groups','discuss',90],['comfort-evaluation','evaluate',60],['trend-foresight','scan',120]] as const){const m=catalogue.find(m=>m.id===`index-delft-${id}`)!;const stage=m.stages!.find(s=>s.id===stageId)!;assert(stageMinimum(m,stage)>=floor);const a=fromMethodStages(m).find(a=>a.stageId===stageId)!;assert(activityMinutes(a)>=floor);assert.throws(()=>setActivityTime(a,floor-1));}});
it('staged research requires ordered sessions and warns before confirmation',()=>{const p=project(),m=catalogue.find(m=>m.id==='index-delft-interviews')!,stages=fromMethodStages(m);p.sessions[0].plan!.activities=stages;assert(dependencyIssues(p.sessions).some(s=>s.includes('later session')));const sessions=stages.map((a,i)=>{const s=newSession(`Session ${i+1}`);return {...s,plan:{...p.sessions[0].plan!,intake:s.intake,activities:[a]}};});assert.deepEqual(dependencyIssues(sessions),[]);assert(dependencyIssues(sessions.toReversed()).length>0);});
it('search combines procedure text, phase, mode, difficulty and time',()=>{const m=catalogue.find(m=>m.id==='delft-how-tos')!;assert(matchesMethod(m,{...emptyFilters,search:m.steps[0].title.toLowerCase()}));assert(!matchesMethod(m,{...emptyFilters,phase:'deliver'}));assert(!matchesMethod(m,{...emptyFilters,difficulty:'difficult'}));});

it('moving to an unplanned session preserves the block and creates an editable agenda',()=>{const p=project(),a=p.sessions[0],b=newSession('Next'),block=a.plan!.activities[1];const moved=moveBlock([a,b],a.id,block.instanceId,b.id,0);assert.deepEqual(moved[1].plan!.activities,[block]);assert.deepEqual(moved[1].plan!.intake,b.intake);});
it('later catalogue rating edits do not invalidate unchanged saved blocks',()=>{const p=project();const unrated=catalogue.map(m=>({...m,defaultMinutes:null}));validateProjectChange(p,{...p,name:'Renamed'},unrated);});

it('Sam intake-only drafts import without manufacturing an agenda or mutating local data',()=>{const legacy={intake:{...project().sessions[0].intake,name:'Sam intake',phase:'define'},plan:null,approved:null,demo:true};const before=JSON.stringify(legacy);const imported=importLegacyProject(legacy);assert.equal(imported.name,'Sam intake');assert.equal(imported.sessions[0].plan,null);assert.equal(imported.sessions[0].intake.phase,'define');assert.equal(imported.demo,true);assert.equal(JSON.stringify(legacy),before);});
it('Sam approved drafts keep their exact agenda and approval when imported',()=>{const plan=project().sessions[0].plan!;const imported=importLegacyProject({intake:plan.intake,plan:null,approved:plan});assert.deepEqual(imported.sessions[0].plan,plan);assert.equal(imported.sessions[0].status,'approved');assert.throws(()=>importLegacyProject({intake:{name:''}}));});
it('overruns remain visible in local sessions',()=>{const p=project();p.sessions[0].intake.minutes=10;assert(sessionWarnings(p.sessions[0]).length);});
it('an unrelated goal with incomplete staged work does not block confirming a valid goal',()=>{
 const first=project(),other=newSession('Other goal session'),method=catalogue.find(m=>m.id==='index-delft-interviews')!;
 other.plan={...first.sessions[0].plan!,id:crypto.randomUUID(),intake:other.intake,activities:[fromMethodStages(method)[0]]};
 const previous={...first,sessions:[...first.sessions,other],goals:[...first.goals,{...first.goals[0],id:'other-goal',title:'Unfinished research',sessionIds:[other.id]}]};
 const approveFirst={...previous,sessions:previous.sessions.map((s,index)=>index===0?{...s,status:'approved' as const}:s)};
 assert.doesNotThrow(()=>validateProjectChange(previous,approveFirst,catalogue));
 const approveOther={...previous,sessions:previous.sessions.map(s=>s.id===other.id?{...s,status:'approved' as const}:s)};
 assert.throws(()=>validateProjectChange(previous,approveOther,catalogue),/required stages/);
 const duplicate={...previous,sessions:[previous.sessions[0],{...other,plan:{...other.plan!,activities:[previous.sessions[0].plan!.activities[0]]}}]};
 assert.throws(()=>validateProjectChange(previous,duplicate,catalogue),/more than once/);
});

it('confirmation succeeds after staged dependencies are repaired without changing completed sessions',()=>{
 const p=project(),method=catalogue.find(m=>m.id==='index-delft-interviews')!,stages=fromMethodStages(method);
 const sessions=stages.map((activity,index)=>{const session=newSession(`Research ${index+1}`);return {...session,plan:{...p.sessions[0].plan!,id:crypto.randomUUID(),intake:session.intake,activities:[activity]}};});
 sessions[0]={...sessions[0],status:'completed',completion:{outcomes:'Preparation retained',decisions:'',questions:'',completedAt:'earlier'}};
 const previous={...p,sessions,goals:[{...p.goals[0],sessionIds:sessions.map(s=>s.id)}]};
 const approved={...previous,sessions:sessions.map((s,index)=>index===1?{...s,status:'approved' as const}:s)};
 assert.doesNotThrow(()=>validateProjectChange(previous,approved,catalogue));assert.deepEqual(approved.sessions[0],previous.sessions[0]);
 const invalid={...approved,sessions:[sessions[1],sessions[0],...sessions.slice(2)],goals:[{...approved.goals[0],sessionIds:[sessions[1].id,sessions[0].id,...sessions.slice(2).map(s=>s.id)]}]};
 invalid.sessions=invalid.sessions.map(s=>s.id===sessions[1].id?{...s,status:'approved' as const}:s);
 assert.throws(()=>validateProjectChange(previous,invalid,catalogue),/preceding method stage/);
});
