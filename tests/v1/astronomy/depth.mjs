import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
globalThis.OFU={};
for(const f of ['src/kernel/sha256.js','src/extensions/contracts.js','src/domains/v1/common.js','src/domains/v1/astronomy.js'])vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const input={universeId:'universe-v11',galaxyCell:'g:0',regionCell:'r:0',systemAddress:'s:0',stellarOrdinal:0,environmentPpm:520000,radialPpm:430000,heightPpm:120000};
const beforeSystem=OFU.v1Astronomy.systemBirthContext(input),beforeDiscovery=OFU.v1Astronomy.discoverGalaxies({universeId:'universe-v11',cellPrefix:'origin',cursor:3,limit:6});
vm.runInThisContext(fs.readFileSync('src/domains/v1/astronomy/depth.js','utf8'),{filename:'src/domains/v1/astronomy/depth.js'});
const A=OFU.v1Astronomy,D=OFU.v1AstronomyDepth,afterSystem=A.systemBirthContext(input),again=A.systemBirthContext(input);
assert.deepEqual(afterSystem,again);assert.deepEqual(afterSystem.ids,beforeSystem.ids);assert.deepEqual(afterSystem.primary,beforeSystem.primary);assert.deepEqual(afterSystem.multiplicity,beforeSystem.multiplicity);
assert.equal(afterSystem.astronomyDepth.canonicalPromotion,false);assert.equal(afterSystem.astronomyDepth.authority.class,'MODEL_DERIVED_SIMULATION');
assert.equal(afterSystem.galaxy.stellarPopulationMix.weights.reduce((n,x)=>n+x.sharePpm,0),1000000);assert.equal(afterSystem.galaxy.stellarPopulationMix.calibrated,false);assert.equal(afterSystem.galaxy.stellarPopulationMix.probability,false);
const solar=D.stellarEvolution({massMilliSolar:1000,ageMyr:4500});assert.equal(solar.supported,true);assert.equal(solar.phase,'EARLY_MAIN_SEQUENCE_PROXY');assert.equal(solar.isochroneSolved,false);assert.equal(solar.canonicalStellarClaim,false);
for(const massMilliSolar of [499,3001,80000]){const x=D.stellarEvolution({massMilliSolar,ageMyr:1000});assert.equal(x.supported,false);assert.equal(x.reason,'OUTSIDE_SIMPLE_LIFETIME_DOMAIN');}
const multi=D.multiplicityDepth({componentCount:4,companions:[
  {stellarObjectIdentity:'a',massRatioPpm:900000,periodLogDaysMilli:800,eccentricityPpm:50000},
  {stellarObjectIdentity:'b',massRatioPpm:500000,periodLogDaysMilli:3000,eccentricityPpm:250000},
  {stellarObjectIdentity:'c',massRatioPpm:300000,periodLogDaysMilli:6500,eccentricityPpm:600000}
]});assert.deepEqual(multi.companions.map(x=>x.periodRegime),['CLOSE','INTERMEDIATE','WIDE']);assert.equal(multi.dynamicalStabilitySolved,false);assert.ok(multi.companions.length<=3);
const discovery=A.discoverGalaxies({universeId:'universe-v11',cellPrefix:'origin',cursor:3,limit:6});assert.deepEqual(discovery.galaxies.map(x=>x.galaxyIdentity),beforeDiscovery.galaxies.map(x=>x.galaxyIdentity));assert.equal(discovery.galaxies.length,6);assert.equal(discovery.astronomyDepth.globalEnumeration,false);
for(const g of discovery.galaxies){assert.equal(g.stellarPopulationMix.weights.reduce((n,x)=>n+x.sharePpm,0),1000000);assert.equal(g.stellarPopulationMix.observationalSelectionFunction,false);}
console.log(JSON.stringify({status:'PASS',suite:'v1.1 astronomy depth',version:D.VERSION,galaxies:discovery.galaxies.length,system:afterSystem.ids.stellarSystemIdentity,evolutionSupported:afterSystem.stellarEvolution.supported}));
