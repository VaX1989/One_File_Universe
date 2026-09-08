import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const context=vm.createContext({console});
for(const name of ['core.js','economy-init.js','economy-step.js','institutions.js','morphology.js','production-network.js','society-dynamics.js','urban-evolution.js','advanced.js','index.js']){
  const source=fs.readFileSync(new URL('../../src/v2x-09-civilization-economy-city/'+name,import.meta.url),'utf8');
  vm.runInContext(source,context,{filename:'v2x09-'+name});
}
const API=context.OFU.v2x09CivilizationEconomyCity;
let cases=0;
const check=(value,message)=>{assert.ok(value,message);cases++;};
const eq=(a,b,message)=>{assert.deepEqual(a,b,message);cases++;};

function fixture({abandoned=false,lowTech=false,dry=false}={}){
  const settlements=[
    {settlementId:'delta-city',regionId:'delta',status:abandoned?'ABANDONED':'ACTIVE',population:abandoned?0:26000,storageCapacityUnits:240000,infrastructurePpm:720000,stocks:{SUBSISTENCE_GOODS:34000,MATERIAL_GOODS:16000,ENERGY_SERVICE:9000},polityId:'polity-a',authority:'MODEL_DERIVED_SIMULATION'},
    {settlementId:'ridge-town',regionId:'ridge',status:'ACTIVE',population:6200,storageCapacityUnits:70000,infrastructurePpm:410000,stocks:{SUBSISTENCE_GOODS:3000,MATERIAL_GOODS:18000,ENERGY_SERVICE:2200},polityId:'polity-a',authority:'MODEL_DERIVED_SIMULATION'},
    {settlementId:'harbor-village',regionId:'delta',status:'ACTIVE',population:1800,storageCapacityUnits:24000,infrastructurePpm:320000,stocks:{SUBSISTENCE_GOODS:1200,MATERIAL_GOODS:900,ENERGY_SERVICE:700},polityId:'polity-b',authority:'MODEL_DERIVED_SIMULATION'}
  ];
  const resources=[
    {resourceId:'delta-food',regionId:'delta',resourceClass:'BIOMASS_OR_ANALOGUE',transformsTo:'SUBSISTENCE_GOODS',amountUnits:240000,initialAmountUnits:240000,availabilityPpm:820000,regenerationPpm:15000,depletable:true,authority:'MODEL_DERIVED_SIMULATION'},
    {resourceId:'delta-energy',regionId:'delta',resourceClass:'ACCESSIBLE_ENERGY_GRADIENT',transformsTo:'ENERGY_SERVICE',amountUnits:180000,initialAmountUnits:180000,availabilityPpm:690000,regenerationPpm:0,depletable:false,authority:'MODEL_DERIVED_SIMULATION'},
    {resourceId:'ridge-material',regionId:'ridge',resourceClass:'MINERAL_OR_CONSTRUCTION_MATERIAL',transformsTo:'MATERIAL_GOODS',amountUnits:330000,initialAmountUnits:330000,availabilityPpm:910000,regenerationPpm:0,depletable:true,authority:'MODEL_DERIVED_SIMULATION'}
  ];
  return {
    state:'MODELED_CIVILIZATION',worldIdentity:'world-1',lineageId:'lineage-1',epoch:20,
    regions:[
      {regionId:'delta',waterPpm:dry?120000:860000,biologicalResourcePpm:830000,materialResourcePpm:420000,transportPpm:900000,barrierPpm:80000},
      {regionId:'ridge',waterPpm:240000,biologicalResourcePpm:280000,materialResourcePpm:920000,transportPpm:520000,barrierPpm:460000}
    ],
    settlements,resources,
    tradeEdges:[
      {edgeId:'edge-1',from:'delta-city',to:'ridge-town',costPpm:220000,flowUnits:1200,status:'ACTIVE'},
      {edgeId:'edge-2',from:'delta-city',to:'harbor-village',costPpm:120000,flowUnits:900,status:'ACTIVE'}
    ],
    technology:lowTech?{production:1,transport:0,materials:1,energy:1,communication:0,medicine:0,construction:1,conflict:0,knowledgeContinuityPpm:210000}:{production:4,transport:3,materials:3,energy:3,communication:3,medicine:2,construction:4,conflict:1,knowledgeContinuityPpm:620000},
    polities:[
      {polityId:'polity-a',institutionId:'inst-a',settlementIds:['delta-city','ridge-town'],authorityPpm:720000,legitimacyPpm:690000,cohesionPpm:640000,status:'ACTIVE'},
      {polityId:'polity-b',institutionId:'inst-b',settlementIds:['harbor-village'],authorityPpm:360000,legitimacyPpm:520000,cohesionPpm:560000,status:'ACTIVE'}
    ],
    factions:[{factionId:'f-1',polityId:'polity-a',status:'ACTIVE'}],
    relations:[{relationId:'rel-1',aPolityId:'polity-a',bPolityId:'polity-b',kind:'COOPERATION'}],
    infrastructure:[
      {infrastructureId:'road-1',kind:'MAJOR_CORRIDOR',fromSettlementId:'delta-city',toSettlementId:'ridge-town',status:'ACTIVE',conditionPpm:900000,builtEpoch:10,lastActiveEpoch:20,authority:'MODEL_DERIVED_SIMULATION'},
      {infrastructureId:'road-2',kind:'ROUTE_CORRIDOR',fromSettlementId:'delta-city',toSettlementId:'harbor-village',status:'ACTIVE',conditionPpm:820000,builtEpoch:12,lastActiveEpoch:20,authority:'MODEL_DERIVED_SIMULATION'}
    ],
    history:{proposals:[
      {eventProposalId:'ev-found-delta',epoch:0,type:'SETTLEMENT_FOUNDATION',targetIds:['delta-city']},
      {eventProposalId:'ev-road',epoch:10,type:'INFRASTRUCTURE_BUILT',targetIds:['delta-city','road-1']},
      {eventProposalId:'ev-conflict',epoch:15,type:'CONFLICT',targetIds:['delta-city'],payload:{intensityPpm:700000}},
      ...(abandoned?[{eventProposalId:'ev-abandon',epoch:20,type:'ABANDONMENT',targetIds:['delta-city']}]:[])
    ]},
    authority:'MODEL_DERIVED_SIMULATION'
  };
}

