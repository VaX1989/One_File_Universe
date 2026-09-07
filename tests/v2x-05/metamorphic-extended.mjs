import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const sandbox={console};sandbox.globalThis=sandbox;sandbox.OFU={};
for(const file of ['src/v2x-05-deep-planet-science/regime-core.js','src/v2x-05-deep-planet-science/interior-atmosphere.js','src/v2x-05-deep-planet-science/climate-volatile.js','src/v2x-05-deep-planet-science/deep-planet-provider.js'])vm.runInNewContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
const {v2x05RegimeCore:C,v2x05ClimateVolatile:CV,v2x05DeepPlanetProvider:P}=sandbox.OFU;
function world(id,{gravity=9810,ice=70000,light=50000,metal=320000,silicate=560000,rotation=23934,age=4500,family='N2_CO2_H2O_OUTGASSED'}={}){return{planetIdentity:id,causal:{
 inputs:{planetIdentity:id,bulkPriorClass:'TERRESTRIAL',massMilliEarth:1000,radiusKm:6371,ageMyr:age,eccentricityPpm:16700,obliquityMilliDeg:23440,rotationPeriodMilliHours:rotation},
 formation:{equilibriumTemperatureMilliK:255000,irradiationPpm:1000000},
 composition:{metalPpm:metal,silicatePpm:silicate,icePpm:ice,lightVolatilePpm:light,sumPpm:1000000},
 gravity:{surfaceGravityMilliMs2:gravity},
 interior:{differentiationState:'STRONGLY_DIFFERENTIATED',differentiationPpm:780000,coreFractionPpm:300000,mantleFractionPpm:650000,crustFractionPpm:50000,heat:{radiogenicPpm:250000,primordialPpm:300000,tidalPpm:20000,heatIndexPpm:330000},convectiveVigorPpm:500000,tectonicRegime:'EPISODIC_OR_STAGNANT_LID',volcanismPpm:350000,dynamoPpm:480000},
 atmosphere:{initialInventoryUnits:1000000,escapedUnits:100000,interiorUnits:350000,surfaceCondensedUnits:150000,atmosphereUnits:400000,escape:{xuvMilliWm2:1000,escapePpm:200000},outgassingPpm:300000,pressureProxyPpm:500000,compositionFamily:family,meanMolecularMassMilliAmu:31500,collapsePotentialPpm:100000,cloudCondensatePotentialPpm:350000,greenhouseDeltaMilliK:33000}
}}}
const lowG=P.evaluate(world('low-g',{gravity:3500})),highG=P.evaluate(world('high-g',{gravity:18000}));
const share=(e,k)=>e.causality.drivers.find(d=>d.driver===k).sharePpm;
assert.ok(share(highG,'GRAVITY_RETENTION_CONTEXT')>share(lowG,'GRAVITY_RETENTION_CONTEXT'));
const rocky=P.evaluate(world('rocky',{ice:20000,light:20000,metal:360000,silicate:600000})),volatile=P.evaluate(world('volatile',{ice:300000,light:280000,metal:140000,silicate:280000}));
assert.ok(share(volatile,'VOLATILE_INVENTORY_CONTEXT')>share(rocky,'VOLATILE_INVENTORY_CONTEXT'));
const fast=P.evaluate(world('fast',{rotation:8000})),slow=P.evaluate(world('slow',{rotation:200000}));
assert.equal(fast.climate.rotationRegime,'FAST_ROTATOR_CONTEXT');assert.equal(slow.climate.rotationRegime,'SLOW_ROTATOR_CONTEXT');assert.notEqual(fast.climate.transportProxyPpm,slow.climate.transportProxyPpm);
assert.equal(P.RESEARCH_ROUTING.length,5);for(const route of P.RESEARCH_ROUTING)assert.equal(route.status,'RESEARCH_REQUIRED');
assert.equal(CV.rotationRegime(8),'FAST_ROTATOR_CONTEXT');assert.equal(CV.rotationRegime(200),'SLOW_ROTATOR_CONTEXT');

