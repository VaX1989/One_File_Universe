(function(root){
'use strict';
const O=root.OFU=root.OFU||{},K=O.v2x09CivilizationCore;if(!K)throw new Error('V2X-09 core required');
const {AUTHORITY,LIMITATIONS,freeze,text,int,clamp,arr,assertBound,sortId,validateCivilization,technologyProfile,techLevel,deriveId,tradeDegree}=K;
const CONTRACT='ofu-v2x-09-production-logistics-network-1';
const NETWORK_LIMITS=Object.freeze({recipes:8,intermediateGoods:12,routes:96,settlements:48,infrastructureAssets:256,flows:1152,bottlenecks:256,operations:48000,pathSearches:1024,maxHops:47});
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
function operationalStatus(economyRow,stateRow){
  if(!stateRow||!text(stateRow.settlementId))return 'MISSING_STATE_SETTLEMENT';
  const stateStatus=text(stateRow.status||'UNKNOWN').toUpperCase(),economyStatus=text(economyRow?.status||'').toUpperCase();
  if(stateStatus!=='ACTIVE')return stateStatus;
  if(economyStatus&&economyStatus!=='ACTIVE')return economyStatus;
  return 'ACTIVE';
}
function activeSettlementRows(state,economy){
  const source=arr(economy?.settlements);assertBound('economy settlements',source.length,NETWORK_LIMITS.settlements);
  const byState=new Map(arr(state?.settlements).map(s=>[text(s.settlementId),s]));
  return sortId(source.map(s=>{const original=byState.get(text(s.settlementId))||{},stocks={};for(const g of K.GOODS)stocks[g]=Math.max(0,int(s?.stocks?.[g]||0));for(const g of INTERMEDIATE_GOODS)stocks[g]=0;return {settlementId:text(s.settlementId),regionId:text(s.regionId||original.regionId),status:operationalStatus(s,original),population:Math.max(0,int(s.population??original.population)),infrastructurePpm:clamp(original.infrastructurePpm||0),stocks,ledger:blankLedger()}}),'settlementId');
}
function recipeCapacity(state,row,recipe){const production=techLevel(state.technology,'production'),construction=techLevel(state.technology,'construction'),degree=tradeDegree(state,row.settlementId),scale=Math.max(1,Math.floor(row.population/250)),capabilityMultiplier=1+production+Math.floor(construction/2)+Math.min(3,degree);return Math.max(0,Math.min(20000,scale*capabilityMultiplier))}
function addOps(counter,n=1){counter.count+=n;if(counter.count>NETWORK_LIMITS.operations)throw new RangeError('V2X-09 production-network operation bound exceeded')}
function applyRecipes(state,rows,tech,operationCounter){
  const active=new Set(tech.activeCapabilities);
  for(const row of rows){for(const g of K.GOODS)row.ledger[g].start=row.stocks[g];if(row.status!=='ACTIVE')continue;for(const recipe of RECIPE_GRAPH){if(!active.has(recipe.capability))continue;let cycles=recipeCapacity(state,row,recipe);for(const [g,units] of Object.entries(recipe.inputs))cycles=Math.min(cycles,Math.floor((row.stocks[g]||0)/units));if(cycles<=0)continue;for(const [g,units] of Object.entries(recipe.inputs)){const used=cycles*units;row.stocks[g]-=used;row.ledger[g].consumed+=used;addOps(operationCounter,2)}const output=cycles*recipe.outputUnits;row.stocks[recipe.output]+=output;row.ledger[recipe.output].produced+=output;addOps(operationCounter,2)}}
}
function modeledRouteCondition(state,edge){
  const infrastructure=arr(state?.infrastructure);assertBound('infrastructure assets',infrastructure.length,NETWORK_LIMITS.infrastructureAssets);
  const matches=infrastructure.filter(x=>{const a=text(x.fromSettlementId),b=text(x.toSettlementId),ef=text(edge.from),et=text(edge.to);return (a===ef&&b===et)||(a===et&&b===ef)});
  if(!matches.length)return freeze({conditionPpm:450000,degradationPpm:550000,evidenceClass:'TRADE_EDGE_WITHOUT_MODELED_INFRASTRUCTURE_ASSET',sourceInfrastructureIds:[]});
  let total=0;const ids=[];for(const x of matches){ids.push(text(x.infrastructureId||deriveId('infra',edge.edgeId,ids.length)));const status=text(x.status||'ACTIVE').toUpperCase();let c=clamp(x.conditionPpm??(status==='ACTIVE'?850000:status==='DAMAGED'?450000:status==='RUINED'?100000:300000));const idle=Math.max(0,int(state?.epoch||0)-int(x.lastActiveEpoch??state?.epoch??0));c=clamp(c-idle*15000);total+=c}const condition=clamp(Math.floor(total/Math.max(1,matches.length)));return freeze({conditionPpm:condition,degradationPpm:1000000-condition,evidenceClass:'MODELED_INFRASTRUCTURE_CONDITION',sourceInfrastructureIds:ids.sort()})
}
function demandFor(row,good,state){const degree=tradeDegree(state,row.settlementId),infra=row.infrastructurePpm,pop=row.population;if(row.status!=='ACTIVE')return 0;if(good==='DURABLE_PROVISIONS')return Math.max(1,Math.floor(pop/24));if(good==='BUILDING_COMPONENTS')return Math.max(1,Math.floor(pop/140)+Math.floor(infra/12000));if(good==='DISTRIBUTION_SERVICE')return Math.max(1,Math.floor(pop/55)+degree*40);if(good==='PUBLIC_WORKS_SERVICE')return Math.max(1,Math.floor(pop/180)+Math.floor(infra/15000));if(good==='URBAN_MAINTENANCE_SERVICE')return Math.max(1,Math.floor(pop/160)+Math.floor(infra/13000));return 0}
function routeDisableReason(edge,a,b,enabled){
  const edgeStatus=text(edge?.status||'UNKNOWN').toUpperCase();
  if(edgeStatus!=='ACTIVE')return edgeStatus==='UNKNOWN'?'TRADE_EDGE_STATUS_UNKNOWN':'TRADE_EDGE_NOT_ACTIVE';
  if(!a||!b)return 'MISSING_SETTLEMENT_ENDPOINT';
  if(a.status!=='ACTIVE'||b.status!=='ACTIVE')return 'SETTLEMENT_ENDPOINT_NOT_ACTIVE';
  if(!enabled)return 'ROUTE_LOGISTICS_CAPABILITY_INACTIVE';
  return null;
}
function pathNodeIds(path,sourceId){const nodes=[sourceId];let current=sourceId;for(const route of path){const next=route.from===current?route.to:route.from;if(next===current)return [];nodes.push(next);current=next}return nodes}
function routeAdjacency(routeRows){
  const adjacency=new Map();
  for(const r of routeRows){
    if(!r.routingEligible||r.remainingUnits<=0)continue;
    if(!adjacency.has(r.from))adjacency.set(r.from,[]);
    if(!adjacency.has(r.to))adjacency.set(r.to,[]);
    adjacency.get(r.from).push(r);adjacency.get(r.to).push(r);
  }
  for(const list of adjacency.values())list.sort((a,b)=>a.edgeId.localeCompare(b.edgeId));
  return adjacency;
}
function consumeSearchOp(operationCounter,routingState){
  const closureReserve=NETWORK_LIMITS.settlements*INTERMEDIATE_GOODS.length*2+NETWORK_LIMITS.maxHops+16;
  if(operationCounter.count>=NETWORK_LIMITS.operations-closureReserve){routingState.operationBudgetExhausted=true;return false}
  addOps(operationCounter,1);return true;
}
function findResidualPath(routeRows,fromId,toId,operationCounter,routingState){
  if(fromId===toId)return [];
  if(routingState.searches>=NETWORK_LIMITS.pathSearches){routingState.searchLimitReached=true;return []}
  routingState.searches++;
  const adjacency=routeAdjacency(routeRows);
  if(!adjacency.has(fromId)||!adjacency.has(toId))return [];

  const width=new Map([[fromId,Number.MAX_SAFE_INTEGER]]),frontier=new Set([fromId]),settled=new Set();
  while(frontier.size){
    const current=[...frontier].sort((a,b)=>(width.get(b)||0)-(width.get(a)||0)||a.localeCompare(b))[0];
    frontier.delete(current);if(settled.has(current))continue;settled.add(current);
    if(current===toId)break;
    for(const route of adjacency.get(current)||[]){
      if(!consumeSearchOp(operationCounter,routingState))return [];
      const next=route.from===current?route.to:route.from;if(settled.has(next))continue;
      const candidate=Math.min(width.get(current)||0,route.remainingUnits);
      if(candidate>(width.get(next)||0)){width.set(next,candidate);frontier.add(next)}
    }
  }
  const targetWidth=width.get(toId)||0;if(targetWidth<=0)return [];

  const start={node:fromId,hops:0,burden:0,key:'',path:[],nodes:[fromId]},best=new Map([[fromId,start]]),queue=[start];
  const better=(x,y)=>!y||x.hops<y.hops||(x.hops===y.hops&&(x.burden<y.burden||(x.burden===y.burden&&x.key<y.key)));
  while(queue.length){
    queue.sort((a,b)=>a.hops-b.hops||a.burden-b.burden||a.key.localeCompare(b.key)||a.node.localeCompare(b.node));
    const current=queue.shift();if(best.get(current.node)!==current)continue;if(current.node===toId)return current.path;if(current.hops>=NETWORK_LIMITS.maxHops)continue;
    for(const route of adjacency.get(current.node)||[]){
      if(route.remainingUnits<targetWidth)continue;
      if(!consumeSearchOp(operationCounter,routingState))return [];
      const next=route.from===current.node?route.to:route.from;if(current.nodes.includes(next))continue;
      const candidate={node:next,hops:current.hops+1,burden:current.burden+clamp(route.costPpm)+clamp(route.degradationPpm),key:current.key+'|'+route.edgeId,path:[...current.path,route],nodes:[...current.nodes,next]};
      if(better(candidate,best.get(next))){best.set(next,candidate);queue.push(candidate)}
    }
  }
  return [];
}
function moveIntermediateGoods(state,rows,tech,operationCounter){
  const byId=new Map(rows.map(r=>[r.settlementId,r]));
  const demands=new Map(rows.map(r=>[r.settlementId,Object.fromEntries(INTERMEDIATE_GOODS.map(g=>[g,demandFor(r,g,state)]))]));
  const routeRows=[];
  const flows=[];
  const enabled=tech.activeCapabilities.includes('ROUTE_LOGISTICS');
  const routingState={searches:0,searchLimitReached:false,operationBudgetExhausted:false,flowLimitReached:false};

  for(const edge of sortId(arr(state?.tradeEdges).slice(0,NETWORK_LIMITS.routes),'edgeId')){
    const a=byId.get(text(edge.from)),b=byId.get(text(edge.to));
    const condition=modeledRouteCondition(state,edge);
    const cost=clamp(edge.costPpm||0),base=Math.max(0,int(edge.flowUnits||0));
    const disableReason=routeDisableReason(edge,a,b,enabled),operational=disableReason===null;
    const capacity=operational?Math.max(0,Math.floor(base*(1000000-cost)*condition.conditionPpm/1000000000000)):0;
    routeRows.push({
      edgeId:text(edge.edgeId||deriveId('edge',edge.from,edge.to)),from:text(edge.from),to:text(edge.to),
      tradeEdgeStatus:text(edge.status||'UNKNOWN').toUpperCase(),endpointStatuses:freeze({from:a?.status||'MISSING',to:b?.status||'MISSING'}),
      operational,disableReason,capacityUnits:capacity,usedUnits:0,remainingUnits:capacity,costPpm:cost,
      conditionPpm:condition.conditionPpm,degradationPpm:condition.degradationPpm,evidenceClass:condition.evidenceClass,
      sourceInfrastructureIds:condition.sourceInfrastructureIds,logisticsCapabilityActive:enabled,routingEligible:operational&&capacity>0
    });
  }

  for(const route of routeRows){
    if(!route.routingEligible)continue;
    const a=byId.get(route.from),b=byId.get(route.to);
    if(!a||!b||a.status!=='ACTIVE'||b.status!=='ACTIVE')continue;
    for(const g of INTERMEDIATE_GOODS){
      if(route.remainingUnits<=0)break;
      const da=demands.get(a.settlementId)[g],db=demands.get(b.settlementId)[g];
      const sa=Math.max(0,a.stocks[g]-da),sb=Math.max(0,b.stocks[g]-db),na=Math.max(0,da-a.stocks[g]),nb=Math.max(0,db-b.stocks[g]);
      let from=null,to=null,amount=0;
      if(sa>0&&nb>0){from=a;to=b;amount=Math.min(sa,nb,route.remainingUnits)}
      else if(sb>0&&na>0){from=b;to=a;amount=Math.min(sb,na,route.remainingUnits)}
      if(amount<=0)continue;
      from.stocks[g]-=amount;to.stocks[g]+=amount;from.ledger[g].outbound+=amount;to.ledger[g].inbound+=amount;
      route.remainingUnits-=amount;route.usedUnits+=amount;
      flows.push(freeze({flowId:deriveId('flow',route.edgeId,g,from.settlementId,to.settlementId),edgeId:route.edgeId,pathEdgeIds:[route.edgeId],hopCount:1,good:g,fromSettlementId:from.settlementId,toSettlementId:to.settlementId,amountUnits:amount,routingPhase:'DIRECT',authority:AUTHORITY.MODEL_DERIVED_SIMULATION,physicalRouteGeometryClaim:false}));
      addOps(operationCounter,5);
    }
  }

  if(enabled){
    const activeRows=rows.filter(r=>r.status==='ACTIVE');
    for(const g of INTERMEDIATE_GOODS){
      const sourceRows=activeRows.map(r=>({row:r,surplus:Math.max(0,r.stocks[g]-demands.get(r.settlementId)[g])})).filter(x=>x.surplus>0).sort((a,b)=>b.surplus-a.surplus||a.row.settlementId.localeCompare(b.row.settlementId));
      for(const sourceInfo of sourceRows){
        let surplus=Math.max(0,sourceInfo.row.stocks[g]-demands.get(sourceInfo.row.settlementId)[g]);
        if(surplus<=0)continue;
        const targetRows=activeRows.map(r=>({row:r,need:Math.max(0,demands.get(r.settlementId)[g]-r.stocks[g])})).filter(x=>x.need>0&&x.row.settlementId!==sourceInfo.row.settlementId).sort((a,b)=>b.need-a.need||a.row.settlementId.localeCompare(b.row.settlementId));
        for(const targetInfo of targetRows){
          if(surplus<=0)break;
          const target=targetInfo.row,need=Math.max(0,demands.get(target.settlementId)[g]-target.stocks[g]);
          if(need<=0)continue;
          const path=findResidualPath(routeRows,sourceInfo.row.settlementId,target.settlementId,operationCounter,routingState);
          if(!path.length)continue;
          const nodes=pathNodeIds(path,sourceInfo.row.settlementId);
          if(nodes.length!==path.length+1||nodes.at(-1)!==target.settlementId||nodes.slice(1,-1).some(id=>byId.get(id)?.status!=='ACTIVE'))continue;
          const bottleneck=Math.min(...path.map(r=>r.remainingUnits)),amount=Math.min(surplus,need,bottleneck);
          if(amount<=0)continue;
          sourceInfo.row.stocks[g]-=amount;target.stocks[g]+=amount;
          sourceInfo.row.ledger[g].outbound+=amount;target.ledger[g].inbound+=amount;
          for(const route of path){route.remainingUnits-=amount;route.usedUnits+=amount}
          surplus-=amount;
          const pathEdgeIds=path.map(r=>r.edgeId),hopCount=path.length;
          flows.push(freeze({flowId:deriveId(hopCount>1?'multihop-flow':'residual-flow',g,sourceInfo.row.settlementId,target.settlementId,pathEdgeIds.join('+')),edgeId:hopCount===1?pathEdgeIds[0]:null,pathEdgeIds,hopCount,good:g,fromSettlementId:sourceInfo.row.settlementId,toSettlementId:target.settlementId,amountUnits:amount,transitSettlementIds:nodes.slice(1,-1),routingPhase:'RESIDUAL_WIDEST_PATH',pathBottleneckCapacityUnits:bottleneck,pathBurdenUnits:path.reduce((n,r)=>n+clamp(r.costPpm)+clamp(r.degradationPpm),0),authority:AUTHORITY.MODEL_DERIVED_SIMULATION,physicalRouteGeometryClaim:false}));
          addOps(operationCounter,6+path.length);
          if(flows.length>=NETWORK_LIMITS.flows){routingState.flowLimitReached=true;break}
        }
        if(routingState.flowLimitReached)break;
      }
      if(routingState.flowLimitReached)break;
    }
  }

  const routes=routeRows.map(r=>freeze({...r,utilizationPpm:r.capacityUnits?clamp(Math.floor(r.usedUnits*1000000/r.capacityUnits)):0,authority:AUTHORITY.MODEL_DERIVED_SIMULATION}));
  return {demands,routes,flows,routing:freeze({policy:'DIRECT_THEN_RESIDUAL_WIDEST_PATH',searches:routingState.searches,searchLimit:NETWORK_LIMITS.pathSearches,searchLimitReached:routingState.searchLimitReached,operationBudgetExhausted:routingState.operationBudgetExhausted,flowLimitReached:routingState.flowLimitReached,maxHops:NETWORK_LIMITS.maxHops,physicalRouteGeometryClaim:false,shortestPhysicalPathClaim:false})};
}
function consumeServices(rows,demands,operationCounter){const satisfaction=[];for(const row of rows){for(const g of INTERMEDIATE_GOODS){const demand=demands.get(row.settlementId)[g],available=row.stocks[g],used=Math.min(available,demand);row.stocks[g]-=used;row.ledger[g].consumed+=used;const sat=demand?clamp(Math.floor(used*1000000/demand)):1000000;satisfaction.push(freeze({settlementId:row.settlementId,good:g,demandUnits:demand,servedUnits:used,unmetUnits:demand-used,satisfactionPpm:sat}));addOps(operationCounter,2)}}return satisfaction}
function productionNetwork(state,economy){
  if(!validateCivilization(state)||!economy||!['READY','STEPPED'].includes(text(economy.status)))return freeze({contract:CONTRACT,status:'NO_MODELED_CIVILIZATION_OR_ECONOMY',settlements:[],routes:[],flows:[],bottlenecks:[],authority:AUTHORITY.MODEL_DERIVED_SIMULATION,bounded:true,limitations:LIMITATIONS});
  assertBound('infrastructure assets',arr(state?.infrastructure).length,NETWORK_LIMITS.infrastructureAssets);const tech=technologyProfile(state),rows=activeSettlementRows(state,economy),ops={count:0};applyRecipes(state,rows,tech,ops);const transport=moveIntermediateGoods(state,rows,tech,ops),satisfaction=consumeServices(rows,transport.demands,ops),closure=[];for(const row of rows){for(const g of allGoods()){const l=row.ledger[g];l.end=row.stocks[g];closure.push(freeze({settlementId:row.settlementId,good:g,...l,closed:l.start+l.produced+l.inbound-l.consumed-l.outbound===l.end}))}}
  const serviceBySettlement=new Map();for(const row of rows){const list=satisfaction.filter(x=>x.settlementId===row.settlementId);serviceBySettlement.set(row.settlementId,freeze({overallPpm:list.length?clamp(Math.floor(list.reduce((n,x)=>n+x.satisfactionPpm,0)/list.length)):1000000,services:list}))}
  const bottlenecks=[];for(const r of transport.routes){const endpoints=[r.from,r.to],unmet=satisfaction.some(s=>endpoints.includes(s.settlementId)&&s.unmetUnits>0);if((r.capacityUnits===0&&unmet)||(r.utilizationPpm>=850000&&unmet)||r.degradationPpm>=650000)bottlenecks.push(freeze({bottleneckId:deriveId('bottleneck',r.edgeId),kind:r.capacityUnits===0?'ROUTE_UNAVAILABLE':r.degradationPpm>=650000?'INFRASTRUCTURE_DEGRADATION':'ROUTE_CAPACITY',edgeId:r.edgeId,severityPpm:r.capacityUnits===0?1000000:Math.max(r.utilizationPpm,r.degradationPpm),disableReason:r.disableReason||null,sourceInfrastructureIds:r.sourceInfrastructureIds,authority:AUTHORITY.DERIVED}))}
  for(const s of satisfaction)if(s.unmetUnits>0&&s.satisfactionPpm<500000)bottlenecks.push(freeze({bottleneckId:deriveId('bottleneck',s.settlementId,s.good),kind:'SERVICE_DEFICIT',settlementId:s.settlementId,good:s.good,severityPpm:1000000-s.satisfactionPpm,unmetUnits:s.unmetUnits,authority:AUTHORITY.DERIVED}));
  const settlements=rows.map(r=>freeze({settlementId:r.settlementId,regionId:r.regionId,status:r.status,population:r.population,infrastructurePpm:r.infrastructurePpm,stocks:freeze({...r.stocks}),serviceSatisfaction:serviceBySettlement.get(r.settlementId),authority:AUTHORITY.MODEL_DERIVED_SIMULATION}));
  return freeze({contract:CONTRACT,status:'MODELED',settlements,routes:transport.routes,flows:transport.flows,routing:transport.routing,satisfaction,technology:tech,recipeGraph:RECIPE_GRAPH,intermediateGoods:INTERMEDIATE_GOODS,closure:freeze({entries:closure,allClosed:closure.every(x=>x.closed),accountingUnitsOnly:true,physicalMassOrEnergyConservationClaim:false}),bottlenecks:bottlenecks.slice(0,NETWORK_LIMITS.bottlenecks),operations:ops.count,limits:NETWORK_LIMITS,authority:AUTHORITY.MODEL_DERIVED_SIMULATION,bounded:true,mutationPerformed:false,canonicalHistoryMutation:false,physicalRouteGeometryClaim:false,limitations:LIMITATIONS});
}
O.v2x09CivilizationProductionNetwork=Object.freeze({CONTRACT,NETWORK_LIMITS,INTERMEDIATE_GOODS,RECIPE_GRAPH,productionNetwork,modeledRouteCondition,demandFor});
})(typeof globalThis!=='undefined'?globalThis:this);
