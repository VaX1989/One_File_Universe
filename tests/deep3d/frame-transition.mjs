import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const sandbox={console,TextEncoder,TextDecoder,Uint8Array,Float32Array,Float64Array,ArrayBuffer,Math};sandbox.globalThis=sandbox;vm.createContext(sandbox);
for(const file of ['src/kernel/sha256.js','src/v1x-01-camera-scale-frames/reference-frames.js','src/rendering/deep3d/spatial-address.js','src/rendering/deep3d/frame-transition.js'])vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
const F=sandbox.OFU.v1xReferenceFrames,D=sandbox.OFU.deep3dFrameTransition;
const graph=F.createReferenceFrameGraph([
 {id:'galaxy',parentId:null,metersPerUnit:1e20},
 {id:'system',parentId:'galaxy',metersPerUnit:1e9,originInParent:[0,0,0],rotationToParent:F.qAxisAngle([0,1,0],0.03125)},
 {id:'planet',parentId:'system',metersPerUnit:1e6,originInParent:[1024,-512,256],rotationToParent:F.qAxisAngle([1,0,0],-0.015625)},
 {id:'surface',parentId:'planet',metersPerUnit:1,originInParent:[0.5,-0.25,0.125],rotationToParent:F.qAxisAngle([0,0,1],0.0078125)},
 {id:'human',parentId:'surface',metersPerUnit:0.01,originInParent:[128,-64,32],rotationToParent:F.qAxisAngle([1,1,0],0.00390625)}
]);
const manager=D.createManager({frameGraph:graph});
const original={frameId:'system',position:[0.125,-0.5,1.25],orientation:F.qAxisAngle([0.2,1,-0.3],0.45),selectionToken:'entity:system:alpha',logDistanceM:11.25,semanticScale:'system',commandCount:17};
const witness=manager.continuityWitness(original,'planet',{entityId:'entity:system:alpha',targetId:'entity:system:alpha',maxPositionErrorMeters:0.05,minOrientationDot:1-1e-11});
assert.equal(witness.status,'PASS');assert.equal(witness.authority,'PRESENTATION_ONLY');assert.equal(witness.selectionToken,original.selectionToken);assert.equal(witness.shadowCameraAuthority,false);assert.equal(witness.addressRebase.preservedEntityId,original.selectionToken);assert.equal(witness.addressRebase.preservedTargetId,original.selectionToken);
let camera=original;const route=['planet','surface','human','surface','planet','system'];for(let cycle=0;cycle<64;cycle++)for(const frameId of route){const next=manager.rebaseCamera(camera,frameId);assert.equal(next.selectionToken,original.selectionToken);assert.equal(next.logDistanceM,original.logDistanceM);assert.equal(next.commandCount,original.commandCount);camera=next;}
const positionErrorMeters=Math.hypot(...camera.position.map((v,i)=>v-original.position[i]))*graph.frame('system').metersPerUnit;
const orientationAbsDot=Math.abs(camera.orientation.reduce((sum,v,i)=>sum+v*original.orientation[i],0));
assert.ok(positionErrorMeters<0.5,`repeated hierarchical rebase drift ${positionErrorMeters}m`);assert.ok(orientationAbsDot>1-1e-9,`orientation drift ${orientationAbsDot}`);
const forward0=F.qRotate(original.orientation,[0,0,-1]),forward1=F.qRotate(camera.orientation,[0,0,-1]),lineOfSightDot=forward0.reduce((sum,v,i)=>sum+v*forward1[i],0);assert.ok(lineOfSightDot>1-1e-9,`line-of-sight drift ${lineOfSightDot}`);
const address=manager.addressFromCamera(original);const rebased=manager.rebaseAddress(address,'planet',{entityId:original.selectionToken,targetId:original.selectionToken,orientation:original.orientation,lineOfSight:forward0});assert.equal(rebased.from.frameId,'system');assert.equal(rebased.to.frameId,'planet');assert.deepEqual(Array.from(rebased.to.hierarchy),['galaxy','system','planet']);
assert.throws(()=>manager.rebaseAddress({...address,unit:'METERS'},'planet'),/FRAME_NATIVE/);
console.log(JSON.stringify({status:'PASS',suite:'v2-deep3d-frame-transition',cycles:64,positionErrorMeters,orientationAbsDot,lineOfSightDot,shadowCameraAuthority:false}));
