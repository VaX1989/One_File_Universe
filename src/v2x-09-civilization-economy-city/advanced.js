(function(root){
'use strict';
const O=root.OFU=root.OFU||{},K=O.v2x09CivilizationCore,P=O.v2x09CivilizationProductionNetwork,S=O.v2x09CivilizationSocietyDynamics,U=O.v2x09CivilizationUrbanEvolution;if(!K||!P||!S||!U)throw new Error('V2X-09 advanced module set required');
const RESILIENCE_CONTRACT='ofu-v2x-09-network-resilience-1';
const RECOVERY_CONTRACT='ofu-v2x-09-recovery-envelope-1';
const RESILIENCE_LIMITS=Object.freeze({routes:96,settlements:48,projectionEpochs:16,scenarioInfrastructureAssets:96,operations:24000});
function t(v){return K.text?K.text(v):String(v??'')}
function a(v){return K.arr?K.arr(v):(Array.isArray(v)?v:[])}
function i(v,f=0){return K.int?K.int(v,f):(Number.isFinite(Number(v))?Math.trunc(Number(v)):f)}
function c(v,lo=0,hi=1000000){return K.clamp?K.clamp(v,lo,hi):Math.max(lo,Math.min(hi,i(v)))}
function f(v){return K.freeze(v)}
function routeGraph(production){
  const settlementIds=a(production?.settlements).filter(s=>t(s.status).toUpperCase()==='ACTIVE').map(s=>t(s.settlementId)).sort();
  const known=new Set(settlementIds),routes=a(production?.routes).filter(r=>known.has(t(r.from))&&known.has(t(r.to))&&i(r.capacityUnits)>0&&r.routingEligible!==false&&r.operational!==false).slice(0,RESILIENCE_LIMITS.routes);
  const adjacency=new Map(settlementIds.map(id=>[id,[]]));
  for(const r of routes){const e={edgeId:t(r.edgeId),from:t(r.from),to:t(r.to),capacityUnits:Math.max(0,i(r.capacityUnits)),usedUnits:Math.max(0,i(r.usedUnits)),conditionPpm:c(r.conditionPpm||0),degradationPpm:c(r.degradationPpm||0),utilizationPpm:c(r.utilizationPpm||0)};adjacency.get(e.from).push(e);adjacency.get(e.to).push(e)}
  for(const list of adjacency.values())list.sort((x,y)=>x.edgeId.localeCompare(y.edgeId));
  return {settlementIds,routes,adjacency};
}
function reachableWithoutEdge(graph,start,goal,blockedEdgeId){
  if(start===goal)return true;const seen=new Set([start]),queue=[start];let operations=0;
  while(queue.length){const id=queue.shift();for(const e of graph.adjacency.get(id)||[]){operations++;if(operations>RESILIENCE_LIMITS.operations)throw new RangeError('V2X-09 resilience graph operation bound exceeded');if(e.edgeId===blockedEdgeId)continue;const next=e.from===id?e.to:e.from;if(next===goal)return true;if(!seen.has(next)){seen.add(next);queue.push(next)}}}
  return false;
}
function alternatePathBottleneckCapacity(graph,start,goal,blockedEdgeId){
  if(start===goal)return 0;const best=new Map(graph.settlementIds.map(id=>[id,0]));best.set(start,Number.MAX_SAFE_INTEGER);const pending=new Set(graph.settlementIds);let operations=0;
  while(pending.size){let current=null,currentCapacity=-1;for(const id of pending){const value=best.get(id)||0;if(value>currentCapacity||(value===currentCapacity&&(current===null||id<current))){current=id;currentCapacity=value}}if(current===null||currentCapacity<=0)break;pending.delete(current);if(current===goal)return currentCapacity===Number.MAX_SAFE_INTEGER?0:currentCapacity;
    for(const e of graph.adjacency.get(current)||[]){operations++;if(operations>RESILIENCE_LIMITS.operations)throw new RangeError('V2X-09 alternate-capacity operation bound exceeded');if(e.edgeId===blockedEdgeId)continue;const next=e.from===current?e.to:e.from;if(!pending.has(next))continue;const candidate=Math.min(currentCapacity,Math.max(0,i(e.capacityUnits)));if(candidate>(best.get(next)||0))best.set(next,candidate)}
  }
  return 0;
}
function networkResilience(production){
  if(production?.status!=='MODELED')return f({contract:RESILIENCE_CONTRACT,status:'NO_MODELED_NETWORK',routes:[],settlements:[],criticalRouteIds:[],authority:K.AUTHORITY.DERIVED,bounded:true,mutationPerformed:false});
  const graph=routeGraph(production),critical=[];
  const routes=graph.routes.map(r=>{const alternatePathAvailable=reachableWithoutEdge(graph,t(r.from),t(r.to),t(r.edgeId)),alternatePathBottleneckCapacityUnits=alternatePathAvailable?alternatePathBottleneckCapacity(graph,t(r.from),t(r.to),t(r.edgeId)):0;const capacity=Math.max(0,i(r.capacityUnits)),used=Math.max(0,i(r.usedUnits)),spare=Math.max(0,capacity-used),alternatePathCapacityRatioPpm=capacity?c(Math.floor(alternatePathBottleneckCapacityUnits*1000000/capacity)):0,substitutionGapPpm=alternatePathAvailable?1000000-Math.min(1000000,alternatePathCapacityRatioPpm):1000000;const criticalityPpm=alternatePathAvailable?c(Math.floor((1000000-c(r.conditionPpm||0))*.25+c(r.utilizationPpm||0)*.25+substitutionGapPpm*.25)):c(Math.floor(650000+c(r.utilizationPpm||0)*.2+c(r.degradationPpm||0)*.15));if(!alternatePathAvailable)critical.push(t(r.edgeId));return f({edgeId:t(r.edgeId),from:t(r.from),to:t(r.to),alternatePathAvailable,bridgeLike:!alternatePathAvailable,alternatePathBottleneckCapacityUnits,alternatePathCapacityRatioPpm,topologicalAlternatePathOnly:true,flowSubstitutionClaim:false,capacityUnits:capacity,usedUnits:used,spareCapacityUnits:spare,criticalityPpm,conditionPpm:c(r.conditionPpm||0),degradationPpm:c(r.degradationPpm||0),authority:K.AUTHORITY.DERIVED})});
  const settlements=graph.settlementIds.slice(0,RESILIENCE_LIMITS.settlements).map(id=>{const incident=routes.filter(r=>r.from===id||r.to===id),criticalIncident=incident.filter(r=>r.bridgeLike),capacity=incident.reduce((n,r)=>n+r.capacityUnits,0),spare=incident.reduce((n,r)=>n+r.spareCapacityUnits,0);return f({settlementId:id,degree:incident.length,criticalIncidentRouteIds:criticalIncident.map(r=>r.edgeId).sort(),aggregateRouteCapacityUnits:capacity,aggregateSpareCapacityUnits:spare,isolationRiskPpm:incident.length===0?1000000:c(Math.floor(criticalIncident.length*1000000/incident.length)),authority:K.AUTHORITY.DERIVED})});
  return f({contract:RESILIENCE_CONTRACT,status:'MODELED',routes,settlements,criticalRouteIds:critical.sort(),authority:K.AUTHORITY.DERIVED,bounded:true,limits:RESILIENCE_LIMITS,mutationPerformed:false,physicalTransportGeometryClaim:false,topologyOnly:true,flowSubstitutionClaim:false});
}
function modelAdvancedCivilization(state,economy){
  const production=P.productionNetwork(state,economy);
  const society=S.societyDynamics(state,production);
  const urban=U.urbanEvolution(state,production,society);
  const resilience=networkResilience(production);
  return f({contract:'ofu-v2x-09-advanced-civilization-composition-2',version:K.VERSION,status:production.status==='MODELED'&&society.status==='MODELED'&&urban.status==='MODELED'?'MODELED':'NO_MODELED_INPUT',production,society,urban,resilience,authority:K.AUTHORITY.MODEL_DERIVED_SIMULATION,renderAuthority:K.AUTHORITY.PRESENTATION_ONLY,bounded:true,mutationPerformed:false,persistentPersonIdentityCreated:false,canonicalHistoryMutation:false,planetOrLifeMutation:false,requiresConvergenceOwnerComposition:true,limitations:K.LIMITATIONS});
}
function cloneScenarioState(state){
  return {...state,
    regions:a(state?.regions).map(x=>({...x})),settlements:a(state?.settlements).map(x=>({...x})),tradeEdges:a(state?.tradeEdges).map(x=>({...x})),technology:{...(state?.technology||{})},polities:a(state?.polities).map(x=>({...x,settlementIds:a(x.settlementIds).slice()})),infrastructure:a(state?.infrastructure).map(x=>({...x})),history:state?.history?{...state.history,proposals:a(state.history.proposals).slice()}:state?.history
  };
}
function infrastructureForEdge(state,edge){const ef=t(edge?.from),et=t(edge?.to);return a(state?.infrastructure).filter(x=>{const a1=t(x.fromSettlementId),b1=t(x.toSettlementId);return (a1===ef&&b1===et)||(a1===et&&b1===ef)})}
function averageCondition(rows){if(!rows.length)return null;return c(Math.floor(rows.reduce((n,x)=>n+c(x.conditionPpm??(t(x.status).toUpperCase()==='ACTIVE'?850000:300000)),0)/rows.length))}
function pressureFor(society,settlementId){return a(society?.settlementPressures).find(x=>t(x.settlementId)===settlementId)||null}
function institutionFor(society,settlementId){return a(society?.institutionProposals).find(x=>a(x.settlementIds).map(t).includes(settlementId))||null}
function routeFor(production,edgeId){return a(production?.routes).find(x=>t(x.edgeId)===edgeId)||null}
function recoveryRefusal(status,extra={}){return f({contract:RECOVERY_CONTRACT,status,trajectory:[],authority:K.AUTHORITY.MODEL_DERIVED_SIMULATION,counterfactual:true,canonicalForecast:false,mutationPerformed:false,persistentPersonIdentityCreated:false,canonicalHistoryMutation:false,planetOrLifeMutation:false,...extra})}
function recoveryRatePpm(composed,edgeId,settlementIds){
  const route=routeFor(composed.production,edgeId),services=[];for(const sid of settlementIds){const row=a(composed.production?.settlements).find(x=>t(x.settlementId)===sid);const pub=a(row?.serviceSatisfaction?.services).find(x=>t(x.good)==='PUBLIC_WORKS_SERVICE');const maint=a(row?.serviceSatisfaction?.services).find(x=>t(x.good)==='URBAN_MAINTENANCE_SERVICE');if(pub)services.push(c(pub.satisfactionPpm));if(maint)services.push(c(maint.satisfactionPpm))}
  const service=services.length?Math.floor(services.reduce((n,x)=>n+x,0)/services.length):0;const repairPriority=settlementIds.some(sid=>a(institutionFor(composed.society,sid)?.mechanisms).includes('REPAIR_PRIORITY'));const spare=c(route?.capacityUnits?Math.floor(Math.max(0,i(route.remainingUnits))*1000000/Math.max(1,i(route.capacityUnits))):0);return c(15000+Math.floor(service*.07)+(repairPriority?45000:0)+Math.floor(spare*.015),10000,160000);
}
function projectRecoveryEnvelope(state,economy,{edgeId=null,shockSeverityPpm=700000,maxEpochs=12}={}){
  maxEpochs=c(maxEpochs,1,RESILIENCE_LIMITS.projectionEpochs);shockSeverityPpm=c(shockSeverityPpm,0,950000);
  if(!K.validateCivilization(state))return recoveryRefusal('NO_MODELED_CIVILIZATION');
  if(!economy||!['READY','STEPPED'].includes(t(economy.status)))return recoveryRefusal('NO_MODELED_ECONOMY_FOR_RECOVERY');
  const edge=edgeId?a(state?.tradeEdges).find(x=>t(x.edgeId)===t(edgeId)):a(state?.tradeEdges)[0];
  if(!edge)return recoveryRefusal('NO_MODELED_EDGE');
  const edgeStatus=t(edge.status||'UNKNOWN').toUpperCase();if(edgeStatus!=='ACTIVE')return recoveryRefusal('EDGE_NOT_ACTIVE_FOR_RECOVERY',{edgeId:t(edge.edgeId),edgeStatus});
  const stateById=new Map(a(state?.settlements).map(x=>[t(x.settlementId),x])),economyById=new Map(a(economy?.settlements).map(x=>[t(x.settlementId),x])),settlementIds=[t(edge.from),t(edge.to)].sort();
  for(const sid of settlementIds){const modeled=stateById.get(sid),economic=economyById.get(sid);if(!modeled||t(modeled.status||'UNKNOWN').toUpperCase()!=='ACTIVE')return recoveryRefusal('EDGE_ENDPOINT_NOT_ACTIVE_FOR_RECOVERY',{edgeId:t(edge.edgeId),settlementId:sid});if(!economic)return recoveryRefusal('EDGE_ENDPOINT_NOT_MODELED_IN_ECONOMY',{edgeId:t(edge.edgeId),settlementId:sid});const economicStatus=t(economic.status||'').toUpperCase();if(economicStatus&&economicStatus!=='ACTIVE')return recoveryRefusal('EDGE_ENDPOINT_NOT_ACTIVE_IN_ECONOMY',{edgeId:t(edge.edgeId),settlementId:sid,economyStatus:economicStatus})}
  const technology=K.technologyProfile(state),activeCapabilities=new Set(a(technology.activeCapabilities));
  if(!activeCapabilities.has('ROUTE_LOGISTICS'))return recoveryRefusal('ROUTE_LOGISTICS_CAPABILITY_INACTIVE',{edgeId:t(edge.edgeId)});
  if(!activeCapabilities.has('PUBLIC_WORKS'))return recoveryRefusal('PUBLIC_WORKS_CAPABILITY_INACTIVE',{edgeId:t(edge.edgeId)});
  const allInfrastructure=a(state?.infrastructure);if(allInfrastructure.length>RESILIENCE_LIMITS.scenarioInfrastructureAssets)return recoveryRefusal('INFRASTRUCTURE_BOUND_EXCEEDED',{edgeId:t(edge.edgeId),observedInfrastructureAssets:allInfrastructure.length,maxInfrastructureAssets:RESILIENCE_LIMITS.scenarioInfrastructureAssets});
  const originalRows=infrastructureForEdge(state,edge);if(!originalRows.length)return recoveryRefusal('NO_MODELED_INFRASTRUCTURE_FOR_EDGE',{edgeId:t(edge.edgeId)});
  const originalCondition=averageCondition(originalRows);if(originalCondition<=0)return recoveryRefusal('NO_RECOVERABLE_BASELINE',{edgeId:t(edge.edgeId),originalConditionPpm:originalCondition});
  const scenario=cloneScenarioState(state),scenarioRows=infrastructureForEdge(scenario,edge),shockFloor=Math.min(50000,originalCondition),shockCondition=c(Math.floor(originalCondition*(1000000-shockSeverityPpm)/1000000),shockFloor,originalCondition);for(const x of scenarioRows){x.conditionPpm=shockCondition;x.status=shockCondition<350000?'DAMAGED':t(x.status||'ACTIVE');x.lastActiveEpoch=i(state?.epoch||0)}
  const trajectory=[];let recoveredEpoch=null;
  for(let step=0;step<=maxEpochs;step++){
    scenario.epoch=i(state?.epoch||0)+step;const composed=modelAdvancedCivilization(scenario,economy),route=routeFor(composed.production,t(edge.edgeId)),pressures=settlementIds.map(sid=>pressureFor(composed.society,sid)).filter(Boolean);const avgPressure=pressures.length?c(Math.floor(pressures.reduce((n,x)=>n+c(x.migrationPressurePpm||0),0)/pressures.length)):0;const avgService=pressures.length?c(Math.floor(pressures.reduce((n,x)=>n+c(x.serviceSatisfactionPpm||0),0)/pressures.length)):0;const institutions=settlementIds.map(sid=>institutionFor(composed.society,sid)).filter(Boolean);const repairPriority=institutions.some(x=>a(x.mechanisms).includes('REPAIR_PRIORITY'));const condition=averageCondition(scenarioRows);trajectory.push(f({projectedEpoch:scenario.epoch,conditionPpm:condition,routeCapacityUnits:Math.max(0,i(route?.capacityUnits||0)),routeUtilizationPpm:c(route?.utilizationPpm||0),averageMigrationPressurePpm:avgPressure,averageServiceSatisfactionPpm:avgService,repairPriority,criticalRoute:composed.resilience.criticalRouteIds.includes(t(edge.edgeId)),urbanPhases:settlementIds.map(sid=>({settlementId:sid,phase:t(a(composed.urban?.settlements).find(x=>t(x.settlementId)===sid)?.phase||'UNKNOWN')})),authority:K.AUTHORITY.MODEL_DERIVED_SIMULATION}));
    if(condition>=Math.floor(originalCondition*.95)){recoveredEpoch=scenario.epoch;break}if(step===maxEpochs)break;const rate=recoveryRatePpm(composed,t(edge.edgeId),settlementIds),next=c(condition+Math.floor((originalCondition-condition)*rate/1000000),condition,originalCondition);for(const x of scenarioRows){x.conditionPpm=next;if(next>=500000&&t(x.status).toUpperCase()==='DAMAGED')x.status='ACTIVE';x.lastActiveEpoch=scenario.epoch+1}
  }
  const first=trajectory[0],last=trajectory[trajectory.length-1];return f({contract:RECOVERY_CONTRACT,status:'PROJECTED',edgeId:t(edge.edgeId),sourceInfrastructureIds:scenarioRows.map(x=>t(x.infrastructureId)).filter(Boolean).sort(),originalConditionPpm:originalCondition,shockSeverityPpm,shockConditionPpm:shockCondition,recoveredEpoch,trajectory,summary:f({epochsProjected:trajectory.length-1,capacityDeltaUnits:i(last?.routeCapacityUnits)-i(first?.routeCapacityUnits),conditionDeltaPpm:c(last?.conditionPpm||0)-c(first?.conditionPpm||0),migrationPressureDeltaPpm:i(last?.averageMigrationPressurePpm)-i(first?.averageMigrationPressurePpm),serviceSatisfactionDeltaPpm:i(last?.averageServiceSatisfactionPpm)-i(first?.averageServiceSatisfactionPpm)}),authority:K.AUTHORITY.MODEL_DERIVED_SIMULATION,counterfactual:true,canonicalForecast:false,mutationPerformed:false,persistentPersonIdentityCreated:false,canonicalHistoryMutation:false,planetOrLifeMutation:false,economySnapshotHeldConstant:true,infrastructureOnlyCounterfactual:true,bounded:true,limits:RESILIENCE_LIMITS,limitations:K.LIMITATIONS});
}
O.v2x09CivilizationAdvanced=Object.freeze({VERSION:K.VERSION,RESILIENCE_CONTRACT,RECOVERY_CONTRACT,RESILIENCE_LIMITS,modelAdvancedCivilization,networkResilience,alternatePathBottleneckCapacity,projectRecoveryEnvelope,PRODUCTION_CONTRACT:P.CONTRACT,SOCIETY_CONTRACT:S.CONTRACT,URBAN_CONTRACT:U.CONTRACT});
})(typeof globalThis!=='undefined'?globalThis:this);
