import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const sandbox={console};sandbox.globalThis=sandbox;sandbox.OFU={};
vm.runInNewContext(fs.readFileSync('src/v1x-02-spatial-universe/spatial-universe.js','utf8'),sandbox,{filename:'spatial-universe.js'});
for(const file of [
 'src/rendering/galaxy/galaxy-field.js',
 'src/rendering/macro/macrocosm-batches.js',
 'src/rendering/region/region-refinement.js',
 'src/rendering/neighborhood/neighborhood-depth.js',
 'src/rendering/macro/macrocosm-provider.js'
])vm.runInNewContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
const O=sandbox.OFU,F=O.v2x03GalaxyField,B=O.v2x03MacrocosmBatches,R=O.v2x03RegionRefinement,N=O.v2x03NeighborhoodDepth,P=O.v2x03MacrocosmProvider,S=O.v1x02SpatialUniverse;
const galaxy={canonicalId:'galaxy-alpha',sourceAuthority:'CANONICAL_PROVEN',metadata:{modelProfile:{morphology:'SPIRAL'}}};
const entities=Array.from({length:80},(_,i)=>({canonicalId:'entity-'+String(i).padStart(3,'0'),sourceAuthority:'CANONICAL_PROVEN'}));
const frame={origin:{x:0,y:0,z:-1200},right:{x:1,y:0,z:0},up:{x:0,y:1,z:0},forward:{x:0,y:0,z:1},focalLength:1.2,near:.01};

const a=F.build({galaxyId:'galaxy-alpha',morphology:'SPIRAL',quality:'STANDARD',presentationSeed:'stable-seed'}),b=F.build({galaxyId:'galaxy-alpha',morphology:'SPIRAL',quality:'STANDARD',presentationSeed:'stable-seed'});
assert.deepEqual(a,b,'galaxy field must be deterministic across revisit');
assert.equal(a.authority,'PRESENTATION_ONLY');
assert.equal(a.claims.calibratedObservation,false);
assert.equal(a.claims.morphologyComponentsArePhysical,false);
assert.ok(a.particles.length<=F.PROFILES.STANDARD.particles);
assert.ok(a.bounds.total<=F.PROFILES.STANDARD.particles+F.PROFILES.STANDARD.clusters+F.PROFILES.STANDARD.dust);
assert.equal(Object.values(a.components).reduce((sum,n)=>sum+n,0),a.particles.length,'component census must account for every decorative particle');
const diskComponents=new Set(['SPIRAL_ARM','DISK','BULGE','HALO']);
for(const item of a.particles){assert.ok(diskComponents.has(item.component));assert.ok(Number.isInteger(item.componentCode));assert.equal(item.claims.componentIsPhysicalDecomposition,false)}
for(const item of [...a.particles,...a.clusters,...a.dust]){assert.equal(item.canonical,false);assert.equal(item.selectable,false);assert.equal(item.navigable,false);assert.equal(item.authority,'PRESENTATION_ONLY')}
for(const morphology of ['SPIRAL','ELLIPTICAL','IRREGULAR','UNKNOWN']){const f=F.build({galaxyId:'morph-'+morphology,morphology,quality:'LOW'});assert.equal(f.status,'READY');assert.ok(f.bounds.total>0);assert.equal(f.claims.morphologyComponentsArePhysical,false)}

const universe=P.buildUniverse({scopeId:'universe-root',entities,cameraFrame:frame,quality:'STANDARD'});
assert.equal(universe.claims.gridPrimary,false);
assert.equal(universe.camera.ownsFrame,false);
assert.equal(universe.claims.stableIdentityRequired,true);
assert.ok(universe.objects.length<=48);
const reversed=P.buildUniverse({scopeId:'universe-root',entities:[...entities].reverse(),cameraFrame:frame,quality:'STANDARD'});
assert.deepEqual(universe.objects,reversed.objects,'query order must not alter spatial identity placement');

