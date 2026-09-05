import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {traceSurfaceSamples} from './local-surface-visual-oracle.mjs';

const width=1000,height=710,fov=55*Math.PI/180;
const samples=Array.from({length:165},(_,i)=>({x:Math.floor((i%15+1)*width/16),y:Math.floor((Math.floor(i/15)+1)*height/12),pixel:[90,80,60,255]}));
const camera={absolutePresentationPositionM:[0,0,65],cameraRelativePositionM:[0,0,0],headingRad:0,pitchRad:-.35};
const draw={clip:{near:.052,far:20000},verticalDatum:{referenceElevationM:0},presentationPolicy:{elevationScale:1.3}};
const plane={localOriginM:[-5000,-5000,0],vertices:[0,0,0,10000,0,0,0,10000,0,10000,10000,0],indices:[0,1,2,1,3,2]};
const input={camera,draw,meshes:[['flat-plane',plane]],width,height,fov,samples};
const flat=traceSurfaceSamples(input);assert(flat.cpuHits>100);assert.equal(flat.cpuHitClear,0);
// Exact center-ray distance to the flat plane, not an implementation-derived oracle.
const center=traceSurfaceSamples({...input,samples:[{x:width/2-.5,y:height/2-.5,pixel:[90,80,60,255]}]});
assert.equal(center.cpuHits,1);assert(Math.abs(center.samples[0].distanceM-65/-Math.sin(-.35))<1e-9);
const missingPixels=traceSurfaceSamples({...input,samples:samples.map(s=>({...s,pixel:[4,6,9,255]}))});assert.equal(missingPixels.cpuHitClear,flat.cpuHits);
assert.equal(traceSurfaceSamples({...input,meshes:[]}).cpuHits,0);
assert.equal(traceSurfaceSamples({...input,meshes:[['back-facing',{...plane,indices:[0,2,1,1,2,3]}]]}).cpuHits,0);
assert.equal(traceSurfaceSamples({...input,camera:{...camera,pitchRad:1.2}}).cpuHits,0);
const translated=traceSurfaceSamples({...input,camera:{...camera,absolutePresentationPositionM:[1000000,-1000000,65]},meshes:[['translated',{...plane,localOriginM:[995000,-1005000,0]}]]});
assert.equal(translated.cpuHits,flat.cpuHits);for(let i=0;i<flat.samples.length;i++)assert(Math.abs(flat.samples[i].distanceM-translated.samples[i].distanceM)<1e-8);

// The real composition regression: the historical camera-neighborhood prototype
// has no visible triangles for this pose. The full Wave IV frustum planner does.
const load=p=>vm.runInThisContext(fs.readFileSync(p,'utf8'),{filename:p});
globalThis.OFU={planetRenderCore:{},planetWebGL2:{}};
for(const p of ['planet-surface.js','planet-surface-terrain.js','planet-surface-webgl2.js'])load('src/rendering/'+p);
const S=OFU.planetSurface,W=OFU.planetSurfaceWebGL2;
const a=S.createAnchor({planetId:'9e2041b4c8550e86edc574c42cba1bb31224a2ac7a9e8ffaea232310ce24d98e',radiusM:6371000,viewDirection:[.18,.12,1]});
const c=S.createLocalCamera(a,{presentationAltitudeM:65,pitchRad:-.35});
const snap={...S.localCameraSnapshot(c),viewportAspect:width/height,verticalFovRad:fov};
function traceActual(){const T=OFU.planetSurfaceTerrain,session=T.createTerrainSession(),u=session.update(snap);const result=traceSurfaceSamples({camera:snap,draw:{clip:W.clipFor(snap,u.plan),verticalDatum:{referenceElevationM:T.presentationHeightM(a.token,0,0)},presentationPolicy:W.presentationPolicy('HUMAN')},meshes:[...session.active],width,height,fov,samples});session.dispose();return{coverage:u.plan.coverageMode,patches:u.plan.activePatchCount,patchSizeM:u.plan.patchSizeM,cpuHits:result.cpuHits};}
const legacy=traceActual();assert.equal(legacy.cpuHits,0,'reproduce incomplete legacy build rather than weakening the visible-terrain requirement');
load('src/rendering/planet-surface-continuity.js');load('src/rendering/planet-surface-relief.js');
const full=traceActual();assert.equal(full.coverage,'FRUSTUM_GROUND_FOOTPRINT_BOUNDED');assert(full.cpuHits>=8);assert(full.patches<=25);
console.log(JSON.stringify({status:'PASS',oracle:'INDEPENDENT_LOCAL_SURFACE_RAY',flatHits:flat.cpuHits,centerRayAnalytic:true,floatingOriginInvariant:true,missingPixelsDetected:missingPixels.cpuHitClear,legacy,full}));
