// Timers persist elapsed time, never an active wall-clock timestamp.
export function recordedSessionSeconds(activities:{id:string;seconds:number}[], read:(id:string)=>unknown){
 return activities.reduce((total,activity)=>{
  try{return total+createActivityTimer(activity.seconds,read(activity.id)).snapshot().elapsed;}catch{return total;}
 },0);
}
export function createActivityTimer(totalSeconds:number,saved:unknown,now:()=>number=Date.now){
 const total=Math.max(0,totalSeconds),raw=(saved&&typeof saved==='object'?'elapsed' in saved?saved.elapsed:0:0);
 let elapsed=Math.min(total,Math.max(0,typeof raw==='number'&&Number.isFinite(raw)?raw:0)),since:number|null=null;
 function checkpoint(pause=false){const at=now();if(since!==null)elapsed=Math.min(total,elapsed+Math.max(0,at-since)/1000);since=pause||elapsed>=total||since===null?null:at;return snapshot();}
 function snapshot(){return {elapsed,remaining:Math.max(0,total-elapsed),running:since!==null,expired:elapsed>=total};}
 return {snapshot,checkpoint,pause:()=>checkpoint(true),resume:()=>{if(elapsed<total)since=now();return snapshot();},reset:()=>{elapsed=0;since=null;return snapshot();},saved:()=>({elapsed,since:null})};
}
export function restoreRunnerView(saved:unknown,activityIds:string[],fallback=-1){
 const value=saved&&typeof saved==='object'?saved as {view?:unknown;visited?:unknown;completedAt?:unknown}:{};
 const stage=value.view==='end'?activityIds.length:value.view==='start'?-1:typeof value.view==='string'?activityIds.indexOf(value.view):fallback;
 return {stage,visited:Array.isArray(value.visited)?value.visited.filter((v):v is string=>typeof v==='string'&&activityIds.includes(v)):[],completedAt:typeof value.completedAt==='string'?value.completedAt:''};
}
