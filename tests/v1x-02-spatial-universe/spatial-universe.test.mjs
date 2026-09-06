import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const sourcePath=path.join(root,'src/v1x-02-spatial-universe/spatial-universe.js');
const fixturePath=path.join(here,'fixtures/spatial-golden.json');
const sandbox={console};sandbox.globalThis=sandbox;
vm.runInNewContext(fs.readFileSync(sourcePath,'utf8'),sandbox,{filename:sourcePath});
const S=sandbox.OFU.v1x02SpatialUniverse;
assert.equal(S.VERSION,'ofu-v1x-02-spatial-universe-1');
assert.equal(S.CONTRACT,'ofu-v1x-02-spatial-consumer-1');
assert.equal(S.CONSUMER_CONTRACT.positionAuthority,'PRESENTATION_ONLY');
assert.equal(S.CONSUMER_CONTRACT.invariants.canonicalMutation,false);

const round=n=>Number(n.toFixed(9));
const compactPosition=p=>({x:round(p.x),y:round(p.y),z:round(p.z),authority:p.authority,space:p.space});
const byIdentity=scene=>Object.fromEntries(scene.objects.map(o=>[o.identity,compactPosition(o.position)]));
const entities=[
  {canonicalId:'galaxy:alpha',sourceAuthority:'CANONICAL_PROVEN',facts:{morphology:'ELLIPTICAL'}},
  {canonicalId:'galaxy:beta',sourceAuthority:'CANONICAL_PROVEN',facts:{morphology:'ELLIPTICAL'}},
  {canonicalId:'galaxy:gamma',sourceAuthority:'CANONICAL_PROVEN',facts:{morphology:'ELLIPTICAL'}},
  {canonicalId:'galaxy:delta',sourceAuthority:'CANONICAL_PROVEN',facts:{morphology:'ELLIPTICAL'}},
  {canonicalId:'galaxy:epsilon',sourceAuthority:'CANONICAL_PROVEN',facts:{morphology:'ELLIPTICAL'}}
];
const universe=S.projectEntities({context:'UNIVERSE',scopeId:'universe:fixture',entities,presentationSeed:'seed-A',morphology:'ELLIPTICAL',densityHint:.68});
const reversed=S.projectEntities({context:'UNIVERSE',scopeId:'universe:fixture',entities:[...entities].reverse(),presentationSeed:'seed-A',morphology:'ELLIPTICAL',densityHint:.68});
assert.deepEqual(byIdentity(universe),byIdentity(reversed),'query order changed coordinates');
const revisit=S.projectEntities({context:'UNIVERSE',scopeId:'universe:fixture',entities:JSON.parse(JSON.stringify(entities)),presentationSeed:'seed-A',morphology:'ELLIPTICAL',densityHint:.68});
assert.deepEqual(byIdentity(universe),byIdentity(revisit),'revisit changed coordinates');
assert.equal(universe.bounds.bounded,true);
assert.equal(universe.stability.cacheResidencyIndependent,true);
assert.equal(universe.objects.every(o=>o.authority==='PRESENTATION_ONLY'&&o.claims.positionIsPhysical===false),true);

const keyA={galaxyX:1n,galaxyY:-2n,galaxyZ:7n,sectorX:3n,sectorY:4n,sectorZ:-5n,siteX:11n,siteY:12n,siteZ:13n};
const keyB={siteZ:13n,siteY:12n,siteX:11n,sectorZ:-5n,sectorY:4n,sectorX:3n,galaxyZ:7n,galaxyY:-2n,galaxyX:1n};
assert.equal(S.stableIdentity({canonicalKey:keyA}),S.stableIdentity({canonicalKey:keyB}),'canonical key property order affected identity');
const sourceCarried=S.placeEntity({context:'NEIGHBORHOOD',scopeId:'system-scope',entity:{canonicalKey:keyA,sourceAuthority:'CANONICAL_PROVEN'},sourcePosition:{x:1200,y:-400,z:75,unit:'milliPc',authority:'CANONICAL_PROVEN',provenance:'P3 baseline position'}});
assert.equal(sourceCarried.position.authority,'PRESENTATION_ONLY');
assert.equal(sourceCarried.position.physicalCoordinateClaim,false);
assert.equal(sourceCarried.sourcePosition.authority,'CANONICAL_PROVEN');
assert.equal(sourceCarried.sourcePosition.physicalCoordinateClaim,true);

const probes=S.sampleNeighborhood({context:'REGION',scopeId:'galaxy:alpha',anchorId:'region:anchor',presentationSeed:'seed-probes',morphology:'SPIRAL',densityHint:.82,limit:S.MAX_PROBES});
assert.equal(probes.probes.length,S.MAX_PROBES);
assert.equal(probes.bounds.enumeratesUniverse,false);
assert.equal(probes.bounds.enumeratesCanonicalPopulation,false);
assert.equal(probes.probes.every(p=>p.canonical===false&&p.selectable===false&&p.navigable===false),true);
assert.throws(()=>S.sampleNeighborhood({context:'REGION',scopeId:'galaxy:alpha',anchorId:'region:anchor',limit:S.MAX_PROBES+1}),/outside bounds/);

