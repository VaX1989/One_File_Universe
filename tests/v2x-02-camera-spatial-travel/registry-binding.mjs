import assert from 'node:assert/strict';
import {load} from '../v1/integration/runtime-helper.mjs';
const {O,plan}=load({extraComponents:['v2x02.camera.continuous-travel']});
const id='v2x02.interaction.continuous-travel',registry=O.pxProduct.registry,snapshot=registry.snapshot(),V=O.v2x02ContinuousTravel,S=O.v1xSemanticDistance;
assert(snapshot.order.includes(id),'provider descriptor must be admitted into the sealed graph');
assert(snapshot.bound.includes(id),'shipping continuous-travel provider must bind before registry seal');
assert(plan.some(c=>c.id==='v2x02.camera.continuous-travel'));
assert(plan.some(c=>c.id==='v2x.frontier.providers.v2x02-camera-spatial-travel'));
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
assert.throws(()=>V.planIntent({currentLogDistanceM:7,currentSemanticScale:{toString(){throw new Error('must not coerce');}},referenceRadiusM:6371000,intent:{kind:'distance',deltaLog10M:.01}}),/currentSemanticScale must be a string/);
assert.throws(()=>V.planIntent({currentLogDistanceM:7,currentSemanticScale:'not-a-band',referenceRadiusM:6371000,intent:{kind:'distance',deltaLog10M:.01}}),/unsupported Wave IV semantic scale/);
console.log(JSON.stringify({status:'PASS',oracle:'v2x02-registry-binding-oracle-3',provider:id,version:d.version,admitted:true,bound:true,semanticDistanceDelegated:true,rawWheelParity:true,inputBounded:true,semanticBandFailClosed:true,selectionInvariant:true,canonicalMutation:false,historyMutation:false,authority:'PRESENTATION_ONLY'}));
