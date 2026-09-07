(function(root){
'use strict';
const O=root.OFU=root.OFU||{},K=O.v2x09CivilizationCore;if(!K)throw new Error('V2X-09 core required');
const {AUTHORITY,LIMITATIONS,freeze,text,int,clamp,arr,sortId,validateCivilization,technologyProfile,techLevel,deriveId,tradeDegree}=K;
const CONTRACT='ofu-v2x-09-production-logistics-network-1';
const NETWORK_LIMITS=Object.freeze({recipes:8,intermediateGoods:12,routes:96,settlements:48,flows:1152,bottlenecks:256,operations:48000});
const INTERMEDIATE_GOODS=Object.freeze(['DURABLE_PROVISIONS','BUILDING_COMPONENTS','DISTRIBUTION_SERVICE','PUBLIC_WORKS_SERVICE','URBAN_MAINTENANCE_SERVICE']);
const RECIPE_GRAPH=Object.freeze([
  Object.freeze({id:'PRESERVATION',output:'DURABLE_PROVISIONS',outputUnits:4,inputs:Object.freeze({SUBSISTENCE_GOODS:4,ENERGY_SERVICE:1}),capability:'BULK_STORAGE'}),
  Object.freeze({id:'COMPONENT_FABRICATION',output:'BUILDING_COMPONENTS',outputUnits:3,inputs:Object.freeze({MATERIAL_GOODS:3,ENERGY_SERVICE:1}),capability:'SPECIALIZED_MATERIALS'}),
  Object.freeze({id:'DISTRIBUTION',output:'DISTRIBUTION_SERVICE',outputUnits:4,inputs:Object.freeze({ENERGY_SERVICE:2}),capability:'ROUTE_LOGISTICS'}),
  Object.freeze({id:'PUBLIC_WORKS',output:'PUBLIC_WORKS_SERVICE',outputUnits:2,inputs:Object.freeze({BUILDING_COMPONENTS:2,DISTRIBUTION_SERVICE:1}),capability:'PUBLIC_WORKS'}),
  Object.freeze({id:'URBAN_MAINTENANCE',output:'URBAN_MAINTENANCE_SERVICE',outputUnits:2,inputs:Object.freeze({BUILDING_COMPONENTS:1,DISTRIBUTION_SERVICE:1}),capability:'PUBLIC_WORKS'})
]);
function allGoods(){return [...K.GOODS,...INTERMEDIATE_GOODS]}
function blankLedger(){const out={};for(const g of allGoods())out[g]={start:0,produced:0,inbound:0,consumed:0,outbound:0,end:0};return out}
function activeSettlementRows(state,economy){
  const source=arr(economy?.settlements);const byState=new Map(arr(state?.settlements).map(s=>[text(s.settlementId),s]));
  return sortId(source.map(s=>{const original=byState.get(text(s.settlementId))||{};const stocks={};for(const g of K.GOODS)stocks[g]=Math.max(0,int(s?.stocks?.[g]||0));for(const g of INTERMEDIATE_GOODS)stocks[g]=0;return {settlementId:text(s.settlementId),regionId:text(s.regionId),status:text(s.status||original.status||'UNKNOWN').toUpperCase(),population:Math.max(0,int(s.population??original.population)),infrastructurePpm:clamp(original.infrastructurePpm||0),stocks,ledger:blankLedger()}}),'settlementId');
}
function recipeCapacity(state,row,recipe){
  const production=techLevel(state.technology,'production'),construction=techLevel(state.technology,'construction'),degree=tradeDegree(state,row.settlementId);
  const scale=Math.max(1,Math.floor(row.population/250));
  const capabilityMultiplier=1+production+Math.floor(construction/2)+Math.min(3,degree);
  return Math.max(0,Math.min(20000,scale*capabilityMultiplier));
}
function applyRecipes(state,rows,tech,operationCounter){
  const active=new Set(tech.activeCapabilities);
  for(const row of rows){
    for(const g of K.GOODS)row.ledger[g].start=row.stocks[g];
    if(row.status!=='ACTIVE')continue;
    for(const recipe of RECIPE_GRAPH){
      if(!active.has(recipe.capability))continue;
      let cycles=recipeCapacity(state,row,recipe);
      for(const [g,units] of Object.entries(recipe.inputs))cycles=Math.min(cycles,Math.floor((row.stocks[g]||0)/units));
      if(cycles<=0)continue;
      for(const [g,units] of Object.entries(recipe.inputs)){const used=cycles*units;row.stocks[g]-=used;row.ledger[g].consumed+=used;operationCounter.count+=2}
      const output=cycles*recipe.outputUnits;row.stocks[recipe.output]+=output;row.ledger[recipe.output].produced+=output;operationCounter.count+=2;
      if(operationCounter.count>NETWORK_LIMITS.operations)throw new RangeError('V2X-09 production-network operation bound exceeded');
    }
  }
}
function modeledRouteCondition(state,edge){
  const matches=arr(state?.infrastructure).filter(x=>{
    const a=text(x.fromSettlementId),b=text(x.toSettlementId),ef=text(edge.from),et=text(edge.to);return (a===ef&&b===et)||(a===et&&b===ef);
  });
  if(!matches.length)return freeze({conditionPpm:450000,degradationPpm:550000,evidenceClass:'TRADE_EDGE_WITHOUT_MODELED_INFRASTRUCTURE_ASSET',sourceInfrastructureIds:[]});
  let total=0;const ids=[];
  for(const x of matches){ids.push(text(x.infrastructureId||deriveId('infra',edge.edgeId,ids.length)));const status=text(x.status||'ACTIVE').toUpperCase();let c=clamp(x.conditionPpm??(status==='ACTIVE'?850000:status==='DAMAGED'?450000:status==='RUINED'?100000:300000));const idle=Math.max(0,int(state?.epoch||0)-int(x.lastActiveEpoch ?? state?.epoch ?? 0));c=clamp(c-idle*15000);total+=c}
  const condition=clamp(Math.floor(total/Math.max(1,matches.length)));return freeze({conditionPpm:condition,degradationPpm:1000000-condition,evidenceClass:'MODELED_INFRASTRUCTURE_CONDITION',sourceInfrastructureIds:ids.sort()});
}
function demandFor(row,good,state){
  const degree=tradeDegree(state,row.settlementId),infra=row.infrastructurePpm,pop=row.population;
  if(row.status!=='ACTIVE')return 0;
  if(good==='DURABLE_PROVISIONS')return Math.max(1,Math.floor(pop/24));
  if(good==='BUILDING_COMPONENTS')return Math.max(1,Math.floor(pop/140)+Math.floor(infra/12000));
  if(good==='DISTRIBUTION_SERVICE')return Math.max(1,Math.floor(pop/55)+degree*40);
  if(good==='PUBLIC_WORKS_SERVICE')return Math.max(1,Math.floor(pop/180)+Math.floor(infra/15000));
  if(good==='URBAN_MAINTENANCE_SERVICE')return Math.max(1,Math.floor(pop/160)+Math.floor(infra/13000));
  return 0;
}
function findResidualPath(routeRows,fromId,toId,operationCounter){
  if(fromId===toId)return [];
  const adjacency=new Map();for(const r of routeRows){if(r.remainingUnits<=0)continue;if(!adjacency.has(r.from))adjacency.set(r.from,[]);if(!adjacency.has(r.to))adjacency.set(r.to,[]);adjacency.get(r.from).push(r);adjacency.get(r.to).push(r)}
  for(const list of adjacency.values())list.sort((a,b)=>a.edgeId.localeCompare(b.edgeId));
  const seen=new Set([fromId]),queue=[fromId],previous=new Map();
  while(queue.length){const current=queue.shift();for(const route of adjacency.get(current)||[]){operationCounter.count++;if(operationCounter.count>NETWORK_LIMITS.operations)throw new RangeError('V2X-09 operation bound exceeded');const next=route.from===current?route.to:route.from;if(seen.has(next))continue;seen.add(next);previous.set(next,{settlementId:current,route});if(next===toId){const path=[];let cursor=toId;while(cursor!==fromId){const step=previous.get(cursor);if(!step)return [];path.push(step.route);cursor=step.settlementId}return path.reverse()}queue.push(next)}}
  return [];
}
function moveIntermediateGoods(state,rows,tech,operationCounter){
  const byId=new Map(rows.map(r=>[r.settlementId,r]));const demands=new Map(rows.map(r=>[r.settlementId,Object.fromEntries(INTERMEDIATE_GOODS.map(g=>[g,demandFor(r,g,state)]))]));
  const routeRows=[];const flows=[];const enabled=tech.activeCapabilities.includes('ROUTE_LOGISTICS');
  for(const edge of sortId(arr(state?.tradeEdges).slice(0,NETWORK_LIMITS.routes),'edgeId')){
    const a=byId.get(text(edge.from)),b=byId.get(text(edge.to));if(!a||!b)continue;
    const condition=modeledRouteCondition(state,edge),cost=clamp(edge.costPpm||0),base=Math.max(0,int(edge.flowUnits||0));const capacity=enabled?Math.max(0,Math.floor(base*(1000000-cost)*condition.conditionPpm/1000000000000)):0;
    routeRows.push({edgeId:text(edge.edgeId||deriveId('edge',edge.from,edge.to)),from:text(edge.from),to:text(edge.to),capacityUnits:capacity,usedUnits:0,remainingUnits:capacity,costPpm:cost,conditionPpm:condition.conditionPpm,degradationPpm:condition.degradationPpm,evidenceClass:condition.evidenceClass,sourceInfrastructureIds:condition.sourceInfrastructureIds,logisticsCapabilityActive:enabled});
  }
  // Preserve the original direct-edge allocation first for compatibility and locality.
  for(const route of routeRows){
    const a=byId.get(route.from),b=byId.get(route.to);if(!a||!b)continue;
    for(const g of INTERMEDIATE_GOODS){
      if(route.remainingUnits<=0)break;const da=demands.get(a.settlementId)[g],db=demands.get(b.settlementId)[g],sa=Math.max(0,a.stocks[g]-da),sb=Math.max(0,b.stocks[g]-db),na=Math.max(0,da-a.stocks[g]),nb=Math.max(0,db-b.stocks[g]);let from=null,to=null,amount=0;
      if(sa>0&&nb>0){from=a;to=b;amount=Math.min(sa,nb,route.remainingUnits)}else if(sb>0&&na>0){from=b;to=a;amount=Math.min(sb,na,route.remainingUnits)}
      if(amount>0){from.stocks[g]-=amount;to.stocks[g]+=amount;from.ledger[g].outbound+=amount;to.ledger[g].inbound+=amount;route.remainingUnits-=amount;route.usedUnits+=amount;flows.push(freeze({flowId:deriveId('flow',route.edgeId,g,from.settlementId,to.settlementId),edgeId:route.edgeId,pathEdgeIds:[route.edgeId],hopCount:1,good:g,fromSettlementId:from.settlementId,toSettlementId:to.settlementId,amountUnits:amount,authority:AUTHORITY.MODEL_DERIVED_SIMULATION}));operationCounter.count+=5}
    }
  }
  // Then use residual route capacity for deterministic multi-hop deficit relief.
  if(enabled){
    const ids=rows.filter(r=>r.status==='ACTIVE').map(r=>r.settlementId).sort();
    for(const g of INTERMEDIATE_GOODS){
      for(const sourceId of ids){
        const source=byId.get(sourceId);if(!source)continue;
        let surplus=Math.max(0,source.stocks[g]-demands.get(sourceId)[g]);if(surplus<=0)continue;
        for(const targetId of ids){
          if(targetId===sourceId||surplus<=0)continue;const target=byId.get(targetId);if(!target)continue;const need=Math.max(0,demands.get(targetId)[g]-target.stocks[g]);if(need<=0)continue;
          const path=findResidualPath(routeRows,sourceId,targetId,operationCounter);if(path.length<2)continue;const bottleneck=Math.min(...path.map(r=>r.remainingUnits));const amount=Math.min(surplus,need,bottleneck);if(amount<=0)continue;
          source.stocks[g]-=amount;target.stocks[g]+=amount;source.ledger[g].outbound+=amount;target.ledger[g].inbound+=amount;for(const route of path){route.remainingUnits-=amount;route.usedUnits+=amount}surplus-=amount;
          const pathEdgeIds=path.map(r=>r.edgeId);flows.push(freeze({flowId:deriveId('multihop-flow',g,sourceId,targetId,pathEdgeIds.join('+')),edgeId:null,pathEdgeIds,hopCount:path.length,good:g,fromSettlementId:sourceId,toSettlementId:targetId,amountUnits:amount,transitSettlementIds:path.slice(0,-1).map((r,index)=>r.to===path[index+1]?.from||r.to===path[index+1]?.to?r.to:r.from).filter(id=>id!==sourceId&&id!==targetId),authority:AUTHORITY.MODEL_DERIVED_SIMULATION,physicalRouteGeometryClaim:false}));operationCounter.count+=6+path.length;
          if(operationCounter.count>NETWORK_LIMITS.operations)throw new RangeError('V2X-09 operation bound exceeded');
        }
      }
    }
  }
  const routes=routeRows.map(r=>freeze({...r,utilizationPpm:r.capacityUnits?clamp(Math.floor(r.usedUnits*1000000/r.capacityUnits)):0,authority:AUTHORITY.MODEL_DERIVED_SIMULATION}));
  return {demands,routes,flows};
}
function consumeServices(rows,demands,operationCounter){
  const satisfaction=[];
  for(const row of rows){for(const g of INTERMEDIATE_GOODS){const demand=demands.get(row.settlementId)[g],available=row.stocks[g],used=Math.min(available,demand);row.stocks[g]-=used;row.ledger[g].consumed+=used;const sat=demand?clamp(Math.floor(used*1000000/demand)):1000000;satisfaction.push(freeze({settlementId:row.settlementId,good:g,demandUnits:demand,servedUnits:used,unmetUnits:demand-used,satisfactionPpm:sat}));operationCounter.count+=2}}
  return satisfaction;
}
function productionNetwork(state,economy){
  if(!validateCivilization(state)||!economy||!['READY','STEPPED'].includes(text(economy.status)))return freeze({contract:CONTRACT,status:'NO_MODELED_CIVILIZATION_OR_ECONOMY',settlements:[],routes:[],flows:[],bottlenecks:[],authority:AUTHORITY.MODEL_DERIVED_SIMULATION,bounded:true,limitations:LIMITATIONS});
  const tech=technologyProfile(state),rows=activeSettlementRows(state,economy),ops={count:0};applyRecipes(state,rows,tech,ops);const transport=moveIntermediateGoods(state,rows,tech,ops);const satisfaction=consumeServices(rows,transport.demands,ops);
  const closure=[];for(const row of rows){for(const g of allGoods()){const l=row.ledger[g];l.end=row.stocks[g];closure.push(freeze({settlementId:row.settlementId,good:g,...l,closed:l.start+l.produced+l.inbound-l.consumed-l.outbound===l.end}))}}
  const serviceBySettlement=new Map();for(const row of rows){const list=satisfaction.filter(x=>x.settlementId===row.settlementId);serviceBySettlement.set(row.settlementId,freeze({overallPpm:list.length?clamp(Math.floor(list.reduce((n,x)=>n+x.satisfactionPpm,0)/list.length)):1000000,services:list}))}
  const bottlenecks=[];for(const r of transport.routes){const endpoints=[r.from,r.to],unmet=satisfaction.some(s=>endpoints.includes(s.settlementId)&&s.unmetUnits>0);if((r.capacityUnits===0&&unmet)||(r.utilizationPpm>=850000&&unmet)||r.degradationPpm>=650000)bottlenecks.push(freeze({bottleneckId:deriveId('bottleneck',r.edgeId),kind:r.capacityUnits===0?'ROUTE_UNAVAILABLE':r.degradationPpm>=650000?'INFRASTRUCTURE_DEGRADATION':'ROUTE_CAPACITY',edgeId:r.edgeId,severityPpm:r.capacityUnits===0?1000000:Math.max(r.utilizationPpm,r.degradationPpm),sourceInfrastructureIds:r.sourceInfrastructureIds,authority:AUTHORITY.DERIVED}));}
  for(const s of satisfaction)if(s.unmetUnits>0&&s.satisfactionPpm<500000)bottlenecks.push(freeze({bottleneckId:deriveId('bottleneck',s.settlementId,s.good),kind:'SERVICE_DEFICIT',settlementId:s.settlementId,good:s.good,severityPpm:1000000-s.satisfactionPpm,unmetUnits:s.unmetUnits,authority:AUTHORITY.DERIVED}));
  const settlements=rows.map(r=>freeze({settlementId:r.settlementId,regionId:r.regionId,status:r.status,population:r.population,infrastructurePpm:r.infrastructurePpm,stocks:freeze({...r.stocks}),serviceSatisfaction:serviceBySettlement.get(r.settlementId),authority:AUTHORITY.MODEL_DERIVED_SIMULATION}));
  return freeze({contract:CONTRACT,status:'MODELED',settlements,routes:transport.routes,flows:transport.flows,satisfaction,technology:tech,recipeGraph:RECIPE_GRAPH,intermediateGoods:INTERMEDIATE_GOODS,closure:freeze({entries:closure,allClosed:closure.every(x=>x.closed),accountingUnitsOnly:true,physicalMassOrEnergyConservationClaim:false}),bottlenecks:bottlenecks.slice(0,NETWORK_LIMITS.bottlenecks),operations:ops.count,limits:NETWORK_LIMITS,authority:AUTHORITY.MODEL_DERIVED_SIMULATION,bounded:true,mutationPerformed:false,canonicalHistoryMutation:false,limitations:LIMITATIONS});
}
O.v2x09CivilizationProductionNetwork=Object.freeze({CONTRACT,NETWORK_LIMITS,INTERMEDIATE_GOODS,RECIPE_GRAPH,productionNetwork,modeledRouteCondition,demandFor});
})(typeof globalThis!=='undefined'?globalThis:this);
