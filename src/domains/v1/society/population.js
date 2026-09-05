(function(root){
'use strict';
const O=root.OFU=root.OFU||{},V=O.v1Common;if(!V)throw new Error('v1 common required');
const VERSION='ofu-v1-society-population-2';
const AUTH=V.authority('v1.society.population','1.0.0',[],'Bounded deterministic population and migration scenario model for an explicitly eligible modeled intelligent lineage.',[
 'Demographic rates are scenario proxies rather than universal demographic laws.',
 'Disease pressure is an abstract stress channel and does not assert Earth-like pathogens.'
]);
const MAX_GROUPS=V.MAX.populations;
function regionInput(r,i){
 V.text(r.regionId||('region-'+i),'regionId',128);
 for(const k of ['suitabilityPpm','waterPpm','foodPpm','materialPpm','transportPpm','defensePpm','climateStabilityPpm'])V.ppm(r[k]??500000,k);
 V.int(r.carryingCapacity??1000,'carryingCapacity',1,1000000000);
 return Object.freeze({regionId:r.regionId||('region-'+i),suitabilityPpm:r.suitabilityPpm??500000,waterPpm:r.waterPpm??500000,foodPpm:r.foodPpm??500000,materialPpm:r.materialPpm??500000,transportPpm:r.transportPpm??500000,defensePpm:r.defensePpm??500000,climateStabilityPpm:r.climateStabilityPpm??500000,carryingCapacity:r.carryingCapacity??1000});
}
function create({worldIdentity,lineageId,totalPopulation,regions}){
 V.text(worldIdentity,'worldIdentity',128);V.text(lineageId,'lineageId',128);V.int(totalPopulation,'totalPopulation',1,1000000000);V.boundedArray(regions,48,'regions');V.assert(regions.length>0,'regions');
 const rs=regions.map(regionInput),weights=rs.map((r,i)=>Math.max(1,Math.floor(r.carryingCapacity*(200000+r.suitabilityPpm)/1200000)+(V.u32(VERSION,worldIdentity,lineageId,'region-weight',i)%97))),alloc=V.partition(totalPopulation,weights),groups=[];
 for(let i=0;i<rs.length&&groups.length<MAX_GROUPS;i++)if(alloc[i]>0){const r=rs[i],groupId=V.deriveId('population-group',lineageId,r.regionId,0);groups.push(Object.freeze({groupId,lineageId,regionId:r.regionId,population:alloc[i],carryingCapacity:r.carryingCapacity,fertilityPpm:22000+(V.unitPpm(VERSION,groupId,'fertility')%26001),mortalityPpm:12000+(V.unitPpm(VERSION,groupId,'mortality')%22001),cohesionPpm:300000+(V.unitPpm(VERSION,groupId,'cohesion')%600001),stressPpm:V.clamp(600000-r.suitabilityPpm,0,850000),diseasePressurePpm:0,generation:0,status:'ACTIVE'}));}
 return V.freezeDeep({worldIdentity,lineageId,totalPopulation,groups,regions:rs,generation:0,authority:AUTH,provenance:V.provenance('v1.society.population','1.0.0',[])});
}
function demographicStep(state,{epochStep=1,climateStressPpm=0,diseasePressurePpm=0}={}){
 V.int(epochStep,'epochStep',1,1000);V.ppm(climateStressPpm,'climateStressPpm');V.ppm(diseasePressurePpm,'diseasePressurePpm');
 const generation=state.generation+epochStep,next=[];let total=0;
 for(const g of state.groups){if(g.status!=='ACTIVE'){next.push(g);continue;}const cap=Math.max(1,g.carryingCapacity),densityPpm=V.clamp(Math.floor(g.population*1000000/cap),0,2000000),crowdingPpm=V.clamp(densityPpm-650000,0,1000000),stressPpm=V.clamp(g.stressPpm+Math.floor(climateStressPpm*.45)+Math.floor(crowdingPpm*.35),0,1000000),diseasePpm=V.clamp(diseasePressurePpm+Math.floor(crowdingPpm*.25),0,1000000),births=Math.floor(g.population*g.fertilityPpm*epochStep/1000000),baseDeaths=Math.floor(g.population*g.mortalityPpm*epochStep/1000000),stressDeaths=Math.floor(g.population*(Math.floor(stressPpm/32)+Math.floor(diseasePpm/24))*epochStep/1000000),overshoot=Math.max(0,g.population-cap),overshootDeaths=Math.floor(overshoot*Math.min(epochStep,10)/12),population=Math.max(0,g.population+births-baseDeaths-stressDeaths-overshootDeaths),status=population<8?'EXTINCT':'ACTIVE',cohesionPpm=V.clamp(g.cohesionPpm-Math.floor(stressPpm/80)+Math.floor(V.signedPpm(VERSION,g.groupId,generation,'cohesion')/250),0,1000000),n=Object.freeze({...g,population,stressPpm,diseasePressurePpm:diseasePpm,cohesionPpm,generation,status});next.push(n);total+=population;}
 return V.freezeDeep({...state,totalPopulation:total,groups:next,generation,authority:AUTH});
}
function migrationPressure(group){const density=V.clamp(Math.floor(group.population*1000000/Math.max(1,group.carryingCapacity)),0,2000000);return V.clamp(Math.floor(group.stressPpm*.55)+Math.floor(Math.max(0,density-700000)*.45)+(1000000-group.cohesionPpm)/8,0,1000000);}
function planMigration(state,{routeAccess=[]}={}){
 V.boundedArray(routeAccess,256,'routeAccess');const active=state.groups.filter(g=>g.status==='ACTIVE'),byId=new Map(state.regions.map(r=>[r.regionId,r])),flows=[];
 for(const from of active){const pressure=migrationPressure(from);if(pressure<180000||from.population<40)continue;let best=null;for(const to of active){if(to.groupId===from.groupId)continue;const r=byId.get(to.regionId),density=Math.floor(to.population*1000000/Math.max(1,to.carryingCapacity)),route=routeAccess.find(e=>(e.fromRegionId===from.regionId&&e.toRegionId===to.regionId)||(e.toRegionId===from.regionId&&e.fromRegionId===to.regionId)),access=route?V.clamp(1000000-(route.costPpm??500000),0,1000000):Math.floor((r?.transportPpm??400000)*.5),pull=V.clamp((r?.suitabilityPpm??500000)+access-Math.floor(density*.4),0,1800000),score=pull+V.unitPpm(VERSION,from.groupId,to.groupId,state.generation,'migration-tie')/100;if(!best||score>best.score)best={to,score};}
  if(best&&best.score>300000){const people=Math.max(1,Math.min(Math.floor(from.population*.12),Math.floor(from.population*pressure/9000000)));flows.push(Object.freeze({flowId:V.deriveId('migration-flow',from.groupId,best.to.groupId,state.generation),fromGroupId:from.groupId,toGroupId:best.to.groupId,people,pressurePpm:pressure}));}
 }
 return Object.freeze(flows.slice(0,MAX_GROUPS));
}
function applyMigration(state,flows){V.boundedArray(flows,MAX_GROUPS,'flows');const delta=new Map();for(const f of flows){delta.set(f.fromGroupId,(delta.get(f.fromGroupId)||0)-f.people);delta.set(f.toGroupId,(delta.get(f.toGroupId)||0)+f.people);}const groups=state.groups.map(g=>Object.freeze({...g,population:Math.max(0,g.population+(delta.get(g.groupId)||0)),status:g.population+(delta.get(g.groupId)||0)<8?'EXTINCT':'ACTIVE'}));return V.freezeDeep({...state,totalPopulation:groups.reduce((n,g)=>n+g.population,0),groups,authority:AUTH});}
function fragmentAndMerge(state){let groups=[...state.groups],changed=[];for(const g of [...groups]){if(groups.length>=MAX_GROUPS||g.status!=='ACTIVE'||g.population<1200||g.cohesionPpm>=180000)continue;const split=Math.max(100,Math.floor(g.population*(180000+(V.unitPpm(VERSION,g.groupId,state.generation,'split-share')%220001))/1000000)),childId=V.deriveId('population-group',g.groupId,state.generation,'fragment'),idx=groups.findIndex(x=>x.groupId===g.groupId);groups[idx]=Object.freeze({...g,population:g.population-split,cohesionPpm:V.clamp(g.cohesionPpm+90000,0,1000000)});groups.push(Object.freeze({...g,groupId:childId,population:split,cohesionPpm:260000+(V.unitPpm(VERSION,childId,'cohesion')%420001),parentGroupId:g.groupId}));changed.push(Object.freeze({type:'FRAGMENT',parentGroupId:g.groupId,childGroupId:childId,population:split}));}
 groups=groups.sort((a,b)=>a.groupId.localeCompare(b.groupId));for(let i=0;i<groups.length-1;i++){const a=groups[i],b=groups[i+1];if(a.status!=='ACTIVE'||b.status!=='ACTIVE'||a.regionId!==b.regionId||a.lineageId!==b.lineageId||a.population+b.population>900)continue;const mergedId=V.deriveId('population-group',a.lineageId,a.regionId,a.groupId,b.groupId,'merge'),merged=Object.freeze({...a,groupId:mergedId,population:a.population+b.population,cohesionPpm:Math.floor((a.cohesionPpm+b.cohesionPpm)/2),mergedFrom:Object.freeze([a.groupId,b.groupId])});groups.splice(i,2,merged);changed.push(Object.freeze({type:'MERGE',groupIds:Object.freeze([a.groupId,b.groupId]),mergedGroupId:mergedId,population:merged.population}));break;}
 return V.freezeDeep({...state,totalPopulation:groups.reduce((n,g)=>n+g.population,0),groups:groups.slice(0,MAX_GROUPS),transitions:changed,authority:AUTH});
}
O.v1SocietyPopulation=Object.freeze({VERSION,AUTHORITY:AUTH,MAX_GROUPS,create,demographicStep,migrationPressure,planMigration,applyMigration,fragmentAndMerge});
})(globalThis);
