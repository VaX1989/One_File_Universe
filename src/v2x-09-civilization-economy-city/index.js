(function(root){
'use strict';
const O=root.OFU=root.OFU||{},K=O.v2x09CivilizationCore,I=O.v2x09CivilizationEconomyInit,E=O.v2x09CivilizationEconomyStep,S=O.v2x09CivilizationInstitutions,M=O.v2x09CivilizationMorphology;
if(!K||!I||!E||!S||!M)throw new Error('V2X-09 module set required');
const FAILURE_CONTRACT='ofu-v2x-09-network-failure-envelope-1';
const FAILURE_LIMITS=Object.freeze({routes:96,settlements:48,candidates:16,scenarios:256,maxFailures:2,operations:24000});
function text(v){return K.text?K.text(v):String(v??'')}
function int(v,f=0){return K.int?K.int(v,f):(Number.isFinite(Number(v))?Math.trunc(Number(v)):f)}
function clamp(v,lo=0,hi=1000000){return K.clamp?K.clamp(v,lo,hi):Math.max(lo,Math.min(hi,int(v)))}
function arr(v){return K.arr?K.arr(v):(Array.isArray(v)?v:[])}
function freeze(v){return K.freeze(v)}
function failureGraph(production){
  const ids=arr(production?.settlements).filter(s=>text(s.status).toUpperCase()==='ACTIVE').map(s=>text(s.settlementId)).sort();
  if(ids.length>FAILURE_LIMITS.settlements)throw new RangeError('V2X-09 failure settlement bound exceeded');
  const known=new Set(ids),routes=arr(production?.routes).filter(r=>known.has(text(r.from))&&known.has(text(r.to))&&int(r.capacityUnits)>0).slice(0,FAILURE_LIMITS.routes).map(r=>({edgeId:text(r.edgeId),from:text(r.from),to:text(r.to),capacityUnits:Math.max(0,int(r.capacityUnits)),criticalityPpm:clamp(r.criticalityPpm||r.degradationPpm||r.utilizationPpm||0)}));
  const adjacency=new Map(ids.map(id=>[id,[]]));for(const r of routes){adjacency.get(r.from).push(r);adjacency.get(r.to).push(r)}for(const list of adjacency.values())list.sort((a,b)=>a.edgeId.localeCompare(b.edgeId));return {ids,routes,adjacency};
}
function connectivity(graph,blocked){
  const denied=new Set(blocked);let pairs=0,ops=0;
  for(let a=0;a<graph.ids.length;a++){
    const start=graph.ids[a],seen=new Set([start]),queue=[start];
    while(queue.length){const current=queue.shift();for(const e of graph.adjacency.get(current)||[]){if(++ops>FAILURE_LIMITS.operations)throw new RangeError('V2X-09 failure operation bound exceeded');if(denied.has(e.edgeId))continue;const next=e.from===current?e.to:e.from;if(!seen.has(next)){seen.add(next);queue.push(next)}}}
    for(let b=a+1;b<graph.ids.length;b++)if(seen.has(graph.ids[b]))pairs++;
  }
  return pairs;
}
function networkFailureEnvelope(production,{maxFailures=2}={}){
  if(production?.status!=='MODELED')return freeze({contract:FAILURE_CONTRACT,status:'NO_MODELED_NETWORK',scenarios:[],authority:K.AUTHORITY.DERIVED,bounded:true,flowSubstitutionClaim:false,mutationPerformed:false});
  maxFailures=clamp(maxFailures,1,FAILURE_LIMITS.maxFailures);const graph=failureGraph(production),baselinePairs=connectivity(graph,[]),baselineCapacity=graph.routes.reduce((n,r)=>n+r.capacityUnits,0),ranked=graph.routes.slice().sort((a,b)=>b.criticalityPpm-a.criticalityPpm||a.edgeId.localeCompare(b.edgeId)).slice(0,FAILURE_LIMITS.candidates),scenarios=[];
  const record=(failed)=>{if(scenarios.length>=FAILURE_LIMITS.scenarios)return;const denied=new Set(failed),pairs=connectivity(graph,failed),remaining=graph.routes.reduce((n,r)=>n+(denied.has(r.edgeId)?0:r.capacityUnits),0),pairRatio=baselinePairs?clamp(Math.floor(pairs*1000000/baselinePairs)):1000000,capacityRatio=baselineCapacity?clamp(Math.floor(remaining*1000000/baselineCapacity)):1000000,severity=clamp(Math.floor((1000000-pairRatio)*.65+(1000000-capacityRatio)*.35));scenarios.push(freeze({scenarioId:'failure:'+failed.slice().sort().join('+'),failedRouteIds:failed.slice().sort(),connectedPairs:pairs,baselineConnectedPairs:baselinePairs,connectivityRatioPpm:pairRatio,remainingCapacityUnits:remaining,baselineCapacityUnits:baselineCapacity,capacityRatioPpm:capacityRatio,severityPpm:severity,authority:K.AUTHORITY.DERIVED,topologyOnly:true,flowSubstitutionClaim:false,mutationPerformed:false}))};
  for(const r of ranked)record([r.edgeId]);if(maxFailures===2)for(let x=0;x<ranked.length;x++){for(let y=x+1;y<ranked.length;y++){record([ranked[x].edgeId,ranked[y].edgeId]);if(scenarios.length>=FAILURE_LIMITS.scenarios)break}if(scenarios.length>=FAILURE_LIMITS.scenarios)break}
  scenarios.sort((a,b)=>b.severityPpm-a.severityPpm||a.scenarioId.localeCompare(b.scenarioId));return freeze({contract:FAILURE_CONTRACT,status:'MODELED',candidateRouteIds:ranked.map(r=>r.edgeId),maxFailures,baselineConnectedPairs:baselinePairs,baselineCapacityUnits:baselineCapacity,scenarios,worstScenario:scenarios[0]||null,scenarioCount:scenarios.length,limits:FAILURE_LIMITS,authority:K.AUTHORITY.DERIVED,bounded:true,topologyOnly:true,flowSubstitutionClaim:false,physicalTransportGeometryClaim:false,mutationPerformed:false});
}
O.v2x09CivilizationEconomyCity=Object.freeze({VERSION:K.VERSION,ECONOMY_CONTRACT:K.ECONOMY_CONTRACT,MORPHOLOGY_CONTRACT:K.MORPHOLOGY_CONTRACT,IMPACT_CONTRACT:K.IMPACT_CONTRACT,FAILURE_CONTRACT,AUTHORITY:K.AUTHORITY,LIMITS:K.LIMITS,FAILURE_LIMITS,GOODS:K.GOODS,CAPABILITY_GRAPH:K.CAPABILITY_GRAPH,LIMITATIONS:K.LIMITATIONS,technologyProfile:K.technologyProfile,initializeEconomy:I.initializeEconomy,stepEconomy:E.stepEconomy,environmentImpactProposals:E.environmentImpactProposals,institutionProfile:S.institutionProfile,cityMorphology:M.cityMorphology,cityRenderPlan:M.cityRenderPlan,inspector:M.inspector,networkFailureEnvelope});
})(typeof globalThis!=='undefined'?globalThis:this);