check(API&&API.VERSION==='ofu-v2x-09-civilization-economy-city-1','API/version available');
const state=fixture();
const t=API.technologyProfile(state);
check(t.activeCapabilities.includes('ROUTE_LOGISTICS')&&t.activeCapabilities.includes('WATERBORNE_LOGISTICS'),'technology prerequisite graph activates supported dependent capabilities');
const low=API.technologyProfile(fixture({lowTech:true}));
check(!low.activeCapabilities.includes('ROUTE_LOGISTICS')&&!low.activeCapabilities.includes('WATERBORNE_LOGISTICS'),'technology graph blocks unmet prerequisites');
check(low.nodes.find(x=>x.id==='WATERBORNE_LOGISTICS').missing.length>0,'technology graph exposes missing prerequisites');

const e1=API.initializeEconomy(state),e2=API.initializeEconomy(state);
eq(e1,e2,'economy initialization deterministic');
check(e1.settlements.every(s=>s.facilities.length<=API.LIMITS.facilitiesPerSettlement),'facility materialization bounded');
check(e1.settlements.find(s=>s.settlementId==='delta-city').facilities.some(f=>f.kind==='LOGISTICS'),'logistics facility tied to trade and prerequisite capability');

const s1=API.stepEconomy(state,e1,{epochStep:2}),s2=API.stepEconomy(state,e1,{epochStep:2});
eq(s1,s2,'economy transition deterministic');
check(s1.closure.allClosed,'resource and settlement accounting closure holds');
check(s1.closure.resource.every(x=>x.closed)&&s1.closure.settlementGoods.every(x=>x.closed),'all closure witnesses individually close');
check(s1.resources.every(r=>r.amountUnits>=0),'resources stay non-negative');
check(s1.impactProposals.length>0&&s1.impactProposals.every(p=>p.mutationPerformed===false&&p.requiresDomainOwnerReconciliation===true),'environment feedback is typed proposal-only state');
check(s1.operations<=API.LIMITS.operationsPerStep,'operation count bounded');

const institutions=API.institutionProfile(state);
check(institutions.institutions.length===2,'institution profile preserves bounded polity mechanisms');
check(institutions.institutions.every(x=>x.universalSociologicalClaim===false),'institution proxies disclaim universal sociological claims');
check(institutions.institutions.find(x=>x.polityId==='polity-a').mechanisms.includes('INFRASTRUCTURE_MAINTENANCE'),'institution mechanisms depend on modeled capability');