const galaxyScene=P.buildGalaxy({galaxy,entities,cameraFrame:frame,quality:'HIGH',presentationSeed:'galaxy-seed'});
assert.equal(galaxyScene.galaxyId,'galaxy-alpha');
assert.equal(galaxyScene.claims.decorativeSelectable,false);
assert.ok(galaxyScene.bounds.entities<=64);
assert.ok(galaxyScene.field.bounds.particles<=F.PROFILES.HIGH.particles);
for(const args of [
 {width:320,height:700,dpr:3,memoryClass:'NORMAL',coarse:true,expected:'LOW'},
 {width:390,height:844,dpr:2,memoryClass:'NORMAL',coarse:true,expected:'MOBILE'},
 {width:1440,height:900,dpr:2,memoryClass:'NORMAL',coarse:false,expected:'STANDARD'},
 {width:2560,height:1440,dpr:1.5,memoryClass:'HIGH',coarse:false,expected:'HIGH'},
 {width:2560,height:480,dpr:2,memoryClass:'NORMAL',coarse:true,expected:'LOW'}
]){
 const qp=B.qualityFor(args);assert.equal(qp.name,args.expected);const plan=B.planGalaxy(galaxyScene.field,args);assert.ok(plan.usage.draws<=3);assert.ok(plan.usage.instances<=plan.bounds.maxInstances);assert.ok(plan.usage.bytes<=plan.bounds.maxBytes);assert.equal(plan.claims.gpuMemoryMeasured,false);assert.equal(plan.claims.driverMemoryMeasured,false);for(const batch of plan.batches)assert.equal(batch.strideFloats,7)
}
const immutablePlan=B.planGalaxy(galaxyScene.field,{width:1440,height:900,dpr:1,memoryClass:'NORMAL'});
assert.ok(immutablePlan.batches.length>0);
const exposed=immutablePlan.batches[0].data,original=exposed[0];
exposed[0]=original+12345;
assert.equal(immutablePlan.batches[0].data[0],original,'mutating an exposed typed-array copy must not mutate the frozen batch');
assert.equal(immutablePlan.batches[0].claims.internalBufferExposed,false);
assert.equal(immutablePlan.batches[0].claims.componentCodePhysical,false);
const nearCue=B.depthCue(2,{near:1,far:1000}),farCue=B.depthCue(800,{near:1,far:1000});assert.ok(nearCue.sizeScale>farCue.sizeScale);assert.ok(nearCue.opacity>farCue.opacity);assert.ok(nearCue.fog<farCue.fog);assert.equal(farCue.claims.physicalExtinction,false);

const children=entities.slice(0,70).map((e,i)=>({...e,entityId:'region-child-'+i}));
const region=P.buildRegion({parentId:'galaxy-alpha',children,quality:'STANDARD'}),regionAgain=P.buildRegion({parentId:'galaxy-alpha',children:[...children].reverse(),quality:'STANDARD'});
assert.deepEqual(region.objects,regionAgain.objects,'region refinement must be stable independent of input order');
assert.ok(region.objects.length<=R.MAX_CHILDREN);
assert.equal(region.continuity.queryOrderIndependent,true);
assert.equal(region.continuity.hardReplacementRequired,false);
assert.equal(region.claims.regionBoundaryCanonical,false);
const reduced=R.blend(region,regionAgain,.5,{reducedMotion:true}),animated=R.blend(region,regionAgain,.5);
assert.equal(reduced.mix,0);assert.equal(reduced.depthBias,0);assert.equal(reduced.claims.reducedMotionAvoidsContinuousBlend,true);assert.equal(animated.mix,.5);

const spatial=S.projectEntities({context:'NEIGHBORHOOD',scopeId:'region-alpha',entities:entities.slice(0,50),presentationSeed:'n-seed',limit:50});
const neighborhood=P.buildNeighborhood({objects:spatial.objects,cameraFrame:frame,quality:'STANDARD'});
assert.ok(neighborhood.objects.length<=N.MAX_OBJECTS);
assert.equal(neighborhood.camera.ownsFrame,false);
assert.equal(neighborhood.stability.queryOrderIndependent,true);
for(const object of neighborhood.objects){assert.equal(object.authority,'PRESENTATION_ONLY');assert.equal(object.claims.positionPhysical,false)}
const visible=neighborhood.objects.find(o=>o.view.visible);if(visible){const hit=P.pick(neighborhood,visible.view.x,visible.view.y);assert.equal(hit.handled,true);assert.equal(hit.decorative,false);assert.equal(hit.sourceId,visible.sourceId)}

for(const quality of ['LOW','MOBILE','STANDARD','HIGH']){const scene=P.buildGalaxy({galaxy,quality,presentationSeed:'q'});const cap=F.PROFILES[quality].particles;assert.ok(scene.field.particles.length<=cap);assert.ok(scene.field.particles.length<=F.HARD_CAP)}
assert.throws(()=>P.buildUniverse({scopeId:'dup',entities:[entities[0],entities[0]],cameraFrame:frame}),/duplicate upstream identity/);
assert.throws(()=>P.buildUniverse({scopeId:'identityless',entities:[{}],cameraFrame:frame}),/stable upstream identity/);
assert.throws(()=>R.refine({parentId:'x',children:[{}]}),/stable child identity/);
assert.throws(()=>R.refine({parentId:'x',children:[entities[0]],parentExtent:Infinity}),/finite/);
const witness=P.continuityWitness({galaxy:galaxyScene,region,neighborhood});
assert.equal(witness.cameraOwnedHere,false);assert.equal(witness.selectionOwnedHere,false);assert.equal(witness.scaleOwnedHere,false);
console.log(JSON.stringify({status:'PASS',oracle:'V2X03_MACROCOSM_ORACLES',contract:P.CONTRACT,bounds:{galaxyParticles:galaxyScene.field.bounds.particles,galaxyDecorative:galaxyScene.field.bounds.total,regionObjects:region.objects.length,neighborhoodObjects:neighborhood.objects.length,maxGalaxyDraws:3},noGrid:true,deterministicRevisit:true,explicitMorphologyLayers:true,decorativeNonSelectable:true,externalCamera:true,qualityProfiles:true,reducedMotion:true,stableIdentityFailClosed:true,immutablePackedData:true}));
