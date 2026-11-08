import type { Phase } from '@/lib/types';
import { phaseLabels } from '@/lib/types';

const segments = [
 {phase:'discover',label:'Discover',path:'M4 75 105 4 105 146Z'},
 {phase:'define',label:'Define',path:'M105 4 206 75 105 146Z'},
 {phase:'develop',label:'Develop',path:'M212 75 313 4 313 146Z'},
 {phase:'deliver',label:'Deliver',path:'M313 4 414 75 313 146Z'},
] as const;

export function PhaseMap({phase}:{phase:Phase}) {
 return <div className="process-map" role="img" aria-label={`Design process. Selected phase: ${phaseLabels[phase]}.`}>
  {segments.map(segment=><span key={segment.phase} className={phase===segment.phase?'phase-active-label':undefined}>{segment.label}</span>)}
  <svg viewBox="0 0 420 174" aria-hidden="true">
   {segments.map(segment=><path key={segment.phase} data-phase={segment.phase} className={phase===segment.phase?'phase-active':undefined} d={segment.path}/>)}
   {phase==='iterate'?<path className="phase-iteration" d="M396 155Q396 164 385 164H30Q20 164 20 155M13 158 20 151 27 158"/>:null}
  </svg>
  {phase==='iterate'?<span className="iteration-label">Later iteration · revisit phases as needed</span>:null}
 </div>;
}
