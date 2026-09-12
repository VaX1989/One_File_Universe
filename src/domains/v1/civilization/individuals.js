(function(root){
'use strict';
const O=root.OFU=root.OFU||{},V=O.v1Common,W=O.v1WorldContext;
if(!V||!W)throw new Error('v1 common and world context required for civilization representatives');
const VERSION='ofu-v11-civilization-representatives-1';
const SOURCE='research/v1x-18-civilization-individuals-2026-09-06';
const AUTH=V.authority('v1.civilization.representatives','1.0.0',[SOURCE],
  'Bounded deterministic late materialization of current-epoch representative residents from modeled aggregate settlement state. Representatives are synthetic explanatory samples, not persistent persons, memories, beliefs or canonical historical actors.',[
    'Aggregate settlement population does not currently provide birth cohorts or person ledgers, so persistent individual identity across epochs is unsupported.',
    'Contextual pressures and knowledge domains are projections from modeled settlement/civilization state, not psychological measurements or private mental states.',
    'Generated representative identities are scoped to the current modeled civilization epoch and must not be interpreted as canonical P4 actors.'
  ]);
const MAX_REPRESENTATIVES=8;
const MAX_CAPABILITY_LEVEL=8;
const TECHNOLOGY_CAPABILITIES=Object.freeze(['production','transport','materials','energy','communication','medicine','construction','conflict']);
const ROLES=Object.freeze(['FOOD_PROVISION','CRAFT_AND_MAINTENANCE','TRADE_AND_LOGISTICS','CARE_AND_HOUSEHOLD','CONSTRUCTION','ADMINISTRATION']);
const clamp=(x,a=0,b=1000000)=>Math.max(a,Math.min(b,Math.round(Number.isFinite(Number(x))?Number(x):0)));
function technologyLevel(technology){
  if(!technology||typeof technology!=='object')return 0;
  const levels=TECHNOLOGY_CAPABILITIES.map(key=>clamp(technology[key]??0,0,MAX_CAPABILITY_LEVEL));
  const average=levels.reduce((sum,value)=>sum+value,0)/levels.length;
  return clamp(average*1000000/MAX_CAPABILITY_LEVEL);
}
function contextualPressures(state,settlement){
  const trade=(state?.tradeEdges||[]).filter(e=>e.from===settlement.settlementId||e.to===settlement.settlementId).length;
  const scarcity=clamp(settlement.scarcityPpm||0),infrastructure=clamp(settlement.infrastructurePpm||0),population=Math.max(0,Number(settlement.population||0));
  const goals=[];
  if(scarcity>=550000)goals.push(Object.freeze({kind:'RESOURCE_SECURITY',basis:'SETTLEMENT_SCARCITY'}));
  if(infrastructure<180000)goals.push(Object.freeze({kind:'MAINTENANCE_AND_REPAIR',basis:'SETTLEMENT_INFRASTRUCTURE'}));
  if(trade>0)goals.push(Object.freeze({kind:'TRADE_CONTINUITY',basis:'MODELED_TRADE_CONNECTIVITY'}));
  if(goals.length===0)goals.push(Object.freeze({kind:'HOUSEHOLD_CONTINUITY',basis:'DEFAULT_CURRENT_EPOCH_CONTEXT'}));
  return Object.freeze({scarcityPpm:scarcity,infrastructurePpm:infrastructure,tradeDegree:trade,population,goals:Object.freeze(goals.slice(0,3))});
}
function knowledgeDomains(state,settlement,ordinal){
  const domains=['LOCAL_TERRAIN','SUBSISTENCE_PRACTICES','SETTLEMENT_MAINTENANCE'];
  const trade=(state?.tradeEdges||[]).some(e=>e.from===settlement.settlementId||e.to===settlement.settlementId);
  if(trade)domains.push('TRADE_ROUTES');
  const tech=technologyLevel(state?.technology);if(tech>=180000)domains.push('CRAFT_TECHNIQUES');if(tech>=420000)domains.push('INSTITUTIONAL_PROCEDURES');
  const ranked=[...new Set(domains)].map(topic=>({topic,rank:V.u32(VERSION,settlement.settlementId,'knowledge',ordinal,topic)})).sort((a,b)=>a.rank-b.rank||a.topic.localeCompare(b.topic));
  return Object.freeze(ranked.slice(0,4).map(x=>x.topic));
}
function representative(state,settlement,ordinal){
  V.int(ordinal,'representative ordinal',0,MAX_REPRESENTATIVES-1);
  const epoch=Number(state?.epoch||0),pressures=contextualPressures(state,settlement),roleIndex=V.u32(VERSION,settlement.settlementId,epoch,'role',ordinal)%ROLES.length;
  return V.freezeDeep({
    representativeId:V.deriveId('current-epoch-resident-representative',state.worldIdentity||'modeled-world',settlement.settlementId,epoch,ordinal),
    settlementId:settlement.settlementId,modeledEpoch:epoch,sampleOrdinal:ordinal,role:ROLES[roleIndex],knowledgeDomains:knowledgeDomains(state,settlement,ordinal),contextualGoals:pressures.goals,
    sourcePopulation:pressures.population,identityClass:'SYNTHETIC_CURRENT_EPOCH_REPRESENTATIVE',persistentPersonIdentity:false,genealogyModeled:false,personalMemoryModeled:false,privateMentalStateClaim:false,
    authority:AUTH,canonicalP4Actor:false,canonicalHistoryClaim:false
  });
}
function materialize(state,settlement,{count=4}={}){
  V.int(count,'representative count',0,MAX_REPRESENTATIVES);
  if(!state||state.state!=='MODELED_CIVILIZATION')return V.freezeDeep({supported:false,reason:'NO_MODELED_CIVILIZATION',representatives:Object.freeze([]),maxRepresentatives:MAX_REPRESENTATIVES,authority:AUTH});
  if(!settlement||settlement.status==='ABANDONED'||Number(settlement.population||0)<=0)return V.freezeDeep({supported:false,reason:'NO_ACTIVE_SETTLEMENT_POPULATION',representatives:Object.freeze([]),maxRepresentatives:MAX_REPRESENTATIVES,authority:AUTH});
  const n=Math.min(count,MAX_REPRESENTATIVES,Math.max(0,Number(settlement.population||0))),representatives=Object.freeze(Array.from({length:n},(_,i)=>representative(state,settlement,i)));
  return V.freezeDeep({supported:true,settlementId:settlement.settlementId,modeledEpoch:Number(state.epoch||0),sourcePopulation:Number(settlement.population||0),sampleCount:representatives.length,maxRepresentatives:MAX_REPRESENTATIVES,representatives,
    sampleSemantics:'DETERMINISTIC_CURRENT_EPOCH_REPRESENTATIVES_NOT_ENUMERATED_PERSONS',globalEnumeration:false,authority:AUTH,canonicalP4Unchanged:true,researchLineage:Object.freeze({sourceBranch:SOURCE,harvestedConcept:'BOUNDED_LATE_MATERIALIZATION',researchAuthorityPromoted:false})});
}
function fromLocalContext(world,context,{count=4}={}){
  const object=(context?.objects||[]).find(x=>(x.kind==='SETTLEMENT'||x.kind==='RUIN')&&x.settlement?.settlementId);
  if(!object)return V.freezeDeep({supported:false,reason:'NO_SETTLEMENT_AT_EXACT_LOCATION',representatives:Object.freeze([]),maxRepresentatives:MAX_REPRESENTATIVES,authority:AUTH});
  return materialize(world?.civilization,object.settlement,{count});
}
const previousLocalContext=W.localContext;
function localContext(world,point,options){
  const base=previousLocalContext(world,point,options),civilizationRepresentatives=fromLocalContext(world,base,{count:4});
  return V.freezeDeep({...base,civilizationRepresentatives});
}
O.v1WorldContext=Object.freeze({...W,localContext});
O.v1CivilizationIndividuals=Object.freeze({VERSION,AUTHORITY:AUTH,MAX_REPRESENTATIVES,MAX_CAPABILITY_LEVEL,TECHNOLOGY_CAPABILITIES,ROLES,technologyLevel,contextualPressures,knowledgeDomains,representative,materialize,fromLocalContext});
})(globalThis);