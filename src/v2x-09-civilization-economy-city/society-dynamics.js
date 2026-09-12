(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const K=O.v2x09CivilizationCore;
const P=O.v2x09CivilizationProductionNetwork;
if(!K||!P)throw new Error('V2X-09 core/production network required');
const {AUTHORITY,LIMITATIONS,freeze,text,int,clamp,arr,sortId,validateCivilization,deriveId,tradeDegree}=K;
const CONTRACT='ofu-v2x-09-aggregate-society-dynamics-1';
const LIMITS=Object.freeze({settlementPressures:48,migrationProposals:96,institutionProposals:256,operations:16000});

function satisfactionMap(network){
 const out=new Map();
 for(const s of arr(network?.settlements))out.set(text(s.settlementId),s.serviceSatisfaction||null);
 return out;
}
function routeStressFor(network,settlementId){
 const incident=arr(network?.routes).filter(r=>r.from===settlementId||r.to===settlementId);
 if(!incident.length)return 0;
 const usable=incident.filter(r=>r.routingEligible!==false);
 if(incident.some(r=>K.knownPpm(r.degradationPpm)===null||K.knownPpm(r.utilizationPpm)===null))return null;
 // Bounded scenario response to explicitly modeled unusable routes, not missing route evidence.
 if(!usable.length)return 700000;
 return clamp(Math.floor(usable.reduce((n,r)=>n+Math.max(clamp(r.degradationPpm||0),clamp(r.utilizationPpm||0)),0)/usable.length));
}
function stockCoveragePpm(row){
 const population=Math.max(1,int(row.population));
 const stocks=row?.stocks||{};
 const subsistence=Math.max(0,int(stocks.SUBSISTENCE_GOODS||0));
 const energy=Math.max(0,int(stocks.ENERGY_SERVICE||0));
 return clamp(Math.floor(Math.min(1,(subsistence/population)/1.5,(energy/population)/.35)*1000000));
}
function incompletePressure(settlement,status,sourceStatus=null){
 return freeze({settlementId:text(settlement.settlementId),status,population:Math.max(0,int(settlement.population)),serviceSatisfactionPpm:null,stockCoveragePpm:null,routeStressPpm:null,scarcityPpm:null,migrationPressurePpm:null,opportunityPpm:null,incompleteEvidence:true,sourceEconomyStatus:sourceStatus,authority:AUTHORITY.DERIVED});
}
function settlementPressures(state,network){
 const satisfaction=satisfactionMap(network);
 const networkById=new Map(arr(network?.settlements).map(s=>[text(s.settlementId),s]));
 const rows=[];
 for(const settlement of sortId(arr(state?.settlements),'settlementId')){
  if(rows.length>=LIMITS.settlementPressures)break;
  const settlementId=text(settlement.settlementId);
  const modeled=networkById.get(settlementId);
  const active=text(settlement.status||'UNKNOWN').toUpperCase()==='ACTIVE'&&int(settlement.population)>0;
  if(active&&!modeled){rows.push(incompletePressure(settlement,'MISSING_MODELED_ECONOMY'));continue;}
  if(active&&text(modeled?.status||'UNKNOWN').toUpperCase()!=='ACTIVE'){
   rows.push(incompletePressure(settlement,'ECONOMY_STATE_STATUS_CONFLICT',text(modeled?.status||'UNKNOWN').toUpperCase()));
   continue;
  }
  if(!active&&text(settlement.status||'UNKNOWN').toUpperCase()==='UNKNOWN'){rows.push(incompletePressure(settlement,'SETTLEMENT_STATUS_UNKNOWN'));continue;}
  if(!active){
   rows.push(freeze({settlementId,status:text(settlement.status||'UNKNOWN').toUpperCase(),population:Math.max(0,int(settlement.population)),serviceSatisfactionPpm:0,stockCoveragePpm:0,routeStressPpm:1000000,scarcityPpm:1000000,migrationPressurePpm:0,opportunityPpm:0,incompleteEvidence:false,authority:AUTHORITY.DERIVED}));
   continue;
  }
  const service=K.knownPpm(satisfaction.get(settlementId)?.overallPpm);
  const coverage=stockCoveragePpm(modeled);
  const routeStress=routeStressFor(network,settlementId);
  const scarcity=clamp(settlement.scarcityPpm??Math.floor((1000000-service)*.55+(1000000-coverage)*.45));
  const infrastructure=K.knownPpm(settlement.infrastructurePpm);
  if(service===null||routeStress===null||infrastructure===null){rows.push(incompletePressure(settlement,'SCIENTIFIC_SOCIAL_INPUT_UNKNOWN'));continue;}
  const opportunity=clamp(Math.floor(service*.35+coverage*.25+infrastructure*.2+Math.min(1000000,tradeDegree(state,settlementId)*180000)*.2));
  const migration=clamp(Math.floor(scarcity*.45+routeStress*.2+(1000000-service)*.25+(1000000-infrastructure)*.1-opportunity*.2));
  rows.push(freeze({settlementId,status:'ACTIVE',population:Math.max(0,int(settlement.population)),serviceSatisfactionPpm:service,stockCoveragePpm:coverage,routeStressPpm:routeStress,scarcityPpm:scarcity,migrationPressurePpm:migration,opportunityPpm:opportunity,incompleteEvidence:false,authority:AUTHORITY.DERIVED}));
 }
 return rows;
}
function migrationProposals(state,pressures){
 const active=pressures.filter(x=>x.status==='ACTIVE'&&!x.incompleteEvidence);
 const proposals=[];
 for(const source of active){
  if(source.migrationPressurePpm<380000||source.population<200)continue;
  const candidates=active
   .filter(x=>x.settlementId!==source.settlementId&&x.opportunityPpm>source.opportunityPpm+80000&&x.migrationPressurePpm<source.migrationPressurePpm)
   .sort((a,b)=>b.opportunityPpm-a.opportunityPpm||(a.settlementId<b.settlementId?-1:a.settlementId>b.settlementId?1:0));
  const destination=candidates[0]||null;
  const amount=Math.min(Math.max(1,Math.floor(source.population*source.migrationPressurePpm/1000000/25)),Math.max(1,Math.floor(source.population*.08)));
  proposals.push(freeze({proposalId:deriveId('aggregate-migration',state.worldIdentity,source.settlementId,destination?.settlementId||'NONE',state.epoch),kind:destination?'AGGREGATE_MIGRATION_PRESSURE':'LOCAL_DISPLACEMENT_PRESSURE_NO_MODELED_DESTINATION',sourceSettlementId:source.settlementId,destinationSettlementId:destination?.settlementId||null,aggregatePopulationUnits:amount,pressurePpm:source.migrationPressurePpm,destinationOpportunityPpm:destination?.opportunityPpm??null,authority:AUTHORITY.MODEL_DERIVED_SIMULATION,mutationPerformed:false,persistentPersonIdentityCreated:false,persistentPersonIds:freeze([]),genealogyMutation:false,canonicalHistoryAdmissionRequested:false,requiresPopulationOwnerReconciliation:true}));
  if(proposals.length>=LIMITS.migrationProposals)break;
 }
 return proposals;
}
function polityInstitutionProposals(state,pressures,network){
 const byPressure=new Map(pressures.map(x=>[x.settlementId,x]));
 const proposals=[];
 for(const polity of sortId(arr(state?.polities),'polityId')){
  const allMembers=arr(polity.settlementIds).map(text).map(id=>byPressure.get(id)).filter(Boolean);
  const incomplete=allMembers.filter(x=>x.incompleteEvidence);
  const members=allMembers.filter(x=>!x.incompleteEvidence);
  if(!members.length)continue;
  const scarcity=clamp(Math.floor(members.reduce((n,x)=>n+x.scarcityPpm,0)/members.length));
  const routeStress=clamp(Math.floor(members.reduce((n,x)=>n+x.routeStressPpm,0)/members.length));
  const service=clamp(Math.floor(members.reduce((n,x)=>n+x.serviceSatisfactionPpm,0)/members.length));
  const legitimacy=K.knownPpm(polity.legitimacyPpm);
  const cohesion=K.knownPpm(polity.cohesionPpm);
  const damaged=arr(network?.bottlenecks).filter(b=>{
   if(b.kind!=='INFRASTRUCTURE_DEGRADATION')return false;
   const route=arr(network?.routes).find(x=>x.edgeId===b.edgeId);
   return Boolean(route&&members.some(m=>route.from===m.settlementId||route.to===m.settlementId));
  });
  const isolated=members.filter(x=>x.routeStressPpm>=650000);
  const mechanisms=[];
  if(scarcity>500000)mechanisms.push('DISTRIBUTION_RATIONING_OR_REALLOCATION');
  if(damaged.length)mechanisms.push('REPAIR_PRIORITY');
  if(isolated.length)mechanisms.push('NETWORK_ACCESS_OR_REDUNDANCY_PRIORITY');
  if(service<500000)mechanisms.push('SERVICE_RESTORATION');
  if(legitimacy!==null&&cohesion!==null&&(legitimacy<300000||cohesion<300000))mechanisms.push('LEGITIMACY_AND_COHESION_RISK');
  if(legitimacy===null||cohesion===null)mechanisms.push('LEGITIMACY_OR_COHESION_UNKNOWN');
  if(!mechanisms.length)mechanisms.push('ROUTINE_COORDINATION');
  const legitimacyDelta=clamp(Math.floor((service-500000)/12-(scarcity-400000)/14),-120000,120000);
  const cohesionDelta=clamp(Math.floor((service-500000)/14-(routeStress-400000)/16),-120000,120000);
  proposals.push(freeze({proposalId:deriveId('institution-response',polity.polityId,state.epoch),polityId:text(polity.polityId),institutionId:text(polity.institutionId||''),settlementIds:members.map(x=>x.settlementId).sort(),excludedIncompleteSettlementIds:incomplete.map(x=>x.settlementId).sort(),evidenceComplete:incomplete.length===0&&legitimacy!==null&&cohesion!==null,sourceLegitimacyPpm:legitimacy,sourceCohesionPpm:cohesion,mechanisms:mechanisms.slice(0,8),scarcityPressurePpm:scarcity,routeStressPpm:routeStress,serviceSatisfactionPpm:service,legitimacyDeltaPpm:legitimacy===null?null:legitimacyDelta,cohesionDeltaPpm:cohesion===null?null:cohesionDelta,transitionRisk:incomplete.length||legitimacy===null||cohesion===null?'UNKNOWN_INCOMPLETE_EVIDENCE':legitimacy<180000||cohesion<180000?'FRAGMENTATION_RISK':scarcity>700000&&service<350000?'ALLOCATIVE_CRISIS':'BOUNDED_RESPONSE',sourceBottleneckIds:damaged.map(x=>x.bottleneckId).sort(),isolatedSettlementIds:isolated.map(x=>x.settlementId).sort(),authority:AUTHORITY.MODEL_DERIVED_SIMULATION,mutationPerformed:false,universalSociologicalClaim:false,canonicalHistoryAdmissionRequested:false}));
  if(proposals.length>=LIMITS.institutionProposals)break;
 }
 return proposals;
}
function societyDynamics(state,network){
 if(!validateCivilization(state)||network?.status!=='MODELED')return freeze({contract:CONTRACT,status:'NO_MODELED_CIVILIZATION_OR_NETWORK',settlementPressures:[],migrationProposals:[],institutionProposals:[],evidenceGaps:[],evidenceComplete:false,authority:AUTHORITY.MODEL_DERIVED_SIMULATION,bounded:true,limitations:LIMITATIONS});
 const pressures=settlementPressures(state,network);
 const migration=migrationProposals(state,pressures);
 const institutions=polityInstitutionProposals(state,pressures,network);
 const institutionGaps=institutions.filter(x=>!x.evidenceComplete).map(x=>freeze({kind:'INSTITUTION_SOURCE_EVIDENCE_UNKNOWN',polityId:x.polityId,authority:AUTHORITY.DERIVED}));
 const evidenceGaps=pressures.filter(x=>x.incompleteEvidence).map(x=>freeze({kind:x.status,settlementId:x.settlementId,sourceEconomyStatus:x.sourceEconomyStatus||null,authority:AUTHORITY.DERIVED})).concat(institutionGaps);
 const operations=pressures.length*8+migration.length*6+institutions.length*8;
 if(operations>LIMITS.operations)throw new RangeError('V2X-09 society-dynamics operation bound exceeded');
 return freeze({contract:CONTRACT,status:'MODELED',settlementPressures:pressures,migrationProposals:migration,institutionProposals:institutions,evidenceGaps,evidenceComplete:evidenceGaps.length===0,operations,limits:LIMITS,authority:AUTHORITY.MODEL_DERIVED_SIMULATION,bounded:true,mutationPerformed:false,persistentPersonIdentityCreated:false,canonicalHistoryMutation:false,planetOrLifeMutation:false,limitations:LIMITATIONS});
}
O.v2x09CivilizationSocietyDynamics=Object.freeze({CONTRACT,LIMITS,societyDynamics,settlementPressures,migrationProposals,polityInstitutionProposals});
})(typeof globalThis!=='undefined'?globalThis:this);
