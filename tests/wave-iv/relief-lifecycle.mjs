import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

// Complete composed terrain, not the base-only continuity fixture. These are
// CPU shape/cache invariants; hosted screenshots remain the visual evidence.
globalThis.OFU={planetRenderCore:{}};
for(const name of ['planet-surface.js','planet-surface-terrain.js','planet-surface-continuity.js','planet-surface-relief.js']){
 vm.runInThisContext(fs.readFileSync('src/rendering/'+name,'utf8'),{filename:name});
}
const T=OFU.planetSurfaceTerrain,S=OFU.planetSurface;
const normalize=v=>{const n=Math.hypot(...v);return v.map(x=>x/n)};
const dot=(a,b)=>a.reduce((n,x,i)=>n+x*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const actualPlanet='9e2041b4c8550e86edc574c42cba1bb31224a2ac7a9e8ffaea232310ce24d98e';
const ridge=[];
for(const id of [actualPlanet,'relief-fixture-a','relief-fixture-b','relief-fixture-c']){
 // Solve the declared seeded 67-cycle ridge phase's zero plane analytically.
 // The oracle never calls the renderer, ridgeProfile or the production wave
 // helper. It measures left/right derivatives of the full added relief field.
 const seed=T.hash32('planet-surface-relief-v1|'+id);
 let h=(seed^Math.imul(4,0x9e3779b1))>>>0;
 const random=()=>{h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;h=Math.imul(h,0x846ca68b);h^=h>>>16;return h>>>0};
 const axis=normalize(Array.from({length:3},()=>random()/2147483647.5-1));
 const phase=((seed>>>24)&255)/255*2;
 const plane=(Math.round(phase)-phase)/67;
 const side=normalize(cross(axis,Math.abs(axis[0])<.9?[1,0,0]:[0,1,0]));
 const crest=axis.map((v,i)=>v*plane+side[i]*Math.sqrt(1-plane*plane));
 assert(Math.abs(dot(axis,crest)-plane)<1e-12);
 const at=t=>T.reliefAtDirection(id,normalize(crest.map((v,i)=>v+axis[i]*t)));
 const center=at(0),jumps=[];
 for(const epsilon of [1e-6,1e-7,1e-8]){
  const left=(center-at(-epsilon))/epsilon,right=(at(epsilon)-center)/epsilon;
  jumps.push(Math.abs(right-left));
 }
 assert(jumps[2]<10,'complete relief must not reintroduce a cusp: '+JSON.stringify({id,jumps}));
 assert(jumps[2]<jumps[0]*.04+.001,'ridge derivative mismatch must vanish under refinement');
 const old=(t)=>1250*Math.pow(1-Math.abs(Math.sin((dot(axis,normalize(crest.map((v,i)=>v+axis[i]*t)))*67+phase)*Math.PI)),3);
 const legacyJump=Math.abs((old(1e-8)-old(0))/1e-8-(old(0)-old(-1e-8))/1e-8);
 assert(legacyJump>1e6,'negative cusp fixture must be discriminated');
 ridge.push({id,derivativeMismatch:jumps,legacyDerivativeJump:legacyJump});
}

const anchor=S.createAnchor({planetId:actualPlanet,radiusM:6371000,viewDirection:[.18,.12,1]});
const camera=S.createLocalCamera(anchor,{presentationAltitudeM:15000,pitchRad:-.6632251157578453});
const snapshot=Object.freeze({...S.localCameraSnapshot(camera),viewportAspect:1.6,verticalFovRad:T.VERTICAL_FOV_RAD});
const session=T.createTerrainSession();session.update(snapshot);
const originals=new Map([...session.active].map(([id,m])=>[id,{object:m,vertices:m.vertices.slice()}]));
for(let i=1;i<=9;i++){
 session.update({...snapshot,absolutePresentationPositionM:[i*150000,i*100000,15000],cameraRelativePositionM:[0,0,15000]});
 assert(session.cache.size<=64);assert(session.stats().cpuBytes<=6*1024*1024);
}
assert([...originals.keys()].every(id=>!session.cache.has(id)),'fixture must actually evict every original tile');
session.update(snapshot);
for(const [id,first] of originals){
 const again=session.active.get(id);assert(again,'same query must return same tile identities');
 assert.notEqual(again,first.object,'revisit must exercise a new mesh object');
 assert.deepEqual(again.vertices,first.vertices,'recreated mesh must receive identical composed relief, not base-only heights');
 for(let i=2;i<again.vertices.length;i+=3){
  const x=again.localOriginM[0]+again.vertices[i-2],y=again.localOriginM[1]+again.vertices[i-1];
  assert.equal(again.vertices[i],Math.fround(T.presentationHeightM(anchor.token,x,y)));
 }
}
const warm=[...session.active].map(([id,m])=>[id,m.vertices.slice()]);
session.update(snapshot);for(const [id,v] of warm)assert.deepEqual(session.active.get(id).vertices,v,'warm reuse must not apply relief twice');
const beforeDispose=session.stats();session.dispose();assert.equal(session.cache.size,0);assert.equal(session.active.size,0);
console.log(JSON.stringify({status:'PASS',evidenceClass:'CPU_RELIEF_CONTINUITY_AND_EVICTION_NOT_GPU',version:T.presentationReliefVersion,ridge,revisitedTiles:originals.size,maxRevisitDifferenceM:0,cacheBound:64,beforeDispose,retentionPolicy:'WEAK_MESH_OBJECT_MEMBERSHIP',canonicalClaim:false}));
