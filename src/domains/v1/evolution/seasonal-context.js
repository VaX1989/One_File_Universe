(function(root){
'use strict';
const O=root.OFU=root.OFU||{},V=O.v1Common,W=O.v1WorldContext,S=O.v1SeasonalEcology,L=O.v1LocalLineageContext;
if(!V||!W||!S||!L)throw new Error('v1 world context, seasonal ecology and local lineage context required for seasonal evolution context');
const VERSION='ofu-v11-evolution-seasonal-context-1';
const SOURCE='research/v1x-17-life-evolution-2026-09-06';
const AUTH=V.authority('v1.evolution.seasonal-context','1.0.0',[SOURCE],
  'Bounded deterministic descriptive seam linking current modeled seasonal ecological opportunity to already modeled local lineage history. It provides context for inspection only and does not infer selection, adaptation, survival, reproduction, ancestry causation or canonical evolutionary events.',[
    'Opportunity deficits and seasonal variability are transforms of existing MODEL_DERIVED_SIMULATION summaries, not fitness measurements or selection coefficients.',
    'Lineage-event counts are retained-ledger context only and do not establish that seasonal conditions caused any historical event.',
    'No adaptation, mutation, speciation, extinction or P4 history event is created or admitted by this component.',
    'Canonical P6 biology remains unchanged; missing population identity correspondence fails closed.'
  ]);
const LIMIT=1000000,MAX_PROFILES=Math.min(S.MAX_POPULATIONS||12,L.MAX_LOCAL_POPULATIONS||12);
const clamp=x=>Math.max(0,Math.min(LIMIT,Math.round(Number.isFinite(Number(x))?Number(x):0)));
function constraintClass(meanOpportunityPpm,amplitudePpm){
  const mean=clamp(meanOpportunityPpm),amp=clamp(amplitudePpm);
  if(mean<250000)return 'PERSISTENT_LOW_MODELED_OPPORTUNITY';
  if(amp>=300000)return 'HIGH_SEASONAL_VARIABILITY';
  if(amp>=120000)return 'MODERATE_SEASONAL_VARIABILITY';
  return 'BROAD_STABLE_MODELED_OPPORTUNITY';
}
function indexUnique(rows,label){
  const map=new Map();
  for(const row of rows){
    const id=String(row?.populationId||'');V.text(id,label+' populationId',128);
    V.assert(!map.has(id),label+' duplicate populationId');map.set(id,row);
  }
  return map;
}
function profile(lineage,seasonal){
  V.assert(lineage&&seasonal,'seasonal evolution profile inputs');
  V.assert(String(lineage.populationId)===String(seasonal.populationId),'seasonal evolution exact population identity');
  const mean=clamp(seasonal.meanOpportunityPpm),amp=clamp(seasonal.amplitudePpm),ancestry=lineage.ancestry||{};
  return V.freezeDeep({
    populationId:String(lineage.populationId),lineageId:lineage.lineageId||seasonal.lineageId||null,role:lineage.role||seasonal.role||null,
    meanModeledOpportunityPpm:mean,opportunityDeficitPpm:LIMIT-mean,seasonalVariabilityPpm:amp,
    peakSeasonPpm:seasonal.peakSeasonPpm??null,troughSeasonPpm:seasonal.troughSeasonPpm??null,
    seasonalConstraintClass:constraintClass(mean,amp),ancestryDepth:Number(ancestry.depth||0),ancestryComplete:ancestry.ancestryComplete===true,
    ancestryTermination:ancestry.termination||null,retainedLineageEventCount:Math.min(64,(lineage.lineageEvents||[]).length),
    retainedTraceEvidenceCount:Math.min(48,(lineage.traceEvidence||[]).length),
    interpretationClass:'DESCRIPTIVE_SEASONAL_CONTEXT_NOT_SELECTION_EVENT',authority:AUTH,
    fitnessMeasurement:false,selectionCoefficient:false,adaptationEvidence:false,survivalProbability:false,reproductionProbability:false,
    historicalCausationClaim:false,canonicalBiologyClaim:false,canonicalP4Event:false
  });
}
function unsupported(reason){return V.freezeDeep({version:VERSION,supported:false,reason,profiles:Object.freeze([]),populationCount:0,resolvedPopulationCount:0,maxProfiles:MAX_PROFILES,
  authority:AUTH,bounded:true,globalEnumeration:false,fitnessMeasurement:false,selectionEventInference:false,adaptationInference:false,historicalCausationClaim:false,
  canonicalP6Unchanged:true,p4HistoryMutated:false});}
function projectFromContext(context){
  V.assert(context&&typeof context==='object','seasonal evolution context');
  const seasonal=context.seasonalEcology,lineage=context.localLineageContext;
  if(!seasonal?.supported)return unsupported(seasonal?.reason||'NO_SEASONAL_ECOLOGY');
  if(!lineage?.supported)return unsupported(lineage?.reason||'NO_LOCAL_LINEAGE_CONTEXT');
  const seasonalRows=seasonal.profiles||[],lineageRows=lineage.profiles||[];
  V.assert(seasonalRows.length<=MAX_PROFILES,'seasonal evolution seasonal profile bound');
  V.assert(lineageRows.length<=MAX_PROFILES,'seasonal evolution lineage profile bound');
  const seasonalBy=indexUnique(seasonalRows,'seasonal evolution seasonal'),lineageBy=indexUnique(lineageRows,'seasonal evolution lineage');
  const matched=[];
  for(const row of lineageRows){const seasonalRow=seasonalBy.get(String(row.populationId));if(seasonalRow)matched.push(profile(row,seasonalRow));}
  if(matched.length===0)return unsupported('NO_SHARED_LOCAL_POPULATION_IDENTITY');
  const profiles=Object.freeze(matched),classes={};for(const p of profiles)classes[p.seasonalConstraintClass]=(classes[p.seasonalConstraintClass]||0)+1;
  const unresolvedPopulationCount=lineageBy.size-profiles.length;
  return V.freezeDeep({version:VERSION,supported:true,profiles,populationCount:lineageBy.size,resolvedPopulationCount:profiles.length,unresolvedPopulationCount,maxProfiles:MAX_PROFILES,
    constraintClassCounts:Object.freeze(classes),identityJoin:'EXACT_LOCAL_POPULATION_ID_ONLY',modelClass:'DESCRIPTIVE_SEASONAL_LINEAGE_CONTEXT',
    bounded:true,globalEnumeration:false,authority:AUTH,fitnessMeasurement:false,selectionEventInference:false,adaptationInference:false,historicalCausationClaim:false,
    canonicalP6Unchanged:true,p4HistoryMutated:false,provenance:V.provenance('v1.evolution.seasonal-context','1.0.0',[SOURCE]),
    researchLineage:Object.freeze({sourceBranch:SOURCE,harvestedConcept:'RESOURCE_CONSTRAINED_EVOLUTION_CONTEXT_WITHOUT_SELECTION_CLAIM',researchAuthorityPromoted:false})});
}
const previousLocalContext=W.localContext;
function localContext(world,point,options){const base=previousLocalContext(world,point,options),evolutionSeasonalContext=projectFromContext(base);return V.freezeDeep({...base,evolutionSeasonalContext});}
O.v1WorldContext=Object.freeze({...W,localContext});
O.v1EvolutionSeasonalContext=Object.freeze({VERSION,SOURCE,AUTHORITY:AUTH,LIMIT,MAX_PROFILES,constraintClass,indexUnique,profile,projectFromContext});
})(globalThis);
