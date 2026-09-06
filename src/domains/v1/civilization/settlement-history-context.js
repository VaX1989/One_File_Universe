(function(root){
'use strict';
const O=root.OFU=root.OFU||{},V=O.v1Common,W=O.v1WorldContext,H=O.v1HistorySystem;
if(!V||!W||!H)throw new Error('v1 common, world context and history system required for settlement history context');
const VERSION='ofu-v11-settlement-history-context-1';
const SOURCE='research/v1x-18-civilization-individuals-2026-09-06';
const AUTH=V.authority('v1.civilization.settlement-history-context','1.0.0',[SOURCE],
  'Bounded deterministic locality view over the existing modeled civilization proposal ledger and archaeological consequence model. It exposes what the simulation says happened at one settlement without admitting history or manufacturing empirical evidence.',[
    'History entries remain MODEL_DERIVED_SIMULATION proposals and are not canonical P4 events.',
    'Archaeological features are modeled consequences or snapshot-derived remnants, not measured archaeological observations.',
    'Current trade connectivity is a snapshot only; this module does not port the research routeLegacy stock or claim a physical historical route.',
    'No persistent-person, birth-cohort, private mental-state or genealogy claim is introduced.'
  ]);
const MAX_TIMELINE_EPOCHS=16,MAX_EVENTS=64,MAX_EVIDENCE=64;
function unsupported(reason,settlementId=null){return V.freezeDeep({version:VERSION,supported:false,reason,settlementId,timeline:Object.freeze([]),evidence:Object.freeze([]),authority:AUTH,canonicalHistoryClaim:false,canonicalArchaeologyClaim:false,p4Admission:false,p4Mutation:false,measuredEvidence:false,physicalRouteLegacyClaim:false,persistentPersonClaim:false});}
function profile(state,settlementId,{timelineLimit=MAX_TIMELINE_EPOCHS,evidenceLimit=32}={}){
  V.text(settlementId,'settlementId',128);V.int(timelineLimit,'timelineLimit',1,MAX_TIMELINE_EPOCHS);V.int(evidenceLimit,'evidenceLimit',1,MAX_EVIDENCE);
  if(!state||state.state!=='MODELED_CIVILIZATION')return unsupported('NO_MODELED_CIVILIZATION',settlementId);
  const settlement=(state.settlements||[]).find(s=>s.settlementId===settlementId)||null;
  const events=Object.freeze(H.atPlace(state.history,settlementId,{limit:MAX_EVENTS}));
  const allEvidence=H.archaeologicalEvidence(state.history,{settlements:state.settlements||[],infrastructure:state.infrastructure||[]}).features
    .filter(f=>f.placeId===settlementId).sort((a,b)=>a.epoch-b.epoch||a.featureId.localeCompare(b.featureId));
  const evidence=Object.freeze(allEvidence.slice(-evidenceLimit));
  if(!settlement&&events.length===0&&evidence.length===0)return unsupported('UNKNOWN_MODELED_PLACE',settlementId);
  const epochs=[...new Set([...events.map(e=>e.epoch),...evidence.map(e=>e.epoch)])].sort((a,b)=>a-b).slice(-timelineLimit);
  const timeline=Object.freeze(epochs.map(epoch=>{
    const es=events.filter(e=>e.epoch===epoch),fs=evidence.filter(f=>f.epoch===epoch);
    return Object.freeze({epoch,
      eventTypes:Object.freeze([...new Set(es.map(e=>e.type))].sort()),
      eventProposalIds:Object.freeze(es.map(e=>e.eventProposalId).sort()),
      evidenceKinds:Object.freeze([...new Set(fs.map(f=>f.kind))].sort()),
      evidenceIds:Object.freeze(fs.map(f=>f.featureId).sort()),
      eventCount:es.length,evidenceCount:fs.length});
  }));
  const foundations=events.filter(e=>e.type==='SETTLEMENT_FOUNDATION').map(e=>e.epoch),abandonments=events.filter(e=>e.type==='ABANDONMENT').map(e=>e.epoch),destructive=events.filter(e=>['CONFLICT','SETTLEMENT_DESTROYED','COLLAPSE','RESOURCE_CRISIS'].includes(e.type));
  const currentTradeRoutes=(state.tradeEdges||[]).filter(e=>e.from===settlementId||e.to===settlementId).length,currentInfrastructureAssets=(state.infrastructure||[]).filter(x=>x.settlementId===settlementId).length;
  const eventDerived=evidence.filter(f=>f.derivationClass==='EVENT_PROPOSAL_DERIVED'&&typeof f.sourceEventProposalId==='string'&&f.sourceEventProposalId.length>0).length,
    snapshotDerived=evidence.filter(f=>f.derivationClass==='INFRASTRUCTURE_SNAPSHOT_DERIVED_NO_EVENT_CAUSE'&&f.sourceEventProposalId==null).length,
    unclassifiedEvidence=evidence.length-eventDerived-snapshotDerived;
  return V.freezeDeep({version:VERSION,supported:true,settlementId,modeledEpoch:Number(state.epoch||0),currentSettlement:settlement,
    timeline,evidence,summary:Object.freeze({foundationEpoch:foundations.length?Math.min(...foundations):null,abandonmentEpochs:Object.freeze([...new Set(abandonments)].sort((a,b)=>a-b)),
      destructiveEventCount:destructive.length,eventCount:events.length,evidenceCount:evidence.length,eventDerivedEvidenceCount:eventDerived,snapshotDerivedEvidenceCount:snapshotDerived,unclassifiedEvidenceCount:unclassifiedEvidence,
      currentStatus:settlement?.status||'NO_CURRENT_SETTLEMENT_SNAPSHOT',currentPopulation:Number(settlement?.population||0),currentTradeRouteCount:currentTradeRoutes,currentInfrastructureAssetCount:currentInfrastructureAssets}),
    historySourceClass:'MODEL_PROPOSAL_LEDGER',archaeologySourceClass:'MODEL_DERIVED_CONSEQUENCE_SET',routeContextClass:'CURRENT_CONNECTIVITY_SNAPSHOT_NOT_PERSISTED_ROUTE_LEGACY',
    bounds:Object.freeze({maxTimelineEpochs:MAX_TIMELINE_EPOCHS,maxEvents:MAX_EVENTS,maxEvidence:MAX_EVIDENCE}),authority:AUTH,
    canonicalHistoryClaim:false,canonicalArchaeologyClaim:false,p4Admission:false,p4Mutation:false,measuredEvidence:false,physicalRouteLegacyClaim:false,persistentPersonClaim:false,
    provenance:V.provenance('v1.civilization.settlement-history-context','1.0.0',[SOURCE]),researchLineage:Object.freeze({sourceBranch:SOURCE,harvestedConcept:'SETTLEMENT_HISTORY_LOCALITY_AND_LEGACY_QUERY',researchAuthorityPromoted:false})});
}
function fromLocalContext(world,context,options={}){
  const object=(context?.objects||[]).find(x=>(x.kind==='SETTLEMENT'||x.kind==='RUIN')&&x.settlement?.settlementId);
  if(!object)return unsupported('NO_SETTLEMENT_AT_EXACT_LOCATION');
  return profile(world?.civilization,object.settlement.settlementId,options);
}
const previousLocalContext=W.localContext;
function localContext(world,point,options){
  const base=previousLocalContext(world,point,options),settlementHistoryContext=fromLocalContext(world,base,{timelineLimit:MAX_TIMELINE_EPOCHS,evidenceLimit:32});
  return V.freezeDeep({...base,settlementHistoryContext});
}
O.v1WorldContext=Object.freeze({...W,localContext});
O.v1SettlementHistoryContext=Object.freeze({VERSION,SOURCE,AUTHORITY:AUTH,MAX_TIMELINE_EPOCHS,MAX_EVENTS,MAX_EVIDENCE,profile,fromLocalContext});
})(globalThis);
