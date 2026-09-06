(function(root){
'use strict';
const O=root.OFU=root.OFU||{},V=O.v1Common,W=O.v1WorldContext,T=O.v1PlanetaryCausalityTrace;
if(!V||!W||!T)throw new Error('v1 common, world context and planetary causality trace required');
const VERSION='ofu-v11-ecology-causal-niche-1';
const SOURCE='research/v1x-17-life-evolution-2026-09-06';
const AUTH=V.authority('v1.ecology.causal-niche','1.0.0',[SOURCE],
  'Bounded deterministic role-sensitive attribution connecting modeled planetary/environment drivers to modeled local populations. Attribution is explanatory MODEL_DERIVED_SIMULATION, not causal identification, fitness measurement or canonical biology.',[
    'Population driver shares are heuristic normalized weights over already modeled state.',
    'No abiogenesis probability, universal evolutionary direction or measured ecological fitness is asserted.',
    'Canonical P6 biology and P4 history are not mutated or promoted.'
  ]);
const LIMIT=1000000,MAX_POPULATIONS=12;
const ORDER=T.ORDER;
const clamp=x=>Math.max(0,Math.min(LIMIT,Math.round(Number.isFinite(Number(x))?Number(x):0)));
const avg=(...xs)=>clamp(xs.reduce((a,x)=>a+clamp(x),0)/Math.max(1,xs.length));
const roleWeights=Object.freeze({
  PRIMARY_PRODUCER:[950000,250000,200000,800000],PHOTOTROPH_ANALOG:[1000000,250000,150000,750000],
  CHEMOTROPH:[250000,350000,1000000,700000],EXTREMOPHILE:[300000,500000,750000,650000],
  DECOMPOSER:[200000,350000,650000,900000],RECYCLER:[200000,350000,700000,900000],
  MUTUALIST:[450000,450000,450000,850000],CONSUMER:[450000,500000,350000,800000],
  PREDATOR:[350000,450000,300000,750000],PARASITE:[300000,450000,250000,700000]
});
function normalize(rows){
  let sum=rows.reduce((a,x)=>a+Math.max(0,x.raw),0);
  if(sum<=0)return rows.map((x,i)=>Object.freeze({id:x.id,signalPpm:clamp(x.signalPpm),sharePpm:i===rows.length-1?LIMIT-Math.floor(LIMIT/rows.length)*(rows.length-1):Math.floor(LIMIT/rows.length)}));
  let used=0;
  const work=rows.map((x,i)=>{const scaled=Math.max(0,x.raw)*LIMIT,share=Math.floor(scaled/sum),rem=scaled-share*sum;used+=share;return{id:x.id,signalPpm:clamp(x.signalPpm),sharePpm:share,rem,i};});
  let left=LIMIT-used;
  const ranked=[...work].sort((a,b)=>b.rem-a.rem||a.i-b.i);
  for(let i=0;i<left;i++)ranked[i%ranked.length].sharePpm++;
  return work.sort((a,b)=>a.i-b.i).map(x=>Object.freeze({id:x.id,signalPpm:x.signalPpm,sharePpm:x.sharePpm}));
}
function profilePopulation(population,trace,environment){
  V.text(String(population.populationId),'populationId',128);
  const role=String(population.role||'CONSUMER').toUpperCase(),weights=roleWeights[role]||roleWeights.CONSUMER;
  const local=new Map((trace?.local?.processes||[]).map(x=>[x.id,clamp(x.influenceSharePpm)]));
  const signals=ORDER.map(id=>local.get(id)||0),rows=ORDER.map((id,i)=>({id,signalPpm:signals[i],raw:signals[i]*weights[i]}));
  const drivers=Object.freeze(normalize(rows)),dominant=drivers.reduce((a,b)=>b.sharePpm>a.sharePpm?b:a,drivers[0]);
  const temp=clamp(environment?.temperatureCompatibilityPpm),nutrients=clamp(environment?.nutrientAvailabilityPpm),freeEnergy=clamp(environment?.freeEnergyAvailabilityPpm),disturbance=clamp(environment?.disturbancePpm);
  const density=clamp(population.localDensityPpm??population.densityPpm??500000);
  const supportPpm=avg(temp,nutrients,freeEnergy,LIMIT-disturbance,density);
  return V.freezeDeep({populationId:population.populationId,lineageId:population.lineageId||null,role,drivers,dominantDriver:dominant.id,
    modeledSupportPpm:supportPpm,localDensityPpm:density,authority:AUTH,canonicalBiologyClaim:false,fitnessMeasurement:false});
}
function profileFromContext(context){
  V.assert(context&&typeof context==='object','causal niche context');
  const populations=(context.life?.local?.populations||[]).slice(0,MAX_POPULATIONS),trace=context.planetaryCausality,environment=context.life?.environment||{};
  if(!trace||populations.length===0)return V.freezeDeep({version:VERSION,supported:false,reason:!trace?'NO_PLANETARY_CAUSAL_TRACE':'NO_MODELED_LOCAL_POPULATIONS',
    profiles:Object.freeze([]),populationCount:0,maxPopulations:MAX_POPULATIONS,authority:AUTH,canonicalP6Unchanged:true});
  const profiles=Object.freeze(populations.map(p=>profilePopulation(p,trace,environment)));
  return V.freezeDeep({version:VERSION,supported:true,profiles,populationCount:profiles.length,maxPopulations:MAX_POPULATIONS,
    attributionClosurePpm:LIMIT,authority:AUTH,canonicalP6Unchanged:true,researchLineage:Object.freeze({sourceBranch:SOURCE,harvestedConcept:'RESOURCE_CONSTRAINED_ECOLOGY_ATTRIBUTION',researchAuthorityPromoted:false})});
}
const previousLocalContext=W.localContext;
function localContext(world,point,options){
  const base=previousLocalContext(world,point,options),ecologyCausality=profileFromContext(base);
  return V.freezeDeep({...base,ecologyCausality});
}
O.v1WorldContext=Object.freeze({...W,localContext});
O.v1EcologyCausalNiche=Object.freeze({VERSION,AUTHORITY:AUTH,LIMIT,MAX_POPULATIONS,ORDER,profilePopulation,profileFromContext});
})(globalThis);
