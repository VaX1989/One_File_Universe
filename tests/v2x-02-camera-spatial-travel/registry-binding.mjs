import assert from 'node:assert/strict';
import fs from 'node:fs';
import {load} from '../v1/integration/runtime-helper.mjs';
const {O,plan}=load({extraComponents:['v2x02.camera.continuous-travel']});
const id='v2x02.interaction.continuous-travel',registry=O.pxProduct.registry,snapshot=registry.snapshot(),V=O.v2x02ContinuousTravel,S=O.v1xSemanticDistance;
assert(snapshot.order.includes(id),'provider descriptor must be admitted into the sealed graph');
assert(snapshot.bound.includes(id),'shipping continuous-travel provider must bind before registry seal');
assert(plan.some(c=>c.id==='v2x02.camera.continuous-travel'));
assert(plan.some(c=>c.id==='px.providers.v2x02-camera-spatial-travel'));
const componentManifest=JSON.parse(fs.readFileSync('config/components/v2x-02-camera-spatial-travel.json','utf8'));
const livingBinding=componentManifest.components.find(c=>c.id==='v2x02.camera.living-binding');
assert(livingBinding,'V2X-02 shipping manifest must expose the convergence-owned Living binding');
assert.equal(livingBinding.owner,'product','Living binding must remain convergence/product owned');
assert(livingBinding.dependencies.includes('v2x02.camera.continuous-travel'),'Living binding must consume the lane controller');
assert.equal(livingBinding.source,'src/rendering/v2x-convergence/living-camera-authority.js');
const livingSource=fs.readFileSync(livingBinding.source,'utf8');
assert(livingSource.includes('V=O.v2x02ContinuousTravel'),'Living binding must load the V2X-02 controller rather than a legacy fallback');
assert(livingSource.includes('shadowNavigationState:false'),'Living binding must explicitly expose absence of shadow navigation state');
assert(livingSource.includes('controller.queueLook')&&livingSource.includes('controller.distance'),'Living pointer look and distance synchronization must traverse the V2X-02 controller');
const d=registry.descriptor(id),captured=O.pxProduct.captured();
assert.equal(d.version,'2.1.0');assert.equal(V.VERSION,'ofu-v2x02-continuous-travel-2.1');assert.equal(V.PROVIDER_ID,id);assert.equal(V.AUTHORITY,'PRESENTATION_ONLY');
function invoke(intent,extra={}){
 const request={contract:O.pxContracts.VERSION,provider:id,operation:'TRAVEL',selection:captured.selection,fidelity:d.fidelity,budget:d.budget,payload:{currentLogDistanceM:7,currentSemanticScale:'orbit',referenceRadiusM:6371000,intent,...extra}};
 return registry.invoke(id,request);
}
const pixel=invoke({kind:'wheel',deltaY:40,deltaMode:0}),line=invoke({kind:'wheel',deltaY:1,deltaMode:1});
for(const result of [pixel,line]){assert.equal(result.provider,id);assert.equal(result.version,'2.1.0');assert.deepEqual(result.selection,captured.selection);assert.equal(result.value.distanceAuthorityKey,'logDistanceM');assert.equal(result.value.semanticDistanceContract,S.VERSION);assert(result.value.toLogDistanceM>result.value.fromLogDistanceM);assert.equal(result.value.canonicalMutation,false);assert.equal(result.value.selectionMutation,false);assert.equal(result.value.historyMutation,false);assert.equal(result.value.cameraPathIsPhysicalTrajectory,false);}
assert.equal(pixel.value.appliedDeltaLog10M,line.value.appliedDeltaLog10M,'line and pixel wheel forms must converge to the same semantic intent');
const bounded=invoke({kind:'wheel',deltaY:1e9,deltaMode:2},{pagePixels:1e9,maxInputLogDelta:.1});assert.equal(bounded.value.inputClamped,true);assert(Math.abs(bounded.value.appliedDeltaLog10M)<=.100000000000001);assert.equal(V.normalizedWheelPixels(1e9,{deltaMode:2,pagePixels:1e9}),300);
const clampEdge=V.planIntent({currentLogDistanceM:29.99,minLogDistanceM:-18,maxLogDistanceM:30,currentSemanticScale:'galaxy',referenceRadiusM:6371000,maxInputLogDelta:.9,intent:{kind:'distance',deltaLog10M:.9}});assert.equal(clampEdge.toLogDistanceM,30);assert(clampEdge.appliedDeltaLog10M<=.010000000000001,'distance authority clamp must never overshoot the declared max');
assert.throws(()=>V.planIntent({currentLogDistanceM:7,currentSemanticScale:{toString(){throw new Error('must not coerce');}},referenceRadiusM:6371000,intent:{kind:'distance',deltaLog10M:.01}}),/currentSemanticScale must be a string/);
assert.throws(()=>V.planIntent({currentLogDistanceM:7,currentSemanticScale:'not-a-band',referenceRadiusM:6371000,intent:{kind:'distance',deltaLog10M:.01}}),/unsupported Wave IV semantic scale/);
console.log(JSON.stringify({status:'PASS',oracle:'v2x02-registry-binding-oracle-4',provider:id,version:d.version,admitted:true,bound:true,semanticDistanceDelegated:true,rawWheelParity:true,inputBounded:true,semanticBandFailClosed:true,selectionInvariant:true,canonicalMutation:false,historyMutation:false,livingBinding:true,shadowNavigationRejected:true,legacyFallbackKiller:true,authority:'PRESENTATION_ONLY'}));
