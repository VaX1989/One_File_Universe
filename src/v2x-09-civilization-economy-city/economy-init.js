(function(root){
'use strict';
const O=root.OFU=root.OFU||{},K=O.v2x09CivilizationCore;if(!K)throw new Error('V2X-09 core required');
const {VERSION,LIMITS,AUTHORITY,freeze,text,int,clamp,arr,sortId,sourceAuthority,validateCivilization,technologyProfile,goodForResource,tradeDegree,deriveId,GOODS,ECONOMY_CONTRACT,LIMITATIONS}=K;
function facilitySet(state,s,resources,tech){
  if(text(s.status).toUpperCase()!=='ACTIVE')return [];
  const local=resources.filter(r=>r.regionId===s.regionId),goods=new Set(local.map(r=>r.good));
  const facilities=[];
  const add=(kind,basis)=>{if(facilities.length<LIMITS.facilitiesPerSettlement)facilities.push(freeze({facilityId:deriveId('facility',s.settlementId,kind),kind,basis,authority:AUTHORITY.MODEL_DERIVED_SIMULATION}))};
  if(goods.has('SUBSISTENCE_GOODS'))add('PROVISIONING','LOCAL_SUBSISTENCE_RESOURCE');
  if(goods.has('MATERIAL_GOODS'))add('MATERIAL_TRANSFORMATION','LOCAL_MATERIAL_RESOURCE');
  if(goods.has('ENERGY_SERVICE'))add('ENERGY_SERVICE_CAPTURE','LOCAL_ENERGY_RESOURCE');
  if(tech.activeCapabilities.includes('BULK_STORAGE'))add('STORAGE','TECH:BULK_STORAGE');
  if(tradeDegree(state,s.settlementId)>0&&tech.activeCapabilities.includes('ROUTE_LOGISTICS'))add('LOGISTICS','TRADE_EDGE_AND_TECH');
  if(tech.activeCapabilities.includes('PUBLIC_WORKS'))add('PUBLIC_WORKS','TECH:PUBLIC_WORKS');
  if(tech.activeCapabilities.includes('CENTRAL_RECORDS'))add('ADMINISTRATION','TECH:CENTRAL_RECORDS');
  return facilities;
}
function initializeEconomy(state){
  if(!validateCivilization(state))return freeze({contract:ECONOMY_CONTRACT,status:'NO_MODELED_CIVILIZATION',authority:AUTHORITY.MODEL_DERIVED_SIMULATION,bounded:true,limitations:LIMITATIONS});
  const tech=technologyProfile(state);
  const resources=sortId(arr(state.resources).map((r,i)=>freeze({resourceId:text(r.resourceId||deriveId('resource',r.regionId,i)),regionId:text(r.regionId),good:goodForResource(r),amountUnits:Math.max(0,int(r.amountUnits)),initialAmountUnits:Math.max(0,int(r.initialAmountUnits??r.amountUnits)),availabilityPpm:clamp(r.availabilityPpm??500000),regenerationPpm:clamp(r.regenerationPpm||0),depletable:r.depletable!==false,sourceAuthority:sourceAuthority(r)})),'resourceId');
  const settlements=sortId(arr(state.settlements).map(s=>{
    const stocks={};for(const g of GOODS)stocks[g]=Math.max(0,int(s?.stocks?.[g]||0));
    return freeze({settlementId:text(s.settlementId),regionId:text(s.regionId),status:text(s.status||'UNKNOWN').toUpperCase(),population:Math.max(0,int(s.population)),storageCapacityUnits:Math.max(1,int(s.storageCapacityUnits||Math.max(1000,int(s.population)*6))),stocks:freeze(stocks),facilities:facilitySet(state,s,resources,tech),sourceAuthority:sourceAuthority(s)});
  }),'settlementId');
  return freeze({contract:ECONOMY_CONTRACT,version:VERSION,status:'READY',epoch:int(state.epoch||0),worldIdentity:text(state.worldIdentity||''),lineageId:text(state.lineageId||''),resources,settlements,technology:tech,authority:AUTHORITY.MODEL_DERIVED_SIMULATION,bounded:true,limits:LIMITS,limitations:LIMITATIONS});
}
function cloneStocks(s){const out={};for(const g of GOODS)out[g]=Math.max(0,int(s?.stocks?.[g]||0));return out}

O.v2x09CivilizationEconomyInit=Object.freeze({facilitySet,initializeEconomy,cloneStocks});
})(typeof globalThis!=='undefined'?globalThis:this);
