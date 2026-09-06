(function(root){
'use strict';
const O=root.OFU=root.OFU||{},V=O.v1Common,W=O.v1WorldContext,S=O.v1SeasonalEnvironment,N=O.v1EcologyCausalNiche;
if(!V||!W||!S||!N)throw new Error('v1 world context, seasonal environment and causal niche required for seasonal ecology opportunity');
const VERSION='ofu-v11-ecology-seasonal-opportunity-1';
const SOURCE='research/v1x-17-life-evolution-2026-09-06';
const AUTH=V.authority('v1.ecology.seasonal-opportunity','1.0.0',[SOURCE],
  'Bounded deterministic role-sensitive seasonal opportunity projection for already modeled local populations. It combines the four-phase modeled environment envelope with existing causal-niche support and is not fitness, abundance, survival probability or canonical biology.',[
    'Seasonal opportunity scores are heuristic normalized model summaries, not ecological measurements or validated niche models.',
    'The projection never establishes a biosphere, lineage, adaptation, selection event or canonical P6 state.',
    'No P4 history is admitted or mutated; seasonal phase samples remain reduced-order environment scenarios.'
  ]);
const LIMIT=1000000,MAX_POPULATIONS=N.MAX_POPULATIONS||12,MAX_SEASONS=S.MAX_SAMPLES||4,MAX_EVALUATIONS=MAX_POPULATIONS*MAX_SEASONS;
const SIGNALS=Object.freeze(['TEMPERATURE_COMPATIBILITY','WATER_ACTIVITY','PRECIPITATION_POTENTIAL','BASELINE_LOCAL_SUPPORT','MEDIUM_AVAILABILITY']);
const ROLE_WEIGHTS=Object.freeze({
  PRIMARY_PRODUCER:[250000,300000,200000,150000,100000],PHOTOTROPH_ANALOG:[250000,300000,200000,150000,100000],
  CHEMOTROPH:[150000,250000,50000,250000,300000],EXTREMOPHILE:[100000,150000,50000,400000,300000],
  DECOMPOSER:[200000,300000,100000,300000,100000],RECYCLER:[200000,300000,100000,300000,100000],
  MUTUALIST:[225000,275000,100000,300000,100000],CONSUMER:[250000,250000,100000,300000,100000],
  PREDATOR:[250000,250000,100000,300000,100000],PARASITE:[225000,225000,50000,400000,100000]
});
const clamp=x=>Math.max(0,Math.min(LIMIT,Math.round(Number.isFinite(Number(x))?Number(x):0)));
function weightsFor(role){const weights=ROLE_WEIGHTS[String(role||'CONSUMER').toUpperCase()]||ROLE_WEIGHTS.CONSUMER;V.assert(weights.reduce((a,x)=>a+x,0)===LIMIT,'seasonal opportunity role weight closure');return weights;}
function evaluate(profile,snapshot){
  V.assert(profile&&typeof profile==='object','seasonal opportunity profile');V.assert(snapshot&&typeof snapshot==='object','seasonal opportunity snapshot');
  const signals=Object.freeze([
    clamp(snapshot.temperatureCompatibilityPpm),clamp(snapshot.waterActivityPpm),clamp(snapshot.precipitationPotentialPpm),
    clamp(profile.modeledSupportPpm),snapshot.mediumAvailable?LIMIT:0
  ]),weights=weightsFor(profile.role);
  let weighted=0;for(let i=0;i<signals.length;i++)weighted+=signals[i]*weights[i];
  const opportunityPpm=clamp(Math.floor(weighted/LIMIT));
  return V.freezeDeep({seasonPpm:snapshot.seasonPpm,populationId:profile.populationId,lineageId:profile.lineageId||null,role:profile.role,
    opportunityPpm,signals:Object.freeze(SIGNALS.map((id,i)=>Object.freeze({id,valuePpm:signals[i],weightPpm:weights[i]}))),
    sourceLocationIdentity:snapshot.sourceLocationIdentity||null,sampleLocationIdentity:snapshot.sampleLocationIdentity||null,
    authority:AUTH,fitnessMeasurement:false,abundancePrediction:false,survivalProbability:false,canonicalBiologyClaim:false});
}
function summarizeProfile(profile,snapshots){
  const phases=Object.freeze(snapshots.map(snapshot=>evaluate(profile,snapshot)));V.assert(phases.length>0&&phases.length<=MAX_SEASONS,'seasonal opportunity phase bound');
  let peak=phases[0],trough=phases[0],sum=0;for(const p of phases){sum+=p.opportunityPpm;if(p.opportunityPpm>peak.opportunityPpm)peak=p;if(p.opportunityPpm<trough.opportunityPpm)trough=p;}
  return V.freezeDeep({populationId:profile.populationId,lineageId:profile.lineageId||null,role:profile.role,phases,
    meanOpportunityPpm:clamp(Math.floor(sum/phases.length)),minOpportunityPpm:trough.opportunityPpm,maxOpportunityPpm:peak.opportunityPpm,
    amplitudePpm:peak.opportunityPpm-trough.opportunityPpm,peakSeasonPpm:peak.seasonPpm,troughSeasonPpm:trough.seasonPpm,
    authority:AUTH,fitnessMeasurement:false,canonicalBiologyClaim:false});
}
function projectFromContext(context){
  V.assert(context&&typeof context==='object','seasonal ecology context');
  const seasonal=context.seasonalEnvironment,niche=context.ecologyCausality;
  if(!seasonal)return V.freezeDeep({version:VERSION,supported:false,reason:'NO_SEASONAL_ENVIRONMENT',profiles:Object.freeze([]),populationCount:0,evaluations:0,maxEvaluations:MAX_EVALUATIONS,authority:AUTH,canonicalP6Unchanged:true});
  if(!niche?.supported)return V.freezeDeep({version:VERSION,supported:false,reason:niche?.reason||'NO_MODELED_LOCAL_POPULATIONS',profiles:Object.freeze([]),populationCount:0,evaluations:0,maxEvaluations:MAX_EVALUATIONS,authority:AUTH,canonicalP6Unchanged:true});
  const snapshots=(seasonal.snapshots||[]).slice(0,MAX_SEASONS);V.assert(snapshots.length>0&&snapshots.length<=MAX_SEASONS,'seasonal ecology snapshot bound');
  const profiles=Object.freeze((niche.profiles||[]).slice(0,MAX_POPULATIONS).map(profile=>summarizeProfile(profile,snapshots))),evaluations=profiles.reduce((a,p)=>a+p.phases.length,0);
  V.assert(evaluations<=MAX_EVALUATIONS,'seasonal ecology evaluation bound');
  return V.freezeDeep({version:VERSION,supported:true,profiles,populationCount:profiles.length,seasonCount:snapshots.length,evaluations,maxEvaluations:MAX_EVALUATIONS,
    modelClass:'ROLE_SENSITIVE_SEASONAL_OPPORTUNITY_PROJECTION',authority:AUTH,bounded:true,globalEnumeration:false,fitnessMeasurement:false,abundancePrediction:false,
    survivalProbability:false,canonicalBiologyClaim:false,canonicalP6Unchanged:true,p4HistoryMutated:false,
    researchLineage:Object.freeze({sourceBranch:SOURCE,harvestedConcept:'BOUNDED_RESOURCE_CONSTRAINED_SEASONAL_OPPORTUNITY',researchAuthorityPromoted:false})});
}
const previousLocalContext=W.localContext;
function localContext(world,point,options){const base=previousLocalContext(world,point,options),seasonalEcology=projectFromContext(base);return V.freezeDeep({...base,seasonalEcology});}
O.v1WorldContext=Object.freeze({...W,localContext});
O.v1SeasonalEcology=Object.freeze({VERSION,SOURCE,AUTHORITY:AUTH,LIMIT,MAX_POPULATIONS,MAX_SEASONS,MAX_EVALUATIONS,SIGNALS,ROLE_WEIGHTS,weightsFor,evaluate,summarizeProfile,projectFromContext});
})(globalThis);
