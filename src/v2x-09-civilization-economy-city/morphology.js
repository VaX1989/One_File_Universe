(function(root){
'use strict';
const O=root.OFU=root.OFU||{},K=O.v2x09CivilizationCore,S=O.v2x09CivilizationInstitutions;if(!K||!S)throw new Error('V2X-09 core/institutions required');
const {VERSION,MORPHOLOGY_CONTRACT,AUTHORITY,LIMITS,LIMITATIONS,freeze,text,int,clamp,arr,unit,sortId,sourceAuthority,validateCivilization,technologyProfile,deriveId,tradeDegree}=K;
const {institutionProfile}=S;
function targetIds(e){return arr(e?.targetIds).map(text)}
function morphologyForSettlement(state,settlement,economy,tech){
  const sid=text(settlement.settlementId),region=arr(state.regions).find(r=>r.regionId===settlement.regionId)||{},events=arr(state.history?.proposals).filter(e=>targetIds(e).includes(sid)).sort((a,b)=>int(a.epoch)-int(b.epoch)||text(a.eventProposalId).localeCompare(text(b.eventProposalId))),degree=tradeDegree(state,sid),infraAssets=arr(state.infrastructure).filter(x=>x.fromSettlementId===sid||x.toSettlementId===sid||x.settlementId===sid),active=text(settlement.status).toUpperCase()==='ACTIVE'&&int(settlement.population)>0,pop=Math.max(0,int(settlement.population)),infrastructure=clamp(settlement.infrastructurePpm||0),districts=[];
  const add=(kind,basis,weight)=>{if(districts.length<LIMITS.districtsPerSettlement)districts.push(freeze({districtId:deriveId('district',sid,kind),kind,basis,weightPpm:clamp(weight),placement:freeze({u:unit(sid,kind+'u')/1000000,v:unit(sid,kind+'v')/1000000,authority:AUTHORITY.PRESENTATION_ONLY,physicalGeometryClaim:false})}))};
  if(active)add('CORE',['ACTIVE_SETTLEMENT','POPULATION'],220000+Math.min(500000,pop*10));
  if(active&&pop>=150)add('RESIDENTIAL',['POPULATION'],200000+Math.min(600000,pop*8));
  if(active&&clamp(region.biologicalResourcePpm||0)>=120000)add('AGRICULTURAL_HINTERLAND',['BIOLOGICAL_RESOURCE','ACTIVE_SETTLEMENT'],clamp(region.biologicalResourcePpm||0));
  if(active&&tech.activeCapabilities.includes('SPECIALIZED_MATERIALS'))add('PRODUCTION',['TECH:SPECIALIZED_MATERIALS','MATERIAL_RESOURCE'],clamp(region.materialResourcePpm||0));
  if(active&&degree>0&&tech.activeCapabilities.includes('ROUTE_LOGISTICS'))add('MARKET_AND_STORAGE',['TRADE_EDGE','TECH:ROUTE_LOGISTICS'],Math.min(1000000,degree*180000+infrastructure/2));
  if(active&&clamp(region.waterPpm||0)>=450000&&degree>0&&tech.activeCapabilities.includes('WATERBORNE_LOGISTICS'))add('PORT_OR_WATER_TERMINAL',['WATER_ACCESS','TRADE_EDGE','TECH:WATERBORNE_LOGISTICS'],clamp(region.waterPpm||0));
  if(active&&settlement.polityId)add('CIVIC_COORDINATION',['POLITY_MEMBERSHIP'],Math.max(180000,infrastructure));
  const destructive=events.filter(e=>['CONFLICT','SETTLEMENT_DESTROYED','COLLAPSE','RESOURCE_CRISIS'].includes(e.type));
  if(!active||destructive.length)add('RUIN_OR_DAMAGE_LAYER',[!active?'CURRENT_ABANDONMENT':'HISTORY_EVENT'],Math.min(1000000,250000+destructive.length*140000));
  const roadHierarchy=!active?'RELICT_OR_UNSUPPORTED':infraAssets.length>=3||degree>=4?'PRIMARY_AND_SECONDARY_CORRIDORS':infraAssets.length||degree?'LOCAL_OR_REGIONAL_CORRIDORS':'NO_MODELED_CORRIDOR';
  const layout=!active?'ABANDONED_LAYERED':pop>=20000&&degree>=2?'DENSE_NETWORKED_CENTER':pop>=3000&&degree>=1?'CONNECTED_TOWN':degree>=1?'LINEAR_ROUTE_SETTLEMENT':'DISPERSED_SETTLEMENT';
  const layers=[];for(const e of events){let kind=null;if(e.type==='SETTLEMENT_FOUNDATION')kind='FOUNDATION';else if(['CONFLICT','SETTLEMENT_DESTROYED','RESOURCE_CRISIS','COLLAPSE'].includes(e.type))kind='DAMAGE_OR_STRESS';else if(e.type==='ABANDONMENT')kind='ABANDONMENT';else if(e.type==='INFRASTRUCTURE_BUILT')kind='INFRASTRUCTURE_ADDITION';if(kind)layers.push(freeze({layerId:deriveId('layer',sid,e.eventProposalId||e.epoch,kind),kind,epoch:int(e.epoch),sourceEventProposalId:text(e.eventProposalId||''),authority:AUTHORITY.PRESENTATION_ONLY,historyCanonicalClaim:false}));if(layers.length>=LIMITS.historicalLayersPerSettlement)break}
  return freeze({contract:MORPHOLOGY_CONTRACT,settlementId:sid,regionId:text(settlement.regionId),status:text(settlement.status||'UNKNOWN').toUpperCase(),layoutClass:layout,populationBand:pop>=100000?'METROPOLITAN':pop>=20000?'URBAN':pop>=3000?'TOWN':pop>=300?'SETTLEMENT':'SMALL',roadHierarchy,districts,historicalLayers:layers,lod:freeze({regional:freeze({representation:'FOOTPRINT_AND_NETWORK_CUE',districtBudget:Math.min(4,districts.length)}),local:freeze({representation:'DISTRICT_AND_CORRIDOR_DESCRIPTORS',districtBudget:districts.length}),human:freeze({representation:'LANDMARK_AND_EDGE_HINTS_NOT_BUILDING_SIMULATION',landmarkBudget:Math.min(8,districts.length+infraAssets.length)})}),authority:AUTHORITY.PRESENTATION_ONLY,sourceAuthority:sourceAuthority(settlement),claims:freeze({physicalBuildingSimulation:false,physicalRoadGeometry:false,randomRuins:false,historyBackedDamage:destructive.length>0,abandonedCaseHonest:!active})});
}
function cityMorphology(state,{economy=null}={}){
  if(!validateCivilization(state))return freeze({contract:MORPHOLOGY_CONTRACT,status:'NO_MODELED_CIVILIZATION',settlements:[],authority:AUTHORITY.PRESENTATION_ONLY,limitations:LIMITATIONS});
  const tech=technologyProfile(state),rows=sortId(arr(state.settlements),'settlementId').map(s=>morphologyForSettlement(state,s,economy,tech));
  return freeze({contract:MORPHOLOGY_CONTRACT,version:VERSION,status:rows.length?'PROJECTED':'NO_SETTLEMENTS',settlements:rows,technology:tech,authority:AUTHORITY.PRESENTATION_ONLY,bounded:true,limits:LIMITS,claims:freeze({schematicPlacement:true,physicalCityGeometryClaim:false,fullPersistentBuildingSimulation:false,unsupportedInfrastructureNotDecorated:true}),limitations:LIMITATIONS});
}

function cityRenderPlan(state,{settlementId=null}={}){
  const morphology=cityMorphology(state);
  if(morphology.status==='NO_MODELED_CIVILIZATION')return freeze({contract:'ofu-v2x-09-city-render-plan-1',status:'NO_MODELED_CIVILIZATION',commands:[],authority:AUTHORITY.PRESENTATION_ONLY,physicalGeometryClaim:false});
  const selected=settlementId?morphology.settlements.filter(x=>x.settlementId===settlementId):morphology.settlements;
  const commands=[];
  for(const row of selected){
    const cx=unit(row.settlementId,'center-x')/1000000,cy=unit(row.settlementId,'center-y')/1000000;
    commands.push(freeze({kind:'SETTLEMENT_FOOTPRINT_CUE',sourceSettlementId:row.settlementId,x:cx,y:cy,layoutClass:row.layoutClass,populationBand:row.populationBand,status:row.status,authority:AUTHORITY.PRESENTATION_ONLY,physicalPositionClaim:false}));
    for(const d of row.districts)commands.push(freeze({kind:'DISTRICT_CUE',sourceSettlementId:row.settlementId,sourceDistrictId:d.districtId,x:clamp(Math.round((cx+(d.placement.u-.5)*.18)*1000000),0,1000000)/1000000,y:clamp(Math.round((cy+(d.placement.v-.5)*.18)*1000000),0,1000000)/1000000,districtKind:d.kind,weightPpm:d.weightPpm,authority:AUTHORITY.PRESENTATION_ONLY,physicalGeometryClaim:false}));
    for(const layer of row.historicalLayers)commands.push(freeze({kind:'HISTORY_LAYER_CUE',sourceSettlementId:row.settlementId,sourceEventProposalId:layer.sourceEventProposalId,layerKind:layer.kind,epoch:layer.epoch,x:cx,y:cy,authority:AUTHORITY.PRESENTATION_ONLY,historyCanonicalClaim:false}));
  }
  const visibleIds=new Set(selected.map(x=>x.settlementId));
  for(const e of sortId(arr(state?.tradeEdges),'edgeId'))if(visibleIds.has(e.from)&&visibleIds.has(e.to))commands.push(freeze({kind:'CORRIDOR_CUE',sourceEdgeId:text(e.edgeId||deriveId('edge',e.from,e.to)),fromSettlementId:text(e.from),toSettlementId:text(e.to),mode:text(e.mode||'UNSPECIFIED'),status:text(e.status||'ACTIVE'),authority:AUTHORITY.PRESENTATION_ONLY,physicalPathClaim:false}));
  const maxCommands=LIMITS.settlements*(1+LIMITS.districtsPerSettlement+LIMITS.historicalLayersPerSettlement)+LIMITS.tradeEdges;
  if(commands.length>maxCommands)throw new RangeError('V2X-09 render command bound exceeded');
  return freeze({contract:'ofu-v2x-09-city-render-plan-1',version:VERSION,status:commands.length?'PROJECTED':'NO_SUPPORTED_CITY_VISUALS',commands,commandCount:commands.length,maxCommands,authority:AUTHORITY.PRESENTATION_ONLY,bounded:true,physicalGeometryClaim:false,rendererMutationPerformed:false,sharedSceneMutationPerformed:false,requiresConvergenceOwnerComposition:true,limitations:LIMITATIONS});
}

function inspector(state,{settlementId=null}={}){
  if(!validateCivilization(state))return freeze({supported:false,reason:'NO_MODELED_CIVILIZATION',authority:AUTHORITY.DERIVED,limitations:LIMITATIONS});
  const s=settlementId?arr(state.settlements).find(x=>x.settlementId===settlementId):null,tech=technologyProfile(state),inst=institutionProfile(state),morph=cityMorphology(state),selectedMorph=s?morph.settlements.find(x=>x.settlementId===settlementId):null;
  return freeze({supported:true,scope:settlementId?'SETTLEMENT':'CIVILIZATION',settlementId,technologyPrerequisites:tech,institutions:settlementId?inst.institutions.filter(x=>x.settlementIds.includes(settlementId)):inst.institutions,morphology:selectedMorph||null,uncertainty:freeze({authorityBoundary:'MODEL_DERIVED_SIMULATION_PLUS_PRESENTATION_ONLY',limitations:LIMITATIONS,scenarioProbabilityClaim:false,empiricalForecastClaim:false,canonicalHistoryClaim:false}),authority:AUTHORITY.DERIVED});
}

O.v2x09CivilizationMorphology=Object.freeze({cityMorphology,cityRenderPlan,inspector});
})(typeof globalThis!=='undefined'?globalThis:this);
