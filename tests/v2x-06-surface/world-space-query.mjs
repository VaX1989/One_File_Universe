import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const ROOT=path.resolve(import.meta.dirname,'../..');
for(const file of ['src/domains/v1/surface/address.js','src/domains/v1/surface/geography.js','src/domains/v1/surface/hydrology.js','src/domains/v1/surface/world-space-query.js'])vm.runInThisContext(fs.readFileSync(path.join(ROOT,file),'utf8'),{filename:file});
const {v2x06SurfaceAddress:A,v2x06Geography:G,v2x06Hydrology:H,v2x06WorldSpaceQuery:Q}=globalThis.OFU;
function service(planetIdentity,planetClass,overrides={}){const model=G.createModel({planetIdentity,planetClass,waterAreaPpm:540000,iceAreaPpm:80000,tectonicActivityPpm:500000,volcanicActivityPpm:220000,impactActivityPpm:160000,erosionActivityPpm:510000,aridityPpm:310000,...overrides}),hydrology=H.createHydrology(model);return{model,hydrology,query:Q.createService({model,hydrology,bounds:{maxBatchQueries:8,maxLevel:Math.min(16,A.MAX_LEVEL)}})}}
const worlds=[service('query-earth','TERRESTRIAL'),service('query-ocean','OCEAN_WORLD',{waterAreaPpm:970000}),service('query-airless','AIRLESS_ROCKY',{waterAreaPpm:0,aridityPpm:1000000,erosionActivityPpm:20000})];
const points=[[12345678,179999900],[-55700000,-179999900],[89900000,120000000],[0,0]];
let continuity=0,queries=0;
for(const w of worlds){
 for(const [lat,lon] of points){
  const a=w.query.queryLatLon(lat,lon,{level:2}),b=w.query.queryLatLon(lat,lon,{level:12}),c=w.query.queryUnit(a.worldSpace.position,{level:7});
  assert.equal(a.locationIdentity,b.locationIdentity);assert.equal(a.locationIdentity,c.locationIdentity);assert.equal(a.worldSpace.kind,'PLANET_CENTERED_UNIT_SPHERE_DERIVED');assert.equal(a.worldSpace.units,'NORMALIZED_PLANET_RADIUS');assert.equal(a.worldSpace.canonicalMeters,false);assert.equal(a.worldSpace.canonicalElevation,false);assert.ok(Math.abs(Math.hypot(...a.worldSpace.position)-1)<1e-12);assert.ok(Math.abs(a.worldSpace.frame.east.reduce((n,v,i)=>n+v*a.worldSpace.frame.up[i],0))<1e-12);assert.equal(a.claims.legacySurfaceWindowFallback,false);assert.equal(a.placement.claims.vegetationEligibilityAssigned,false);assert.equal(a.placement.claims.structureSuitabilityAssigned,false);assert.equal(a.placement.claims.organismPresenceAssigned,false);assert.equal(a.placement.claims.traversalSafetyAssigned,false);queries+=3;
  const witness=w.query.continuityWitness(lat,lon,{globalLevel:2,regionalLevel:7,localLevel:12});assert.ok(witness.pass);assert.deepEqual(witness.levels,[2,7,12,7,2]);assert.equal(witness.claims.samePhysicalElevationProved,false);continuity++;
 }
 const batch=[{latMicroDeg:0,lonMicroDeg:0,level:3},{latMicroDeg:1000000,lonMicroDeg:180000000,level:9},{unit:[1,1,1],level:6}],b1=w.query.queryBatch(batch),b2=w.query.queryBatch(batch);assert.equal(b1.witness.digest,b2.witness.digest);assert.deepEqual(b1.witness.locations,b2.witness.locations);assert.equal(b1.witness.count,3);assert.equal(b1.witness.maxBatchQueries,8);
 assert.throws(()=>w.query.queryBatch(Array.from({length:9},()=>({latMicroDeg:0,lonMicroDeg:0}))),/batch budget exceeded/);
}
const earth=worlds[0];
const wrapA=earth.query.queryLatLon(1000000,180000000,{level:5}),wrapB=earth.query.queryLatLon(1000000,-180000000,{level:11});assert.equal(wrapA.locationIdentity,wrapB.locationIdentity);
const northA=earth.query.queryLatLon(90000000,120000000,{level:4}),northB=earth.query.queryLatLon(90000000,-70000000,{level:14});assert.equal(northA.locationIdentity,northB.locationIdentity);
let legacyReads=0;Object.defineProperty(globalThis,'surfaceWindow',{configurable:true,get(){legacyReads++;throw new Error('legacy surfaceWindow accessed')}});const noFallback=earth.query.queryLatLon(-12000000,77000000,{level:10});delete globalThis.surfaceWindow;assert.equal(legacyReads,0);assert.equal(noFallback.claims.legacySurfaceWindowFallback,false);
const foreign=service('query-foreign','TERRESTRIAL');assert.throws(()=>Q.createService({model:earth.model,hydrology:foreign.hydrology}),/planet mismatch/);
assert.throws(()=>earth.query.queryUnit([0,0,0]),/non-zero vector/);assert.throws(()=>earth.query.queryUnit([1,NaN,0]),/finite 3-vector/);
console.log(JSON.stringify({schema:'ofu-v2x-06-world-space-query-oracle-1',status:'PASS',worlds:worlds.map(w=>w.model.planetIdentity),queries,continuityWitnesses:continuity,legacySurfaceWindowReads:legacyReads,authority:Q.AUTHORITY,sourceAuthority:Q.SOURCE_AUTHORITY,claims:{canonicalMeters:false,canonicalElevation:false,consumerEligibilityAssigned:false}},null,2));
