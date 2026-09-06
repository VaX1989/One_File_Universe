import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const ROOT=path.resolve(import.meta.dirname,'../../..');
globalThis.OFU={};
for(const rel of [
  'src/kernel/sha256.js','src/extensions/contracts.js','src/domains/v1/common.js',
  'src/domains/v1/planetology/causal-system.js','src/domains/v1/environment/world-system.js',
  'src/domains/v1/biology.js','src/domains/v1/biology/provider.js','src/domains/v1/ecology/query.js',
  'src/domains/v1/society/population.js','src/domains/v1/history/system.js','src/domains/v1/civilization.js',
  'src/domains/v1/civilization/foundation.js','src/domains/v1/civilization/economy-culture.js',
  'src/domains/v1/civilization/politics-conflict.js','src/domains/v1/civilization/runtime.js',
  'src/domains/v1/convergence/world-context.js','src/domains/v1/planetology/causality-trace.js'
]) vm.runInThisContext(fs.readFileSync(path.join(ROOT,rel),'utf8'),{filename:rel});
const E=OFU.v1PlanetEnvironment,T=OFU.v1PlanetaryCausalityTrace,W=OFU.v1WorldContext,id=c=>c.repeat(64);
const input={planetIdentity:id('a'),bulkPriorClass:'TERRESTRIAL',stellarLuminosityMilliSolar:1000,stellarTemperatureK:5772,orbitMilliAu:1000,massMilliEarth:1000,radiusKm:6371,ageMyr:4500,eccentricityPpm:16700,obliquityMilliDeg:23440,rotationPeriodMilliHours:23934,tidalHeatingPpm:0,xuvMilliWm2:4500};
const planet=E.enrich({},input),point=W.location(planet.planetIdentity,12500000,44000000),surface=W.sample(planet,point,250000),a=T.summarize(planet,surface),b=T.summarize(planet,surface);
assert.deepEqual(a,b);
assert.equal(a.authority.class,'MODEL_DERIVED_SIMULATION');
assert.equal(a.canonicalClaim,false);assert.equal(a.physicalConservationClaim,false);
assert.equal(a.global.attributionClosurePpm,1000000);assert.equal(a.global.closureResidualPpm,0);
assert.equal(a.local.attributionClosurePpm,1000000);assert.equal(a.local.closureResidualPpm,0);
assert.deepEqual(a.global.processes.map(x=>x.id),T.ORDER);
assert.ok(a.global.processes.every(x=>Number.isInteger(x.influenceSharePpm)&&x.influenceSharePpm>=0&&x.influenceSharePpm<=1000000));
assert.equal(a.locationIdentity,surface.location.locationIdentity);
assert.equal(a.researchLineage.researchAuthorityPromoted,false);
assert.match(String(W.localContext),/planetaryCausality/,'shipping localContext must consume causality trace');
const dry=E.enrich({}, {...input,planetIdentity:id('b'),stellarLuminosityMilliSolar:1500,orbitMilliAu:300});
const dryTrace=T.summarize(dry,W.sample(dry,W.location(dry.planetIdentity,-30000000,90000000)));
assert.equal(dryTrace.global.attributionClosurePpm,1000000);
assert.notDeepEqual(dryTrace.global.processes,a.global.processes);
const normalized=T.normalize([0,0,0,0]);
assert.deepEqual(normalized.map(x=>x.influenceSharePpm),[250000,250000,250000,250000]);
console.log(JSON.stringify({status:'PASS',suite:'planetary causality trace',version:T.VERSION,globalClosure:a.global.attributionClosurePpm,localClosure:a.local.attributionClosurePpm}));
