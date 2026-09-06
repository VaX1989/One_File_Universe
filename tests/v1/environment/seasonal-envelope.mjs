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
vm.runInThisContext(fs.readFileSync('src/domains/v1/convergence/world-context.js','utf8'),{filename:'src/domains/v1/convergence/world-context.js'});
vm.runInThisContext(fs.readFileSync('src/domains/v1/environment/seasonal-envelope.js','utf8'),{filename:'src/domains/v1/environment/seasonal-envelope.js'});
const E=OFU.v1PlanetEnvironment,W=OFU.v1WorldContext,S=OFU.v1SeasonalEnvironment,id=c=>c.repeat(64);
const input={planetIdentity:id('a'),bulkPriorClass:'TERRESTRIAL',stellarLuminosityMilliSolar:1000,stellarTemperatureK:5772,orbitMilliAu:1000,massMilliEarth:1000,radiusKm:6371,ageMyr:4500,eccentricityPpm:16700,obliquityMilliDeg:23440,rotationPeriodMilliHours:23934,tidalHeatingPpm:0,xuvMilliWm2:4500};
const planet=E.enrich({},input),point=W.location(planet.planetIdentity,35000000,12000000);
const a=S.summarize(planet,point),b=S.summarize(planet,point);
assert.deepEqual(a,b);
assert.equal(a.authority.class,'MODEL_DERIVED_SIMULATION');
assert.equal(a.sampleCount,4);assert.equal(a.maxSamples,4);assert.deepEqual(a.seasonMarksPpm,[0,250000,500000,750000]);
assert.equal(a.snapshots.length,4);assert.ok(a.snapshots.every(x=>x.locationIdentity===point.locationIdentity));
assert.equal(a.temperatureMilliK.amplitude,a.temperatureMilliK.max-a.temperatureMilliK.min);
assert.equal(a.precipitationPotentialPpm.amplitude,a.precipitationPotentialPpm.max-a.precipitationPotentialPpm.min);
assert.equal(a.waterActivityPpm.amplitude,a.waterActivityPpm.max-a.waterActivityPpm.min);
assert.ok(a.mediumAvailableSeasons>=0&&a.mediumAvailableSeasons<=4);assert.ok(a.surfaceStateTransitions>=0&&a.surfaceStateTransitions<=4);
assert.equal(a.bounded,true);assert.equal(a.globalEnumeration,false);assert.equal(a.weatherForecastClaim,false);assert.equal(a.measuredClimateClaim,false);assert.equal(a.canonicalClimateClaim,false);assert.equal(a.p4HistoryMutated,false);assert.equal(a.canonicalP5Unchanged,true);assert.equal(a.canonicalP6Unchanged,true);
for(const s of a.snapshots){assert.ok(Number.isInteger(s.localMeanTemperatureMilliK));assert.ok(s.waterActivityPpm>=0&&s.waterActivityPpm<=1000000);assert.equal(s.authority,'MODEL_DERIVED_SIMULATION');}
const tilted=E.enrich({}, {...input,planetIdentity:id('b'),obliquityMilliDeg:70000}),tiltedPoint=W.location(tilted.planetIdentity,35000000,12000000),tiltedEnvelope=S.summarize(tilted,tiltedPoint);
assert.ok(tiltedEnvelope.temperatureMilliK.amplitude>a.temperatureMilliK.amplitude,'higher modeled obliquity should increase the reduced-order seasonal temperature envelope at the same modeled latitude');
const giant=E.enrich({}, {...input,planetIdentity:id('c'),bulkPriorClass:'GAS_GIANT',orbitMilliAu:5200,massMilliEarth:318000,radiusKm:69911}),giantPoint=W.location(giant.planetIdentity,0,0),giantEnvelope=S.summarize(giant,giantPoint);
assert.equal(giantEnvelope.mediumAvailableSeasons,0);assert.equal(giantEnvelope.surfaceStateTransitions,0);assert.deepEqual(giantEnvelope.surfaceStates,['NO_SOLID_SURFACE_REFERENCE']);
const world={planetIdentity:planet.planetIdentity,planetology:planet,biology:{ecosystem:{state:'NO_MODELED_BIOSPHERE'},intelligence:{candidates:[]}},civilization:{settlements:[],technology:{materials:0}}};
const wrapped=W.localContext(world,point,{seasonPpm:250000});
assert.equal(wrapped.planetIdentity,planet.planetIdentity);assert.equal(wrapped.surface.location.locationIdentity,point.locationIdentity);assert.equal(wrapped.seasonalEnvironment.locationIdentity,point.locationIdentity);assert.equal(wrapped.seasonalEnvironment.sampleCount,4);assert.equal(wrapped.committedCanonicalHistory,false);assert.equal(wrapped.canonicalP6Unchanged,true);
assert.throws(()=>S.summarize(planet,W.location(id('d'),0,0)),/exact world\/location identity/);
console.log(JSON.stringify({status:'PASS',suite:'v1.1 seasonal environment envelope',version:S.VERSION,samples:a.sampleCount,temperatureAmplitudeMilliK:a.temperatureMilliK.amplitude,tiltedAmplitudeMilliK:tiltedEnvelope.temperatureMilliK.amplitude,authority:a.authority.class}));
