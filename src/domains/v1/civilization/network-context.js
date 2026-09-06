(function(root){
'use strict';
const O=root.OFU=root.OFU||{},V=O.v1Common,W=O.v1WorldContext;
if(!V||!W)throw new Error('v1 common and world context required for settlement network context');
const VERSION='ofu-v11-settlement-network-context-1';
const SOURCE='research/v1x-18-civilization-individuals-2026-09-06';
const AUTH=V.authority('v1.civilization.network-context','1.0.0',[SOURCE],
  'Bounded deterministic topology inspection of the current modeled settlement/trade snapshot. Graph connectivity is exact for the modeled edges supplied to this query, but it is not an empirical transport network, historical route reconstruction, resilience probability or canonical history.',[
    'Trade edges and route costs remain MODEL_DERIVED_SIMULATION; graph topology does not make their physical geometry or economic necessity canonical.',
    'Articulation/lost-pair diagnostics describe only the current bounded modeled graph and are not failure probabilities, robustness measurements or causal claims.',
    'Abandoned settlements are reported as inactive in the current network; route legacy is not inferred from former connectivity.',
    'No P4 event is admitted or mutated and no persistent-person state is created.'
  ]);
const MAX_SETTLEMENTS=48,MAX_EDGES=96,MAX_DISTANCE_ROWS=48;
const active=s=>s?.status==='ACTIVE'&&Number(s.population||0)>0;
const pairKey=(a,b)=>a<b?a+'\u0000'+b:b+'\u0000'+a;
function unsupported(reason,extra={}){return V.freezeDeep({version:VERSION,supported:false,reason,selectedSettlementId:extra.selectedSettlementId||null,
  nodeCount:0,edgeCount:0,authority:AUTH,currentSnapshotOnly:true,routeLegacyInferred:false,physicalTransportNetworkClaim:false,
  resilienceProbability:false,canonicalHistoryClaim:false,p4HistoryMutated:false,...extra});}
function canonicalGraph(state){
  V.assert(state&&state.state==='MODELED_CIVILIZATION','modeled civilization required');
  const settlements=Array.isArray(state.settlements)?state.settlements:[],edges=Array.isArray(state.tradeEdges)?state.tradeEdges:[];
  V.assert(settlements.length<=MAX_SETTLEMENTS,'settlement network settlement bound');
  V.assert(edges.length<=MAX_EDGES,'settlement network edge bound');
  const allIds=new Set(),nodes=[];
  for(const s of settlements){V.text(String(s.settlementId),'settlementId',128);V.assert(!allIds.has(s.settlementId),'duplicate settlement identity');allIds.add(s.settlementId);if(active(s))nodes.push(s);}
  nodes.sort((a,b)=>String(a.settlementId).localeCompare(String(b.settlementId)));
  const activeIds=new Set(nodes.map(s=>s.settlementId)),usable=[],seenPairs=new Set();let ignoredInactiveEdges=0;
  for(const e of edges){
    V.text(String(e.from),'trade from',128);V.text(String(e.to),'trade to',128);V.assert(e.from!==e.to,'settlement network self edge');
    if(!allIds.has(e.from)||!allIds.has(e.to))return {error:'DANGLING_MODELED_TRADE_EDGE',settlements,nodes,ignoredInactiveEdges};
    if(!activeIds.has(e.from)||!activeIds.has(e.to)||e.status==='INACTIVE'){ignoredInactiveEdges++;continue;}
    const key=pairKey(e.from,e.to);V.assert(!seenPairs.has(key),'duplicate settlement network edge');seenPairs.add(key);
    const cost=Number(e.costPpm||0),flow=Number(e.flowUnits||0);V.ppm(cost,'trade costPpm');V.int(flow,'trade flowUnits',0,Number.MAX_SAFE_INTEGER);
    usable.push(Object.freeze({...e,costPpm:cost,flowUnits:flow}));
  }
  usable.sort((a,b)=>pairKey(a.from,a.to).localeCompare(pairKey(b.from,b.to))||String(a.edgeId||'').localeCompare(String(b.edgeId||'')));
  const adjacency=new Map(nodes.map(n=>[n.settlementId,[]]));
  for(const e of usable){adjacency.get(e.from).push({id:e.to,edge:e});adjacency.get(e.to).push({id:e.from,edge:e});}
  for(const list of adjacency.values())list.sort((a,b)=>a.id.localeCompare(b.id));
  return {settlements,nodes,edges:usable,adjacency,ignoredInactiveEdges};
}
function bfs(graph,start,excluded=null){
  if(start===excluded||!graph.adjacency.has(start))return new Map();
  const distance=new Map([[start,0]]),queue=[start];
  for(let q=0;q<queue.length;q++){
    const here=queue[q];for(const next of graph.adjacency.get(here)||[]){if(next.id===excluded||distance.has(next.id))continue;distance.set(next.id,distance.get(here)+1);queue.push(next.id);}
  }
  return distance;
}
function componentsAmong(graph,ids,excluded=null){
  const allowed=new Set(ids.filter(id=>id!==excluded)),components=[];
  while(allowed.size){const start=[...allowed].sort()[0],seen=new Set([start]),queue=[start];allowed.delete(start);
    for(let q=0;q<queue.length;q++)for(const next of graph.adjacency.get(queue[q])||[]){if(next.id===excluded||!allowed.has(next.id))continue;allowed.delete(next.id);seen.add(next.id);queue.push(next.id);}
    components.push([...seen].sort());
  }
  return components.sort((a,b)=>a[0].localeCompare(b[0]));
}
const pairs=n=>n<2?0:n*(n-1)/2;
function topology(state,settlementId){
  V.text(String(settlementId),'selected settlementId',128);
  if(!state||state.state!=='MODELED_CIVILIZATION')return unsupported('NO_MODELED_CIVILIZATION',{selectedSettlementId:settlementId});
  const graph=canonicalGraph(state);if(graph.error)return unsupported(graph.error,{selectedSettlementId:settlementId,ignoredInactiveEdges:graph.ignoredInactiveEdges});
  const settlement=graph.settlements.find(s=>s.settlementId===settlementId);if(!settlement)return unsupported('UNKNOWN_MODELED_SETTLEMENT',{selectedSettlementId:settlementId});
  if(!active(settlement))return V.freezeDeep({...unsupported('INACTIVE_CURRENT_SETTLEMENT',{selectedSettlementId:settlementId}),selectedStatus:String(settlement.status||'UNKNOWN'),modeledEpoch:Number(state.epoch||0),
    inactiveSettlementKnown:true,routeContinuityClass:'INACTIVE_CURRENT_SNAPSHOT'});
  const distance=bfs(graph,settlementId),componentIds=[...distance.keys()].sort(),incident=(graph.adjacency.get(settlementId)||[]),incidentEdges=incident.map(x=>x.edge),neighborIds=[...new Set(incident.map(x=>x.id))].sort();
  const incidentFlowUnits=incidentEdges.reduce((n,e)=>n+e.flowUnits,0),meanIncidentCostPpm=incidentEdges.length?Math.floor(incidentEdges.reduce((n,e)=>n+e.costPpm,0)/incidentEdges.length):0;
  V.assert(Number.isSafeInteger(incidentFlowUnits),'settlement network incident flow overflow');
  const remaining=componentIds.filter(id=>id!==settlementId),after=componentsAmong(graph,remaining,settlementId),connectedPairsAfter=after.reduce((n,c)=>n+pairs(c.length),0),lostPairCount=pairs(remaining.length)-connectedPairsAfter;
  const maxHopDistance=Math.max(0,...distance.values()),routeContinuityClass=neighborIds.length===0?'ISOLATED':neighborIds.length===1?'LEAF':lostPairCount>0?'ARTICULATION_CONNECTOR':'MESHED_NODE';
  const distances=Object.freeze([...distance.entries()].sort((a,b)=>a[1]-b[1]||a[0].localeCompare(b[0])).slice(0,MAX_DISTANCE_ROWS).map(([id,hops])=>Object.freeze({settlementId:id,hops})));
  return V.freezeDeep({version:VERSION,supported:true,worldIdentity:state.worldIdentity||null,modeledEpoch:Number(state.epoch||0),selectedSettlementId:settlementId,selectedStatus:settlement.status,
    nodeCount:graph.nodes.length,edgeCount:graph.edges.length,ignoredInactiveEdges:graph.ignoredInactiveEdges,directDegree:neighborIds.length,neighborIds:Object.freeze(neighborIds),incidentFlowUnits,meanIncidentCostPpm,
    connectedComponentSize:componentIds.length,reachableSettlementCount:Math.max(0,componentIds.length-1),unreachableActiveSettlementCount:Math.max(0,graph.nodes.length-componentIds.length),maxHopDistance,distances,
    articulationLostPairCount:lostPairCount,componentsAfterSelectedRemoval:after.length,routeContinuityClass,bounded:true,maxSettlements:MAX_SETTLEMENTS,maxEdges:MAX_EDGES,maxDistanceRows:MAX_DISTANCE_ROWS,
    graphSemantics:'UNDIRECTED_CURRENT_MODELED_EXCHANGE_CONNECTIVITY',authority:AUTH,currentSnapshotOnly:true,routeLegacyInferred:false,physicalTransportNetworkClaim:false,resilienceProbability:false,
    empiricalTravelTimeClaim:false,economicNecessityClaim:false,canonicalHistoryClaim:false,p4HistoryMutated:false,
    researchLineage:Object.freeze({sourceBranch:SOURCE,harvestedConcept:'BOUNDED_SETTLEMENT_EXCHANGE_TOPOLOGY',researchAuthorityPromoted:false})});
}
function fromLocalContext(world,context){
  const object=(context?.objects||[]).find(x=>(x.kind==='SETTLEMENT'||x.kind==='RUIN')&&x.settlement?.settlementId);
  if(!object)return unsupported('NO_SETTLEMENT_AT_EXACT_LOCATION');
  return topology(world?.civilization,object.settlement.settlementId);
}
const previousLocalContext=W.localContext;
function localContext(world,point,options){const base=previousLocalContext(world,point,options),settlementNetworkContext=fromLocalContext(world,base);return V.freezeDeep({...base,settlementNetworkContext});}
O.v1WorldContext=Object.freeze({...W,localContext});
O.v1CivilizationNetworkContext=Object.freeze({VERSION,AUTHORITY:AUTH,MAX_SETTLEMENTS,MAX_EDGES,MAX_DISTANCE_ROWS,canonicalGraph,bfs,componentsAmong,topology,fromLocalContext});
})(globalThis);