function determinant4(points){
  const [a,b,c,d]=points;const u={x:b.x-a.x,y:b.y-a.y,z:b.z-a.z},v={x:c.x-a.x,y:c.y-a.y,z:c.z-a.z},w={x:d.x-a.x,y:d.y-a.y,z:d.z-a.z};
  return u.x*(v.y*w.z-v.z*w.y)-u.y*(v.x*w.z-v.z*w.x)+u.z*(v.x*w.y-v.y*w.x);
}
for(const [name,scene] of [
  ['universe',universe],
  ['galaxy',S.projectEntities({context:'GALAXY',scopeId:'galaxy:spiral-01',entities:entities.map((e,i)=>({canonicalId:'region:'+i})),presentationSeed:'seed-B',morphology:'BARRED_SPIRAL',densityHint:.74})],
  ['region',S.projectEntities({context:'REGION',scopeId:'region:outer-02',entities:entities.map((e,i)=>({canonicalId:'neighborhood:'+i})),presentationSeed:'seed-C',morphology:'IRREGULAR',densityHint:.41})],
  ['neighborhood',S.projectEntities({context:'NEIGHBORHOOD',scopeId:'neighborhood:local-03',entities:entities.map((e,i)=>({canonicalId:'system:'+i})),presentationSeed:'seed-D',morphology:'UNKNOWN',densityHint:.55})]
]){
  const zs=scene.objects.map(o=>o.position.z);assert.ok(Math.max(...zs)-Math.min(...zs)>1e-6,name+' collapsed depth');
  assert.ok(Math.abs(determinant4(scene.objects.slice(0,4).map(o=>o.position)))>1e-5,name+' positions are coplanar');
}

const frameA={origin:{x:0,y:0,z:-4200},right:{x:1,y:0,z:0},up:{x:0,y:1,z:0},forward:{x:0,y:0,z:1},focalLength:1.3,near:.01};
const frameB={origin:{x:35,y:0,z:-4200},right:{x:1,y:0,z:0},up:{x:0,y:1,z:0},forward:{x:0,y:0,z:1},focalLength:1.3,near:.01};
const parallax=S.parallaxWitness(universe.objects.slice(0,5),frameA,frameB);
assert.equal(parallax.depthDependent,true,'camera translation did not produce depth-dependent parallax');
assert.ok(parallax.depthSpread>100,'insufficient representative depth spread');
assert.ok(parallax.shiftSpread>1e-6,'insufficient parallax spread');
assert.ok(parallax.nearShift>parallax.farShift,'near point should shift more than far point');

const fixture={
  schema:'ofu-v1x-02-spatial-golden-1',
  version:S.VERSION,
  contract:S.CONTRACT,
  cases:{
    universeSeedA:universe.objects.map(o=>({identity:o.identity,position:compactPosition(o.position)})),
    spiralGalaxySeedB:S.projectEntities({context:'GALAXY',scopeId:'galaxy:spiral-01',entities:entities.slice(0,4).map((e,i)=>({canonicalId:'region:'+i})),presentationSeed:'seed-B',morphology:'BARRED_SPIRAL',densityHint:.74}).objects.map(o=>({identity:o.identity,position:compactPosition(o.position)})),
    irregularRegionSeedC:S.projectEntities({context:'REGION',scopeId:'region:outer-02',entities:entities.slice(0,4).map((e,i)=>({canonicalId:'neighborhood:'+i})),presentationSeed:'seed-C',morphology:'IRREGULAR',densityHint:.41}).objects.map(o=>({identity:o.identity,position:compactPosition(o.position)})),
    parallax:{depthSpread:round(parallax.depthSpread),shiftSpread:round(parallax.shiftSpread),nearShift:round(parallax.nearShift),farShift:round(parallax.farShift),depthDependent:parallax.depthDependent}
  }
};
if(process.argv.includes('--print-fixture')){
  console.log(JSON.stringify(fixture,null,2));
  process.exit(0);
}
const golden=JSON.parse(fs.readFileSync(fixturePath,'utf8'));
assert.equal(JSON.stringify(fixture),JSON.stringify(golden),'golden spatial presentation fixture changed');

const result={status:'PASS',oracle:'v1x02-deterministic-3d-spatial-universe',version:S.VERSION,contexts:[...S.CONTEXTS],objectsChecked:universe.objects.length+12,probeBound:S.MAX_PROBES,queryOrderStable:true,revisitStable:true,nonCoplanar:true,parallaxDepthDependent:true,authority:'PRESENTATION_ONLY'};
console.log(JSON.stringify(result));
