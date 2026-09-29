import assert from 'node:assert/strict';
import { createDiscoveryScheduler } from '../../src/experiments/spatial-continuum/discovery-scheduler.js';

const population=Array.from({length:257},(_value,index)=>Object.freeze({id:`entity-${index}`,address:index}));
const discoverer=({cursor,limit,maxProbes})=>{const items=[];let probes=0,index=cursor;for(;index<population.length&&probes<maxProbes&&items.length<limit;index++){probes++;if((index*17+5)%11<3)items.push(population[index])}return Object.freeze({items,nextCursor:index<population.length?index:null,probes})};
const request=(scheduler,key='cell:0')=>scheduler.request({key,intentKey:'macro-camera',cursor:0,limit:12,maxProbes:257,discover:discoverer}).promise;

const fine=createDiscoveryScheduler({probesPerSlice:3}),coarse=createDiscoveryScheduler({probesPerSlice:29});
const [fineResult,coarseResult]=await Promise.all([request(fine),request(coarse)]);
assert.equal(fineResult.status,'COMPLETED');assert.equal(coarseResult.status,'COMPLETED');assert.deepEqual(fineResult.items,coarseResult.items,'slice size must not change deterministic identity or order');assert.ok(fineResult.slices>coarseResult.slices);

let releases=[];const controlled=createDiscoveryScheduler({maxPending:2,probesPerSlice:4,yieldControl:()=>new Promise(resolve=>releases.push(resolve))});
const old=controlled.request({key:'cell:old',intentKey:'macro-camera',limit:8,maxProbes:257,discover:discoverer}),next=controlled.request({key:'cell:new',intentKey:'macro-camera',limit:8,maxProbes:257,discover:discoverer});
assert.equal((await old.promise).status,'CANCELLED','new intent must supersede queued work before it can commit');
while(controlled.snapshot().size){const resolve=releases.shift();if(resolve)resolve();await new Promise(resolve=>setImmediate(resolve))}
const nextResult=await next.promise,revisitScheduler=createDiscoveryScheduler({probesPerSlice:7}),revisited=await revisitScheduler.request({key:'cell:new',intentKey:'macro-camera',limit:8,maxProbes:257,discover:discoverer}).promise;assert.equal(nextResult.status,'COMPLETED');assert.deepEqual(revisited.items,nextResult.items,'cancellation history must not alter a revisited address');revisitScheduler.dispose();

const aborter=new AbortController(),aborted=createDiscoveryScheduler({probesPerSlice:2}).request({key:'cell:abort',intentKey:'prefetch:abort',limit:12,maxProbes:257,discover:discoverer,signal:aborter.signal});aborter.abort();assert.equal((await aborted.promise).status,'CANCELLED');

const saturated=createDiscoveryScheduler({maxPending:2,probesPerSlice:1,yieldControl:()=>new Promise(()=>{})}),low=saturated.request({key:'low',intentKey:'low',priority:0,discover:discoverer}),medium=saturated.request({key:'medium',intentKey:'medium',priority:1,discover:discoverer}),high=saturated.request({key:'high',intentKey:'high',priority:2,discover:discoverer});
assert.equal((await low.promise).status,'CANCELLED');assert.equal(saturated.snapshot().size,2);assert.equal(saturated.snapshot().bounded,true);medium.cancel();high.cancel();saturated.dispose();

for(const scheduler of [fine,coarse,controlled])scheduler.dispose();
console.log(JSON.stringify({status:'PASS',suite:'spatial-continuum-r6-discovery-scheduler',deterministicItems:fineResult.items.map(item=>item.id),fineSlices:fineResult.slices,coarseSlices:coarseResult.slices,supersession:'PASS',abort:'PASS',boundedQueue:'PASS'},null,2));
