(function(root){
'use strict';
const O=root.OFU=root.OFU||{},K=O.v2x09CivilizationCore,I=O.v2x09CivilizationEconomyInit;if(!K||!I)throw new Error('V2X-09 core/economy init required');
const {VERSION,ECONOMY_CONTRACT,IMPACT_CONTRACT,AUTHORITY,LIMITS,GOODS,LIMITATIONS,freeze,text,int,clamp,arr,sortId,validateCivilization,techLevel,deriveId}=K;
const {initializeEconomy,cloneStocks}=I;
function stepEconomy(state,economy,{epochStep=1}={}){
  if(!validateCivilization(state))return initializeEconomy(state);
  if(!economy||economy.status!=='READY')economy=initializeEconomy(state);
  epochStep=clamp(epochStep,1,100);
  let operations=0;
  const resources=economy.resources.map(r=>({...r})),byResourceRegion=new Map();
  for(const r of resources){if(!byResourceRegion.has(r.regionId))byResourceRegion.set(r.regionId,[]);byResourceRegion.get(r.regionId).push(r)}
  const settlementRows=economy.settlements.map(s=>({...s,stocks:cloneStocks(s)})),bySettlement=new Map(settlementRows.map(s=>[s.settlementId,s]));
  const tx=new Map(settlementRows.map(s=>[s.settlementId,Object.fromEntries(GOODS.map(g=>[g,{start:s.stocks[g],produced:0,inbound:0,consumed:0,outbound:0,end:0,unmetDemand:0}]))]));
  const resourceClosure=[];
  const tech=economy.technology;
  const productionLevel=techLevel(state.technology,'production'),materialsLevel=techLevel(state.technology,'materials'),energyLevel=techLevel(state.technology,'energy');
  for(const r of resources){
    const start=r.amountUnits,regenPotential=r.depletable?Math.floor(r.initialAmountUnits*r.regenerationPpm*epochStep/1000000):0;
    if(r.depletable)r.amountUnits=Math.min(r.initialAmountUnits,r.amountUnits+regenPotential);
    const regen=r.depletable?r.amountUnits-start:0;
    let depletableExtraction=0,renewableThroughput=0;
    const consumers=settlementRows.filter(s=>s.status==='ACTIVE'&&s.regionId===r.regionId).sort((a,b)=>a.settlementId.localeCompare(b.settlementId));
    for(const s of consumers){
      const facilityNeeded=r.good==='SUBSISTENCE_GOODS'?'PROVISIONING':r.good==='MATERIAL_GOODS'?'MATERIAL_TRANSFORMATION':'ENERGY_SERVICE_CAPTURE';
      if(!s.facilities.some(f=>f.kind===facilityNeeded))continue;
      const level=r.good==='MATERIAL_GOODS'?materialsLevel:r.good==='ENERGY_SERVICE'?energyLevel:productionLevel;
      const cap=Math.max(0,Math.floor(s.population*(24+productionLevel*7+level*5)*r.availabilityPpm*epochStep/1000000));
      const extracted=r.depletable?Math.min(r.amountUnits,cap):cap;
      if(r.depletable){r.amountUnits-=extracted;depletableExtraction+=extracted}else renewableThroughput+=extracted;
      const efficiency=clamp(420000+productionLevel*45000+level*35000,100000,920000),output=Math.floor(extracted*efficiency/1000000);
      s.stocks[r.good]+=output;tx.get(s.settlementId)[r.good].produced+=output;operations+=3;
      if(operations>LIMITS.operationsPerStep)throw new RangeError('V2X-09 operation bound exceeded');
    }
    resourceClosure.push(freeze({resourceId:r.resourceId,depletable:r.depletable,startUnits:start,regeneratedUnits:regen,depletableExtractionUnits:depletableExtraction,renewableThroughputUnits:renewableThroughput,endUnits:r.amountUnits,closed:r.depletable?(start+regen-depletableExtraction===r.amountUnits):start===r.amountUnits}));
  }
  const demandRates={SUBSISTENCE_GOODS:1000,MATERIAL_GOODS:55,ENERGY_SERVICE:180};
  for(const s of settlementRows){if(s.status!=='ACTIVE')continue;for(const g of GOODS){const demand=Math.floor(s.population*demandRates[g]*epochStep/1000),take=Math.min(s.stocks[g],demand);s.stocks[g]-=take;tx.get(s.settlementId)[g].consumed+=take;tx.get(s.settlementId)[g].unmetDemand+=demand-take;operations+=2}}
  const edges=sortId(arr(state.tradeEdges).filter(e=>bySettlement.has(e.from)&&bySettlement.has(e.to)&&text(e.status||'ACTIVE').toUpperCase()==='ACTIVE'),'edgeId');
  const routeEnabled=tech.activeCapabilities.includes('ROUTE_LOGISTICS');
  if(routeEnabled){
    for(const e of edges){
      const a=bySettlement.get(e.from),b=bySettlement.get(e.to);if(!a||!b||a.status!=='ACTIVE'||b.status!=='ACTIVE')continue;
      const edgeCap=Math.max(0,Math.floor(Math.max(0,int(e.flowUnits))*epochStep*(1000000-clamp(e.costPpm||0))/1000000));
      for(const g of GOODS){
        const ta=tx.get(a.settlementId)[g],tb=tx.get(b.settlementId)[g],needA=ta.unmetDemand,needB=tb.unmetDemand;
        let from,to,fromTx,toTx,need;if(needA>needB){from=b;to=a;fromTx=tb;toTx=ta;need=needA}else if(needB>needA){from=a;to=b;fromTx=ta;toTx=tb;need=needB}else continue;
        const reserve=Math.floor(from.population*(g==='SUBSISTENCE_GOODS'?0.5:0.08)),surplus=Math.max(0,from.stocks[g]-reserve),amount=Math.min(edgeCap,surplus,need);
        if(amount>0){from.stocks[g]-=amount;to.stocks[g]+=amount;fromTx.outbound+=amount;toTx.inbound+=amount;toTx.unmetDemand=Math.max(0,toTx.unmetDemand-amount);operations+=4}
      }
    }
  }
  const settlementClosure=[];
  for(const s of settlementRows){for(const g of GOODS){const t=tx.get(s.settlementId)[g];t.end=s.stocks[g];const closed=t.start+t.produced+t.inbound-t.consumed-t.outbound===t.end;settlementClosure.push(freeze({settlementId:s.settlementId,good:g,...t,closed}))}}
  const nextSettlements=settlementRows.map(s=>freeze({...s,stocks:freeze(s.stocks)}));
  const impacts=environmentImpactProposals(state,{resources,settlements:nextSettlements,resourceClosure,settlementClosure,technology:tech});
  return freeze({contract:ECONOMY_CONTRACT,version:VERSION,status:'STEPPED',epoch:economy.epoch+epochStep,worldIdentity:economy.worldIdentity,lineageId:economy.lineageId,resources:resources.map(freeze),settlements:nextSettlements,technology:tech,authority:AUTHORITY.MODEL_DERIVED_SIMULATION,bounded:true,limits:LIMITS,operations,closure:freeze({resource:resourceClosure,settlementGoods:settlementClosure,allClosed:resourceClosure.every(x=>x.closed)&&settlementClosure.every(x=>x.closed),physicalMassConservationClaim:false,accountingUnitClosure:true}),impactProposals:impacts,limitations:LIMITATIONS});
}
function environmentImpactProposals(state,economy){
  if(!state||state.state!=='MODELED_CIVILIZATION')return freeze([]);
  const byRegion=new Map();for(const s of economy.settlements||[]){if(!byRegion.has(s.regionId))byRegion.set(s.regionId,[]);byRegion.get(s.regionId).push(s)}
  const extractedByRegion=new Map();for(const rc of economy.resourceClosure||[]){const source=(economy.resources||[]).find(r=>r.resourceId===rc.resourceId);if(!source)continue;extractedByRegion.set(source.regionId,(extractedByRegion.get(source.regionId)||0)+rc.depletableExtractionUnits+rc.renewableThroughputUnits)}
  const proposals=[];
  for(const [regionId,settlements] of [...byRegion.entries()].sort((a,b)=>a[0].localeCompare(b[0]))){
    const population=settlements.reduce((n,s)=>n+s.population,0),extraction=extractedByRegion.get(regionId)||0,region=arr(state.regions).find(r=>r.regionId===regionId)||{};
    const extractionPressurePpm=clamp(Math.floor(extraction*1000000/Math.max(1,extraction+population*8))),landUsePressurePpm=clamp(Math.floor(settlements.reduce((n,s)=>n+clamp((arr(state.settlements).find(x=>x.settlementId===s.settlementId)?.infrastructurePpm)||0),0)/Math.max(1,settlements.length))),wasteProxyPpm=clamp(Math.floor((techLevel(state.technology,'production')+techLevel(state.technology,'materials')+techLevel(state.technology,'energy'))*55000+population/10)),sensitivityPpm=clamp(1000000-Math.floor((clamp(region.biologicalResourcePpm||0)+clamp(region.waterPpm||0))/2));
    proposals.push(freeze({contract:IMPACT_CONTRACT,proposalId:deriveId('impact',state.worldIdentity,regionId,economy.epoch),regionId,sourceSettlementIds:settlements.map(s=>s.settlementId).sort(),modeledEpoch:economy.epoch,extractionPressurePpm,landUsePressurePpm,wasteProxyPpm,environmentSensitivityPpm:sensitivityPpm,authority:AUTHORITY.MODEL_DERIVED_SIMULATION,mutationPerformed:false,requiresDomainOwnerReconciliation:true,canonicalEventAdmissionRequested:false,canonicalPlanetMutation:false,canonicalLifeMutation:false}));
    if(proposals.length>=LIMITS.impactProposals)break;
  }
  return freeze(proposals);
}

O.v2x09CivilizationEconomyStep=Object.freeze({stepEconomy,environmentImpactProposals});
})(typeof globalThis!=='undefined'?globalThis:this);
