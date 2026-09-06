(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const VERSION='ofu-v1x-08-civilization-history-embodiment-1';
const CONTRACT='ofu-v1x-08-civilization-history-overlay-1';
const LOCAL_OVERLAY_CONTRACT='ofu-v1x-08-local-overlay-handoff-1';
const AUTHORITY=Object.freeze({
  CANONICAL_PROVEN:'CANONICAL_PROVEN',
  DERIVED:'DERIVED',
  MODEL_DERIVED_SIMULATION:'MODEL_DERIVED_SIMULATION',
  PRESENTATION_ONLY:'PRESENTATION_ONLY',
  MEASURED_RUNTIME_EVIDENCE:'MEASURED_RUNTIME_EVIDENCE'
});
const SUPPORTED_SCALES=Object.freeze(['REGIONAL_SURFACE','LOCAL_SURFACE','HUMAN','CIVILIZATION']);
const TEMPORAL_MODES=Object.freeze(['CURRENT_ONLY','HISTORY_ONLY','CURRENT_PLUS_HISTORY']);
const SCALE_LIMITS=Object.freeze({
  REGIONAL_SURFACE:Object.freeze({settlements:36,infrastructure:48,trade:56,history:40}),
  LOCAL_SURFACE:Object.freeze({settlements:28,infrastructure:40,trade:32,history:48}),
  HUMAN:Object.freeze({settlements:18,infrastructure:28,trade:20,history:40}),
  CIVILIZATION:Object.freeze({settlements:128,infrastructure:128,trade:192,history:96})
});
const TRACE_GRAMMAR=Object.freeze({
  SETTLEMENT_FOUNDATION:'FOUNDING_TRACE',
  MIGRATION:'MIGRATION_TRACE',
  TRADE_EXPANSION:'TRADE_HISTORY_TRACE',
  INFRASTRUCTURE_BUILT:'INFRASTRUCTURE_HISTORY_TRACE',
  CONFLICT:'DAMAGE_TRACE',
  SETTLEMENT_DESTROYED:'DESTRUCTION_TRACE',
  ABANDONMENT:'ABANDONMENT_TRACE',
  COLLAPSE:'COLLAPSE_TRACE',
  RECOVERY:'RECOVERY_TRACE'
});
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;for(const k of Object.keys(v))freeze(v[k]);return Object.freeze(v)}
function text(v){return typeof v==='string'?v:String(v??'')}
function num(v,fallback=0){const n=Number(v);return Number.isFinite(n)?n:fallback}
function int(v,fallback=0){return Math.trunc(num(v,fallback))}
function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v))}
function stableId(v,keys,fallback=''){for(const k of keys){if(v&&v[k]!==undefined&&v[k]!==null&&text(v[k]))return text(v[k])}return fallback}
function bySourceId(a,b){return a.sourceEntityId.localeCompare(b.sourceEntityId)}
function eventId(e){return stableId(e,['eventProposalId','eventId','id'],'')}
function eventSort(a,b){return int(a.epoch)-int(b.epoch)||eventId(a).localeCompare(eventId(b))}
function hash32(s){let h=2166136261>>>0;for(const ch of text(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0}return h>>>0}
function unit(seed,salt){return (hash32(text(seed)+'|'+text(salt))%1000001)/1000000}
function sourceAuthority(v){
  const a=v?.authority;
  const candidate=typeof a==='string'?a:(a?.authorityClass??a?.class??a?.authority??v?.authorityClass);
  const s=text(candidate||'UNSPECIFIED').toUpperCase();
  return Object.values(AUTHORITY).includes(s)?s:'UNSPECIFIED';
}
function sourceCanonical(v){return v?.canonical===true||sourceAuthority(v)===AUTHORITY.CANONICAL_PROVEN}
function presentationClaims(extra={}){return freeze({
  visualEncodingIsScientificTruth:false,
  screenGeometryCanonical:false,
  presentationCreatesCanonicalHistory:false,
  absentStateIsNotDecorated:true,
  ...extra
})}
function normalizedScale(scale){const s=text(scale||'CIVILIZATION').toUpperCase();if(!SUPPORTED_SCALES.includes(s))throw new RangeError('V1X-08 unsupported shared scale '+s);return s}
function normalizedMode(mode){const m=text(mode||'CURRENT_PLUS_HISTORY').toUpperCase();if(!TEMPORAL_MODES.includes(m))throw new RangeError('V1X-08 unsupported temporal mode '+m);return m}
function effectiveLimits(scale,budget){
  const own=SCALE_LIMITS[scale],shared=Math.max(0,int(budget?.SETTLEMENT?.objects??budget?.settlement?.objects??Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER));
  const objects=Math.min(shared,own.settlements+own.infrastructure);
  const settlementShare=Math.min(own.settlements,objects);
  const infrastructureShare=Math.min(own.infrastructure,Math.max(0,objects-settlementShare));
  return freeze({...own,settlements:settlementShare,infrastructure:infrastructureShare,sharedSettlementObjectLimit:Number.isSafeInteger(shared)?shared:null});
}
function regionMap(c){return new Map((Array.isArray(c?.regions)?c.regions:[]).map(r=>[text(r.regionId),r]))}
function regionAnchor(region,regionId){
  const lat=region?.location?.latMicroDeg,lon=region?.location?.lonMicroDeg;
  const located=Number.isFinite(Number(lat))&&Number.isFinite(Number(lon));
  return freeze({kind:'REGION',regionId:text(regionId||region?.regionId||''),locationStatus:located?'MODEL_REGION_LOCATION':'UNLOCATED_REGION',latMicroDeg:located?int(lat):null,lonMicroDeg:located?int(lon):null,authority:sourceAuthority(region)});
}
function schematicPlacement(entityId,regionId){return freeze({status:'SCHEMATIC_WITHIN_REGION',u:unit(entityId,'u'),v:unit(entityId,'v'),regionId:text(regionId),authority:AUTHORITY.PRESENTATION_ONLY,physicalPositionClaim:false})}
function populationBand(pop){const p=Math.max(0,int(pop));return p>=100000?'METROPOLITAN':p>=20000?'URBAN':p>=3000?'TOWN':p>=300?'SETTLEMENT':'SMALL'}
function landUseProxy(s){
  const pop=Math.max(0,int(s?.population)),infra=clamp(int(s?.infrastructurePpm),0,1000000),score=Math.log10(1+pop)*160000+infra*.35;
  return freeze({kind:'SETTLEMENT_LAND_USE_PROXY',band:score>=1200000?'EXTENSIVE':score>=800000?'MODERATE':score>=400000?'LIMITED':'MINIMAL',authority:AUTHORITY.PRESENTATION_ONLY,sourceFields:['population','infrastructurePpm'],measuredArea:false,canonicalLandUse:false});
}
function historyProposals(c,history){const h=history||c?.history;return (Array.isArray(h?.proposals)?h.proposals:[]).slice().sort(eventSort)}
function targetIds(e){return (Array.isArray(e?.targetIds)?e.targetIds:[]).map(text).filter(Boolean).sort()}
function eventLinks(events,entityId){return events.filter(e=>targetIds(e).includes(entityId)).map(eventId).filter(Boolean).sort()}
function currentSettlement(s,regions,events){
  const settlementId=stableId(s,['settlementId','id']);if(!settlementId)return null;
  const regionId=text(s.regionId||''),region=regions.get(regionId),status=text(s.status||'UNKNOWN').toUpperCase(),active=status==='ACTIVE';
  return freeze({
    id:'v1x08:settlement:'+settlementId,
    kind:active?'SETTLEMENT':'RUIN',
    sourceEntityId:settlementId,
    sourceEntityKind:'SETTLEMENT',
    authority:AUTHORITY.PRESENTATION_ONLY,
    sourceAuthority:sourceAuthority(s),
    temporalLayer:'CURRENT_STATE',
    selectable:true,
    anchor:regionAnchor(region,regionId),
    placement:schematicPlacement(settlementId,regionId),
    visual:freeze({settlementType:text(s.type||s.form||s.settlementClass||'UNSPECIFIED'),status,populationBand:populationBand(s.population),population:Math.max(0,int(s.population)),infrastructurePpm:clamp(int(s.infrastructurePpm),0,1000000),landUse:landUseProxy(s),grammar:active?'CURRENT_SETTLEMENT':'CURRENT_RUIN'}),
    sourceEventProposalIds:eventLinks(events,settlementId),
    reverseNavigation:freeze({action:'REQUEST_CANONICAL_SELECTION_CONTEXT',entityId:settlementId,entityKind:'SETTLEMENT',mutationPerformed:false,contract:'ofu-wave-iv-selection-1'}),
    claims:presentationClaims({sourceEntityExistenceCanonical:sourceCanonical(s),settlementPointLocationCanonical:false,landUseAreaCanonical:false})
  });
}
function endpointId(x,keyA,keyB){return text(x?.[keyA]??x?.[keyB]??'')}
function infrastructurePrimitive(x,events){
  const infrastructureId=stableId(x,['infrastructureId','id']);if(!infrastructureId)return null;
  const from=endpointId(x,'fromSettlementId','from'),to=endpointId(x,'toSettlementId','to'),status=text(x.status||'UNKNOWN').toUpperCase();
  return freeze({
    id:'v1x08:infrastructure:'+infrastructureId,
    kind:status==='RUINED'||status==='ABANDONED'?'INFRASTRUCTURE_RUIN':'INFRASTRUCTURE',
    sourceEntityId:infrastructureId,
    sourceEntityKind:'INFRASTRUCTURE',
    authority:AUTHORITY.PRESENTATION_ONLY,
    sourceAuthority:sourceAuthority(x),
    temporalLayer:'CURRENT_STATE',
    selectable:true,
    endpoints:freeze({fromSettlementId:from||null,toSettlementId:to||null}),
    visual:freeze({grammar:status==='RUINED'||status==='ABANDONED'?'RUINED_CORRIDOR':'ACTIVE_CORRIDOR',kind:text(x.kind||'UNSPECIFIED'),status}),
    sourceEventProposalIds:eventLinks(events,infrastructureId),
    reverseNavigation:freeze({action:'REQUEST_CANONICAL_SELECTION_CONTEXT',entityId:infrastructureId,entityKind:'INFRASTRUCTURE',mutationPerformed:false,contract:'ofu-wave-iv-selection-1'}),
    claims:presentationClaims({pathGeometryCanonical:false,sourceEntityExistenceCanonical:sourceCanonical(x)})
  });
}
function tradeLink(e){
  const edgeId=stableId(e,['edgeId','id']);if(!edgeId)return null;const from=endpointId(e,'from','fromSettlementId'),to=endpointId(e,'to','toSettlementId');if(!from||!to)return null;
  return freeze({id:'v1x08:trade:'+edgeId,kind:'TRADE_ROUTE_CUE',sourceEntityId:edgeId,authority:AUTHORITY.PRESENTATION_ONLY,sourceAuthority:sourceAuthority(e),temporalLayer:'CURRENT_STATE',fromSettlementId:from,toSettlementId:to,visual:freeze({flowUnits:Math.max(0,int(e.flowUnits)),mode:text(e.mode||'UNSPECIFIED'),status:text(e.status||'UNKNOWN')}),claims:presentationClaims({pathGeometryCanonical:false,tradeExistenceCanonical:sourceCanonical(e)})});
}
function historicalTrace(e){
  const grammar=TRACE_GRAMMAR[e?.type];if(!grammar)return null;const id=eventId(e);if(!id)return null;const targets=targetIds(e);if(!targets.length)return null;
  return freeze({
    id:'v1x08:history:'+id,
    kind:'HISTORICAL_TRACE',
    eventType:text(e.type),
    visualGrammar:grammar,
    sourceEventProposalId:id,
    sourceTargetIds:freeze(targets),
    epoch:int(e.epoch),
    authority:AUTHORITY.PRESENTATION_ONLY,
    sourceAuthority:sourceAuthority(e),
    sourceCanonical:sourceCanonical(e),
    temporalLayer:'HISTORICAL_PROJECTION',
    selectable:true,
    payloadKeys:freeze(Object.keys(e?.payload&&typeof e.payload==='object'?e.payload:{}).sort().slice(0,24)),
    claims:presentationClaims({historicalProjectionCanonical:false,freeFormNarrativeGenerated:false})
  });
}
function scopeFilter(scale,context){
  const regionId=text(context?.regionId||''),settlementId=text(context?.settlementId||'');
  if(!['LOCAL_SURFACE','HUMAN'].includes(scale))return ()=>true;
  if(settlementId&&regionId)return s=>text(s.settlementId)===settlementId||text(s.regionId)===regionId;
  if(settlementId)return s=>text(s.settlementId)===settlementId;
  if(regionId)return s=>text(s.regionId)===regionId;
  return ()=>false;
}
function selectedFirst(rows,selectedId,idFn){const sid=text(selectedId||'');return rows.slice().sort((a,b)=>{const ai=idFn(a)===sid?0:1,bi=idFn(b)===sid?0:1;return ai-bi||idFn(a).localeCompare(idFn(b))})}
function absentProjection({scale,mode,reason,sourceAuthority:sa='UNSPECIFIED'}){return freeze({contract:CONTRACT,version:VERSION,status:'ABSENT_OR_UNSUPPORTED',reason,scale,temporalMode:mode,civilizationVisible:false,objects:[],links:[],historyTraces:[],authority:AUTHORITY.PRESENTATION_ONLY,sourceAuthority:sa,claims:presentationClaims(),resourceWitness:freeze({authority:AUTHORITY.DERIVED,measured:false,objects:0,links:0,historyTraces:0})})}
function project({civilization,history=null,scale='CIVILIZATION',temporalMode='CURRENT_PLUS_HISTORY',context={},selectedId=null,budget=null}={}){
  const s=normalizedScale(scale),mode=normalizedMode(temporalMode),c=civilization;
  if(!c||c.state!=='MODELED_CIVILIZATION')return absentProjection({scale:s,mode,reason:'NO_MODELED_CIVILIZATION',sourceAuthority:sourceAuthority(c)});
  const localScope=['LOCAL_SURFACE','HUMAN'].includes(s);if(localScope&&!text(context?.regionId||context?.settlementId||''))return absentProjection({scale:s,mode,reason:'LOCAL_CONTEXT_REQUIRED',sourceAuthority:sourceAuthority(c)});
  const limits=effectiveLimits(s,budget),events=historyProposals(c,history),regions=regionMap(c),filter=scopeFilter(s,context),objects=[],links=[],traces=[];
  if(mode!=='HISTORY_ONLY'){
    const settlements=selectedFirst((Array.isArray(c.settlements)?c.settlements:[]).filter(filter),selectedId,x=>stableId(x,['settlementId','id'])).slice(0,limits.settlements);
    for(const row of settlements){const p=currentSettlement(row,regions,events);if(p)objects.push(p)}
    const visibleSettlementIds=new Set(settlements.map(x=>stableId(x,['settlementId','id'])));
    const infrastructure=(Array.isArray(c.infrastructure)?c.infrastructure:[]).filter(x=>!localScope||visibleSettlementIds.has(endpointId(x,'fromSettlementId','from'))||visibleSettlementIds.has(endpointId(x,'toSettlementId','to'))).sort((a,b)=>stableId(a,['infrastructureId','id']).localeCompare(stableId(b,['infrastructureId','id']))).slice(0,limits.infrastructure);
    for(const row of infrastructure){const p=infrastructurePrimitive(row,events);if(p)objects.push(p)}
    const trade=(Array.isArray(c.tradeEdges)?c.tradeEdges:[]).filter(x=>!localScope||visibleSettlementIds.has(endpointId(x,'from','fromSettlementId'))||visibleSettlementIds.has(endpointId(x,'to','toSettlementId'))).sort((a,b)=>stableId(a,['edgeId','id']).localeCompare(stableId(b,['edgeId','id']))).slice(0,limits.trade);
    for(const row of trade){const p=tradeLink(row);if(p)links.push(p)}
  }
  if(mode!=='CURRENT_ONLY'){
    const allowedTargets=new Set((Array.isArray(c.settlements)?c.settlements:[]).filter(filter).map(x=>stableId(x,['settlementId','id'])));
    const relevant=events.filter(e=>!localScope||targetIds(e).some(id=>allowedTargets.has(id))).slice(-limits.history);
    for(const e of relevant){const p=historicalTrace(e);if(p)traces.push(p)}
  }
  objects.sort(bySourceId);links.sort((a,b)=>a.id.localeCompare(b.id));traces.sort((a,b)=>a.epoch-b.epoch||a.sourceEventProposalId.localeCompare(b.sourceEventProposalId));
  const visible=objects.length>0||links.length>0||traces.length>0;
  return freeze({contract:CONTRACT,version:VERSION,status:visible?'PROJECTED':'NO_SUPPORTED_CIVILIZATION_VISUALS',scale:s,temporalMode:mode,civilizationVisible:visible,objects,links,historyTraces:traces,authority:AUTHORITY.PRESENTATION_ONLY,sourceAuthority:sourceAuthority(c),limits,claims:presentationClaims(),resourceWitness:freeze({authority:AUTHORITY.DERIVED,measured:false,objects:objects.length,links:links.length,historyTraces:traces.length,hardBounds:limits})});
}
function select(projection,entityId){
  const id=text(entityId);const candidate=[...(projection?.objects||[]),...(projection?.historyTraces||[])].find(x=>x.sourceEntityId===id||x.sourceEventProposalId===id||x.id===id);
  if(!candidate)return freeze({status:'NOT_FOUND',entityId:id,mutationPerformed:false,authority:AUTHORITY.PRESENTATION_ONLY});
  return freeze({status:'SELECTION_REQUEST',entityId:candidate.sourceEntityId||candidate.sourceEventProposalId,visualId:candidate.id,sourceEventProposalId:candidate.sourceEventProposalId||null,temporalLayer:candidate.temporalLayer,selectionContract:'ofu-wave-iv-selection-1',mutationPerformed:false,requiresConvergenceOwnerBridge:true,authority:AUTHORITY.PRESENTATION_ONLY});
}
function localSceneOverlay(args={}){
  const projection=project(args),eligible=['REGIONAL_SURFACE','LOCAL_SURFACE','HUMAN'].includes(projection.scale);
  return freeze({contract:LOCAL_OVERLAY_CONTRACT,version:VERSION,status:eligible?projection.status:'SCALE_NOT_LOCAL',scale:projection.scale,objects:eligible?projection.objects:[],links:eligible?projection.links:[],historyTraces:eligible?projection.historyTraces:[],selectionMutationPerformed:false,sharedSceneMutationPerformed:false,requiresIntegrationOwner:true,authority:AUTHORITY.PRESENTATION_ONLY,sourceAuthority:projection.sourceAuthority,claims:presentationClaims()});
}
function compare({before,after,scale='CIVILIZATION',context={},budget=null}={}){
  const a=project({civilization:before,scale,context,budget,temporalMode:'CURRENT_PLUS_HISTORY'}),b=project({civilization:after,scale,context,budget,temporalMode:'CURRENT_PLUS_HISTORY'});
  const ids=x=>new Set([...(x.objects||[]),...(x.links||[]),...(x.historyTraces||[])].map(v=>v.id)),A=ids(a),B=ids(b),added=[...B].filter(x=>!A.has(x)).sort(),removed=[...A].filter(x=>!B.has(x)).sort();
  const objectState=x=>new Map((x.objects||[]).map(v=>[v.sourceEntityId,JSON.stringify(v.visual)])),am=objectState(a),bm=objectState(b),changed=[];for(const id of new Set([...am.keys(),...bm.keys()]))if(am.has(id)&&bm.has(id)&&am.get(id)!==bm.get(id))changed.push(id);changed.sort();
  return freeze({contract:'ofu-v1x-08-comparative-visual-witness-1',authority:AUTHORITY.DERIVED,before:a,after:b,delta:freeze({addedVisualIds:added,removedVisualIds:removed,changedSourceEntityIds:changed}),claims:presentationClaims()});
}
function handoffCapabilities(){return freeze({
  contract:'ofu-v1x-08-future-human-context-hooks-1',
  authority:AUTHORITY.PRESENTATION_ONLY,
  hooks:[
    {id:'GAMEPLAY_INTERVENTION_CONTEXT',status:'HOOK_ONLY',targetLane:'V1X-12',canonicalMutation:false},
    {id:'FUTURE_INDIVIDUAL_CONTEXT',status:'HOOK_ONLY',targetLane:'V1X-18',canonicalMutation:false}
  ],
  claims:presentationClaims({gameplayImplemented:false,individualSimulationImplemented:false})
})}
const API=Object.freeze({VERSION,CONTRACT,LOCAL_OVERLAY_CONTRACT,AUTHORITY,SUPPORTED_SCALES,TEMPORAL_MODES,SCALE_LIMITS,TRACE_GRAMMAR,project,select,localSceneOverlay,compare,handoffCapabilities});
O.v1x08CivilizationHistoryEmbodiment=API;
})(typeof globalThis!=='undefined'?globalThis:this);
