(function(root){
'use strict';
const O=root.OFU=root.OFU||{},K=O.v2x09CivilizationCore,P=O.v2x09CivilizationProductionNetwork,S=O.v2x09CivilizationSocietyDynamics;if(!K||!P||!S)throw new Error('V2X-09 core/production/society modules required');
const {AUTHORITY,LIMITATIONS,freeze,text,int,clamp,arr,sortId,validateCivilization,technologyProfile,deriveId,tradeDegree,unit}=K;
const CONTRACT='ofu-v2x-09-urban-evolution-1';
const LIMITS=Object.freeze({settlements:48,specializationsPerSettlement:8,evidenceLayersPerSettlement:24,renderCuesPerSettlement:32,totalRenderCues:1536});
function eventTargets(event){return arr(event?.targetIds).map(text)}
function routeRowsFor(network,settlementId){return arr(network?.routes).filter(r=>r.from===settlementId||r.to===settlementId)}
function serviceRow(network,settlementId,good){return arr(network?.satisfaction).find(x=>x.settlementId===settlementId&&x.good===good)||null}
function regionFor(state,regionId){return arr(state?.regions).find(r=>text(r.regionId)===regionId)||{}}
function familyFor(state,settlement,network,tech){
  const sid=text(settlement.settlementId),status=text(settlement.status||'UNKNOWN').toUpperCase(),region=regionFor(state,text(settlement.regionId)),degree=tradeDegree(state,sid),pop=Math.max(0,int(settlement.population));
  if(status!=='ACTIVE'||pop===0)return 'POST_COLLAPSE_RELICT';
  if(clamp(region.waterPpm||0)>=450000&&degree>0&&tech.activeCapabilities.includes('WATERBORNE_LOGISTICS'))return 'PORT_CLUSTER';
  if(degree>=4&&pop>=12000)return 'POLYCENTRIC_NETWORK';
  if(clamp(region.materialResourcePpm||0)>=700000&&tech.activeCapabilities.includes('SPECIALIZED_MATERIALS'))return 'RESOURCE_FRONTIER';
  if(degree>=1&&tech.activeCapabilities.includes('ROUTE_LOGISTICS'))return 'CORRIDOR_SPINE';
  if(clamp(region.biologicalResourcePpm||0)>=550000)return 'AGRARIAN_MARKET';
  return 'DISPERSED_CORE';
}
function specializations(state,settlement,network,tech){
  const sid=text(settlement.settlementId),out=[];const add=(kind,basis,weight)=>{if(out.length<LIMITS.specializationsPerSettlement)out.push(freeze({specializationId:deriveId('specialization',sid,kind),kind,basis:basis.slice().sort(),weightPpm:clamp(weight),authority:AUTHORITY.MODEL_DERIVED_SIMULATION}))};
  const service=(good)=>serviceRow(network,sid,good);const degree=tradeDegree(state,sid),region=regionFor(state,text(settlement.regionId));
  if((service('DURABLE_PROVISIONS')?.servedUnits||0)>0)add('FOOD_STORAGE_AND_PRESERVATION',['DURABLE_PROVISIONS'],service('DURABLE_PROVISIONS').satisfactionPpm);
  if((service('BUILDING_COMPONENTS')?.servedUnits||0)>0)add('CRAFT_AND_BUILDING_YARD',['BUILDING_COMPONENTS'],service('BUILDING_COMPONENTS').satisfactionPpm);
  if((service('DISTRIBUTION_SERVICE')?.servedUnits||0)>0&&degree>0)add('LOGISTICS_QUARTER',['DISTRIBUTION_SERVICE','TRADE_NETWORK'],Math.max(service('DISTRIBUTION_SERVICE').satisfactionPpm,Math.min(1000000,degree*180000)));
  if((service('PUBLIC_WORKS_SERVICE')?.servedUnits||0)>0&&tech.activeCapabilities.includes('PUBLIC_WORKS'))add('CIVIC_WORKS',['PUBLIC_WORKS_SERVICE','TECH:PUBLIC_WORKS'],service('PUBLIC_WORKS_SERVICE').satisfactionPpm);
  if(clamp(region.waterPpm||0)>=450000&&tech.activeCapabilities.includes('WATERBORNE_LOGISTICS')&&degree>0)add('WATER_TERMINAL',['WATER_ACCESS','WATERBORNE_LOGISTICS'],clamp(region.waterPpm||0));
  if(clamp(region.biologicalResourcePpm||0)>=450000)add('AGRARIAN_HINTERLAND',['BIOLOGICAL_RESOURCE'],clamp(region.biologicalResourcePpm||0));
  if(clamp(region.materialResourcePpm||0)>=600000&&tech.activeCapabilities.includes('SPECIALIZED_MATERIALS'))add('MATERIAL_WORKS',['MATERIAL_RESOURCE','SPECIALIZED_MATERIALS'],clamp(region.materialResourcePpm||0));
  return out;
}
function evidenceLayers(state,settlement,network,dynamics){
  const sid=text(settlement.settlementId),layers=[];const add=(kind,sourceClass,sourceIds,epoch=null,severity=500000)=>{if(layers.length<LIMITS.evidenceLayersPerSettlement)layers.push(freeze({layerId:deriveId('urban-layer',sid,kind,sourceIds.join('|'),epoch??''),kind,sourceClass,sourceIds:sourceIds.slice().sort(),epoch:epoch===null?null:int(epoch),severityPpm:clamp(severity),authority:AUTHORITY.PRESENTATION_ONLY,physicalArchaeologyClaim:false,canonicalHistoryClaim:false}))};
  for(const e of arr(state?.history?.proposals).filter(e=>eventTargets(e).includes(sid)).sort((a,b)=>int(a.epoch)-int(b.epoch)||text(a.eventProposalId).localeCompare(text(b.eventProposalId)))){
    const type=text(e.type).toUpperCase();if(type==='SETTLEMENT_FOUNDATION')add('FOUNDATION_SEQUENCE','MODEL_HISTORY_PROPOSAL',[text(e.eventProposalId)],e.epoch,250000);else if(type==='INFRASTRUCTURE_BUILT')add('INFRASTRUCTURE_ADDITION','MODEL_HISTORY_PROPOSAL',[text(e.eventProposalId)],e.epoch,350000);else if(['CONFLICT','SETTLEMENT_DESTROYED','RESOURCE_CRISIS','COLLAPSE'].includes(type))add('DAMAGE_OR_STRESS','MODEL_HISTORY_PROPOSAL',[text(e.eventProposalId)],e.epoch,clamp(e?.payload?.intensityPpm||650000));else if(type==='ABANDONMENT')add('ABANDONMENT','MODEL_HISTORY_PROPOSAL',[text(e.eventProposalId)],e.epoch,850000);else if(type==='RECOVERY')add('RECOVERY','MODEL_HISTORY_PROPOSAL',[text(e.eventProposalId)],e.epoch,500000);
  }
  for(const r of routeRowsFor(network,sid).filter(r=>clamp(r.degradationPpm||0)>=450000)){const ids=[text(r.edgeId),...arr(r.sourceInfrastructureIds).map(text)];add('CORRIDOR_DEGRADATION','MODELED_INFRASTRUCTURE_CONDITION',ids,null,r.degradationPpm)}
  const pressure=arr(dynamics?.settlementPressures).find(x=>x.settlementId===sid);if(pressure&&pressure.migrationPressurePpm>=550000)add('AGGREGATE_OUTMIGRATION_PRESSURE','DERIVED_AGGREGATE_PRESSURE',[sid],null,pressure.migrationPressurePpm);
  return layers;
}
function phaseFor(settlement,pressure,layers){
  const status=text(settlement.status||'UNKNOWN').toUpperCase();if(status!=='ACTIVE'||int(settlement.population)<=0)return 'RELICT';
  if(layers.some(x=>x.kind==='ABANDONMENT'))return 'REOCCUPIED_OR_STATE_INCONSISTENT';
  if(pressure?.migrationPressurePpm>=650000||pressure?.scarcityPpm>=700000)return 'STRESSED';
  if(layers.some(x=>x.kind==='RECOVERY'))return 'RECOVERING';
  if((pressure?.serviceSatisfactionPpm||0)>=700000&&clamp(settlement.infrastructurePpm||0)>=550000)return 'CONSOLIDATING';
  return 'STABLE_OR_AMBIGUOUS';
}
function renderCuesFor(row){
  const cues=[];const centerX=unit(row.settlementId,'evolution-center-x')/1000000,centerY=unit(row.settlementId,'evolution-center-y')/1000000;const push=(v)=>{if(cues.length<LIMITS.renderCuesPerSettlement)cues.push(freeze(v))};
  push({kind:'URBAN_FAMILY_CUE',settlementId:row.settlementId,family:row.family,phase:row.phase,x:centerX,y:centerY,authority:AUTHORITY.PRESENTATION_ONLY,physicalGeometryClaim:false});
  for(const s of row.specializations){push({kind:'SPECIALIZATION_CUE',settlementId:row.settlementId,sourceSpecializationId:s.specializationId,specialization:s.kind,weightPpm:s.weightPpm,x:clamp(Math.round((centerX+(unit(s.specializationId,'x')/1000000-.5)*.16)*1000000),0,1000000)/1000000,y:clamp(Math.round((centerY+(unit(s.specializationId,'y')/1000000-.5)*.16)*1000000),0,1000000)/1000000,authority:AUTHORITY.PRESENTATION_ONLY,physicalGeometryClaim:false})}
  for(const layer of row.evidenceLayers){push({kind:'EVIDENCE_LAYER_CUE',settlementId:row.settlementId,sourceLayerId:layer.layerId,layerKind:layer.kind,severityPpm:layer.severityPpm,x:centerX,y:centerY,authority:AUTHORITY.PRESENTATION_ONLY,physicalArchaeologyClaim:false})}
  return cues;
}
function urbanEvolution(state,network,dynamics){
  if(!validateCivilization(state)||network?.status!=='MODELED'||dynamics?.status!=='MODELED')return freeze({contract:CONTRACT,status:'NO_MODELED_INPUT',settlements:[],renderCues:[],authority:AUTHORITY.PRESENTATION_ONLY,bounded:true,limitations:LIMITATIONS});
  const tech=technologyProfile(state),pressures=new Map(arr(dynamics.settlementPressures).map(x=>[x.settlementId,x])),rows=[];for(const s of sortId(arr(state.settlements),'settlementId')){const specs=specializations(state,s,network,tech),layers=evidenceLayers(state,s,network,dynamics),pressure=pressures.get(text(s.settlementId))||null;rows.push(freeze({settlementId:text(s.settlementId),regionId:text(s.regionId),status:text(s.status||'UNKNOWN').toUpperCase(),population:Math.max(0,int(s.population)),family:familyFor(state,s,network,tech),phase:phaseFor(s,pressure,layers),specializations:specs,evidenceLayers:layers,pressure:pressure?freeze({...pressure}):null,authority:AUTHORITY.MODEL_DERIVED_SIMULATION,renderAuthority:AUTHORITY.PRESENTATION_ONLY,claims:freeze({physicalGeometry:false,persistentBuildingSimulation:false,empiricalUrbanForecast:false,historyLayersRequireWitness:true,randomRuinDecoration:false})}));if(rows.length>=LIMITS.settlements)break}
  const renderCues=[];for(const row of rows)for(const cue of renderCuesFor(row)){renderCues.push(cue);if(renderCues.length>=LIMITS.totalRenderCues)break}
  return freeze({contract:CONTRACT,status:'MODELED',settlements:rows,renderCues,technology:tech,limits:LIMITS,authority:AUTHORITY.MODEL_DERIVED_SIMULATION,renderAuthority:AUTHORITY.PRESENTATION_ONLY,bounded:true,rendererMutationPerformed:false,sharedSceneMutationPerformed:false,requiresConvergenceOwnerComposition:true,physicalGeometryClaim:false,canonicalHistoryMutation:false,limitations:LIMITATIONS});
}
O.v2x09CivilizationUrbanEvolution=Object.freeze({CONTRACT,LIMITS,urbanEvolution,familyFor,specializations,evidenceLayers});
})(typeof globalThis!=='undefined'?globalThis:this);