const morphology=API.cityMorphology(state,{economy:s1});
const delta=morphology.settlements.find(x=>x.settlementId==='delta-city');
check(delta.layoutClass==='DENSE_NETWORKED_CENTER','population and network state shape urban layout class');
check(delta.districts.some(x=>x.kind==='PORT_OR_WATER_TERMINAL'),'port appears only with modeled water/trade/technology support');
check(delta.districts.some(x=>x.kind==='PRODUCTION')&&delta.districts.some(x=>x.kind==='MARKET_AND_STORAGE'),'production and logistics shape visible districts');
check(delta.historicalLayers.some(x=>x.kind==='DAMAGE_OR_STRESS'),'conflict history produces visible historical layer');
check(delta.claims.randomRuins===false&&delta.claims.physicalRoadGeometry===false,'morphology does not invent random ruins or physical roads');
check(delta.lod.human.representation.includes('NOT_BUILDING_SIMULATION'),'human LOD remains descriptor-level, not persistent buildings');
const render=API.cityRenderPlan(state,{settlementId:'delta-city'});
check(render.status==='PROJECTED'&&render.commands.some(x=>x.kind==='DISTRICT_CUE')&&render.commands.some(x=>x.kind==='HISTORY_LAYER_CUE'),'render plan exposes bounded district/history primitives');
check(render.commands.every(x=>x.authority==='PRESENTATION_ONLY')&&render.physicalGeometryClaim===false&&render.requiresConvergenceOwnerComposition===true,'render plan preserves presentation-only and shared-renderer ownership boundaries');

const packet1=API.civilizationEmbodimentPacket(state,s1,{settlementId:'delta-city'}),packet2=API.civilizationEmbodimentPacket(state,s1,{settlementId:'delta-city'});
eq(packet1,packet2,'civilization embodiment packet deterministic');
check(packet1.contract===API.EMBODIMENT_CONTRACT&&packet1.status==='PROJECTED'&&packet1.noLegacyFallback===true&&packet1.legacyCityRenderPlanUsed===false,'V2 embodiment contract projects without legacy cue fallback');
for(const kind of ['SETTLEMENT_EMBODIMENT','DISTRICT_EMBODIMENT','HISTORICAL_STATE_EMBODIMENT','RESOURCE_RELATIONSHIP_EMBODIMENT','ROUTE_NETWORK_EMBODIMENT','INFRASTRUCTURE_EMBODIMENT'])check(packet1.commandKinds.includes(kind),'embodiment includes '+kind);
check(packet1.commands.every(x=>x.authority==='PRESENTATION_ONLY'),'all embodiment commands remain presentation-only');
check(packet1.claims.physicalCityGeometryClaim===false&&packet1.claims.physicalTransportGeometryClaim===false&&packet1.claims.physicalResourceGeometryClaim===false&&packet1.claims.canonicalHistoryClaim===false,'embodiment refuses unsupported physical/canonical claims');
check(packet1.requiresAdvancedComposition===true&&packet1.requiresV2x07PlacementReconciliation===true&&packet1.requiresConvergenceOwnerComposition===true,'embodiment preserves advanced-model, V2X-07 placement and convergence composition boundaries');
check(packet1.commandCount<=packet1.limits.commands&&packet1.operations<=packet1.limits.operations,'embodiment respects hard command and operation budgets');
const settlementBody=packet1.commands.find(x=>x.kind==='SETTLEMENT_EMBODIMENT');
check(settlementBody.visualState==='ACTIVE'&&settlementBody.urbanFamily==='PORT_CLUSTER'&&settlementBody.isolationRiskPpm!==null,'visible settlement body is causally connected to current state, urban model and resilience');
const routeBody=packet1.commands.find(x=>x.kind==='ROUTE_NETWORK_EMBODIMENT'&&x.sourceEdgeId==='edge-1');
check(routeBody&&routeBody.sourceInfrastructureIds.includes('road-1')&&routeBody.physicalPathClaim===false,'route embodiment carries modeled infrastructure witness without inventing a physical path');
const resourceBody=packet1.commands.find(x=>x.kind==='RESOURCE_RELATIONSHIP_EMBODIMENT');
check(resourceBody&&resourceBody.relationship==='SAME_MODELED_REGION_ACCESS'&&resourceBody.physicalResourceGeometryClaim===false,'resource relationship is spatially expressible but not promoted to deposit geometry');
const historicalBody=packet1.commands.find(x=>x.kind==='HISTORICAL_STATE_EMBODIMENT');
check(historicalBody&&historicalBody.canonicalHistoryClaim===false&&historicalBody.physicalArchaeologyClaim===false,'visible historical state retains proposal/presentation authority');
const noFallback=API.civilizationEmbodimentPacket(state,null,{settlementId:'delta-city'});
check(noFallback.status==='ADVANCED_MODEL_REQUIRED'&&noFallback.commands.length===0&&noFallback.noLegacyFallback===true,'adversarial missing-advanced case fails closed instead of silently reverting to v1 schematic cues');

