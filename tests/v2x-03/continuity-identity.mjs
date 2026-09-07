import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const sandbox={console};sandbox.globalThis=sandbox;sandbox.OFU={};
for(const file of [
 'src/v1x-02-spatial-universe/spatial-universe.js',
 'src/rendering/galaxy/galaxy-field.js',
 'src/rendering/region/region-refinement.js',
 'src/rendering/neighborhood/neighborhood-depth.js',
 'src/rendering/macro/macrocosm-provider.js'
])vm.runInNewContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
const O=sandbox.OFU,P=O.v2x03MacrocosmProvider,N=O.v2x03NeighborhoodDepth;
const frame={origin:{x:0,y:0,z:-900},right:{x:1,y:0,z:0},up:{x:0,y:1,z:0},forward:{x:0,y:0,z:1},focalLength:1.15,near:.01};
const galaxy={canonicalId:'g-continuity',metadata:{modelProfile:{morphology:'SPIRAL'}}};
const systems=Array.from({length:80},(_,i)=>({canonicalId:'sys-'+String(i).padStart(3,'0'),sourceAuthority:'CANONICAL_PROVEN',presentationPosition:{x:(i%10-4.5)*3.5,y:(Math.floor(i/10)-3.5)*2.75,z:i*.45}}));
const shuffled=[...systems].reverse();
const g1=P.buildGalaxy({galaxy,entities:systems,cameraFrame:frame,quality:'STANDARD'});
const g2=P.buildGalaxy({galaxy,entities:shuffled,cameraFrame:frame,quality:'STANDARD'});
assert.equal(g1.galaxyId,'g-continuity');
assert.deepEqual(g1.objects,g2.objects,'galaxy revisit must be query-order stable');
const children=systems.map((s,i)=>({...s,entityId:'region-'+i}));
const r1=P.buildRegion({parentId:g1.galaxyId,children,quality:'STANDARD',focus:.35,parentExtent:1});
const r2=P.buildRegion({parentId:g1.galaxyId,children:[...children].reverse(),quality:'STANDARD',focus:.35,parentExtent:1});
assert.equal(r1.parentId,g1.galaxyId);
assert.deepEqual(r1.objects,r2.objects,'region revisit must be query-order stable');
const n1=P.buildNeighborhood({objects:systems,cameraFrame:frame,quality:'STANDARD'});
const n2=P.buildNeighborhood({objects:shuffled,cameraFrame:frame,quality:'STANDARD'});
assert.equal(n1.objects.length,48,'STANDARD neighborhood must exercise a real bounded subset');
assert.deepEqual(n1.objects,n2.objects,'neighborhood bounded subset and ordering must be query-order stable');
assert.deepEqual(n1.objects.map(o=>o.sourceId),systems.slice(0,48).map(s=>s.canonicalId),'stable identity ordering must determine bounded subset');
assert.equal(n1.stability.queryOrderIndependent,true);
const ids=new Set(systems.map(x=>x.canonicalId));
for(const o of n1.objects){assert.ok(ids.has(o.sourceId),'neighborhood identity must come from upstream');assert.equal(o.selectable,true);assert.equal(o.claims.identityPreserved,true)}
for(const d of g1.field.particles)assert.equal(d.selectable,false);
for(const d of g1.field.clusters)assert.equal(d.selectable,false);
for(const d of g1.field.dust)assert.equal(d.selectable,false);
const tieScene={objects:[
 {objectId:'b',sourceId:'sys-b',canonicalId:'sys-b',view:{visible:true,x:.25,y:.25}},
 {objectId:'a',sourceId:'sys-a',canonicalId:'sys-a',view:{visible:true,x:.25,y:.25}}
]};
assert.equal(N.pick(tieScene,.25,.25,{radius:.1}).sourceId,'sys-a','equal-distance picks must resolve deterministically by stable identity');
assert.throws(()=>N.project({objects:[{canonicalId:'bad',presentationPosition:{x:NaN,y:0,z:0}}],cameraFrame:frame}),/finite/,'non-finite coordinates must fail closed through spatial projection');
assert.throws(()=>N.project({objects:[{presentationPosition:{x:0,y:0,z:0}}],cameraFrame:frame}),/stable upstream identity/,'identity-less materialization must fail closed');
const w=P.continuityWitness({galaxy:g1,region:r1,neighborhood:n1});
assert.equal(w.galaxyId,g1.galaxyId);assert.equal(w.regionParent,g1.galaxyId);
assert.ok(w.neighborhoodObjectIds.every(id=>ids.has(id)));
assert.equal(w.cameraOwnedHere,false);assert.equal(w.selectionOwnedHere,false);assert.equal(w.scaleOwnedHere,false);
console.log(JSON.stringify({status:'PASS',oracle:'V2X03_CONTINUITY_IDENTITY',galaxyId:w.galaxyId,regionParent:w.regionParent,neighborhoodObjects:w.neighborhoodObjectIds.length,queryOrderStable:true,nonVacuousNeighborhood:true,deterministicPickTieBreak:true,decorativeNonSelectable:true,externalAuthoritiesPreserved:true}));
