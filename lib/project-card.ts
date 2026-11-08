import type {Project} from './projects';
import {nextSessionId} from './programme';

export function projectCardSummary(project:Project){
 const ordered=project.goals.flatMap(goal=>goal.sessionIds.map(id=>project.sessions.find(session=>session.id===id)).filter(session=>!!session));
 const sessions=ordered.length?ordered:project.sessions;
 const next=sessions.find(session=>session.id===nextSessionId(project))??sessions.find(session=>session.status!=='completed');
 const current=next??sessions.at(-1),completed=sessions.filter(session=>session.status==='completed').length;
 const complete=sessions.length>0&&completed===sessions.length;
 const status=complete?'Completed project':next?.status==='approved'?'Session plan confirmed':next?.plan?'Planning in progress':'Intake in progress';
 const latest=complete?`All ${sessions.length} sessions are completed.`:next?.status==='approved'?`${next.title} has a confirmed plan.`:next?.plan?`${next.title} has a draft agenda.`:'Your project brief is saved.';
 const nextStep=complete?'Open the project to review your work or add a new goal.':!next?.plan?`Create a plan for ${next?.title??'the next session'}.`:next.status==='approved'?`Open ${next.title} and start when your team is ready.`:`Review the methods and timing for ${next.title}, then confirm the plan.`;
 return{phase:current?.intake.phase,status,latest,nextStep,completed,total:sessions.length};
}