const damagedState=fixture();damagedState.infrastructure[0]={...damagedState.infrastructure[0],status:'DAMAGED',conditionPpm:180000};
const damagedEconomy=API.stepEconomy(damagedState,API.initializeEconomy(damagedState),{epochStep:1});
const damagedPacket=API.civilizationEmbodimentPacket(damagedState,damagedEconomy,{settlementId:'delta-city'});
check(damagedPacket.commands.some(x=>x.kind==='INFRASTRUCTURE_EMBODIMENT'&&x.sourceInfrastructureId==='road-1'&&x.visualState==='DAMAGED'),'modeled damaged infrastructure becomes visibly damaged state');
const abandonedState=fixture({abandoned:true}),abandonedEconomy=API.initializeEconomy(abandonedState),abandonedPacket=API.civilizationEmbodimentPacket(abandonedState,abandonedEconomy,{settlementId:'delta-city'});
check(abandonedPacket.commands.some(x=>x.kind==='SETTLEMENT_EMBODIMENT'&&x.sourceSettlementId==='delta-city'&&x.visualState==='ABANDONED'),'model-supported abandonment becomes visible without random ruin fabrication');

const dryMorph=API.cityMorphology(fixture({dry:true}));
check(!dryMorph.settlements.find(x=>x.settlementId==='delta-city').districts.some(x=>x.kind==='PORT_OR_WATER_TERMINAL'),'port omitted without modeled water support');
const lowMorph=API.cityMorphology(fixture({lowTech:true}));
check(!lowMorph.settlements.find(x=>x.settlementId==='delta-city').districts.some(x=>x.kind==='PRODUCTION'),'advanced production district omitted without prerequisites');
const abandoned=API.cityMorphology(fixture({abandoned:true}));
const ruin=abandoned.settlements.find(x=>x.settlementId==='delta-city');
check(ruin.layoutClass==='ABANDONED_LAYERED'&&ruin.districts.some(x=>x.kind==='RUIN_OR_DAMAGE_LAYER'),'abandoned settlement remains explicit and historically layered');
check(ruin.historicalLayers.some(x=>x.kind==='ABANDONMENT'),'abandonment visual layer is history-backed');

const inspect=API.inspector(state,{settlementId:'delta-city'});
check(inspect.supported&&inspect.uncertainty.scenarioProbabilityClaim===false&&inspect.uncertainty.canonicalHistoryClaim===false,'inspector exposes authority and uncertainty limitations');
check(inspect.embodiment.contract===API.EMBODIMENT_CONTRACT&&inspect.embodiment.noLegacyFallback===true&&inspect.embodiment.requiresConvergenceOwnerComposition===true,'inspector exposes exact V2 embodiment hook and authority boundary');
const absent=API.initializeEconomy({state:'NO_CIVILIZATION_MODEL'});
check(absent.status==='NO_MODELED_CIVILIZATION','no-civilization case stays honest');
const absentMorph=API.cityMorphology({state:'NO_CIVILIZATION_MODEL'});
check(absentMorph.status==='NO_MODELED_CIVILIZATION'&&absentMorph.settlements.length===0,'no-civilization morphology does not decorate unsupported state');

const triangleProduction={status:'MODELED',settlements:['a','b','c'].map(settlementId=>({settlementId,status:'ACTIVE'})),routes:[
  {edgeId:'ab',from:'a',to:'b',capacityUnits:100,usedUnits:20,degradationPpm:100000,utilizationPpm:200000,routingEligible:true,operational:true},
  {edgeId:'bc',from:'b',to:'c',capacityUnits:100,usedUnits:20,degradationPpm:100000,utilizationPpm:200000,routingEligible:true,operational:true},
  {edgeId:'ca',from:'c',to:'a',capacityUnits:100,usedUnits:20,degradationPpm:100000,utilizationPpm:200000,routingEligible:true,operational:true},
  {edgeId:'disabled-shadow',from:'a',to:'c',capacityUnits:10000,usedUnits:0,degradationPpm:0,utilizationPpm:0,routingEligible:false,operational:false}
]};
const failure1=API.networkFailureEnvelope(triangleProduction,{maxFailures:2}),failure2=API.networkFailureEnvelope(triangleProduction,{maxFailures:2});
eq(failure1,failure2,'network failure envelope deterministic');
check(failure1.scenarioCount===6&&failure1.candidateRouteIds.length===3&&!failure1.candidateRouteIds.includes('disabled-shadow'),'disabled routes never enter failure topology or candidate set');
check(failure1.scenarios.filter(x=>x.failedRouteIds.length===1).every(x=>x.connectivityRatioPpm===1000000),'single failure in triangle preserves all modeled connected pairs');
check(failure1.scenarios.filter(x=>x.failedRouteIds.length===2).every(x=>x.connectivityRatioPpm<1000000),'double failure in triangle reduces modeled connectivity');
check(failure1.operations<=failure1.limits.operations&&failure1.flowSubstitutionClaim===false&&failure1.physicalTransportGeometryClaim===false,'failure analysis is globally operation-bounded and topology-only');

