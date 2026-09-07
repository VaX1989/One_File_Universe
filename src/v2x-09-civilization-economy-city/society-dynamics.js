(function(root){
'use strict';
const O=root.OFU=root.OFU||{},K=O.v2x09CivilizationCore,P=O.v2x09CivilizationProductionNetwork;if(!K||!P)throw new Error('V2X-09 core/production network required');
const {AUTHORITY,LIMITATIONS,freeze,text,int,clamp,arr,sortId,validateCivilization,deriveId,tradeDegree}=K;
const CONTRACT='ofu-v2x-09-aggregate-society-dynamics-1';
const LIMITS=Object.freeze({settlementPressures:48,migrationProposals:96,institutionProposals:256,operations:16000});
function satisfactionMap(network){const out=new Map();for(const s of arr(network?.settlements))out.set(text(s.settlementId),s.serviceSatisfaction||{overallPpm:0,services:[]});return out}
function routeStressFor(network,settlementId){const routes=arr(network?.routes).filter(r=>(r.from===settlementId||r.to===settlementId)&&r.routingEligible!==false);if(!routes.length)return 700000;return clamp(Math.floor(routes.reduce((n,r)=>n+Math.max(clamp(r.degradationPpm||0),clamp(r.utilizationPpm||0)),0)/routes.length))}
function stockCoveragePpm(row){const p=Math.max(1,int(row.population));const stocks=row?.stocks||{};const subs=Math.max(0,int(stocks.SUBSISTENCE_GOODS||0)),energy=Math.max(0,int(stocks.ENERGY_SERVICE||0));return clamp(Math.floor(Math.min(1,(subs/p)/1.5,(energy/p)/.35)*1000000))}
function settlementPressures(state,network){
  const sat=satisfactionMap(network),networkById=new Map(arr(network?.settlements).map(s=>[text(s.settlementId),s])),rows=[];
  for(const s of sortId(arr(state?.settlements),'settlementId')){
    const sid=text(s.settlementId),modeled=networkById.get(sid),active=text(s.status||'UNKNOWN').toUpperCase()==='ACTIVE'&&int(s.population)>0;
    if(!active){rows.push(freeze({settlementId:sid,status:text(s.status||'UNKNOWN').toUpperCase(),population:Math.max(0,int(s.population)),serviceSatisfactionPpm:0,stockCoveragePpm:0,routeStressPpm:1000000,scarcityPpm:1000000,migrationPressurePpm:0,opportunityPpm:0,authority:AUTHORITY.DERIVED}));continue}
    const service=clamp(sat.get(sid)?.overallPpm||0),coverage=stockCoveragePpm(modeled||{population:s.population,stocks:s.stocks}),routeStress=routeStressFor(network,sid),scarcity=clamp(s.scarcityPpm??Math.floor((1000000-service)*.55+(1000000-coverage)*.45)),infra=clamp(s.infrastructurePpm||0),opportunity=clamp(Math.floor(service*.35+coverage*.25+infra*.2+Math.min(1000000,tradeDegree(state,sid)*180000)*.2));const migration=clamp(Math.floor(scarcity*.45+routeStress*.2+(1000000-service)*.25+(1000000-infra)*.1-opportunity*.2));
    rows.push(freeze({settlementId:sid,status:'ACTIVE',population:Math.max(0,int(s.population)),serviceSatisfactionPpm:service,stockCoveragePpm:coverage,routeStressPpm:routeStress,scarcityPpm:scarcity,migrationPressurePpm:migration,opportunityPpm:opportunity,authority:AUTHORITY.DERIVED}));
  }
  return rows;
}
function migrationProposals(state,pressures){
  const active=pressures.filter(x=>x.status==='ACTIVE'),proposals=[];
  for(const source of active){if(source.migrationPressurePpm<380000||source.population<200)continue;const candidates=active.filter(x=>x.settlementId!==source.settlementId&&x.opportunityPpm>source.opportunityPpm+80000&&x.migrationPressurePpm<source.migrationPressurePpm).sort((a,b)=>b.opportunityPpm-a.opportunityPpm||a.settlementId.localeCompare(b.settlementId));const destination=candidates[0]||null;const amount=Math.min(Math.max(1,Math.floor(source.population*source.migrationPressurePpm/1000000/25)),Math.max(1,Math.floor(source.population*.08)));proposals.push(freeze({proposalId:deriveId('aggregate-migration',state.worldIdentity,source.settlementId,destination?.settlementId||'NONE',state.epoch),kind:destination?'AGGREGATE_MIGRATION_PRESSURE':'LOCAL_DISPLACEMENT_PRESSURE_NO_MODELED_DESTINATION',sourceSettlementId:source.settlementId,destinationSettlementId:destination?.settlementId||null,aggregatePopulationUnits:amount,pressurePpm:source.migrationPressurePpm,destinationOpportunityPpm:destination?.opportunityPpm||0,authority:AUTHORITY.MODEL_DERIVED_SIMULATION,mutationPerformed:false,persistentPersonIdentityCreated:false,persistentPersonIds:freeze([]),genealogyMutation:false,canonicalHistoryAdmissionRequested:false,requiresPopulationOwnerReconciliation:true}));if(proposals.length>=LIMITS.migrationProposals)break}
  return proposals;
}
function polityInstitutionProposals(state,pressures,network){
  const byPressure=new Map(pressures.map(x=>[x.settlementId,x])),proposals=[];
  for(const p of sortId(arr(state?.polities),'polityId')){
    const members=arr(p.settlementIds).map(text).map(id=>byPressure.get(id)).filter(Boolean);if(!members.length)continue;
    const scarcity=clamp(Math.floor(members.reduce((n,x)=>n+x.scarcityPpm,0)/members.length)),routeStress=clamp(Math.floor(members.reduce((n,x)=>n+x.routeStressPpm,0)/members.length)),service=clamp(Math.floor(members.reduce((n,x)=>n+x.serviceSatisfactionPpm,0)/members.length)),legitimacy=clamp(p.legitimacyPpm||0),cohesion=clamp(p.cohesionPpm||0);
    const damaged=arr(network?.bottlenecks).filter(b=>b.kind==='INFRASTRUCTURE_DEGRADATION'&&members.some(m=>{const r=arr(network?.routes).find(x=>x.edgeId===b.edgeId);return r&&(r.from===m.settlementId||r.to===m.settlementId)})),isolated=members.filter(x=>x.routeStressPpm>=650000);
    const mechanisms=[];if(scarcity>500000)mechanisms.push('DISTRIBUTION_RATIONING_OR_REALLOCATION');if(damaged.length)mechanisms.push('REPAIR_PRIORITY');if(isolated.length)mechanisms.push('NETWORK_ACCESS_OR_REDUNDANCY_PRIORITY');if(service<500000)mechanisms.push('SERVICE_RESTORATION');if(legitimacy<300000||cohesion<300000)mechanisms.push('LEGITIMACY_AND_COHESION_RISK');if(!mechanisms.length)mechanisms.push('ROUTINE_COORDINATION');
    const legitimacyDelta=clamp(Math.floor((service-500000)/12-(scarcity-400000)/14),-120000,120000),cohesionDelta=clamp(Math.floor((service-500000)/14-(routeStress-400000)/16),-120000,120000);
    proposals.push(freeze({proposalId:deriveId('institution-response',p.polityId,state.epoch),polityId:text(p.polityId),institutionId:text(p.institutionId||''),settlementIds:members.map(x=>x.settlementId).sort(),mechanisms:mechanisms.slice(0,8),scarcityPressurePpm:scarcity,routeStressPpm:routeStress,serviceSatisfactionPpm:service,legitimacyDeltaPpm:legitimacyDelta,cohesionDeltaPpm:cohesionDelta,transitionRisk:legitimacy<180000||cohesion<180000?'FRAGMENTATION_RISK':scarcity>700000&&service<350000?'ALLOCATIVE_CRISIS':'BOUNDED_RESPONSE',sourceBottleneckIds:damaged.map(x=>x.bottleneckId).sort(),isolatedSettlementIds:isolated.map(x=>x.settlementId).sort(),authority:AUTHORITY.MODEL_DERIVED_SIMULATION,mutationPerformed:false,universalSociologicalClaim:false,canonicalHistoryAdmissionRequested:false}));if(proposals.length>=LIMITS.institutionProposals)break}
  }
  return proposals;
}
function societyDynamics(state,network){
  if(!validateCivilization(state)||network?.status!=='MODELED')return freeze({contract:CONTRACT,status:'NO_MODELED_CIVILIZATION_OR_NETWORK',settlementPressures:[],migrationProposals:[],institutionProposals:[],authority:AUTHORITY.MODEL_DERIVED_SIMULATION,bounded:true,limitations:LIMITATIONS});
  const pressures=settlementPressures(state,network),migration=migrationProposals(state,pressures),institutions=polityInstitutionProposals(state,pressures,network);const operations=pressures.length*8+migration.length*6+institutions.length*8;if(operations>LIMITS.operations)throw new RangeError('V2X-09 society-dynamics operation bound exceeded');
  return freeze({contract:CONTRACT,status:'MODELED',settlementPressures:pressures,migrationProposals:migration,institutionProposals:institutions,operations,limits:LIMITS,authority:AUTHORITY.MODEL_DERIVED_SIMULATION,bounded:true,mutationPerformed:false,persistentPersonIdentityCreated:false,canonicalHistoryMutation:false,planetOrLifeMutation:false,limitations:LIMITATIONS});
}
O.v2x09CivilizationSocietyDynamics=Object.freeze({CONTRACT,LIMITS,societyDynamics,settlementPressures,migrationProposals,polityInstitutionProposals});
})(typeof globalThis!=='undefined'?globalThis:this);
