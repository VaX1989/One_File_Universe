import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const sandbox={console};sandbox.globalThis=sandbox;sandbox.OFU={};
for(const file of [
 'src/v2x-05-deep-planet-science/regime-core.js',
 'src/v2x-05-deep-planet-science/interior-atmosphere.js',
 'src/v2x-05-deep-planet-science/climate-volatile.js',
 'src/v2x-05-deep-planet-science/deep-planet-provider.js'
])vm.runInNewContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
const {v2x05ClimateVolatile:CV,v2x05DeepPlanetProvider:P}=sandbox.OFU;
function world(id,{gravity=9810,ice=70000,light=50000,rotation=23934}={}){return{planetIdentity:id,causal:{
 inputs:{planetIdentity:id,bulkPriorClass:'TERRESTRIAL',massMilliEarth:1000,radiusKm:6371,ageMyr:4500,eccentricityPpm:16700,obliquityMilliDeg:23440,rotationPeriodMilliHours:rotation},
 formation:{equilibriumTemperatureMilliK:255000,irradiationPpm:1000000},
 composition:{metalPpm:320000,silicatePpm:560000,icePpm:ice,lightVolatilePpm:light},
 gravity:{surfaceGravityMilliMs2:gravity},
 interior:{differentiationState:'STRONGLY_DIFFERENTIATED',differentiationPpm:780000,coreFractionPpm:300000,mantleFractionPpm:650000,crustFractionPpm:50000,heat:{radiogenicPpm:250000,primordialPpm:300000,tidalPpm:20000,heatIndexPpm:330000},convectiveVigorPpm:500000,tectonicRegime:'EPISODIC_OR_STAGNANT_LID',volcanismPpm:350000,dynamoPpm:480000},
 atmosphere:{initialInventoryUnits:1000000,escapedUnits:100000,interiorUnits:350000,surfaceCondensedUnits:150000,atmosphereUnits:400000,escape:{xuvMilliWm2:1000,escapePpm:200000},outgassingPpm:300000,pressureProxyPpm:500000,compositionFamily:'N2_CO2_H2O_OUTGASSED',meanMolecularMassMilliAmu:31500,collapsePotentialPpm:100000,cloudCondensatePotentialPpm:350000,greenhouseDeltaMilliK:33000}
}}}
const lowG=P.evaluate(world('low-g',{gravity:3500})),highG=P.evaluate(world('high-g',{gravity:18000}));
const share=(e,k)=>e.causality.drivers.find(d=>d.driver===k).sharePpm;
assert.ok(share(highG,'GRAVITY_RETENTION_CONTEXT')>share(lowG,'GRAVITY_RETENTION_CONTEXT'));
const rocky=P.evaluate(world('rocky',{ice:20000,light:20000})),volatile=P.evaluate(world('volatile',{ice:300000,light:280000}));
assert.ok(share(volatile,'VOLATILE_INVENTORY_CONTEXT')>share(rocky,'VOLATILE_INVENTORY_CONTEXT'));
const fast=P.evaluate(world('fast',{rotation:8000})),slow=P.evaluate(world('slow',{rotation:200000}));
assert.equal(fast.climate.rotationRegime,'FAST_ROTATOR_CONTEXT');assert.equal(slow.climate.rotationRegime,'SLOW_ROTATOR_CONTEXT');assert.notEqual(fast.climate.transportProxyPpm,slow.climate.transportProxyPpm);
assert.equal(P.RESEARCH_ROUTING.length,5);for(const route of P.RESEARCH_ROUTING)assert.equal(route.status,'RESEARCH_REQUIRED');
assert.equal(CV.rotationRegime(8),'FAST_ROTATOR_CONTEXT');assert.equal(CV.rotationRegime(200),'SLOW_ROTATOR_CONTEXT');
console.log(JSON.stringify({status:'PASS',oracle:'V2X05_EXTENDED_METAMORPHIC',gravity:true,composition:true,rotation:true,researchRouting:P.RESEARCH_ROUTING.map(r=>r.route)}));
