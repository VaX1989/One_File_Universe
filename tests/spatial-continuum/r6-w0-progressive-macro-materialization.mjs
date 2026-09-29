import assert from 'node:assert/strict';
import { createProgressiveMacroMaterializer } from '../../src/experiments/spatial-continuum/macro-materialization.js';

let clock=0;
const make=(ids,priorities={})=>ids.map(id=>Object.freeze({id,priority:priorities[id]||0}));
const released=[];
const materializer=createProgressiveMacroMaterializer({maxResident:4,maxBuildPerSlice:2,now:()=>clock,disposeValue:(value,reason)=>released.push(`${value.id}:${reason}`)});

// Cold entry retains no blank intermediate commit: active stays valid until the target is complete.
materializer.begin(make(['a','b','c','d']),{priorityOf:item=>item.priority});
assert.deepEqual(materializer.active,[]);
clock+=1;let step=materializer.runSlice({build:item=>Object.freeze({...item,built:true})});
assert.equal(step.status,'PENDING');
assert.deepEqual(materializer.active,[]);
clock+=1;step=materializer.runSlice({build:item=>Object.freeze({...item,built:true})});
assert.equal(step.status,'COMMITTED');
assert.deepEqual(materializer.active.map(item=>item.id),['a','b','c','d']);

// Repeated movement reuses overlap, releases evicted resources and caps duplicate transition residency.
materializer.begin(make(['b','c','d','e']));
let state=materializer.snapshot();
assert.equal(state.pending.remaining,1);
assert.equal(state.active.length,4);
step=materializer.runSlice({build:item=>Object.freeze({...item,built:true})});
assert.equal(step.status,'COMMITTED');
assert.deepEqual(materializer.active.map(item=>item.id),['b','c','d','e']);
assert.ok(released.includes('a:EVICTED'),'evicted built values must be explicitly released');
assert.equal(materializer.snapshot().metrics.maxResident,4);

// Rapid reverse supersedes pending work atomically and preserves the previous committed context.
materializer.begin(make(['c','d','e','f']));
step=materializer.runSlice({build:item=>Object.freeze({...item,built:true}),budget:1});
assert.equal(step.status,'COMMITTED');
materializer.begin(make(['a','b','c','d']));
assert.deepEqual(materializer.active.map(item=>item.id),['c','d','e','f']);
materializer.begin(make(['d','e','f','g']));
state=materializer.snapshot();
assert.equal(state.metrics.cancelled>=1,true);
assert.deepEqual(materializer.active.map(item=>item.id),['c','d','e','f']);
step=materializer.runSlice({build:item=>Object.freeze({...item,built:true})});
assert.equal(step.status,'COMMITTED');
assert.deepEqual(materializer.active.map(item=>item.id),['d','e','f','g']);

// A build that is superseded re-entrantly must release the just-built stale value.
const staleReleased=[];
const stale=createProgressiveMacroMaterializer({maxResident:2,maxBuildPerSlice:1,disposeValue:(value,reason)=>staleReleased.push(`${value.id}:${reason}`)});
stale.begin(make(['old']));
const staleStep=stale.runSlice({build:item=>{stale.begin(make(['new']));return Object.freeze({...item,built:true});}});
assert.equal(staleStep.status,'STALE');
assert.deepEqual(staleReleased,['old:STALE']);
while(stale.hasPending)stale.runSlice({build:item=>Object.freeze({...item,built:true})});
assert.deepEqual(stale.active.map(item=>item.id),['new']);

// Priority is deterministic and relevance-first under a resident cap.
const prioritized=createProgressiveMacroMaterializer({maxResident:3,maxBuildPerSlice:1,now:()=>++clock});
prioritized.begin(make(['far','target','travel','drop'],{target:100,travel:50,far:1,drop:-5}),{priorityOf:item=>item.priority});
while(prioritized.hasPending)prioritized.runSlice({build:item=>Object.freeze({...item,built:true})});
assert.deepEqual(prioritized.active.map(item=>item.id),['target','travel','far']);

// Long traversal remains bounded and every replaced resident is released.
for(let index=0;index<32;index++){
  const ids=[index,index+1,index+2,index+3].map(value=>'cell-'+value);
  materializer.begin(make(ids));
  while(materializer.hasPending)materializer.runSlice({build:item=>Object.freeze({...item,built:true})});
  assert.equal(materializer.active.length<=4,true);
}
const beforeDispose=materializer.snapshot();
assert.equal(beforeDispose.metrics.evicted>0,true);
const releaseCountBeforeDispose=released.length;
const disposal=materializer.dispose({reason:'TEST_END'});
assert.equal(disposal.removed,4);
assert.equal(disposal.disposed,4);
assert.equal(released.length-releaseCountBeforeDispose,4);
assert.deepEqual(materializer.active,[]);
assert.equal(materializer.hasPending,false);
assert.equal(materializer.snapshot().metrics.disposedValues,released.length);

console.log(JSON.stringify({
  contract:'ofu-r6-w0-progressive-macro-materialization-test-2',
  status:'PASS',
  coldSlices:2,
  maxResident:beforeDispose.metrics.maxResident,
  cancellations:beforeDispose.metrics.cancelled,
  commits:beforeDispose.metrics.commits,
  evictions:beforeDispose.metrics.evicted,
  releasedValues:released.length,
  staleReleaseVerified:true,
  finalDisposed:disposal.disposed,
},null,2));
