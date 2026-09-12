import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
globalThis.OFU={};
for(const f of [
  'src/kernel/sha256.js','src/extensions/contracts.js','src/domains/v1/common.js',
  'src/domains/v1/planetology/causal-system.js','src/domains/v1/environment/world-system.js',
  'src/domains/v1/biology.js','src/domains/v1/biology/provider.js','src/domains/v1/ecology/query.js',
  'src/domains/v1/society/population.js','src/domains/v1/history/system.js','src/domains/v1/civilization.js',
  'src/domains/v1/civilization/foundation.js','src/domains/v1/civilization/economy-culture.js',
  'src/domains/v1/civilization/politics-conflict.js','src/domains/v1/civilization/runtime.js',
  'src/domains/v1/convergence/world-context.js','src/domains/v1/planetology/causality-trace.js',
  'src/domains/v1/planetology/volatile-ledger.js'
])vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const E=OFU.v1PlanetEnvironment,L=OFU.v1VolatileLedger,W=OFU.v1WorldContext,id=c=>c.repeat(64);
const input={planetIdentity:id('v'),bulkPriorClass:'VOLATILE_RICH',stellarLuminosityMilliSolar:1000,stellarTemperatureK:5772,orbitMilliAu:1000,massMilliEarth:1500,radiusKm:7600,ageMyr:4500,eccentricityPpm:16700,obliquityMilliDeg:23440,rotationPeriodMilliHours:23934,tidalHeatingPpm:0,xuvMilliWm2:4500};
const a=E.enrich({},input),b=E.enrich({},input);assert.deepEqual(a,b);assert.ok(a.volatileLedger.supported);assert.equal(a.volatileLedger.worldIdentity,a.planetIdentity);assert.equal(a.volatileLedger.authority.class,'MODEL_DERIVED_SIMULATION');
assert.equal(a.volatileLedger.closure.exactInternalClosure,true);assert.equal(a.volatileLedger.closure.residualUnits,0);assert.equal(a.volatileLedger.closure.sourceConservedFlag,true);assert.equal(a.volatileLedger.shareClosurePpm,1000000);assert.equal(a.volatileLedger.shares.reduce((n,x)=>n+x.sharePpm,0),1000000);
assert.equal(a.volatileLedger.physicalUnitClaim,false);assert.equal(a.volatileLedger.physicalModelValidationClaim,false);assert.equal(a.volatileLedger.canonicalGenesisClaim,false);assert.equal(a.volatileLedger.canonicalOceanClaim,false);assert.equal(a.volatileLedger.p4Mutation,false);assert.equal(a.volatileLedger.canonicalPromotion,false);
const sum=Object.values(a.volatileLedger.reservoirs).reduce((n,x)=>n+x,0);assert.equal(sum,a.volatileLedger.initialInventoryUnits);
const hot=E.enrich({}, {...input,planetIdentity:id('x'),orbitMilliAu:250,xuvMilliWm2:50000000}),cold=E.enrich({}, {...input,planetIdentity:id('y'),orbitMilliAu:4500,xuvMilliWm2:50});
assert.equal(hot.volatileLedger.closure.exactInternalClosure,true);assert.equal(cold.volatileLedger.closure.exactInternalClosure,true);assert.ok(hot.volatileLedger.reservoirs.escapedUnits>cold.volatileLedger.reservoirs.escapedUnits);
const broken=L.witness({planetIdentity:id('b'),causal:{atmosphere:{initialInventoryUnits:100,escapedUnits:20,interiorUnits:20,surfaceCondensedUnits:20,atmosphereUnits:20,conserved:false}}});assert.equal(broken.supported,true);assert.equal(broken.closure.exactInternalClosure,false);assert.equal(broken.closure.residualUnits,20);assert.equal(broken.closure.sourceConservedFlag,false);assert.equal(broken.shareClosurePpm,1000000);
const unsafe=L.witness({planetIdentity:id('u'),causal:{atmosphere:{initialInventoryUnits:Number.MAX_SAFE_INTEGER,escapedUnits:Number.MAX_SAFE_INTEGER,interiorUnits:1,surfaceCondensedUnits:0,atmosphereUnits:0,conserved:false}}});assert.equal(unsafe.supported,true);assert.equal(unsafe.closure.exactInternalClosure,false);
const biology=W.buildLife(a,input.ageMyr),sites=W.survey(a),civ=W.civilization(a,biology,sites,input.ageMyr),world={planetIdentity:a.planetIdentity,planetology:a,biology,civilization:civ.state},point=W.location(a.planetIdentity,12000000,34000000),local=W.localContext(world,point);
assert.deepEqual(local.volatileLedger,a.volatileLedger);assert.equal(local.planetaryCausality.worldIdentity,a.planetIdentity);assert.equal(local.volatileLedger.researchLineage.researchAuthorityPromoted,false);
console.log(JSON.stringify({status:'PASS',suite:'v1.1 volatile ledger',version:L.VERSION,initial:a.volatileLedger.initialInventoryUnits,escaped:a.volatileLedger.reservoirs.escapedUnits,shareClosure:a.volatileLedger.shareClosurePpm}));
