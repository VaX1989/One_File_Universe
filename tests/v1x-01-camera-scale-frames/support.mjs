import assert from 'node:assert/strict';
await import('../../src/v1x-01-camera-scale-frames/reference-frames.js');
await import('../../src/v1x-01-camera-scale-frames/semantic-distance.js');
await import('../../src/v1x-01-camera-scale-frames/camera-authority.js');
await import('../../src/v1x-01-camera-scale-frames/wave-iv-adapter.js');
await import('../../src/v1x-01-camera-scale-frames/trace-harness.js');
export {assert};
export const O=globalThis.OFU;
export const RADIUS_M=6371000;
export function graph(){
 return O.v1xReferenceFrames.createReferenceFrameGraph([
  {id:'galaxy',parentId:null,metersPerUnit:1e20},
  {id:'system',parentId:'galaxy',metersPerUnit:1e9,originInParent:[1.2,-.8,.4]},
  {id:'planet',parentId:'system',metersPerUnit:1e6,originInParent:[12,-5,2]},
  {id:'surface',parentId:'planet',metersPerUnit:1,originInParent:[0,0,6.371]},
  {id:'human',parentId:'surface',metersPerUnit:.01,originInParent:[1000,2000,10]},
  {id:'micro',parentId:'human',metersPerUnit:1e-9,originInParent:[50,160,20]}
 ]);
}
export function frameForBand(band){
 if(['galaxy','galactic_region','stellar_neighborhood'].includes(band))return 'galaxy';
 if(band==='system')return 'system';
 if(['orbit','approach'].includes(band))return 'planet';
 if(['global_surface','regional_surface','local_surface'].includes(band))return 'surface';
 return 'human';
}
export function camera({band='orbit',selectionToken='planet:test'}={}){
 const g=graph(),model=O.v1xSemanticDistance.createScaleModel({referenceRadiusM:RADIUS_M}),log=model.anchorLogM[band];
 const frame=frameForBand(band);
 const c=O.v1xCameraAuthority.createCameraAuthority({frameGraph:g,scaleModel:model,initialPose:{frameId:frame,position:[.125,-.25,.5],orientation:[0,0,0,1]},initialLogDistanceM:log,selectionToken,frameResolver:frameForBand});
 return {camera:c,graph:g,model,adapter:O.v1xWaveIVCameraAdapter.createWaveIVAdapter(c,{referenceRadiusM:RADIUS_M})};
}
export function close(a,b,tolerance=1e-10){assert.ok(Math.abs(a-b)<=tolerance,`expected ${a} ~= ${b}`);}
