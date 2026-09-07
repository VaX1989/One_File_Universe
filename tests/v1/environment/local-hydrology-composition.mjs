import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
globalThis.OFU={};
for(const f of [
  'src/kernel/sha256.js','src/extensions/contracts.js','src/domains/v1/common.js',
  'src/domains/v1/planetology/causal-system.js','src/domains/v1/environment/world-system.js'
])vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const readiness=Object.freeze({nutrientAvailabilityPpm:500000,disturbancePpm:120000,freeEnergyAvailabilityPpm:650000,environmentPersistencePpm:740000});
OFU.v1Biology=Object.freeze({environmentFromPlanetology(){return readiness;},environmentEligibility(){return {eligible:false,readiness:{opportunityScorePpm:0}};},morphologyHints(){return {};}});
OFU.v1LifeProvider=Object.freeze({queryRegion(){return Object.freeze({});},queryLocal(){return Object.freeze({populations:Object.freeze([])});},buildFromEnvironment(){return Object.freeze({ecosystem:Object.freeze({state:'NO_MODELED_BIOSPHERE'}),intelligence:Object.freeze({candidates:Object.freeze([])})});}});
OFU.v1Ecology=Object.freeze({answers(){return Object.freeze({});}});
OFU.v1CivilizationRuntime=Object.freeze({});
for(const f of [
  'src/domains/v1/convergence/world-context.js',
  'src/domains/v1/planetology/causality-trace.js',
  'src/domains/v1/planetology/volatile-ledger.js',
  'src/domains/v1/environment/seasonal-envelope.js',
  'src/domains/v1/environment/local-hydrology.js'
])vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const E=OFU.v1PlanetEnvironment,W=OFU.v1WorldContext,id=c=>c.repeat(64);
const input={planetIdentity:id('c'),bulkPriorClass:'TERRESTRIAL',stellarLuminosityMilliSolar:1000,stellarTemperatureK:5772,orbitMilliAu:1000,massMilliEarth:1000,radiusKm:6371,ageMyr:4500,eccentricityPpm:16700,obliquityMilliDeg:23440,rotationPeriodMilliHours:23934,tidalHeatingPpm:0,xuvMilliWm2:4500};
const planet=E.enrich({},input),point=W.location(planet.planetIdentity,18000000,-75000000);
const world={planetIdentity:planet.planetIdentity,planetology:planet,biology:{ecosystem:{state:'NO_MODELED_BIOSPHERE'},intelligence:{candidates:[]}},civilization:{settlements:[],technology:{materials:0}}};
const a=W.localContext(world,point,{seasonPpm:500000}),b=W.localContext(world,point,{seasonPpm:500000});
assert.deepEqual(a,b);
assert.equal(a.planetIdentity,planet.planetIdentity);
assert.equal(a.planetaryCausality.authority.class,'MODEL_DERIVED_SIMULATION');
assert.equal(a.planetaryCausality.canonicalClaim,false);
assert.equal(a.volatileLedger.authority.class,'MODEL_DERIVED_SIMULATION');
assert.equal(a.volatileLedger.supported,true);
assert.equal(a.volatileLedger.closure.exactInternalClosure,true);
assert.equal(a.seasonalEnvironment.authority.class,'MODEL_DERIVED_SIMULATION');
assert.equal(a.seasonalEnvironment.sampleCount,4);
assert.equal(a.localHydrology.authority.class,'MODEL_DERIVED_SIMULATION');
assert.equal(a.localHydrology.probes.length,9);
assert.equal(a.localHydrology.probes[0].sampleLocationIdentity,a.surface.location.locationIdentity);
assert.equal(a.localHydrology.bounds.additionalSurfaceQueries,8);
assert.equal(a.committedCanonicalHistory,false);assert.equal(a.canonicalP6Unchanged,true);
assert.equal(a.planetaryCausality.researchLineage.researchAuthorityPromoted,false);
assert.equal(a.volatileLedger.researchLineage.researchAuthorityPromoted,false);
assert.equal(a.seasonalEnvironment.researchLineage.researchAuthorityPromoted,false);
assert.equal(a.localHydrology.researchLineage.researchAuthorityPromoted,false);
console.log(JSON.stringify({status:'PASS',suite:'v1.1 environment wrapper composition',fields:['planetaryCausality','volatileLedger','seasonalEnvironment','localHydrology'],volatileClosure:a.volatileLedger.closure.exactInternalClosure,hydrologyProbes:a.localHydrology.probes.length}));
