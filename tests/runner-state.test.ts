import {it} from 'node:test';
import assert from 'node:assert/strict';
import {createActivityTimer,recordedSessionSeconds,restoreRunnerView} from '../lib/runner-state';
it('time accrues only while active, pauses on departure, and resumes remaining time',()=>{let now=1000;const timer=createActivityTimer(60,null,()=>now);timer.resume();now+=12000;assert.equal(timer.pause().remaining,48);now+=900000;assert.equal(timer.checkpoint().remaining,48);assert.equal(timer.snapshot().running,false);timer.resume();now+=3000;assert.equal(timer.checkpoint().remaining,45);});
it('reload ignores stale running timestamps and uses elapsed checkpoints',()=>{const timer=createActivityTimer(60,{elapsed:12,since:1},()=>999999);assert.equal(timer.resume().remaining,48);assert.deepEqual(timer.saved(),{elapsed:12,since:null});});
it('expiry clamps to zero and cannot resume or accrue overtime',()=>{let now=0;const timer=createActivityTimer(60,null,()=>now);timer.resume();now=90000;assert.deepEqual(timer.checkpoint(),{elapsed:60,remaining:0,running:false,expired:true});now+=10000;assert.equal(timer.resume().running,false);assert.equal(timer.checkpoint().remaining,0);const restored=createActivityTimer(60,timer.saved(),()=>now);assert.equal(restored.resume().running,false);});
it('reset restores full time while remaining paused',()=>{let now=0;const timer=createActivityTimer(60,null,()=>now);timer.resume();now=20000;timer.pause();assert.deepEqual(timer.reset(),{elapsed:0,remaining:60,running:false,expired:false});});
it('checkpoints keep counting while hidden and exclude time after pagehide pause',()=>{let now=0;const timer=createActivityTimer(60,null,()=>now);timer.resume();now=30000;assert.equal(timer.checkpoint().remaining,30);timer.pause();now=600000;assert.equal(createActivityTimer(60,timer.saved(),()=>now).resume().remaining,30);});
it('ending overview restores without manufacturing completion or visited activities',()=>{const state=restoreRunnerView({view:'end',visited:['a']},['a','b']);assert.deepEqual(state,{stage:2,visited:['a'],completedAt:''});});
it('view follows stable activity IDs after reorder and discards removed visited IDs',()=>{assert.deepEqual(restoreRunnerView({view:'a',visited:['a','removed']},['b','a']),{stage:1,visited:['a'],completedAt:''});assert.equal(restoreRunnerView({view:'removed'},['a']).stage,-1);});

it('session elapsed time uses saved activity clocks and stable IDs rather than positions',()=>{
 const saved:Record<string,unknown>={a:{elapsed:12,since:1},b:{elapsed:30},removed:{elapsed:500}};
 const read=(id:string)=>saved[id];
 const activities=[{id:'a',seconds:60},{id:'b',seconds:60},{id:'new',seconds:60}];
 assert.equal(recordedSessionSeconds(activities,read),42);
 assert.equal(recordedSessionSeconds([...activities].reverse(),read),42);
 saved.a={elapsed:0};assert.equal(recordedSessionSeconds(activities,read),30);
});
it('session elapsed time tolerates missing and corrupt clocks and clamps expired steps',()=>{
 assert.equal(recordedSessionSeconds([{id:'a',seconds:60},{id:'b',seconds:60},{id:'c',seconds:60}],id=>{if(id==='a')return {elapsed:90};if(id==='b')throw new Error('Bad saved clock');return {elapsed:-1};}),60);
});
