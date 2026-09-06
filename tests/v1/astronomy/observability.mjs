import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
globalThis.OFU={};
for(const f of [
  'src/kernel/sha256.js','src/extensions/contracts.js','src/domains/v1/common.js',
  'src/domains/v1/astronomy.js','src/domains/v1/astronomy/depth.js'
])vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const input={universeId:'universe-v11-observe',galaxyCell:'g:0',regionCell:'r:0',systemAddress:'s:0',stellarOrdinal:0,environmentPpm:620000,radialPpm:420000,heightPpm:90000};
const before=OFU.v1Astronomy.systemBirthContext(input);
vm.runInThisContext(fs.readFileSync('src/domains/v1/astronomy/observability.js','utf8'),{filename:'src/domains/v1/astronomy/observability.js'});
const A=OFU.v1Astronomy,O=OFU.v1AstronomyObservability,after=A.systemBirthContext(input),again=A.systemBirthContext(input);
assert.deepEqual(after,again);
assert.deepEqual(after.ids,before.ids);assert.deepEqual(after.primary,before.primary);assert.deepEqual(after.multiplicity,before.multiplicity);
assert.equal(after.observability.authority.class,'MODEL_DERIVED_SIMULATION');assert.equal(after.observability.canonicalPromotion,false);
assert.equal(after.observability.referenceSeries.length,3);assert.ok(after.observability.referenceSeries.length<=O.MAX_REFERENCE_FRAMES);
assert.deepEqual(after.observability.referenceSeries.map(x=>x.distanceMilliPc),[10000,100000,1000000]);
for(const x of after.observability.referenceSeries){
 assert.equal(x.referenceDistanceOnly,true);assert.equal(x.actualObserverDistanceClaim,false);assert.equal(x.surveyCompletenessProbability,undefined);
 assert.equal(x.probability,false);assert.equal(x.measured,false);assert.equal(x.canonicalClaim,false);assert.equal(x.bandpassPhotometry,false);assert.equal(x.extinctionModeled,false);
 assert.ok(Number.isInteger(x.detectabilityScorePpm)&&x.detectabilityScorePpm>=0&&x.detectabilityScorePpm<=1000000);
}
for(let i=1;i<after.observability.referenceSeries.length;i++){
 assert.ok(after.observability.referenceSeries[i].parallaxMicroArcsec<=after.observability.referenceSeries[i-1].parallaxMicroArcsec);
 assert.ok(after.observability.referenceSeries[i].detectabilityScorePpm<=after.observability.referenceSeries[i-1].detectabilityScorePpm);
}
const solar={luminosityMilliSolar:1000};
const ten=O.atDistance(solar,{distanceMilliPc:10000,crowdingPpm:0}),hundred=O.atDistance(solar,{distanceMilliPc:100000,crowdingPpm:0});
assert.equal(ten.relativeFluxAt10PcPpm,1000000);assert.equal(ten.parallaxMicroArcsec,100000);assert.equal(hundred.relativeFluxAt10PcPpm,10000);assert.equal(hundred.parallaxMicroArcsec,10000);
assert.ok(ten.detectabilityScorePpm>hundred.detectabilityScorePpm);
const clear=O.atDistance(solar,{distanceMilliPc:10000,crowdingPpm:0}),crowded=O.atDistance(solar,{distanceMilliPc:10000,crowdingPpm:900000});assert.ok(clear.detectabilityScorePpm>crowded.detectabilityScorePpm);
assert.throws(()=>O.atDistance(solar,{distanceMilliPc:0,crowdingPpm:0}));
assert.equal(after.observability.researchLineage.researchAuthorityPromoted,false);assert.equal(after.observability.surveyCompletenessProbability,false);assert.equal(after.observability.observationalCatalogClaim,false);
console.log(JSON.stringify({status:'PASS',suite:'v1.1 astronomy observability',version:O.VERSION,system:after.ids.stellarSystemIdentity,frames:after.observability.referenceSeries.length}));
