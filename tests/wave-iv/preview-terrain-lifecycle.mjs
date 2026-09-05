import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {traceSurfaceSamples} from '../rendering/local-surface-visual-oracle.mjs';

// Execute the actual preview lifecycle with real assembled terrain/camera modules.
// Canonical realization and GPU/DOM adapters are minimal fixtures, not scientific
// or pixel evidence. This isolates which factory the lifecycle actually calls.
const load=file=>vm.runInThisContext(fs.readFileSync(file,'utf8'),{filename:file});
const raf=[],dom=[];
let viewport={width:1440,height:900},nextPlanet='9e2041b4c8550e86edc574c42cba1bb31224a2ac7a9e8ffaea232310ce24d98e';
const canvas={width:1440,height:900,clientWidth:1440,clientHeight:900,
 addEventListener(){},setAttribute(){},removeAttribute(){},getBoundingClientRect:()=>viewport,
 getContext:()=>null};
globalThis.document={readyState:'loading',hidden:false,addEventListener:(name,fn)=>{if(name==='DOMContentLoaded')dom.push(fn)},
 getElementById:id=>id==='planet-view'?canvas:null,querySelectorAll:()=>[],activeElement:canvas};
globalThis.requestAnimationFrame=fn=>{raf.push(fn);return raf.length};
globalThis.addEventListener=()=>{};
globalThis.matchMedia=()=>({matches:false,addEventListener(){}});
globalThis.devicePixelRatio=1;
const fields=['galaxyX','galaxyY','galaxyZ','sectorX','sectorY','sectorZ','siteX','siteY','siteZ','orbitSlot'];
const key=Object.fromEntries(fields.map(k=>[k,'0']));
const physical=()=>({status:'SUPPORTED',planetId:nextPlanet,physical:{meanRadiusM:6371000},upstreamBaseline:{formation:{bulkPriorClass:'TERRESTRIAL'}}});
const disposedGpu=()=>({disposed:false,gpu:null});
const canonicalEnvelope={minDistanceRadii:1.01,minDistanceM:6434710,meshBoundingRadiusM:6400000,clearanceFraction:.0035};
const C={AUTHORITY:'PRESENTATION_ONLY',cameraEnvelope:()=>canonicalEnvelope,
 createP5Provider:(ctx,p)=>({planetId:p.planetId,physical:p,topology:{},presentationBounds:{maxRadiusM:6400000}}),
 createSession:provider=>({provider,active:new Map(),cache:new Map()}),
 createCamera:(r,opts)=>({distanceM:r*opts.distanceRadii,targetDistanceM:r*opts.distanceRadii,minDistanceM:canonicalEnvelope.minDistanceM,targetDirection:opts.targetDirection,direction:opts.targetDirection}),
 setCameraTarget:(c,o)=>{c.targetDistanceM=o.distanceM;c.targetDirection=o.direction||c.targetDirection},
 sessionStats:s=>({activePatches:s.active.size,cpuMeshes:s.cache.size}),
 cameraSnapshot:c=>({distanceM:c.distanceM,direction:c.direction}),depthAdjudication:()=>({fixture:true})};
const O=globalThis.OFU={planetRenderCore:C,planetWebGL2:{stateStats:()=>({gpu:null}),dispose:disposedGpu},
 p3Astronomy:{semanticManifestHash:()=>new Uint8Array(32),planetaryInputSnapshot:()=>({status:'PRESENT',planetId:nextPlanet}),resolvePlanet:()=>({status:'PRESENT',id:nextPlanet})},
 p5Planetology:{adaptP3PlanetaryInputSnapshot:s=>s,realizePhysicalPlanet:physical},
 p5EnvironmentV2:{environmentV2Projection:()=>({authority:'FIXTURE',contractId:'fixture'}),environmentDigest:()=> 'environment-fixture'},
 p6Biosphere:{adaptEnvironment:e=>e,eligibility:()=>({state:'INSUFFICIENT_ENVIRONMENT',witnessDigest:'eligibility-fixture'}),renderingProjection:()=>({biologyEstablished:false})},
 p2:{hex:x=>x},BASELINE_BUILD:{rendering:{previewPlanetKey:key,previewPlanetId:nextPlanet,previewP6EligibilityState:'INSUFFICIENT_ENVIRONMENT',previewP6EligibilityWitnessDigest:'eligibility-fixture'}}};