// Read-only guarantee: evaluating a source world must not freeze or mutate upstream objects.
const mutable=world('mutable');const before=JSON.stringify(mutable);const evaluated=P.evaluate(mutable);assert.equal(evaluated.supported,true);assert.equal(JSON.stringify(mutable),before);assert.equal(Object.isFrozen(mutable),false);assert.equal(Object.isFrozen(mutable.causal),false);mutable.afterEvaluation='still-mutable';assert.equal(mutable.afterEvaluation,'still-mutable');
// Cycles outside consumed surfaces must not cause recursive freeze/stack failure.
const cyclic=world('cyclic');cyclic.self=cyclic;assert.doesNotThrow(()=>P.evaluate(cyclic));assert.equal(P.evaluate(cyclic).supported,true);
// Deterministic identity must fail closed on disagreement.
const mismatch=world('identity-a');mismatch.causal.inputs.planetIdentity='identity-b';const mismatchEval=P.evaluate(mismatch);assert.equal(mismatchEval.supported,false);assert.equal(mismatchEval.reason,'WORLD_IDENTITY_MISMATCH');
// Exact closure gates for model-derived composition and interior layers.
const badComposition=world('bad-composition');badComposition.causal.composition.silicatePpm-=1;badComposition.causal.composition.sumPpm=999999;assert.equal(P.evaluate(badComposition).reason,'COMPOSITION_PPM_NOT_CLOSED');
const badLayers=world('bad-layers');badLayers.causal.interior.crustFractionPpm+=1;assert.equal(P.evaluate(badLayers).reason,'INTERIOR_LAYER_PPM_NOT_CLOSED');
const badAge=P.evaluate(world('bad-age',{age:-1}));assert.equal(badAge.supported,false);assert.equal(badAge.reason,'OUTSIDE_V2X05_AGE_ENVELOPE');
// Unknown high-pressure atmospheric family stays unknown rather than leaking through as a valid climate.
const unknownAtmos=P.evaluate(world('unknown-atmos',{family:'UNKNOWN'}));assert.equal(unknownAtmos.supported,false);assert.equal(unknownAtmos.reason,'UNSUPPORTED_COMPOSITION_FAMILY');
// XUV history bound and order are whole-evaluation fail-closed conditions.
const tooLong=Array.from({length:C.LIMITS.historySamples+1},(_,i)=>({ageMyr:i,xuvMilliWm2:1000}));const overHistory=P.evaluate(world('over-history'),{xuvHistory:tooLong});assert.equal(overHistory.supported,false);assert.equal(overHistory.atmosphere.retentionEscape.reason,'XUV_HISTORY_BOUND');
const unordered=P.evaluate(world('unordered'),{xuvHistory:[{ageMyr:100,xuvMilliWm2:1000},{ageMyr:99,xuvMilliWm2:1000}]});assert.equal(unordered.supported,false);assert.equal(unordered.atmosphere.retentionEscape.reason,'INVALID_OR_UNORDERED_XUV_HISTORY');
// Malformed precomputed evaluations fail closed without throwing consumer queries.
const malformed={contract:P.CONTRACT,version:P.VERSION,worldIdentity:'fake',supported:true,status:'PRESENT',authority:P.AUTHORITY,regime:{}};let malformedQuery;assert.doesNotThrow(()=>{malformedQuery=P.query(malformed,'RENDERING_CONTEXT')});assert.equal(malformedQuery.supported,false);assert.equal(malformedQuery.reason,'MALFORMED_PRECOMPUTED_EVALUATION');
const forgedBase=P.evaluate(world('forged'));const forged=Object.freeze({...forgedBase,atmosphere:Object.freeze({worldIdentity:'forged',composition:Object.freeze({supported:true}),retentionEscape:Object.freeze({historyAdjustedEscapeContextPpm:200000}),pressureProxyPpm:500000,cloudCondensatePotentialPpm:350000})});let forgedQuery;assert.doesNotThrow(()=>{forgedQuery=P.query(forged,'RENDERING_CONTEXT')});assert.equal(forgedQuery.supported,false);assert.equal(forgedQuery.reason,'MALFORMED_PRECOMPUTED_EVALUATION');
// Numeric poison cannot silently coerce into plausible weights.
const isRangeError=e=>e&&e.name==='RangeError';assert.throws(()=>C.normalizePpm([1,Infinity]),isRangeError);assert.throws(()=>C.normalizePpm([1,-1]),isRangeError);assert.throws(()=>CV.splitExact(C.LIMITS.exactInventoryUnits+1,[1,1]),isRangeError);
const maxSplit=CV.splitExact(C.LIMITS.exactInventoryUnits,[1,2,3]);assert.equal(maxSplit.reduce((a,b)=>a+b,0),C.LIMITS.exactInventoryUnits);
assert.deepEqual([...C.normalizePpm([Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER])],[500000,500000]);assert.throws(()=>C.normalizePpm([1.5,2]),isRangeError);
const maxLedger=world('max-ledger');maxLedger.causal.atmosphere.initialInventoryUnits=Number.MAX_SAFE_INTEGER;maxLedger.causal.atmosphere.escapedUnits=Number.MAX_SAFE_INTEGER-3;maxLedger.causal.atmosphere.interiorUnits=1;maxLedger.causal.atmosphere.surfaceCondensedUnits=1;maxLedger.causal.atmosphere.atmosphereUnits=1;maxLedger.causal.atmosphere.retainedUnits=3;maxLedger.causal.atmosphere.conserved=true;const maxLedgerEval=P.evaluate(maxLedger);assert.equal(maxLedgerEval.supported,true);assert.equal(maxLedgerEval.volatile.closure.exactInternalClosure,true);assert.equal(maxLedgerEval.volatile.initialInventoryUnits,Number.MAX_SAFE_INTEGER);
const retainedMismatch=world('retained-mismatch');retainedMismatch.causal.atmosphere.retainedUnits=899999;assert.equal(P.evaluate(retainedMismatch).volatile.reason,'SOURCE_VOLATILE_RETAINED_LEDGER_NOT_CLOSED');
const unconserved=world('unconserved');unconserved.causal.atmosphere.conserved=false;assert.equal(P.evaluate(unconserved).volatile.reason,'SOURCE_VOLATILE_CONSERVED_FLAG_FALSE');
const poisonCloud=world('poison-cloud');poisonCloud.causal.atmosphere.cloudCondensatePotentialPpm=NaN;assert.equal(P.evaluate(poisonCloud).reason,'INVALID_ATMOSPHERIC_PROXY_STATE');
// Bounded property sweep lives in the registered lane oracle so exact-head evidence includes adversarial breadth.
let seed=0x5eed05;const rnd=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0};
for(let i=0;i<256;i++){const w=world('property-'+i);const a=rnd()%1000001,b=rnd()%(1000001-a),c=rnd()%(1000001-a-b),d=1000000-a-b-c;w.causal.composition.metalPpm=a;w.causal.composition.silicatePpm=b;w.causal.composition.icePpm=c;w.causal.composition.lightVolatilePpm=d;w.causal.inputs.obliquityMilliDeg=rnd()%180001;w.causal.inputs.eccentricityPpm=rnd()%1000001;w.causal.inputs.rotationPeriodMilliHours=1+(rnd()%1000000000);const e=P.evaluate(w);assert.equal(e.supported,true);assert.equal(e.volatile.closure.exactInternalClosure,true);assert.equal(e.causality.shareClosurePpm,1000000);assert.equal(P.query(e,'RENDERING_CONTEXT').supported,true);}
// Quarter-season kernel is discrete and does not depend on sin/cos/log10 implementation details.
const climateSource=fs.readFileSync('src/v2x-05-deep-planet-science/climate-volatile.js','utf8');assert.equal(/Math\.(sin|cos|log10)/.test(climateSource),false);assert.deepEqual([...CV.SEASON_SIN_PPM],[0,1000000,0,-1000000]);assert.deepEqual([...CV.SEASON_COS_PPM],[1000000,0,-1000000,0]);
const replayA=JSON.stringify(P.evaluate(world('replay'))),replayB=JSON.stringify(P.evaluate(world('replay')));assert.equal(replayA,replayB);

console.log(JSON.stringify({status:'PASS',oracle:'V2X05_EXTENDED_METAMORPHIC_V2',gravity:true,composition:true,rotation:true,sourceReadOnly:true,cycleSafe:true,identityFailClosed:true,closureFailClosed:true,xuvFailClosed:true,malformedQueryFailClosed:true,numericPoisonRejected:true,exactInventoryBound:true,integerQuarterSeasonKernel:true,replayDeterministic:true,propertyCases:256,maxSafeLedger:true,researchRouting:P.RESEARCH_ROUTING.map(r=>r.route)}));
