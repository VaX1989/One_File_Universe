import assert from 'node:assert/strict';
import { createMaterializationCache } from '../../src/experiments/spatial-continuum/materialization-cache.js';

const disposed=[];
const cache=createMaterializationCache({maxEntries:2,onDispose:(value,context)=>{disposed.push({...context,id:value.id});return value.dispose()}});
const context=id=>({id,dispose:()=>({disposed:true,resources:1,sessions:id==='active'?1:0,representations:2})});
cache.materialize('world:active',()=>context('active'),{kind:'WORLD',pin:true});
cache.materialize('world:old',()=>context('old'),{kind:'WORLD'});
cache.setPinned(['world:active']);
cache.materialize('world:new',()=>context('new'),{kind:'WORLD'});

assert.equal(cache.has('world:active'),true,'the active world must survive cache pressure');
assert.equal(cache.has('world:old'),false,'the least-recent inactive world must be evicted');
assert.equal(disposed.length,1);
assert.deepEqual(disposed[0],{key:'world:old',kind:'WORLD',reason:'LRU_EVICTION',id:'old'});
let snapshot=cache.snapshot();
assert.deepEqual(snapshot.pinned,['world:active']);
assert.equal(snapshot.metrics.evictions,1);
assert.equal(snapshot.metrics.disposalCallbacks,1);
assert.equal(snapshot.metrics.disposedResources,1);
assert.equal(snapshot.metrics.disposedSessions,0);
assert.equal(snapshot.metrics.releasedRepresentations,2);
assert.equal(snapshot.disposalHistory[0].reason,'LRU_EVICTION');

cache.clear();
snapshot=cache.snapshot();
assert.equal(snapshot.size,0);
assert.equal(snapshot.metrics.disposals,3);
assert.equal(snapshot.metrics.disposalCallbacks,3);
assert.equal(snapshot.metrics.disposedSessions,1);
assert.equal(snapshot.metrics.releasedRepresentations,6);

console.log(JSON.stringify({status:'PASS',suite:'spatial-continuum-r5-foundation',cache:snapshot.metrics},null,2));
