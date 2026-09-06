import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  Q16_ONE, Q32_ONE, MODEL_CATALOG, morphologyWeightsQ16, populationMixtureQ16,
  evolutionSummary, companionOrbitCandidate, observabilityProxy, cosmicWebGradientPrior, createProvider
} from './model.mjs';

const sum = o => Object.values(o).reduce((a,b)=>a+b,0n);

for (const mass of [7000n,8500n,10000n,12000n]) for (const density of [0n,16000n,32768n,65535n]) {
  const w=morphologyWeightsQ16({massLog10MilliDex:mass,environmentDensityQ16:density});
  assert.equal(sum(w),Q16_ONE); for(const v of Object.values(w)) assert(v>=0n&&v<=Q16_ONE);
}
assert(morphologyWeightsQ16({massLog10MilliDex:12000n,environmentDensityQ16:65535n}).SPHEROID > morphologyWeightsQ16({massLog10MilliDex:7000n,environmentDensityQ16:0n}).SPHEROID);
assert(morphologyWeightsQ16({massLog10MilliDex:7000n,environmentDensityQ16:0n}).IRREGULAR > morphologyWeightsQ16({massLog10MilliDex:12000n,environmentDensityQ16:65535n}).IRREGULAR);

for (const morphology of ['DISK','SPHEROID','IRREGULAR']) {
  const w=populationMixtureQ16({morphology,populationAgeMyr:6000n,starFormationActivityQ16:30000n});
  assert.equal(sum(w),Q16_ONE);
}
assert(populationMixtureQ16({morphology:'DISK',populationAgeMyr:2000n,starFormationActivityQ16:60000n}).YOUNG > populationMixtureQ16({morphology:'SPHEROID',populationAgeMyr:12000n,starFormationActivityQ16:3000n}).YOUNG);

const ev=evolutionSummary({baselineAgeMyr:5000n,mainSequenceLifetimeMyr:10000n,baselineEvolutionaryClass:'MAIN_SEQUENCE'});
assert.equal(ev.evolutionaryClass,'MAIN_SEQUENCE'); assert.equal(ev.lifetimeProgressQ16,32768n);

let min=0n;
for(let i=1n;i<=3n;i++){
  const o=companionOrbitCandidate({primaryMassMilliSolar:10000n,componentIndex:i,periodDrawU32:500000000n*BigInt(i),massRatioDrawU32:1234567890n,eccentricityDrawU32:2345678901n,minLogPeriodMilliDex:min});
  assert(o.log10PeriodDaysMilliDex>=min&&o.log10PeriodDaysMilliDex<=7500n);
  assert(o.massRatioQ16>=6554n&&o.massRatioQ16<=Q16_ONE);
  assert(o.eccentricityQ16>=0n&&o.eccentricityQ16<Q16_ONE);
  min=o.log10PeriodDaysMilliDex+300n;
}

function closeCount(primaryMassMilliSolar){
  let close=0;
  for(let i=0n;i<4096n;i++){
    const draw=(i*Q32_ONE)/4096n;
    const o=companionOrbitCandidate({primaryMassMilliSolar,componentIndex:1n,periodDrawU32:draw,massRatioDrawU32:0n,eccentricityDrawU32:0n,minLogPeriodMilliDex:0n});
    if(o.periodRegime==='CLOSE')close++;
  }
  return close;
}
const lowMassClose=closeCount(1000n), highMassClose=closeCount(10000n);
assert(lowMassClose>=810&&lowMassClose<=830);
assert(highMassClose>=1835&&highMassClose<=1850);
assert(highMassClose>lowMassClose);

const near=observabilityProxy({baselineLuminosityMilliSolar:1000n},{distanceMilliPc:10000n,crowdingQ16:0n});
const far=observabilityProxy({baselineLuminosityMilliSolar:1000n},{distanceMilliPc:100000n,crowdingQ16:0n});
const crowded=observabilityProxy({baselineLuminosityMilliSolar:1000n},{distanceMilliPc:100000n,crowdingQ16:50000n});
assert(near.relativeFluxAt10pcPpm>far.relativeFluxAt10pcPpm); assert(near.detectabilityScoreQ16>far.detectabilityScoreQ16); assert(far.detectabilityScoreQ16>crowded.detectabilityScoreQ16); assert.equal(near.parallaxMicroArcsec,100000n);

