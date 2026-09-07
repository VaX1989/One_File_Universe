import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
globalThis.OFU={};
for(const f of [
  'src/kernel/sha256.js','src/extensions/contracts.js','src/domains/v1/common.js',
  'src/domains/v1/planetology/causal-system.js','src/domains/v1/environment/world-system.js'
])vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const baseReadiness=Object.freeze({nutrientAvailabilityPpm:520000,disturbancePpm:110000,freeEnergyAvailabilityPpm:680000,environmentPersistencePpm:760000});
OFU.v1Biology=Object.freeze({
  environmentFromPlanetology(){return baseReadiness;},
  environmentEligibility(){return {eligible:false,readiness:{opportunityScorePpm:0}};},
  morphologyHints(){return {};}
});
OFU.v1LifeProvider=Object.freeze({
  queryRegion(){return Object.freeze({});},
  queryLocal(){return Object.freeze({populations:Object.freeze([])});},
  buildFromEnvironment(){return Object.freeze({ecosystem:Object.freeze({state:'NO_MODELED_BIOSPHERE'}),intelligence:Object.freeze({candidates:Object.freeze([])})});}
});
OFU.v1Ecology=Object.freeze({answers(){return Object.freeze({});}});
OFU.v1CivilizationRuntime=Object.freeze({});
for(const f of [
  'src/domains/v1/convergence/world-context.js',
  'src/domains/v1/environment/seasonal-envelope.js',
  'src/domains/v1/environment/local-hydrology.js'
])vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const E=OFU.v1PlanetEnvironment,W=OFU.v1WorldContext,H=OFU.v1LocalHydrology,id=c=>c.repeat(64);
const input={planetIdentity:id('h'),bulkPriorClass:'TERRESTRIAL',stellarLuminosityMilliSolar:1000,stellarTemperatureK:5772,orbitMilliAu:1000,massMilliEarth:1000,radiusKm:6371,ageMyr:4500,eccentricityPpm:16700,obliquityMilliDeg:23440,rotationPeriodMilliHours:23934,tidalHeatingPpm:0,xuvMilliWm2:4500};
const planet=E.enrich({},input),point=W.location(planet.planetIdentity,22000000,179400000),a=H.summarize(planet,point,{seasonPpm:250000}),b=H.summarize(planet,point,{seasonPpm:250000});
assert.deepEqual(a,b);
assert.equal(a.authority.class,'MODEL_DERIVED_SIMULATION');assert.equal(a.canonicalPromotion,false);assert.equal(a.measured,false);
assert.equal(a.physicalFlowPathClaim,false);assert.equal(a.watershedBoundaryClaim,false);assert.equal(a.riverNetworkClaim,false);assert.equal(a.floodRiskClaim,false);
assert.equal(a.probes.length,9);assert.equal(a.bounds.maxProbes,9);assert.equal(a.bounds.materializedProbes,9);assert.equal(a.bounds.additionalSurfaceQueries,9);assert.equal(a.bounds.globalEnumeration,false);
assert.deepEqual(a.probes.map(p=>p.label),['CENTER','N','S','E','W','NE','NW','SE','SW']);
assert.equal(a.summary.distinctLocations,9);assert.ok(a.summary.reliefMeters>=0);assert.ok(a.summary.waterActivityRangePpm.amplitude>=0);
assert.ok(a.summary.wetProbeCount>=0&&a.summary.wetProbeCount<=9);assert.ok(a.summary.liquidProbeCount>=0&&a.summary.liquidProbeCount<=9);assert.ok(a.summary.surfaceStateTransitions>=0&&a.summary.surfaceStateTransitions<=8);
assert.equal(a.summary.measuredHydrologyClaim,false);assert.equal(a.summary.physicalDrainageNetworkClaim,false);assert.equal(a.summary.watershedBoundaryClaim,false);
for(const p of a.probes){assert.ok(p.latMicroDeg>=-90000000&&p.latMicroDeg<=90000000);assert.ok(p.lonMicroDeg>=-180000000&&p.lonMicroDeg<180000000);assert.ok(p.waterActivityPpm>=0&&p.waterActivityPpm<=1000000);assert.equal(p.authority,'MODEL_DERIVED_SIMULATION');}
if(a.summary.descentWitness){const target=a.probes.find(p=>p.sourceLocationIdentity===a.summary.descentWitness.toLocationIdentity);assert.ok(target);assert.equal(a.summary.descentWitness.elevationDropMeters,a.summary.center.elevationMeters-target.elevationMeters);assert.ok(a.summary.descentWitness.elevationDropMeters>0);assert.equal(a.summary.descentWitness.physicalFlowPathClaim,false);}
const labels=['CENTER','N','S','E','W','NE','NW','SE','SW'];
const elevations={CENTER:100,N:140,S:95,E:80,W:20,NE:130,NW:70,SE:60,SW:45};
const fixture=labels.map((label,i)=>({label,sourceLocationIdentity:'p'+i,sampleLocationIdentity:'s'+i,latMicroDeg:0,lonMicroDeg:i,elevationMeters:elevations[label],slopePpm:0,runoffPpm:label==='W'?500000:10000,precipitationPotentialPpm:0,waterContentPpm:0,subsurfaceIcePotentialPpm:0,waterActivityPpm:['CENTER','W','SW'].includes(label)?400000:10000,surfaceState:'LAND_OR_EXPOSED_SUBSTRATE',surfaceLiquid:false,solidSurface:true,authority:'MODEL_DERIVED_SIMULATION'}));
const synthetic=H.analyze(planet.planetIdentity,point,fixture);
assert.equal(synthetic.descentWitness.direction,'W');assert.equal(synthetic.descentWitness.elevationDropMeters,80);assert.equal(synthetic.wetProbeCount,3);assert.equal(synthetic.contextClass,'MODELED_WET_DRAINAGE_POTENTIAL');
const world={planetIdentity:planet.planetIdentity,planetology:planet,biology:{ecosystem:{state:'NO_MODELED_BIOSPHERE'},intelligence:{candidates:[]}},civilization:{settlements:[],technology:{materials:0}}};
const wrapped=W.localContext(world,point,{seasonPpm:250000});
assert.equal(wrapped.planetIdentity,planet.planetIdentity);assert.equal(wrapped.seasonalEnvironment.sampleCount,4);assert.equal(wrapped.localHydrology.probes.length,9);assert.equal(wrapped.localHydrology.bounds.additionalSurfaceQueries,8);assert.equal(wrapped.localHydrology.probes[0].sampleLocationIdentity,wrapped.surface.location.locationIdentity);
const polarPoint=W.location(planet.planetIdentity,90000000,179900000),polar=H.summarize(planet,polarPoint);
assert.equal(polar.probes.length,9);assert.ok(polar.summary.distinctLocations>=3&&polar.summary.distinctLocations<=9);assert.ok(polar.probes.every(p=>p.latMicroDeg>=-90000000&&p.latMicroDeg<=90000000&&p.lonMicroDeg>=-180000000&&p.lonMicroDeg<180000000));
const giant=E.enrich({}, {...input,planetIdentity:id('g'),bulkPriorClass:'GAS_GIANT',orbitMilliAu:5200,massMilliEarth:318000,radiusKm:69911}),giantPoint=W.location(giant.planetIdentity,0,0),gas=H.summarize(giant,giantPoint);
assert.equal(gas.summary.contextClass,'NO_SOLID_SURFACE_REFERENCE');assert.equal(gas.summary.descentWitness,null);assert.equal(gas.summary.reliefMeters,0);assert.ok(gas.probes.every(p=>p.solidSurface===false));
assert.throws(()=>H.summarize(planet,W.location(id('x'),0,0)),/exact world\/location identity/);
assert.throws(()=>H.analyze(planet.planetIdentity,point,fixture.slice(0,8)),/exact probe bound/);
console.log(JSON.stringify({status:'PASS',suite:'v1.1 local hydrology context',version:H.VERSION,probes:a.probes.length,class:a.summary.contextClass,reliefMeters:a.summary.reliefMeters,gasClass:gas.summary.contextClass}));
