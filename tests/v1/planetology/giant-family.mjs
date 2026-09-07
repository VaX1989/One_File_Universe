import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
globalThis.OFU={};
for(const f of [
  'src/kernel/sha256.js','src/extensions/contracts.js','src/domains/v1/common.js',
  'src/domains/v1/planetology/causal-system.js','src/domains/v1/environment/world-system.js',
  'src/domains/v1/planetology/giant-family.js'
])vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const E=OFU.v1PlanetEnvironment,G=OFU.v1GiantFamily,id=c=>c.repeat(64);
const base={planetIdentity:id('g'),bulkPriorClass:'GAS_GIANT',stellarLuminosityMilliSolar:1000,stellarTemperatureK:5772,orbitMilliAu:5200,massMilliEarth:318000,radiusKm:69911,ageMyr:4500,eccentricityPpm:48000,obliquityMilliDeg:3100,rotationPeriodMilliHours:9900,tidalHeatingPpm:0,xuvMilliWm2:1200};
const a=E.enrich({},base),b=E.enrich({},base),ctx=a.giantFamily;
assert.deepEqual(a,b);assert.equal(ctx.supported,true);assert.equal(ctx.authority.class,'MODEL_DERIVED_SIMULATION');assert.equal(ctx.family,'JOVIAN_CANDIDATE');
assert.equal(ctx.bulkPriorClass,'GAS_GIANT');assert.equal(ctx.massMilliEarth,318000);assert.equal(ctx.radiusPrediction,null);assert.equal(ctx.atmospherePrediction,null);assert.equal(ctx.coolingTrackPrediction,null);
assert.equal(ctx.canonicalCompositionClaim,false);assert.equal(ctx.observationalClassificationClaim,false);assert.equal(ctx.populationCalibrationClaim,false);assert.equal(ctx.canonicalPromotion,false);assert.equal(ctx.p4Mutation,false);assert.equal(ctx.canonicalP5Unchanged,true);assert.equal(ctx.canonicalP6Unchanged,true);
assert.equal(ctx.compositionProxy.heavyElementFractionPpm+ctx.compositionProxy.lightVolatilePpm,1000000);assert.equal(ctx.compositionProxy.heavyElementMassMilliEarth,Math.floor(ctx.massMilliEarth*ctx.compositionProxy.heavyElementFractionPpm/1000000));assert.equal(ctx.compositionProxy.physicalAbundanceInferenceClaim,false);
assert.equal(ctx.irradiation.familyBinAffected,false);assert.ok(['LOW_MODELED_IRRADIATION','MODERATE_MODELED_IRRADIATION','HIGH_MODELED_IRRADIATION','EXTREME_MODELED_IRRADIATION'].includes(ctx.irradiation.class));
assert.equal(ctx.researchLineage.researchAuthorityPromoted,false);
assert.equal(G.familyForMass(20000),'NEPTUNE_MASS_GIANT_CANDIDATE');assert.equal(G.familyForMass(59999),'NEPTUNE_MASS_GIANT_CANDIDATE');assert.equal(G.familyForMass(60000),'SUB_SATURN_CANDIDATE');assert.equal(G.familyForMass(149999),'SUB_SATURN_CANDIDATE');assert.equal(G.familyForMass(150000),'JOVIAN_CANDIDATE');assert.equal(G.familyForMass(699999),'JOVIAN_CANDIDATE');assert.equal(G.familyForMass(700000),'SUPER_JOVIAN_CANDIDATE');assert.equal(G.familyForMass(6356000),'SUPER_JOVIAN_CANDIDATE');
const ice=E.enrich({}, {...base,planetIdentity:id('i'),bulkPriorClass:'ICE_GIANT',massMilliEarth:30000,radiusKm:24500,orbitMilliAu:19000});assert.equal(ice.giantFamily.supported,true);assert.equal(ice.giantFamily.family,'NEPTUNE_MASS_GIANT_CANDIDATE');assert.equal(ice.giantFamily.bulkPriorClass,'ICE_GIANT');
const subSaturn=E.enrich({}, {...base,planetIdentity:id('s'),massMilliEarth:90000,radiusKm:42000});assert.equal(subSaturn.giantFamily.family,'SUB_SATURN_CANDIDATE');
const superJovian=E.enrich({}, {...base,planetIdentity:id('j'),massMilliEarth:900000,radiusKm:80000});assert.equal(superJovian.giantFamily.family,'SUPER_JOVIAN_CANDIDATE');
const terrestrial=E.enrich({}, {...base,planetIdentity:id('t'),bulkPriorClass:'TERRESTRIAL',massMilliEarth:1000,radiusKm:6371,orbitMilliAu:1000});assert.equal(terrestrial.giantFamily.supported,false);assert.equal(terrestrial.giantFamily.reason,'NON_GIANT_BULK_PRIOR');
const small=E.enrich({}, {...base,planetIdentity:id('m'),massMilliEarth:15000,radiusKm:18000});assert.equal(small.giantFamily.supported,false);assert.equal(small.giantFamily.reason,'OUTSIDE_RESEARCH_MASS_ENVELOPE');assert.equal(small.giantFamily.minMassMilliEarth,20000);
const huge=E.enrich({}, {...base,planetIdentity:id('x'),massMilliEarth:7000000,radiusKm:90000});assert.equal(huge.giantFamily.supported,false);assert.equal(huge.giantFamily.reason,'OUTSIDE_RESEARCH_MASS_ENVELOPE');assert.equal(huge.giantFamily.maxMassMilliEarth,6356000);
assert.throws(()=>G.familyForMass(19999),/giant family massMilliEarth/);assert.throws(()=>G.familyForMass(6356001),/giant family massMilliEarth/);
assert.equal(G.irradiationClass(99999),'LOW_MODELED_IRRADIATION');assert.equal(G.irradiationClass(100000),'MODERATE_MODELED_IRRADIATION');assert.equal(G.irradiationClass(1000000),'HIGH_MODELED_IRRADIATION');assert.equal(G.irradiationClass(10000000),'EXTREME_MODELED_IRRADIATION');
console.log(JSON.stringify({status:'PASS',suite:'v1.1 giant family context',version:G.VERSION,jovian:ctx.family,ice:ice.giantFamily.family,subSaturn:subSaturn.giantFamily.family,superJovian:superJovian.giantFamily.family}));