const boundSettlements=Array.from({length:48},(_,i)=>({settlementId:'n'+i,status:'ACTIVE'})),boundRoutes=[];
for(let i=0;i<48;i++)boundRoutes.push({edgeId:'ring-'+i,from:'n'+i,to:'n'+((i+1)%48),capacityUnits:100+i,usedUnits:0,degradationPpm:100000,utilizationPpm:0,routingEligible:true,operational:true});
for(let i=0;i<48;i++)boundRoutes.push({edgeId:'chord-'+i,from:'n'+i,to:'n'+((i+2)%48),capacityUnits:200+i,usedUnits:0,degradationPpm:120000,utilizationPpm:0,routingEligible:true,operational:true});
const boundFailure=API.networkFailureEnvelope({status:'MODELED',settlements:boundSettlements,routes:boundRoutes},{maxFailures:2});
check(boundFailure.candidateLimitReached===true&&boundFailure.candidateRouteIds.length===16,'96-route failure analysis explicitly limits exhaustive candidates to top 16');
check(boundFailure.scenarioCount===136&&boundFailure.scenarioLimitReached===false,'16-candidate single/double failure envelope enumerates the complete bounded 136 scenarios');
check(boundFailure.operations<=API.FAILURE_LIMITS.operations,'48-settlement/96-route failure envelope remains inside one global operation budget');
assert.throws(()=>API.networkFailureEnvelope({status:'MODELED',settlements:boundSettlements,routes:[...boundRoutes,{edgeId:'overflow',from:'n0',to:'n1',capacityUnits:1}]},{maxFailures:1}),/failure route bound exceeded/);cases++;

const over=fixture();
over.settlements=Array.from({length:49},(_,i)=>({...over.settlements[0],settlementId:'s-'+i}));
assert.throws(()=>API.initializeEconomy(over),/settlements bound exceeded/);cases++;

const descriptor=JSON.parse(fs.readFileSync(new URL('../../config/components/v2x-09-civilization-economy-city.json',import.meta.url),'utf8'));
const apiComponent=descriptor.components.find(x=>x.id==='v2x09.civilization.api');
check(apiComponent.provides.includes('v2x09.civilization.embodiment-packet')&&apiComponent.dependencies.includes('v2x09.civilization.advanced-api'),'shipping component manifest declares V2 embodiment capability and advanced dependency');
const repoRoot=fileURLToPath(new URL('../../',import.meta.url));
execFileSync(process.execPath,['tools/build-ofu-rendering-v09.mjs'],{cwd:repoRoot,stdio:'pipe'});
const html=fs.readFileSync(new URL('../../dist/One_File_Universe.html',import.meta.url),'utf8');
const advancedMarker='<script data-ofu-component="v2x09.civilization.advanced-api">',apiMarker='<script data-ofu-component="v2x09.civilization.api">';
check(html.includes(advancedMarker)&&html.includes(apiMarker)&&html.indexOf(advancedMarker)<html.indexOf(apiMarker),'one-file HTML embeds advanced provider before public API consumer');
check(html.includes('ofu-v2x-09-civilization-embodiment-packet-1')&&html.includes('civilizationEmbodimentPacket'),'one-file HTML contains V2 embodiment contract and runtime export');

console.log(JSON.stringify({status:'PASS',cases,version:API.VERSION,activeCapabilities:t.activeCapabilities.length,impactProposals:s1.impactProposals.length,deltaDistricts:delta.districts.map(x=>x.kind),embodimentCommands:packet1.commandCount,embodimentKinds:packet1.commandKinds,failureScenarios:failure1.scenarioCount,boundFailureScenarios:boundFailure.scenarioCount,boundFailureOperations:boundFailure.operations}));