const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/oracle-v1.json',import.meta.url),'utf8'));
for(const c of fixture.cases){
  if(c.kind==='morphology'){
    const got=morphologyWeightsQ16({massLog10MilliDex:BigInt(c.input.massLog10MilliDex),environmentDensityQ16:BigInt(c.input.environmentDensityQ16)});
    for(const k of Object.keys(c.expected)) assert.equal(got[k],BigInt(c.expected[k]));
  }else if(c.kind==='observability'){
    const got=observabilityProxy({baselineLuminosityMilliSolar:BigInt(c.input.luminosityMilliSolar)},{distanceMilliPc:BigInt(c.input.distanceMilliPc),crowdingQ16:BigInt(c.input.crowdingQ16)});
    for(const k of Object.keys(c.expected)) assert.equal(got[k],BigInt(c.expected[k]));
  }
}

let gradientCalls=0;
const fakeP3Gradient={environmentDensityQ16(_ctx,x,y,z){gradientCalls++;return 30000n+x*20n+y*10n-z*5n;}};
const gp=cosmicWebGradientPrior(fakeP3Gradient,{}, {status:'PRESENT',key:{siteCellX:1n,siteCellY:2n,siteCellZ:3n}});
assert.equal(gp.coordinateAuthority,'NONE'); assert.equal(gp.physicalTruthClaim,false); assert.equal(gp.axis.l1Q16,Q16_ONE); assert.equal(gradientCalls,6);

const enc = n => Uint8Array.of(Number((n>>24n)&255n),Number((n>>16n)&255n),Number((n>>8n)&255n),Number(n&255n));
const fakeP2={derive({property,counter}){let h=0n;for(const ch of property)h=(h*131n+BigInt(ch.codePointAt(0)))&(Q32_ONE-1n);return enc((h+BigInt(counter)*2654435761n)&(Q32_ONE-1n));}};
const galId=Uint8Array.of(1,2,3), sysId=Uint8Array.of(4,5,6);
const fakeGalaxy={status:'PRESENT',id:galId,address:Uint8Array.of(9),key:{siteCellX:0n,siteCellY:0n,siteCellZ:0n},facts:{morphology:'DISK',massLog10MilliDex:10000n,populationAgeMyr:6000n,metallicityMilliDex:0n,starFormationActivityQ16:32000n,environmentDensityQ16:32000n}};
const fakeSystem={status:'PRESENT',id:sysId,address:Uint8Array.of(8),facts:{stellarComponentCount:2n,baselinePrimaryMassMilliSolar:1000n},relations:{}};
const fakeStar=i=>({status:'PRESENT',id:Uint8Array.of(7,Number(i)),facts:{baselineAgeMyr:5000n,mainSequenceLifetimeMyr:10000n,baselineEvolutionaryClass:'MAIN_SEQUENCE',baselineLuminosityMilliSolar:1000n}});
const fakeP3={resolveGalaxy(){return fakeGalaxy;},resolveSystem(){return fakeSystem;},resolveStar(_ctx,key){return fakeStar(key.componentIndex??0n);},environmentDensityQ16(_ctx,x,y,z){return 30000n+x*7n-y*3n+z*2n;}};
const provider=createProvider({p2:fakeP2,p3:fakeP3});
const g1=provider.resolveGalaxyDepth({masterSeed:new Uint8Array(32),semanticManifestHash:new Uint8Array(32)},{});
assert.equal(g1.sourceEntityId,galId); assert.equal(g1.mutationAuthority,false);
const s1=provider.resolveSystemDepth({masterSeed:new Uint8Array(32),semanticManifestHash:new Uint8Array(32)},{});
assert.equal(s1.sourceEntityId,sysId); assert.equal(s1.companions.length,1); assert.equal(s1.mutationAuthority,false);
const s2=provider.resolveSystemDepth({masterSeed:new Uint8Array(32),semanticManifestHash:new Uint8Array(32)},{});
assert.deepEqual(s1,s2);
const o1=provider.observeStar({}, {componentIndex:0n},{distanceMilliPc:10000n,crowdingQ16:0n});
const o2=provider.observeStar({}, {componentIndex:0n},{distanceMilliPc:20000n,crowdingQ16:0n});
assert.deepEqual(o1.sourceEntityId,o2.sourceEntityId); assert.equal(o1.observerAffectsIdentity,false);

assert.equal(MODEL_CATALOG.observabilityProxy.classification,'MODEL_DERIVED_QUERY_ONLY');
console.log('V1X-15 research tests: PASS');
