import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const ROOT=path.resolve(import.meta.dirname,'../../..');
globalThis.OFU={};
for(const rel of ['src/kernel/sha256.js','src/extensions/contracts.js','src/domains/v1/common.js','src/domains/v1/planetology/causal-system.js','src/domains/v1/environment/world-system.js'])vm.runInThisContext(fs.readFileSync(path.join(ROOT,rel),'utf8'),{filename:rel});
const E=OFU.v1PlanetEnvironment,id=c=>c.repeat(64);
const base={planetIdentity:id('e'),bulkPriorClass:'TERRESTRIAL',stellarLuminosityMilliSolar:1000,stellarTemperatureK:5772,orbitMilliAu:1000,massMilliEarth:1000,radiusKm:6371,ageMyr:4500,eccentricityPpm:16700,obliquityMilliDeg:23440,rotationPeriodMilliHours:23934,tidalHeatingPpm:0,xuvMilliWm2:4500};
const state=E.enrich({},base),r={latMicroDeg:12345678,lonMicroDeg:87654321,detailLevel:8,time:{seasonPpm:250000,p4Seconds:'123456789'}},a=E.sampleSurface(state,r),b=E.sampleSurface(state,r);
assert.deepEqual(a,b);assert.equal(a.worldIdentity,state.planetIdentity);assert.equal(a.time.authority,'P4_COORDINATE_CONSUMED_NOT_MUTATED');assert.equal(a.authority.class,'MODEL_DERIVED_SIMULATION');assert.equal(a.budget.globalEnumeration,false);assert.ok(a.budget.usedOperations<=E.MAX_QUERY.operations);
assert.notEqual(a.location.locationIdentity,E.sampleSurface(state,{...r,lonMicroDeg:r.lonMicroDeg+1}).location.locationIdentity);
const lo=E.sampleSurface(state,{latMicroDeg:10000000,lonMicroDeg:20000000,detailLevel:4}),hi=E.sampleSurface(state,{latMicroDeg:10000000,lonMicroDeg:20000000,detailLevel:8});assert.deepEqual(hi.topography.bands.slice(0,lo.topography.bands.length),lo.topography.bands);
const hot=E.enrich({}, {...base,planetIdentity:id('f'),stellarLuminosityMilliSolar:1400,orbitMilliAu:220,massMilliEarth:1200,radiusKm:6500,ageMyr:3000});assert.equal(hot.hydrology.liquidSurfaceEligible,false);assert.ok(hot.climate.meanSurfaceTemperatureMilliK>390000);
const icy=E.enrich({}, {...base,planetIdentity:id('1'),bulkPriorClass:'VOLATILE_RICH',stellarLuminosityMilliSolar:600,orbitMilliAu:5200,massMilliEarth:800,radiusKm:6000,ageMyr:6000});assert.ok(icy.cryosphere.iceCoverPpm>0);assert.ok(icy.climate.meanSurfaceTemperatureMilliK<245000);
const ocean=E.enrich({}, {...base,planetIdentity:id('2'),bulkPriorClass:'VOLATILE_RICH',stellarLuminosityMilliSolar:900,orbitMilliAu:1100,massMilliEarth:1800,radiusKm:8200,ageMyr:4000});assert.equal(ocean.hydrology.liquidSurfaceEligible,true);assert.ok(ocean.hydrology.oceanFractionPpm>0);
const giant=E.enrich({}, {...base,planetIdentity:id('3'),bulkPriorClass:'GAS_GIANT',orbitMilliAu:5200,massMilliEarth:318000,radiusKm:69911}),gs=E.sampleSurface(giant,{latMicroDeg:0,lonMicroDeg:0,detailLevel:10});assert.equal(giant.hydrology.oceanFractionPpm,0);assert.equal(giant.cryosphere.iceCoverPpm,0);assert.equal(gs.topography.elevationMeters,0);assert.equal(gs.hydrology.surfaceState,'NO_SOLID_SURFACE_REFERENCE');assert.equal(gs.material.materialFamily,'NO_SOLID_SURFACE_CLOUD_DECK');
const mat=E.sampleMaterial(state,{latMicroDeg:-34000000,lonMicroDeg:151000000,detailLevel:6});assert.equal(mat.material.organicContributionPpm,0);assert.equal(mat.material.requiresBiologyForOrganicMatter,true);
const hist=E.modelHistory(state,{fromAgeMyr:500,toAgeMyr:4500,steps:16});assert.equal(hist.snapshots.length,16);assert.equal(hist.p4HistoryMutated,false);assert.ok(hist.snapshots[0].heatIndexPpm>hist.snapshots.at(-1).heatIndexPpm);
const props=E.eventProposals(state,{fromAgeMyr:500,toAgeMyr:4500,steps:16});assert.ok(props.proposals.length<=E.MAX_QUERY.proposals);assert.equal(props.p4HistoryMutated,false);for(const p of props.proposals){assert.equal(p.requiresP4Admission,true);assert.equal(p.canonicalMutation,false);}
for(const q of [E.inspectWorld(state),E.sampleRegionalGeology(state,r),E.sampleClimate(state,r),E.sampleHydrology(state,r),E.sampleMaterial(state,r),E.requestEnvironment(state,r)]){assert.equal(q.worldIdentity,state.planetIdentity);assert.equal(q.authority.class,'MODEL_DERIVED_SIMULATION');assert.equal(q.budget.globalEnumeration,false);}
console.log(JSON.stringify({status:'PASS',suite:'v1 environment world-system',version:E.VERSION,historySamples:hist.snapshots.length,proposals:props.proposals.length}));
