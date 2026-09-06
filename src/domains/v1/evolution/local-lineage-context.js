(function(root){
'use strict';
const O=root.OFU=root.OFU||{},V=O.v1Common,W=O.v1WorldContext;
if(!V||!W)throw new Error('v1 common and world context required for local lineage context');
const VERSION='ofu-v11-local-lineage-context-1';
const SOURCE='research/v1x-17-life-evolution-2026-09-06';
const AUTH=V.authority('v1.evolution.local-lineage-context','1.0.0',[SOURCE],
  'Bounded deterministic projection from exact local modeled populations back into the existing modeled biosphere lineage/event ledger and trace-potential evidence. It is a cross-scale explanatory seam, not biological observation or canonical evolutionary history.',[
    'Lineage ancestry is MODEL_DERIVED_SIMULATION and may be incomplete because the world history ledger is bounded.',
    'Trace evidence is preservation potential derived from modeled events, not a fossil observation or empirical abundance estimate.',
    'A local population sample does not imply global abundance, universal evolutionary direction, fitness measurement or canonical P6 truth.',
    'No biological event is admitted to canonical P4 history by this query.'
  ]);
const MAX_LOCAL_POPULATIONS=12,MAX_ANCESTRY_DEPTH=8,MAX_LINEAGE_EVENTS=64,MAX_TRACE_EVIDENCE=48;
function unsupported(reason){return V.freezeDeep({version:VERSION,supported:false,reason,profiles:Object.freeze([]),populationCount:0,maxLocalPopulations:MAX_LOCAL_POPULATIONS,authority:AUTH,canonicalP6Unchanged:true,canonicalP4History:false,p4Admission:false,p4Mutation:false,fossilObservation:false,globalAbundanceInference:false,universalEvolutionaryLawClaim:false});}
function lineageIndexes(ecosystem){
  const current=new Map((ecosystem?.populations||[]).map(p=>[p.lineageId,p])),divergence=new Map();
  for(const e of (ecosystem?.history||[]).slice(-256))if(e.type==='LINEAGE_DIVERGENCE'&&e.lineageId&&!divergence.has(e.lineageId))divergence.set(e.lineageId,e);
  return {current,divergence};
}
function lineageChain(population,ecosystem,{maxDepth=MAX_ANCESTRY_DEPTH}={}){
  V.int(maxDepth,'maxDepth',1,MAX_ANCESTRY_DEPTH);V.text(String(population.lineageId),'lineageId',128);
  const {current,divergence}=lineageIndexes(ecosystem),rows=[],visited=new Set();let lineageId=population.lineageId,seed=population,complete=false,termination='MAX_DEPTH_REACHED';
  for(let depth=0;depth<maxDepth&&lineageId;depth++){
    if(visited.has(lineageId)){termination='LINEAGE_CYCLE_REJECTED';break;}visited.add(lineageId);
    const active=current.get(lineageId),event=divergence.get(lineageId),record=depth===0?seed:(active||null),parent=record?.parentLineageId||event?.details?.parentLineageId||null,generationBorn=record?.generationBorn??event?.generation??null;
    const source=record?'CURRENT_OR_LOCAL_MODELED_POPULATION_STATE':event?'MODELED_LINEAGE_DIVERGENCE_EVENT':'NO_RETAINED_LINEAGE_RECORD';
    rows.push(Object.freeze({lineageId,parentLineageId:parent,generationBorn,source,sourceEventId:event?.eventId||null}));
    if(!parent){complete=generationBorn===0;termination=complete?'FOUNDER_REACHED':'BOUNDED_LEDGER_GAP';break;}
    lineageId=parent;seed=null;
  }
  if(rows.length===maxDepth&&rows.at(-1)?.parentLineageId){complete=false;termination='MAX_DEPTH_REACHED';}
  return V.freezeDeep({lineageId:population.lineageId,chain:Object.freeze(rows),depth:rows.length,ancestryComplete:complete,termination,maxDepth});
}
function profilePopulation(population,ecosystem,traceEvidence,{maxDepth=MAX_ANCESTRY_DEPTH}={}){
  const ancestry=lineageChain(population,ecosystem,{maxDepth}),lineages=new Set(ancestry.chain.map(x=>x.lineageId));
  // Only events whose subject lineage is on this exact ancestry chain belong here.
  // Matching merely on details.parentLineageId would pull in sibling divergence events
  // and overstate the queried lineage's own history.
  const events=(ecosystem?.history||[]).filter(e=>lineages.has(e.lineageId)).slice(-MAX_LINEAGE_EVENTS).map(e=>Object.freeze({eventId:e.eventId,generation:e.generation,type:e.type,lineageId:e.lineageId,canonicalP4Event:e.canonicalP4Event===true}));
  const traces=(traceEvidence||[]).filter(e=>lineages.has(e.lineageId)).slice(-MAX_TRACE_EVIDENCE).map(e=>Object.freeze({evidenceId:e.evidenceId,sourceEventId:e.sourceEventId,lineageId:e.lineageId,kind:e.kind,tracePotentialPpm:e.tracePotentialPpm,directObservation:e.directObservation===true}));
  return V.freezeDeep({populationId:population.populationId,lineageId:population.lineageId,role:population.role||null,localDensityPpm:population.localDensityPpm??null,rarityClass:population.rarityClass||null,
    generationBorn:population.generationBorn??null,ancestry,lineageEvents:Object.freeze(events),traceEvidence:Object.freeze(traces),
    ancestryInferenceClass:'BOUNDED_MODELED_LINEAGE_LEDGER_PROJECTION',eventScopeClass:'EXACT_ANCESTRY_SUBJECT_LINEAGES_ONLY',authority:AUTH,canonicalBiologyClaim:false,fitnessMeasurement:false,globalAbundanceInference:false,fossilObservation:false});
}
function profileFromContext(world,context,{maxDepth=MAX_ANCESTRY_DEPTH}={}){
  V.int(maxDepth,'maxDepth',1,MAX_ANCESTRY_DEPTH);const ecosystem=world?.biology?.ecosystem;
  if(!ecosystem||ecosystem.state!=='MODELED_BIOSPHERE')return unsupported('NO_MODELED_BIOSPHERE');
  const populations=(context?.life?.local?.populations||[]).slice(0,MAX_LOCAL_POPULATIONS);
  if(populations.length===0)return unsupported('NO_MODELED_LOCAL_POPULATIONS');
  const traceEvidence=world?.biology?.traceEvidence?.evidence||[],profiles=Object.freeze(populations.map(p=>profilePopulation(p,ecosystem,traceEvidence,{maxDepth})));
  return V.freezeDeep({version:VERSION,supported:true,worldIdentity:ecosystem.worldIdentity,modelGeneration:ecosystem.generation,populationCount:profiles.length,maxLocalPopulations:MAX_LOCAL_POPULATIONS,maxAncestryDepth:MAX_ANCESTRY_DEPTH,
    profiles,historyBounded:true,authority:AUTH,canonicalP6Unchanged:true,canonicalP4History:false,p4Admission:false,p4Mutation:false,fossilObservation:false,globalAbundanceInference:false,universalEvolutionaryLawClaim:false,
    provenance:V.provenance('v1.evolution.local-lineage-context','1.0.0',[SOURCE]),researchLineage:Object.freeze({sourceBranch:SOURCE,harvestedConcept:'LINEAGE_EVENT_IDENTITY_AND_TRACE_RECONCILIATION',researchAuthorityPromoted:false})});
}
const previousLocalContext=W.localContext;
function localContext(world,point,options){const base=previousLocalContext(world,point,options),localLineageContext=profileFromContext(world,base);return V.freezeDeep({...base,localLineageContext});}
O.v1WorldContext=Object.freeze({...W,localContext});
O.v1LocalLineageContext=Object.freeze({VERSION,SOURCE,AUTHORITY:AUTH,MAX_LOCAL_POPULATIONS,MAX_ANCESTRY_DEPTH,MAX_LINEAGE_EVENTS,MAX_TRACE_EVIDENCE,lineageChain,profilePopulation,profileFromContext});
})(globalThis);
