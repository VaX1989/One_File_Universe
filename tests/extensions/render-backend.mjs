import assert from 'node:assert/strict';import {load} from './helpers.mjs';
const O=load(['src/extensions/render-backend.js']),R=O.pxRenderBackend;let cases=0,deleted=[];
const owner=R.resourceOwner({maxResources:3,maxBytes:30}),spec=id=>({id,bytes:10,create:()=>({id}),destroy:r=>deleted.push(r.id)});
owner.allocate([spec('a'),spec('b')]);assert.equal(owner.snapshot().trackedBytes,20);cases++;
assert.throws(()=>owner.allocate([spec('c'),spec('d')]),e=>e.code==='BUDGET');assert.equal(owner.snapshot().created,2);cases++;
owner.release('b');assert.throws(()=>owner.allocate([spec('c'),{...spec('d'),create:()=>null}]),e=>e.code==='ALLOCATION');assert.equal(owner.snapshot().liveResources,1);assert(owner.snapshot().accountingExact);assert(deleted.includes('c'));cases++;
owner.lose();assert.equal(owner.snapshot().invalidated,1);assert.throws(()=>owner.allocate([spec('e')]),e=>e.code==='CONTEXT_LOST');cases++;
owner.restore();assert.equal(owner.snapshot().generation,2);owner.allocate([spec('e')]);owner.dispose();assert(owner.snapshot().accountingExact);assert.equal(owner.snapshot().liveResources,0);cases++;
// Cleanup failures keep a tracked handle; neither ordinary release nor rollback
// may invent a successful deletion or release budget for an orphan allocation.
let failDestroy=true;
const uncertain=R.resourceOwner({maxResources:2,maxBytes:20}),unstable={...spec('held'),destroy(){if(failDestroy)throw new Error('delete failed');}};
uncertain.allocate([unstable]);assert.throws(()=>uncertain.release('held'),/delete failed/);assert.equal(uncertain.snapshot().liveResources,1);assert.equal(uncertain.snapshot().destroyed,0);assert(uncertain.snapshot().accountingExact);cases++;
assert.throws(()=>uncertain.allocate([spec('x'),spec('y')]),e=>e.code==='BUDGET');cases++;
assert.throws(()=>uncertain.dispose(),/delete failed/);assert.equal(uncertain.snapshot().disposed,true);assert.throws(()=>uncertain.allocate([spec('x')]),e=>e.code==='ALLOCATION');cases++;
failDestroy=false;uncertain.release('held');uncertain.dispose();assert.equal(uncertain.snapshot().liveResources,0);assert.equal(uncertain.snapshot().destroyed,1);assert.throws(()=>uncertain.restore(),e=>e.code==='CONTEXT');cases++;
failDestroy=true;const rollback=R.resourceOwner({maxResources:2,maxBytes:20});assert.throws(()=>rollback.allocate([unstable,{...spec('null'),create:()=>null}]),e=>e.code==='ALLOCATION');assert.equal(rollback.snapshot().liveResources,1);assert.equal(rollback.snapshot().trackedBytes,10);assert.equal(rollback.snapshot().cleanupFailures,1);assert(rollback.snapshot().accountingExact);rollback.lose();assert.equal(rollback.snapshot().invalidated,1);assert(rollback.snapshot().accountingExact);cases++;
const loss=R.resourceOwner({maxResources:2,maxBytes:20});assert.throws(()=>loss.allocate([{...spec('during-loss'),create(){loss.lose();return {};}}]),e=>e.code==='CONTEXT_LOST');assert.equal(loss.snapshot().invalidated,1);assert.equal(loss.snapshot().liveResources,0);assert(loss.snapshot().accountingExact);cases++;
const d={id:'test.globe',pass:'globe',backend:'webgl2',authority:'PRESENTATION_ONLY',maxMeshes:2,maxBytes:100,optional:false};
R.register(d,{render:()=>({backend:'webgl2'}),snapshot:()=>({gpu:{liveMeshes:1,liveTrackedBytes:30,lifecycleAccountingExact:true}}),dispose:()=>({disposed:true})});assert.throws(()=>R.register(d,{}),e=>e.code==='COLLISION');cases++;
R.seal();assert.equal(R.render('globe',{}, {active:new Map(),provider:{planetId:'a'}},{},{requireStrict:true}).backend,'webgl2');cases++;
assert.throws(()=>R.render('globe',{}, {active:new Map([['a',1],['b',1],['c',1]])},{}),e=>e.code==='BUDGET');cases++;
assert.throws(()=>R.register({...d,id:'other'},{}),e=>e.code==='REGISTRY_SEALED');cases++;
assert.equal(R.capabilities().webgpuImplemented,false);cases++;
console.log(JSON.stringify({status:'PASS',suite:'px-render-backend',cases,measurement:'SYNTHETIC_ALLOCATION_FAILURE_ORACLES_NOT_GPU_MEASUREMENT'}));
