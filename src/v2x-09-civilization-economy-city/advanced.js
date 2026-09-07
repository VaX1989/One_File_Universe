(function(root){
'use strict';
const O=root.OFU=root.OFU||{},K=O.v2x09CivilizationCore,P=O.v2x09CivilizationProductionNetwork,S=O.v2x09CivilizationSocietyDynamics,U=O.v2x09CivilizationUrbanEvolution;if(!K||!P||!S||!U)throw new Error('V2X-09 advanced module set required');
const RESILIENCE_CONTRACT='ofu-v2x-09-network-resilience-1';
const RECOVERY_CONTRACT='ofu-v2x-09-recovery-envelope-1';
const RESILIENCE_LIMITS=Object.freeze({routes:96,settlements:48,projectionEpochs:16,scenarioInfrastructureAssets:96,operations:250000,recoveryReportedOperations:5500000});
function t(v){return K.text?K.text(v):String(v??'')}
function a(v){return K.arr?K.arr(v):(Array.isArray(v)?v:[])}
function i(v,f=0){return K.int?K.int(v,f):(Number.isFinite(Number(v))?Math.trunc(Number(v)):f)}
function c(v,lo=0,hi=1000000){return K.clamp?K.clamp(v,lo,hi):Math.max(lo,Math.min(hi,i(v)))}
function f(v){return K.freeze(v)}
function bump(counter,n=1){counter.count+=n;if(counter.count>RESILIENCE_LIMITS.operations)throw new RangeError('V2X-09 network-resilience global operation bound exceeded')}
function routeGraph(production,counter){
  const rawSettlements=a(production?.settlements),rawRoutes=a(production?.routes);
  if(rawSettlements.length>RESILIENCE_LIMITS.settlements)throw new RangeError('V2X-09 resilience settlement bound exceeded');
  if(rawRoutes.length>RESILIENCE_LIMITS.routes)throw new RangeError('V2X-09 resilience route bound exceeded');
  if(K.assertUniqueIds){K.assertUniqueIds('resilience settlement',rawSettlements,'settlementId');K.assertUniqueIds('resilience route',rawRoutes,'edgeId')}
  const settlementIds=rawSettlements.filter(s=>t(s.status).toUpperCase()==='ACTIVE').map(s=>t(s.settlementId)).sort(),known=new Set(settlementIds),routes=[];
  for(const r of rawRoutes){bump(counter);if(!known.has(t(r.from))||!known.has(t(r.to))||i(r.capacityUnits)<=0||r.routingEligible===false||r.operational===false)continue;routes.push({edgeId:t(r.edgeId),from:t(r.from),to:t(r.to),capacityUnits:Math.max(0,i(r.capacityUnits)),usedUnits:Math.max(0,i(r.usedUnits)),conditionPpm:c(r.conditionPpm||0),degradationPpm:c(r.degradationPpm||0),utilizationPpm:c(r.utilizationPpm||0)})}
  const adjacency=new Map(settlementIds.map(id=>[id,[]]));
  for(const r of routes){bump(counter);adjacency.get(r.from).push(r);adjacency.get(r.to).push(r)}
  for(const list of adjacency.values())list.sort((x,y)=>x.edgeId.localeCompare(y.edgeId));
  return {settlementIds,routes,adjacency};
}
function bridgeEdgeIds(graph,counter){
  const discovery=new Map(),low=new Map(),bridges=new Set();let time=0;
  function visit(node,parentEdgeId=null){
    discovery.set(node,++time);low.set(node,time);
    for(const edge of graph.adjacency.get(node)||[]){
      bump(counter);if(edge.edgeId===parentEdgeId)continue;const next=edge.from===node?edge.to:edge.from;
      if(!discovery.has(next)){visit(next,edge.edgeId);low.set(node,Math.min(low.get(node),low.get(next)));if(low.get(next)>discovery.get(node))bridges.add(edge.edgeId)}
      else low.set(node,Math.min(low.get(node),discovery.get(next)));
    }
  }
  for(const node of graph.settlementIds)if(!discovery.has(node))visit(node);
  return bridges;
}
function heapBetter(x,y){return x.capacity>y.capacity||(x.capacity===y.capacity&&x.node<y.node)}
function heapPush(heap,item,counter){
  heap.push(item);let index=heap.length-1;
  while(index>0){const parent=Math.floor((index-1)/2);bump(counter);if(!heapBetter(heap[index],heap[parent]))break;const tmp=heap[parent];heap[parent]=heap[index];heap[index]=tmp;index=parent}
}
function heapPop(heap,counter){
  if(!heap.length)return null;const root=heap[0],last=heap.pop();if(!heap.length)return root;heap[0]=last;let index=0;
  while(true){const left=index*2+1,right=left+1;let best=index;if(left<heap.length){bump(counter);if(heapBetter(heap[left],heap[best]))best=left}if(right<heap.length){bump(counter);if(heapBetter(heap[right],heap[best]))best=right}if(best===index)break;const tmp=heap[index];heap[index]=heap[best];heap[best]=tmp;index=best}
  return root;
}
function alternatePathBottleneckCapacity(graph,start,goal,blockedEdgeId,counter){
  if(start===goal)return 0;const best=new Map(graph.settlementIds.map(id=>[id,0])),heap=[];best.set(start,Number.MAX_SAFE_INTEGER);heapPush(heap,{node:start,capacity:Number.MAX_SAFE_INTEGER},counter);
  while(heap.length){const current=heapPop(heap,counter);if(!current||current.capacity<(best.get(current.node)||0))continue;if(current.node===goal)return current.capacity===Number.MAX_SAFE_INTEGER?0:current.capacity;
    for(const edge of graph.adjacency.get(current.node)||[]){bump(counter);if(edge.edgeId===blockedEdgeId)continue;const next=edge.from===current.node?edge.to:edge.from,candidate=Math.min(current.capacity,Math.max(0,i(edge.capacityUnits)));if(candidate>(best.get(next)||0)){best.set(next,candidate);heapPush(heap,{node:next,capacity:candidate},counter)}}
  }
  return 0;
}
function networkResilience(production){
  if(production?.status!=='MODELED')return f({contract:RESILIENCE_CONTRACT,status:'NO_MODELED_NETWORK',routes:[],settlements:[],criticalRouteIds:[],operations:0,authority:K.AUTHORITY.DERIVED,bounded:true,mutationPerformed:false});
  const counter={count:0},graph=routeGraph(production,counter),bridges=bridgeEdgeIds(graph,counter),critical=[];
  const routes=graph.routes.map(r=>{const alternatePathAvailable=!bridges.has(r.edgeId),alternatePathBottleneckCapacityUnits=alternatePathAvailable?alternatePathBottleneckCapacity(graph,r.from,r.to,r.edgeId,counter):0,capacity=Math.max(0,i(r.capacityUnits)),used=Math.max(0,i(r.usedUnits)),spare=Math.max(0,capacity-used),alternatePathCapacityRatioPpm=capacity?c(Math.floor(alternatePathBottleneckCapacityUnits*1000000/capacity)):0,substitutionGapPpm=alternatePathAvailable?1000000-Math.min(1000000,alternatePathCapacityRatioPpm):1000000,criticalityPpm=alternatePathAvailable?c(Math.floor((1000000-c(r.conditionPpm||0))*.25+c(r.utilizationPpm||0)*.25+substitutionGapPpm*.25)):c(Math.floor(650000+c(r.utilizationPpm||0)*.2+c(r.degradationPpm||0)*.15));if(!alternatePathAvailable)critical.push(r.edgeId);return f({edgeId:r.edgeId,from:r.from,to:r.to,alternatePathAvailable,bridgeLike:!alternatePathAvailable,alternatePathBottleneckCapacityUnits,alternatePathCapacityRatioPpm,topologicalAlternatePathOnly:true,flowSubstitutionClaim:false,capacityUnits:capacity,usedUnits:used,spareCapacityUnits:spare,criticalityPpm,conditionPpm:c(r.conditionPpm||0),degradationPpm:c(r.degradationPpm||0),authority:K.AUTHORITY.DERIVED})});
  const settlements=[];for(const id of graph.settlementIds){const incident=[],criticalIncident=[];let capacity=0,spare=0;for(const r of routes){bump(counter);if(r.from!==id&&r.to!==id)continue;incident.push(r);capacity+=r.capacityUnits;spare+=r.spareCapacityUnits;if(r.bridgeLike)criticalIncident.push(r)}settlements.push(f({settlementId:id,degree:incident.length,criticalIncidentRouteIds:criticalIncident.map(r=>r.edgeId).sort(),aggregateRouteCapacityUnits:capacity,aggregateSpareCapacityUnits:spare,isolationRiskPpm:incident.length===0?1000000:c(Math.floor(criticalIncident.length*1000000/incident.length)),authority:K.AUTHORITY.DERIVED}))}
  return f({contract:RESILIENCE_CONTRACT,status:'MODELED',routes,settlements,criticalRouteIds:critical.sort(),operations:counter.count,operationAccountingScope:'GRAPH_BUILD_BRIDGE_DETECTION_ALTERNATE_CAPACITY_AND_SETTLEMENT_AGGREGATION',authority:K.AUTHORITY.DERIVED,bounded:true,limits:RESILIENCE_LIMITS,mutationPerformed:false,physicalTransportGeometryClaim:false,topologyOnly:true,flowSubstitutionClaim:false});
}
function modelAdvancedCivilization(state,economy){
  const production=P.productionNetwork(state,economy),society=S.societyDynamics(state,production),urban=U.urbanEvolution(state,production,society),resilience=networkResilience(production),evidenceComplete=production?.evidenceCoverage?.complete!==false&&society?.evidenceComplete!==false&&urban?.evidenceComplete!==false;
  return f({contract:'ofu-v2x-09-advanced-civilization-composition-2',version:K.VERSION,status:production.status==='MODELED'&&society.status==='MODELED'&&urban.status==='MODELED'?'MODELED':'NO_MODELED_INPUT',production,society,urban,resilience,evidenceComplete,evidence:f({productionCoverage:production?.evidenceCoverage||null,societyGaps:a(society?.evidenceGaps),urbanGaps:a(urban?.evidenceGaps)}),authority:K.AUTHORITY.MODEL_DERIVED_SIMULATION,renderAuthority:K.AUTHORITY.PRESENTATION_ONLY,bounded:true,mutationPerformed:false,persistentPersonIdentityCreated:false,canonicalHistoryMutation:false,planetOrLifeMutation:false,requiresConvergenceOwnerComposition:true,limitations:K.LIMITATIONS});
}
function cloneScenarioState(state){return {...state,regions:a(state?.regions).map(x=>({...x})),settlements:a(state?.settlements).map(x=>({...x})),tradeEdges:a(state?.tradeEdges).map(x=>({...x})),technology:{...(state?.technology||{})},polities:a(state?.polities).map(x=>({...x,settlementIds:a(x.settlementIds).slice()})),infrastructure:a(state?.infrastructure).map(x=>({...x})),history:state?.history?{...state.history,proposals:a(state.history.proposals).slice()}:state?.history}}
function infrastructureForEdge(state,edge){const ef=t(edge?.from),et=t(edge?.to);return a(state?.infrastructure).filter(x=>{const a1=t(x.fromSettlementId),b1=t(x.toSettlementId);return (a1===ef&&b1===et)||(a1===et&&b1===ef)})}
function averageCondition(rows){if(!rows.length)return null;return c(Math.floor(rows.reduce((n,x)=>n+c(x.conditionPpm??(t(x.status).toUpperCase()==='ACTIVE'?850000:300000)),0)/rows.length))}
function pressureFor(society,settlementId){return a(society?.settlementPressures).find(x=>t(x.settlementId)===settlementId)||null}
function institutionFor(society,settlementId){return a(society?.institutionProposals).find(x=>a(x.settlementIds).map(t).includes(settlementId))||null}
function routeFor(production,edgeId){return a(production?.routes).find(x=>t(x.edgeId)===edgeId)||null}
function recoveryRefusal(status,extra={}){return f({contract:RECOVERY_CONTRACT,status,trajectory:[],reportedSubmodelOperations:0,authority:K.AUTHORITY.MODEL_DERIVED_SIMULATION,counterfactual:true,canonicalForecast:false,mutationPerformed:false,persistentPersonIdentityCreated:false,canonicalHistoryMutation:false,planetOrLifeMutation:false,...extra})}
function recoveryRatePpm(composed,edgeId,settlementIds){
  const route=routeFor(composed.production,edgeId),services=[];for(const sid of settlementIds){const row=a(composed.production?.settlements).find(x=>t(x.settlementId)===sid);const pub=a(row?.serviceSatisfaction?.services).find(x=>t(x.good)==='PUBLIC_WORKS_SERVICE');const maint=a(row?.serviceSatisfaction?.services).find(x=>t(x.good)==='URBAN_MAINTENANCE_SERVICE');if(pub)services.push(c(pub.satisfactionPpm));if(maint)services.push(c(maint.satisfactionPpm))}
  const service=services.length?Math.floor(services.reduce((n,x)=>n+x,0)/services.length):0,repairPriority=settlementIds.some(sid=>a(institutionFor(composed.society,sid)?.mechanisms).includes('REPAIR_PRIORITY')),spare=c(route?.capacityUnits?Math.floor(Math.max(0,i(route.remainingUnits))*1000000/Math.max(1,i(route.capacityUnits))):0);return c(15000+Math.floor(service*.07)+(repairPriority?45000:0)+Math.floor(spare*.015),10000,160000);
}
function projectRecoveryEnvelope(state,economy,{edgeId=null,shockSeverityPpm=700000,maxEpochs=12}={}){
  maxEpochs=c(maxEpochs,1,RESILIENCE_LIMITS.projectionEpochs);shockSeverityPpm=c(shockSeverityPpm,0,950000);
  if(!K.validateCivilization(state))return recoveryRefusal('NO_MODELED_CIVILIZATION');
  if(!economy||!['READY','STEPPED'].includes(t(economy.status)))return recoveryRefusal('NO_MODELED_ECONOMY_FOR_RECOVERY');
  const edge=edgeId?a(state?.tradeEdges).find(x=>t(x.edgeId)===t(edgeId)):a(state?.tradeEdges)[0];if(!edge)return recoveryRefusal('NO_MODELED_EDGE');
  const edgeStatus=t(edge.status||'UNKNOWN').toUpperCase();if(edgeStatus!=='ACTIVE')return recoveryRefusal('EDGE_NOT_ACTIVE_FOR_RECOVERY',{edgeId:t(edge.edgeId),edgeStatus});
  const stateById=new Map(a(state?.settlements).map(x=>[t(x.settlementId),x])),economyRows=a(economy?.settlements);if(K.assertUniqueIds)K.assertUniqueIds('recovery economy settlement',economyRows,'settlementId');const economyById=new Map(economyRows.map(x=>[t(x.settlementId),x])),settlementIds=[t(edge.from),t(edge.to)].sort();
  for(const sid of settlementIds){const modeled=stateById.get(sid),economic=economyById.get(sid);if(!modeled||t(modeled.status||'UNKNOWN').toUpperCase()!=='ACTIVE')return recoveryRefusal('EDGE_ENDPOINT_NOT_ACTIVE_FOR_RECOVERY',{edgeId:t(edge.edgeId),settlementId:sid});if(!economic)return recoveryRefusal('EDGE_ENDPOINT_NOT_MODELED_IN_ECONOMY',{edgeId:t(edge.edgeId),settlementId:sid});const economicStatus=t(economic.status||'').toUpperCase();if(economicStatus&&economicStatus!=='ACTIVE')return recoveryRefusal('EDGE_ENDPOINT_NOT_ACTIVE_IN_ECONOMY',{edgeId:t(edge.edgeId),settlementId:sid,economyStatus:economicStatus})}
  const technology=K.technologyProfile(state),activeCapabilities=new Set(a(technology.activeCapabilities));if(!activeCapabilities.has('ROUTE_LOGISTICS'))return recoveryRefusal('ROUTE_LOGISTICS_CAPABILITY_INACTIVE',{edgeId:t(edge.edgeId)});if(!activeCapabilities.has('PUBLIC_WORKS'))return recoveryRefusal('PUBLIC_WORKS_CAPABILITY_INACTIVE',{edgeId:t(edge.edgeId)});
  const allInfrastructure=a(state?.infrastructure);if(allInfrastructure.length>RESILIENCE_LIMITS.scenarioInfrastructureAssets)return recoveryRefusal('INFRASTRUCTURE_BOUND_EXCEEDED',{edgeId:t(edge.edgeId),observedInfrastructureAssets:allInfrastructure.length,maxInfrastructureAssets:RESILIENCE_LIMITS.scenarioInfrastructureAssets});if(K.assertUniqueIds)K.assertUniqueIds('recovery infrastructure asset',allInfrastructure,'infrastructureId');
  const originalRows=infrastructureForEdge(state,edge);if(!originalRows.length)return recoveryRefusal('NO_MODELED_INFRASTRUCTURE_FOR_EDGE',{edgeId:t(edge.edgeId)});const originalCondition=averageCondition(originalRows);if(originalCondition<=0)return recoveryRefusal('NO_RECOVERABLE_BASELINE',{edgeId:t(edge.edgeId),originalConditionPpm:originalCondition});
  const scenario=cloneScenarioState(state),scenarioRows=infrastructureForEdge(scenario,edge),shockFloor=Math.min(50000,originalCondition),shockCondition=c(Math.floor(originalCondition*(1000000-shockSeverityPpm)/1000000),shockFloor,originalCondition);for(const x of scenarioRows){x.conditionPpm=shockCondition;x.status=shockCondition<350000?'DAMAGED':t(x.status||'ACTIVE');x.lastActiveEpoch=i(state?.epoch||0)}
  const trajectory=[];let recoveredEpoch=null,reportedSubmodelOperations=0;
  for(let step=0;step<=maxEpochs;step++){
    scenario.epoch=i(state?.epoch||0)+step;const composed=modelAdvancedCivilization(scenario,economy);reportedSubmodelOperations+=i(composed.production?.operations)+i(composed.society?.operations)+i(composed.resilience?.operations);if(reportedSubmodelOperations>RESILIENCE_LIMITS.recoveryReportedOperations)throw new RangeError('V2X-09 recovery reported-operation bound exceeded');const route=routeFor(composed.production,t(edge.edgeId)),pressures=settlementIds.map(sid=>pressureFor(composed.society,sid)).filter(Boolean),avgPressure=pressures.length?c(Math.floor(pressures.reduce((n,x)=>n+c(x.migrationPressurePpm||0),0)/pressures.length)):0,avgService=pressures.length?c(Math.floor(pressures.reduce((n,x)=>n+c(x.serviceSatisfactionPpm||0),0)/pressures.length)):0,institutions=settlementIds.map(sid=>institutionFor(composed.society,sid)).filter(Boolean),repairPriority=institutions.some(x=>a(x.mechanisms).includes('REPAIR_PRIORITY')),condition=averageCondition(scenarioRows);trajectory.push(f({projectedEpoch:scenario.epoch,conditionPpm:condition,routeCapacityUnits:Math.max(0,i(route?.capacityUnits||0)),routeUtilizationPpm:c(route?.utilizationPpm||0),averageMigrationPressurePpm:avgPressure,averageServiceSatisfactionPpm:avgService,repairPriority,criticalRoute:composed.resilience.criticalRouteIds.includes(t(edge.edgeId)),urbanPhases:settlementIds.map(sid=>({settlementId:sid,phase:t(a(composed.urban?.settlements).find(x=>t(x.settlementId)===sid)?.phase||'UNKNOWN')})),reportedSubmodelOperations,authority:K.AUTHORITY.MODEL_DERIVED_SIMULATION}));
    if(condition>=Math.floor(originalCondition*.95)){recoveredEpoch=scenario.epoch;break}if(step===maxEpochs)break;const rate=recoveryRatePpm(composed,t(edge.edgeId),settlementIds),next=c(condition+Math.floor((originalCondition-condition)*rate/1000000),condition,originalCondition);for(const x of scenarioRows){x.conditionPpm=next;if(next>=500000&&t(x.status).toUpperCase()==='DAMAGED')x.status='ACTIVE';x.lastActiveEpoch=scenario.epoch+1}
  }
  const first=trajectory[0],last=trajectory[trajectory.length-1];return f({contract:RECOVERY_CONTRACT,status:'PROJECTED',edgeId:t(edge.edgeId),sourceInfrastructureIds:scenarioRows.map(x=>t(x.infrastructureId)).filter(Boolean).sort(),originalConditionPpm:originalCondition,shockSeverityPpm,shockConditionPpm:shockCondition,recoveredEpoch,trajectory,reportedSubmodelOperations,operationAccountingScope:'SUM_OF_PRODUCTION_SOCIETY_AND_RESILIENCE_REPORTED_OPERATIONS_PER_PROJECTED_EPOCH',summary:f({epochsProjected:trajectory.length-1,capacityDeltaUnits:i(last?.routeCapacityUnits)-i(first?.routeCapacityUnits),conditionDeltaPpm:c(last?.conditionPpm||0)-c(first?.conditionPpm||0),migrationPressureDeltaPpm:i(last?.averageMigrationPressurePpm)-i(first?.averageMigrationPressurePpm),serviceSatisfactionDeltaPpm:i(last?.averageServiceSatisfactionPpm)-i(first?.averageServiceSatisfactionPpm)}),authority:K.AUTHORITY.MODEL_DERIVED_SIMULATION,counterfactual:true,canonicalForecast:false,mutationPerformed:false,persistentPersonIdentityCreated:false,canonicalHistoryMutation:false,planetOrLifeMutation:false,economySnapshotHeldConstant:true,infrastructureOnlyCounterfactual:true,bounded:true,limits:RESILIENCE_LIMITS,limitations:K.LIMITATIONS});
}
O.v2x09CivilizationAdvanced=Object.freeze({VERSION:K.VERSION,RESILIENCE_CONTRACT,RECOVERY_CONTRACT,RESILIENCE_LIMITS,modelAdvancedCivilization,networkResilience,alternatePathBottleneckCapacity,projectRecoveryEnvelope,PRODUCTION_CONTRACT:P.CONTRACT,SOCIETY_CONTRACT:S.CONTRACT,URBAN_CONTRACT:U.CONTRACT});
})(typeof globalThis!=='undefined'?globalThis:this);
