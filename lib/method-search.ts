import type { Method } from './types';
export type MethodFilters={search:string;phase:string;category:string;difficulty:string;fits:boolean};
export const emptyFilters:MethodFilters={search:'',phase:'',category:'',difficulty:'',fits:false};
export function matchesMethod(m:Method,f:MethodFilters,remaining=Infinity){const text=[m.name,m.takeaway,m.input,...m.steps.flatMap(s=>[s.title,s.summary,s.detail])].join(' ').toLowerCase();return (!f.search||text.includes(f.search.trim().toLowerCase()))&&(!f.phase||m.phases.includes(f.phase as Method['phases'][number]))&&(!f.category||m.category===f.category)&&(!f.difficulty||m.difficulty===f.difficulty)&&(!f.fits||(m.defaultMinutes!==null&&m.defaultMinutes<=remaining));}
export const libraryPhases=[['discover','Discover · research'],['define','Define · analysis and framing'],['develop','Develop · ideation and prototyping'],['deliver','Deliver · evaluation and refinement'],['iterate','Iteration']] as const;