for(const name of ['planet-surface.js','planet-surface-terrain.js','planet-surface-webgl2.js'])load('src/rendering/'+name);
const W=O.planetSurfaceWebGL2;
O.planetSurfaceWebGL2={dispose:disposedGpu,stats:()=>({gpu:null}),render:(c,t,camera)=>{
 const out=t.update({...camera,viewportAspect:c.width/c.height,verticalFovRad:55*Math.PI/180});
 return{backend:'FIXTURE_CPU_ONLY',terrain:out.stats,gpu:null,coverage:out.plan,clip:W.clipFor(camera,out.plan),presentationPolicy:W.presentationPolicy(camera.currentBand),verticalDatum:{referenceElevationM:O.planetSurfaceTerrain.presentationHeightM(camera.anchorToken,...camera.absolutePresentationPositionM)}};
}};
const legacyFactory=O.planetSurfaceTerrain.createTerrainSession;
load('src/bootstrap/planet-preview.js'); // evaluates before final composition
for(const name of ['planet-surface-continuity.js','planet-surface-relief.js'])load('src/rendering/'+name);
load('src/bootstrap/product/terrain-session-compat.js');
assert.notEqual(O.planetSurfaceTerrain.createTerrainSession,legacyFactory);
load('src/bootstrap/product/surface-continuity-bind.js');
assert.equal(dom.length,2);for(const init of dom)init();
const P=__OFU_PLANET_PREVIEW__,runs=[];
function verify(label){
 assert.equal(P.surfaceTerrain.version,'ofu-local-terrain-lod-4',label+' must instantiate assembled terrain, not the captured foundation');
 P.enterSurface('HUMAN');
 const before=P.surfaceProvider.snapshot().camera;
 P.surfaceIntent({type:'LOOK_PITCH',amount:(-.41887902047863906-before.pitchRad)/.035});
 const cb=raf.shift();assert(cb);cb(performance.now()+300);
 const camera=P.surfaceProvider.snapshot().camera,plan=P.draw.coverage;
 assert.equal(camera.presentationAltitudeM,65,'relief datum must not be added twice to camera clearance');
 assert.equal(P.lastSurfaceClearanceM,65);
 assert.equal(plan.coverageMode,'FRUSTUM_GROUND_FOOTPRINT_BOUNDED');
 assert.equal(plan.coverageComplete,true);assert.equal(plan.footprintContained,true);
 assert.equal(P.surfaceMode,'LOCAL');assert.equal(P.provider.planetId,nextPlanet);
 const m=P.surfaceTerrain.active.values().next().value;
 assert.equal(m.vertices[2],Math.fround(O.planetSurfaceTerrain.presentationHeightM(m.key.anchorToken,m.localOriginM[0],m.localOriginM[1])),'fresh sessions must include relief');
 const samples=[];for(let gy=1;gy<=11;gy++)for(let gx=1;gx<=15;gx++)samples.push({x:Math.floor(gx*canvas.width/16),y:Math.floor(gy*canvas.height/12)});
 const rays=traceSurfaceSamples({camera,draw:P.draw,meshes:[...P.surfaceTerrain.active],width:canvas.width,height:canvas.height,fov:W.FOV,samples});
 assert(rays.cpuHits>=8,'real composed mesh must intersect portrait/desktop camera rays');
 const old=P.surfaceTerrain;P.leaveSurface();assert.equal(old.active.size,0);
 assert.equal((old.cache.map||old.cache).size,0,'surface exit must release all CPU tiles');
 runs.push({label,terrainVersion:old.version,coverageMode:plan.coverageMode,active:plan.activePatchCount,altitudeM:camera.presentationAltitudeM,cpuRayIntersections:rays.cpuHits});
}
verify('first desktop');
viewport={width:390,height:844};canvas.clientWidth=390;canvas.clientHeight=844;verify('second portrait');
for(let i=0;i<6;i++)verify('return '+i);
nextPlanet='retarget-lifecycle-fixture';P.retarget(Object.fromEntries(fields.map(k=>[k,1n])));verify('retarget');
P.testOnlyUnsupportedFixture();assert.equal(P.surfaceTerrain,null);assert.equal(P.targetStatus,'UNSUPPORTED');
P.retarget(Object.fromEntries(fields.map(k=>[k,2n])));verify('supported after unsupported');
P.dispose();assert.equal(P.surfaceTerrain,null);
console.log(JSON.stringify({status:'PASS',evidenceClass:'ACTUAL_PREVIEW_CPU_LIFECYCLE_WITH_CANONICAL_AND_GPU_FIXTURES',runs,lateCompositionResolved:true,datum:'CAMERA_LOCATION_PRESENTATION_RELIEF_DATUM',physicalOrGpuMeasurementClaim:false}));
