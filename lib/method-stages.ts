import type { Method, MethodStage } from './types';
// Source timing guidance from the recovered Delft records. Other values are facilitator estimates.
const sourceFloors:Record<string,Record<string,number>>={
 'index-delft-interviews':{interview:60},
 'index-delft-focus-groups':{discuss:90},
 'index-delft-comfort-evaluation':{evaluate:60},
 'index-delft-trend-foresight':{scan:120},
};
export function stageDefault(m:Method,s:MethodStage){return Math.max(s.stepIndices.length,Math.ceil((m.defaultMinutes??0)*s.stepIndices.length/m.steps.length),sourceFloors[m.id]?.[s.id]??0);}
export function stageMinimum(m:Method,s:MethodStage){return Math.max(s.stepIndices.length,Math.ceil(stageDefault(m,s)*0.6),sourceFloors[m.id]?.[s.id]??0);}
