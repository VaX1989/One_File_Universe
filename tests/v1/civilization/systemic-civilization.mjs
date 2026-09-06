import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

globalThis.OFU={};
for(const f of [
 'src/kernel/sha256.js','src/extensions/contracts.js','src/domains/v1/common.js','src/domains/v1/civilization.js',
 'src/domains/v1/society/population.js','src/domains/v1/history/system.js','src/domains/v1/civilization/foundation.js',
 'src/domains/v1/civilization/economy-culture.js','src/domains/v1/civilization/politics-conflict.js','src/domains/v1/civilization/runtime.js'
]) vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});

const O=globalThis.OFU,C=O.v1Civilization,R=O.v1CivilizationRuntime,P=O.v1SocietyPopulation,H=O.v1HistorySystem;
let cases=0;const check=(x,m)=>{assert.ok(x,m);cases++;};
check(typeof C.initialState==='function'&&C.advanced===R,'legacy civilization API retained and advanced runtime attached');
const regions=[
 {regionId:'river-delta',waterPpm:900000,terrainPpm:760000,climatePpm:720000,biologicalResourcePpm:860000,materialResourcePpm:420000,energyAccessPpm:300000,transportPpm:880000,defensePpm:350000,barrierPpm:120000,carryingCapacity:35000},
 {regionId:'upland-pass',waterPpm:430000,terrainPpm:520000,climatePpm:600000,biologicalResourcePpm:410000,materialResourcePpm:900000,energyAccessPpm:650000,transportPpm:540000,defensePpm:880000,barrierPpm:480000,carryingCapacity:18000},
 {regionId:'coastal-shelf',waterPpm:820000,terrainPpm:680000,climatePpm:790000,biologicalResourcePpm:720000,materialResourcePpm:500000,energyAccessPpm:500000,transportPpm:920000,defensePpm:460000,barrierPpm:100000,carryingCapacity:30000}
];
const gate=R.eligibility({lineageId:'lineage-1',intelligenceModelEligible:true,population:62000,energySurplusPpm:500000,environmentStabilityPpm:650000});
const a=R.initialize({worldIdentity:'world-1',lineageId:'lineage-1',population:62000,eligibility:gate,regions}),b=R.initialize({worldIdentity:'world-1',lineageId:'lineage-1',population:62000,eligibility:gate,regions});
check(JSON.stringify(a)===JSON.stringify(b),'initial state deterministic');
check(a.population.totalPopulation===62000&&a.settlements.reduce((n,s)=>n+s.population,0)===62000,'population conserved into settlements');
check(a.settlements.length<=48&&a.population.groups.length<=96&&a.polities.length<=64&&a.factions.length<=256,'entity counts bounded');
check(a.resources.length>0&&a.resources.every(r=>r.authority==='MODEL_DERIVED_SIMULATION'),'fallback resources remain model-derived');
check(a.tradeEdges.length<=96&&a.networkMetrics.length===a.settlements.length,'trade graph and centrality/isolation metrics bounded');
check(a.history.proposals.every(e=>e.requiresP4Admission&&e.canonical===false),'all deep history remains P4-gated proposal state');
const noGate=R.eligibility({lineageId:'lineage-x',intelligenceModelEligible:false,population:62000,energySurplusPpm:500000,environmentStabilityPpm:650000});
check(R.initialize({worldIdentity:'world-1',lineageId:'lineage-x',population:62000,eligibility:noGate,regions}).state==='NO_CIVILIZATION_MODEL','no civilization without eligible lineage');
const isolatedRegions=regions.map((r,i)=>({...r,regionId:'isolated-'+i,transportPpm:0,barrierPpm:1000000,biologicalResourcePpm:150000,materialResourcePpm:150000,energyAccessPpm:100000}));
const isolated=R.initialize({worldIdentity:'world-isolated',lineageId:'lineage-1',population:12000,eligibility:R.eligibility({lineageId:'lineage-1',intelligenceModelEligible:true,population:12000,energySurplusPpm:300000,environmentStabilityPpm:500000}),regions:isolatedRegions});
check(isolated.tradeEdges.length===0&&isolated.networkMetrics.every(m=>m.isolationPpm===1000000),'impassable geography remains isolated');
const s1=R.step(a,{epochStep:5,climatePressurePpm:120000,diseasePressurePpm:30000}),s2=R.step(a,{epochStep:5,climatePressurePpm:120000,diseasePressurePpm:30000});
check(JSON.stringify(s1)===JSON.stringify(s2),'civilization step deterministic');
check(s1.resources.every(r=>r.amountUnits>=0&&r.amountUnits<=r.initialAmountUnits),'resource depletion/regeneration bounded');
check(s1.settlements.every(s=>s.storageCapacityUnits>0&&s.scarcityPpm>=0&&s.scarcityPpm<=1000000),'storage and scarcity explicit');
check(s1.cultures.every(c=>c.languageFamilyId&&c.syncretismPpm>=0&&c.preservationPpm>=0&&c.lossRiskPpm>=0),'culture tracks language, diffusion, preservation and loss');
let bounded=P.create({worldIdentity:'demo-world',lineageId:'demo-lineage',totalPopulation:5000,regions:[{regionId:'bounded-region',suitabilityPpm:700000,waterPpm:700000,foodPpm:700000,materialPpm:500000,transportPpm:400000,defensePpm:500000,climateStabilityPpm:700000,carryingCapacity:6000}]});
for(let i=0;i<200;i++)bounded=P.demographicStep(bounded,{epochStep:1});
check(bounded.totalPopulation<12000,'carrying capacity prevents infinite exponential growth');
const pressured=structuredClone(a.population);pressured.groups[0].stressPpm=1000000;pressured.groups[0].cohesionPpm=0;pressured.groups[0].carryingCapacity=Math.max(10,Math.floor(pressured.groups[0].population*.25));
const flows=P.planMigration(pressured,{routeAccess:[{fromRegionId:pressured.groups[0].regionId,toRegionId:pressured.groups[1].regionId,costPpm:0}]}),moved=P.applyMigration(pressured,flows);
check(flows.length>0&&moved.totalPopulation===pressured.totalPopulation,'migration responds to pressure and conserves population');
const fragmented=structuredClone(a);fragmented.polities[0].legitimacyPpm=0;fragmented.polities[0].cohesionPpm=0;
const fragmentedNext=R.step(fragmented,{epochStep:1,climatePressurePpm:300000});
check(fragmentedNext.history.proposals.some(e=>e.type==='FRAGMENTATION'),'polity fragmentation leaves history');
check(fragmentedNext.settlements.every(s=>!s.polityId||fragmentedNext.polities.some(p=>p.polityId===s.polityId&&p.settlementIds.includes(s.settlementId))),'settlement polity pointers stay coherent');
const war=structuredClone(a);for(const r of war.regions){r.transportPpm=0;r.barrierPpm=1000000;}for(const r of war.resources)r.amountUnits=0;for(const s of war.settlements){s.stocks.SUBSISTENCE_GOODS=0;s.stocks.MATERIAL_GOODS=0;s.stocks.ENERGY_SERVICE=0;}if(war.polities.length>=2)for(const p of war.polities){p.legitimacyPpm=900000;p.cohesionPpm=900000;p.territoryRegionIds=['contested'];}
const warNext=R.step(war,{epochStep:1,climatePressurePpm:1000000,diseasePressurePpm:100000});
check(warNext.history.proposals.some(e=>e.type==='CONFLICT'),'scarcity plus territorial tension can produce deterministic conflict');
check(warNext.settlements.some(s=>s.conflictStressPpm>0),'conflict changes population/infrastructure/stocks');
const collapsed=structuredClone(a);collapsed.peakPopulation=200000;collapsed.phase='ESTABLISHED';
const collapsedNext=R.step(collapsed,{epochStep:1,climatePressurePpm:250000});
check(collapsedNext.phase==='COLLAPSED'&&collapsedNext.history.proposals.some(e=>e.type==='COLLAPSE'),'collapse leaves explicit state/history');
const recovering=structuredClone(a);recovering.peakPopulation=80000;recovering.phase='COLLAPSED';
const recoveryNext=R.step(recovering,{epochStep:1});
check(recoveryNext.phase==='RECOVERING'&&recoveryNext.history.proposals.some(e=>e.type==='RECOVERY'),'recovery leaves explicit state/history');
const q=R.settlementSummary(s1,s1.settlements[0].settlementId),rf=R.resourceFlows(s1,s1.settlements[0].settlementId),visible=R.explorerSummary(s1,{settlementId:s1.settlements[0].settlementId});
check(q&&q.polity&&Array.isArray(q.history),'settlement query exposes polity/history');
check(rf.localResources.length>0&&Array.isArray(rf.tradeEdges),'resource query exposes chains/flows');
check(visible.scope==='SETTLEMENT'&&Number.isInteger(visible.ruinCount),'renderer/explorer summary bounded');
const synthetic=H.proposal({worldIdentity:'world-1',lineageId:'lineage-1',epoch:7,type:'CONFLICT',targetIds:[a.settlements[0].settlementId],payload:{intensityPpm:900000},causes:[]}),arch=H.archaeologicalEvidence(H.append(a.history,[synthetic]),{settlements:a.settlements,infrastructure:a.infrastructure});
check(arch.features.some(x=>x.sourceEventProposalId===synthetic.eventProposalId),'archaeology causally references history identity');
check(R.compareTimes(a,s1).toEpoch===5,'time-difference query exposes historical change');
console.log(JSON.stringify({status:'PASS',cases,settlements:a.settlements.length,tradeEdges:a.tradeEdges.length,history:s1.history.proposals.length,version:R.VERSION}));
