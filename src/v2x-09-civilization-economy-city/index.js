(function(root){
'use strict';
const O=root.OFU=root.OFU||{},K=O.v2x09CivilizationCore,I=O.v2x09CivilizationEconomyInit,E=O.v2x09CivilizationEconomyStep,S=O.v2x09CivilizationInstitutions,M=O.v2x09CivilizationMorphology;
if(!K||!I||!E||!S||!M)throw new Error('V2X-09 module set required');
const FAILURE_CONTRACT='ofu-v2x-09-network-failure-envelope-1';
const FAILURE_LIMITS=Object.freeze({routes:96,settlements:48,candidates:16,scenarios:256,maxFailures:2,operations:50000});
function text(v){return K.text?K.text(v):String(v??'')}
function int(v,f=0){return K.int?K.int(v,f):(Number.isFinite(Number(v))?Math.trunc(Number(v)):f)}
function clamp(v,lo=0,hi=1000000){return K.clamp?K.clamp(v,lo,hi):Math.max(lo,Math.min(hi,int(v)))}
function arr(v){return K.arr?K.arr(v):(Array.isArray(v)?v:[])}
function freeze(v){return K.freeze(v)}
function bump(counter,n=1){counter.count+=n;if(counter.count>FAILURE_LIMITS.operations)throw new RangeError('V2X-09 failure-envelope operation bound exceeded')}
function failureGraph(production){
  const rawSettlements=arr(production?.settlements),rawRoutes=arr(production?.routes);
  if(rawSettlements.length>FAILURE_LIMITS.settlements)throw new RangeError('V2X-09 failure settlement bound exceeded');
  if(rawRoutes.length>FAILURE_LIMITS.routes)throw new RangeError('V2X-09 failure route bound exceeded');
  if(K.assertUniqueIds){K.assertUniqueIds('failure settlement',rawSettlements,'settlementId');K.assertUniqueIds('failure route',rawRoutes,'edgeId')}
  const ids=rawSettlements.filter(s=>text(s.status).toUpperCase()==='ACTIVE').map(s=>text(s.settlementId)).sort(),known=new Set(ids);
  const routes=rawRoutes.filter(r=>known.has(text(r.from))&&known.has(text(r.to))&&int(r.capacityUnits)>0&&r.routingEligible!==false&&r.operational!==false).map(r=>({edgeId:text(r.edgeId),from:text(r.from),to:text(r.to),capacityUnits:Math.max(0,int(r.capacityUnits)),criticalityPpm:clamp(r.criticalityPpm??r.degradationPpm??r.utilizationPpm??0)}));
  const adjacency=new Map(ids.map(id=>[id,[]]));for(const r of routes){adjacency.get(r.from).push(r);adjacency.get(r.to).push(r)}for(const list of adjacency.values())list.sort((a,b)=>a.edgeId.localeCompare(b.edgeId));return {ids,routes,adjacency};
}
function connectivity(graph,blocked,counter){
  const denied=new Set(blocked),seen=new Set();let pairs=0;
  for(const start of graph.ids){
    if(seen.has(start))continue;const queue=[start];seen.add(start);let componentSize=0;
    while(queue.length){const current=queue.shift();componentSize++;bump(counter);for(const e of graph.adjacency.get(current)||[]){bump(counter);if(denied.has(e.edgeId))continue;const next=e.from===current?e.to:e.from;if(!seen.has(next)){seen.add(next);queue.push(next)}}}
    pairs+=componentSize*(componentSize-1)/2;
  }
  return pairs;
}
function networkFailureEnvelope(production,{maxFailures=2}={}){
  if(production?.status!=='MODELED')return freeze({contract:FAILURE_CONTRACT,status:'NO_MODELED_NETWORK',scenarios:[],evidenceComplete:false,inputEvidenceCoverage:production?.evidenceCoverage||null,authority:K.AUTHORITY.DERIVED,bounded:true,flowSubstitutionClaim:false,mutationPerformed:false});
  const inputEvidenceCoverage=production?.evidenceCoverage||null,evidenceComplete=inputEvidenceCoverage?.complete===true;
  maxFailures=clamp(maxFailures,1,FAILURE_LIMITS.maxFailures);const graph=failureGraph(production),counter={count:0},baselinePairs=connectivity(graph,[],counter),baselineCapacity=graph.routes.reduce((n,r)=>n+r.capacityUnits,0),ranked=graph.routes.slice().sort((a,b)=>b.criticalityPpm-a.criticalityPpm||a.edgeId.localeCompare(b.edgeId)).slice(0,FAILURE_LIMITS.candidates),scenarios=[];
  let scenarioLimitReached=false;
  const record=(failed)=>{if(scenarios.length>=FAILURE_LIMITS.scenarios){scenarioLimitReached=true;return}const denied=new Set(failed),pairs=connectivity(graph,failed,counter),remaining=graph.routes.reduce((n,r)=>n+(denied.has(r.edgeId)?0:r.capacityUnits),0),pairRatio=baselinePairs?clamp(Math.floor(pairs*1000000/baselinePairs)):1000000,capacityRatio=baselineCapacity?clamp(Math.floor(remaining*1000000/baselineCapacity)):1000000,severity=clamp(Math.floor((1000000-pairRatio)*.65+(1000000-capacityRatio)*.35));scenarios.push(freeze({scenarioId:'failure:'+failed.slice().sort().join('+'),failedRouteIds:failed.slice().sort(),connectedPairs:pairs,baselineConnectedPairs:baselinePairs,connectivityRatioPpm:pairRatio,remainingCapacityUnits:remaining,baselineCapacityUnits:baselineCapacity,capacityRatioPpm:capacityRatio,severityPpm:severity,authority:K.AUTHORITY.DERIVED,topologyOnly:true,flowSubstitutionClaim:false,mutationPerformed:false}))};
  for(const r of ranked)record([r.edgeId]);if(maxFailures===2)for(let x=0;x<ranked.length;x++){for(let y=x+1;y<ranked.length;y++){record([ranked[x].edgeId,ranked[y].edgeId]);if(scenarioLimitReached)break}if(scenarioLimitReached)break}
  scenarios.sort((a,b)=>b.severityPpm-a.severityPpm||a.scenarioId.localeCompare(b.scenarioId));return freeze({contract:FAILURE_CONTRACT,status:'MODELED',candidateRouteIds:ranked.map(r=>r.edgeId),candidateLimitReached:graph.routes.length>ranked.length,maxFailures,baselineConnectedPairs:baselinePairs,baselineCapacityUnits:baselineCapacity,scenarios,worstScenario:scenarios[0]||null,scenarioCount:scenarios.length,scenarioLimitReached,operations:counter.count,limits:FAILURE_LIMITS,evidenceComplete,inputEvidenceCoverage,authority:K.AUTHORITY.DERIVED,bounded:true,topologyOnly:true,flowSubstitutionClaim:false,physicalTransportGeometryClaim:false,mutationPerformed:false});
}
O.v2x09CivilizationEconomyCity=Object.freeze({VERSION:K.VERSION,ECONOMY_CONTRACT:K.ECONOMY_CONTRACT,MORPHOLOGY_CONTRACT:K.MORPHOLOGY_CONTRACT,IMPACT_CONTRACT:K.IMPACT_CONTRACT,FAILURE_CONTRACT,AUTHORITY:K.AUTHORITY,LIMITS:K.LIMITS,FAILURE_LIMITS,GOODS:K.GOODS,CAPABILITY_GRAPH:K.CAPABILITY_GRAPH,LIMITATIONS:K.LIMITATIONS,technologyProfile:K.technologyProfile,initializeEconomy:I.initializeEconomy,stepEconomy:E.stepEconomy,environmentImpactProposals:E.environmentImpactProposals,institutionProfile:S.institutionProfile,cityMorphology:M.cityMorphology,cityRenderPlan:M.cityRenderPlan,inspector:M.inspector,networkFailureEnvelope});
})(typeof globalThis!=='undefined'?globalThis:this);
