import assert from 'node:assert/strict';
import {O} from '../v1x-01-camera-scale-frames/support.mjs';
await import('../../src/rendering/v1/transition-runtime.js');
await import('../../src/v2x-02-camera-spatial-travel/continuous-travel.js');

const calls={render:0,rotate:[],travel:[]};
O.v1LivingRenderer=Object.freeze({
 VERSION:'fake-living-renderer',
 create(){
  return Object.freeze({
   VERSION:'fake-instance',
   async render(s){calls.render++;calls.last=s;},
   rotate(dx,dy){calls.rotate.push([dx,dy]);},
   setTravelDistance(distance,band){calls.travel.push([distance,band]);},
   activateAt(){return false;},keyboard(){return false;},resize(){},sampleColor(){return [0,0,0];},dispose(){},
   state(){return {version:'fake-instance',readyRevision:calls.last?.revision??-1,authority:'PRESENTATION_ONLY',metrics:{fallbackFrames:calls.rotate.length}};}
  });
 }
});
await import('../../src/rendering/v2x-convergence/living-camera-authority.js');
assert.equal(O.v1LivingRenderer.__v2x02CameraComposed,true);
const r=O.v1LivingRenderer.create({},{}),s={revision:1,stage:'SYSTEM',semanticScale:'system',continuousDistanceRadii:500,node:{entityId:'universe:test'},system:{entityId:'system:test'},body:null};
await r.render(s);
let state=r.state();
assert.equal(calls.render,1);
assert.deepEqual(calls.travel,[[500,'system']],'legacy renderer distance cache must be derived only during render');
assert.equal(state.shadowNavigationState,false);
assert.equal(state.distanceDerivedFromLivingRuntime,true);
assert.equal(state.cameraAuthority,O.v1xCameraAuthority.VERSION);
assert.equal(state.travelController,O.v2x02ContinuousTravel.VERSION);
assert.equal(state.cameraAuthorityState.semanticScale,'system');
assert.equal(state.cameraAuthorityState.selectionToken,'system:test');
const beforeCommands=state.cameraAuthorityState.commandCount;
const travelCallsBefore=calls.travel.length;
r.setTravelDistance(123456,'human');
assert.equal(calls.travel.length,travelCallsBefore,'public legacy travel setter must not mutate renderer travel cache');
r.rotate(20,-10);
state=r.state();
assert.equal(state.lookCommands,1);
assert.ok(state.cameraAuthorityState.commandCount>beforeCommands,'look must mutate the shared camera authority');
assert.equal(calls.rotate.length,1,'legacy projection cache receives one derived synchronization delta');
assert.ok(Math.abs(calls.rotate[0][0]-20)<1e-8);
assert.ok(Math.abs(calls.rotate[0][1]+10)<1e-8);
assert.equal(state.shadowNavigationState,false);
assert.equal(calls.render,1,'fake renderer proves wrapper does not create a second product render loop');
r.dispose();
console.log(JSON.stringify({schema:'ofu-v2x02-living-camera-authority-witness-1',status:'PASS',cameraAuthority:state.cameraAuthority,travelController:state.travelController,shadowNavigationState:false,distanceDerivedFromLivingRuntime:true,lookCommands:state.lookCommands}));
