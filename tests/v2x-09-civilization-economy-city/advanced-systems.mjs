import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const context=vm.createContext({console});
for(const name of ['core.js','production-network.js','society-dynamics.js','urban-evolution.js','advanced.js']){
  vm.runInContext(fs.readFileSync(new URL('../../src/v2x-09-civilization-economy-city/'+name,import.meta.url),'utf8'),context,{filename:name});
}
const K=context.OFU.v2x09CivilizationCore;
const PROD=context.OFU.v2x09CivilizationProductionNetwork;
const SOC=context.OFU.v2x09CivilizationSocietyDynamics;
const URB=context.OFU.v2x09CivilizationUrbanEvolution;
const ADV=context.OFU.v2x09CivilizationAdvanced;
let cases=0;
const check=(v,m)=>{assert.ok(v,m);cases++};
const eq=(a,b,m)=>{assert.equal(JSON.stringify(a),JSON.stringify(b),m);cases++};

function fixture({damaged=false,dry=false,abandoned=false,lowTech=false,stressedDelta=false,energyStarvedRidge=false}={}){
  const settlements=[
    {settlementId:'delta-city',regionId:'delta',status:abandoned?'ABANDONED':'ACTIVE',population:abandoned?0:26000,infrastructurePpm:damaged?280000:720000,scarcityPpm:stressedDelta?920000:180000,polityId:'polity-a'},
    {settlementId:'ridge-town',regionId:'ridge',status:'ACTIVE',population:6200,infrastructurePpm:610000,scarcityPpm:140000,polityId:'polity-a'},
    {settlementId:'harbor-village',regionId:'delta',status:'ACTIVE',population:1800,infrastructurePpm:320000,scarcityPpm:260000,polityId:'polity-b'}
  ];
  const state={
    state:'MODELED_CIVILIZATION',worldIdentity:'world-advanced',lineageId:'lineage-advanced',epoch:40,
    regions:[
      {regionId:'delta',waterPpm:dry?120000:860000,biologicalResourcePpm:830000,materialResourcePpm:420000},
      {regionId:'ridge',waterPpm:240000,biologicalResourcePpm:280000,materialResourcePpm:920000}
    ],
    settlements,
    resources:[
      {resourceId:'delta-food',regionId:'delta',resourceClass:'BIOMASS_OR_ANALOGUE',amountUnits:240000,availabilityPpm:820000,depletable:true},
      {resourceId:'delta-energy',regionId:'delta',resourceClass:'ACCESSIBLE_ENERGY_GRADIENT',amountUnits:180000,availabilityPpm:690000,depletable:false},
      {resourceId:'ridge-material',regionId:'ridge',resourceClass:'MINERAL_OR_CONSTRUCTION_MATERIAL',amountUnits:330000,availabilityPpm:910000,depletable:true}
    ],
    tradeEdges:[
      {edgeId:'edge-1',from:'delta-city',to:'ridge-town',costPpm:220000,flowUnits:1200,status:'ACTIVE'},
      {edgeId:'edge-2',from:'delta-city',to:'harbor-village',costPpm:120000,flowUnits:900,status:'ACTIVE'}
    ],
    technology:lowTech?{production:1,transport:0,materials:1,energy:1,communication:0,medicine:0,construction:1,conflict:0,knowledgeContinuityPpm:210000}:{production:4,transport:3,materials:3,energy:3,communication:3,medicine:2,construction:4,conflict:1,knowledgeContinuityPpm:620000},
    polities:[
      {polityId:'polity-a',institutionId:'inst-a',settlementIds:['delta-city','ridge-town'],authorityPpm:720000,legitimacyPpm:damaged?250000:690000,cohesionPpm:damaged?260000:640000,status:'ACTIVE'},
      {polityId:'polity-b',institutionId:'inst-b',settlementIds:['harbor-village'],authorityPpm:360000,legitimacyPpm:520000,cohesionPpm:560000,status:'ACTIVE'}
    ],
    infrastructure:[
      {infrastructureId:'road-1',kind:'MAJOR_CORRIDOR',fromSettlementId:'delta-city',toSettlementId:'ridge-town',status:damaged?'DAMAGED':'ACTIVE',conditionPpm:damaged?180000:900000,builtEpoch:10,lastActiveEpoch:40},
      {infrastructureId:'road-2',kind:'ROUTE_CORRIDOR',fromSettlementId:'delta-city',toSettlementId:'harbor-village',status:'ACTIVE',conditionPpm:820000,builtEpoch:12,lastActiveEpoch:40}
    ],
    history:{proposals:[
      {eventProposalId:'ev-found-delta',epoch:0,type:'SETTLEMENT_FOUNDATION',targetIds:['delta-city']},
      {eventProposalId:'ev-road',epoch:10,type:'INFRASTRUCTURE_BUILT',targetIds:['delta-city','road-1']},
      ...(damaged?[{eventProposalId:'ev-conflict',epoch:35,type:'CONFLICT',targetIds:['delta-city'],payload:{intensityPpm:780000}}]:[]),
      ...(abandoned?[{eventProposalId:'ev-abandon',epoch:40,type:'ABANDONMENT',targetIds:['delta-city']}]:[])
    ]}
  };
  const economy={
    status:'STEPPED',epoch:40,settlements:[
      {settlementId:'delta-city',regionId:'delta',status:abandoned?'ABANDONED':'ACTIVE',population:abandoned?0:26000,stocks:{SUBSISTENCE_GOODS:stressedDelta?400:34000,MATERIAL_GOODS:stressedDelta?200:16000,ENERGY_SERVICE:stressedDelta?100:9000}},
      {settlementId:'ridge-town',regionId:'ridge',status:'ACTIVE',population:6200,stocks:{SUBSISTENCE_GOODS:9000,MATERIAL_GOODS:18000,ENERGY_SERVICE:energyStarvedRidge?0:5200}},
      {settlementId:'harbor-village',regionId:'delta',status:'ACTIVE',population:1800,stocks:{SUBSISTENCE_GOODS:4200,MATERIAL_GOODS:2900,ENERGY_SERVICE:2700}}
    ]
  };
  return {state,economy};
}

check(PROD&&SOC&&URB&&ADV,'advanced modules load');
check(PROD.RECIPE_GRAPH.some(r=>Object.keys(r.inputs).some(g=>PROD.INTERMEDIATE_GOODS.includes(g))),'recipe graph is genuinely multi-stage');
const base=fixture();
const composed1=ADV.modelAdvancedCivilization(base.state,base.economy),composed2=ADV.modelAdvancedCivilization(base.state,base.economy);
eq(composed1,composed2,'advanced composition deterministic');
check(composed1.status==='MODELED'&&composed1.mutationPerformed===false&&composed1.requiresConvergenceOwnerComposition===true,'advanced composition preserves authority and integration boundary');
const before=JSON.stringify(base.economy);
const n1=PROD.productionNetwork(base.state,base.economy),n2=PROD.productionNetwork(base.state,base.economy);
eq(n1,n2,'production/logistics network deterministic');
check(JSON.stringify(base.economy)===before,'production network does not mutate input economy');
check(n1.status==='MODELED'&&n1.closure.allClosed,'advanced network modeled with complete accounting closure');
check(n1.closure.entries.every(x=>x.closed),'every advanced ledger witness closes');
check(n1.recipeGraph.length===5&&n1.intermediateGoods.length===5,'bounded explicit recipe/intermediate graph exposed');
check(n1.settlements.every(s=>s.serviceSatisfaction.services.length===5),'service demand and satisfaction exposed per settlement');
check(n1.operations<=n1.limits.operations,'production network operation budget respected');
check(n1.mutationPerformed===false&&n1.canonicalHistoryMutation===false,'production network has no external authority mutation');

const starved=fixture({energyStarvedRidge:true});
const starvedNet=PROD.productionNetwork(starved.state,starved.economy);
check(starvedNet.flows.length>0,'intermediate service/goods move across modeled trade routes when deficits exist');
check(starvedNet.flows.every(f=>f.amountUnits>0&&f.authority==='MODEL_DERIVED_SIMULATION'),'all logistics flows are bounded model-derived units');
const routeHealthy=starvedNet.routes.find(r=>r.edgeId==='edge-1');
check(routeHealthy.capacityUnits>0&&routeHealthy.conditionPpm===900000,'healthy modeled infrastructure supports route capacity');

const damaged=fixture({damaged:true,energyStarvedRidge:true});
const damagedNet=PROD.productionNetwork(damaged.state,damaged.economy);
const routeDamaged=damagedNet.routes.find(r=>r.edgeId==='edge-1');
check(routeDamaged.capacityUnits<routeHealthy.capacityUnits,'damaged infrastructure causally reduces route capacity');
check(routeDamaged.degradationPpm===820000,'explicit infrastructure condition becomes degradation witness');
check(damagedNet.bottlenecks.some(b=>b.kind==='INFRASTRUCTURE_DEGRADATION'&&b.edgeId==='edge-1'),'degraded route becomes bounded bottleneck evidence');
check(damagedNet.routes.every(r=>r.usedUnits<=r.capacityUnits),'route utilization never exceeds capacity');

const low=fixture({lowTech:true});
const lowNet=PROD.productionNetwork(low.state,low.economy);
check(lowNet.routes.every(r=>r.capacityUnits===0),'route capacity disabled when logistics prerequisites are unmet');
check(lowNet.satisfaction.some(s=>s.unmetUnits>0),'low-technology case exposes unmet derived services');

const dynamics=SOC.societyDynamics(base.state,n1),dynamics2=SOC.societyDynamics(base.state,n1);
eq(dynamics,dynamics2,'aggregate society dynamics deterministic');
check(dynamics.status==='MODELED'&&dynamics.settlementPressures.length===3,'aggregate pressure model covers modeled settlements');
check(dynamics.institutionProposals.length===2,'institution response proposals remain polity bounded');
check(dynamics.institutionProposals.every(p=>p.mutationPerformed===false&&p.universalSociologicalClaim===false),'institution responses are proposal-only and non-universal');
check(dynamics.persistentPersonIdentityCreated===false&&dynamics.planetOrLifeMutation===false,'society dynamics preserve person and cross-domain authority boundaries');

const stressed=fixture({damaged:true,stressedDelta:true});
const stressedNet=PROD.productionNetwork(stressed.state,stressed.economy);
const stressedDyn=SOC.societyDynamics(stressed.state,stressedNet);
const deltaPressure=stressedDyn.settlementPressures.find(x=>x.settlementId==='delta-city');
check(deltaPressure.migrationPressurePpm>=380000,'resource/logistics stress raises aggregate migration pressure');
check(stressedDyn.migrationProposals.some(p=>p.sourceSettlementId==='delta-city'),'high-pressure settlement emits aggregate migration/displacement proposal');
check(stressedDyn.migrationProposals.every(p=>p.persistentPersonIdentityCreated===false&&p.persistentPersonIds.length===0&&p.mutationPerformed===false),'migration proposals never create persistent persons or mutate population directly');
check(stressedDyn.institutionProposals.find(p=>p.polityId==='polity-a').mechanisms.includes('REPAIR_PRIORITY'),'damaged network creates institution repair-priority mechanism');
check(stressedDyn.institutionProposals.find(p=>p.polityId==='polity-a').sourceBottleneckIds.length>0,'institution proposal is causally tied to network bottleneck witnesses');

const urban=URB.urbanEvolution(base.state,n1,dynamics),urban2=URB.urbanEvolution(base.state,n1,dynamics);
eq(urban,urban2,'urban evolution deterministic');
const deltaUrban=urban.settlements.find(x=>x.settlementId==='delta-city');
const ridgeUrban=urban.settlements.find(x=>x.settlementId==='ridge-town');
check(deltaUrban.family==='PORT_CLUSTER','wet connected advanced settlement becomes port-cluster morphology family');
check(ridgeUrban.family==='RESOURCE_FRONTIER','material-rich advanced settlement becomes resource-frontier family');
check(deltaUrban.specializations.some(x=>x.kind==='WATER_TERMINAL'),'water terminal specialization requires waterborne capability and network');
check(deltaUrban.specializations.some(x=>x.kind==='LOGISTICS_QUARTER'),'derived distribution service shapes visible specialization');
check(deltaUrban.claims.physicalGeometry===false&&deltaUrban.claims.empiricalUrbanForecast===false,'urban family remains non-physical, non-empirical model presentation');
check(urban.renderCues.every(c=>c.authority==='PRESENTATION_ONLY'),'all evolution render cues remain presentation-only');
check(urban.requiresConvergenceOwnerComposition===true&&urban.rendererMutationPerformed===false,'advanced render plan preserves shared renderer ownership');

const dry=fixture({dry:true});
const dryNet=PROD.productionNetwork(dry.state,dry.economy),dryDyn=SOC.societyDynamics(dry.state,dryNet),dryUrban=URB.urbanEvolution(dry.state,dryNet,dryDyn);
const dryDelta=dryUrban.settlements.find(x=>x.settlementId==='delta-city');
check(dryDelta.family!=='PORT_CLUSTER'&&!dryDelta.specializations.some(x=>x.kind==='WATER_TERMINAL'),'dry case cannot receive port family or water terminal decoration');

const damagedDyn=SOC.societyDynamics(damaged.state,damagedNet),damagedUrban=URB.urbanEvolution(damaged.state,damagedNet,damagedDyn);
const damagedDelta=damagedUrban.settlements.find(x=>x.settlementId==='delta-city');
check(damagedDelta.evidenceLayers.some(x=>x.kind==='CORRIDOR_DEGRADATION'),'infrastructure condition produces explicit corridor degradation layer');
check(damagedDelta.evidenceLayers.some(x=>x.kind==='DAMAGE_OR_STRESS'),'history conflict produces history-backed damage layer');
check(damagedDelta.evidenceLayers.every(x=>x.physicalArchaeologyClaim===false&&x.canonicalHistoryClaim===false),'evidence layers do not claim archaeology or canonical history');

const abandoned=fixture({abandoned:true});
const abandonedNet=PROD.productionNetwork(abandoned.state,abandoned.economy),abandonedDyn=SOC.societyDynamics(abandoned.state,abandonedNet),abandonedUrban=URB.urbanEvolution(abandoned.state,abandonedNet,abandonedDyn);
const abandonedDelta=abandonedUrban.settlements.find(x=>x.settlementId==='delta-city');
check(abandonedDelta.family==='POST_COLLAPSE_RELICT'&&abandonedDelta.phase==='RELICT','abandoned settlement becomes honest post-collapse relict family');
check(abandonedDelta.evidenceLayers.some(x=>x.kind==='ABANDONMENT'),'relict representation is backed by abandonment witness');

const absent=PROD.productionNetwork({state:'NO_CIVILIZATION_MODEL'},null);
check(absent.status==='NO_MODELED_CIVILIZATION_OR_ECONOMY','advanced production remains honest for no-civilization case');
const absentSoc=SOC.societyDynamics({state:'NO_CIVILIZATION_MODEL'},absent);
check(absentSoc.status==='NO_MODELED_CIVILIZATION_OR_NETWORK','society dynamics remain honest for absent model');
const absentUrban=URB.urbanEvolution({state:'NO_CIVILIZATION_MODEL'},absent,absentSoc);
check(absentUrban.status==='NO_MODELED_INPUT'&&absentUrban.renderCues.length===0,'urban evolution produces no unsupported decoration');

const baseResilience=composed1.resilience;
check(baseResilience.status==='MODELED'&&baseResilience.criticalRouteIds.length===2,'tree-like three-settlement network exposes both single-path routes as critical');
check(baseResilience.settlements.find(x=>x.settlementId==='delta-city').isolationRiskPpm===1000000,'hub with only bridge-like incident routes exposes full modeled isolation risk');
check(baseResilience.routes.every(r=>r.usedUnits<=r.capacityUnits&&r.spareCapacityUnits===r.capacityUnits-r.usedUnits),'resilience accounting preserves route capacity/spare identities');
check(baseResilience.physicalTransportGeometryClaim===false&&baseResilience.mutationPerformed===false,'network resilience does not claim physical transport geometry or mutate state');

const redundant=fixture();
redundant.state.tradeEdges.push({edgeId:'edge-3',from:'ridge-town',to:'harbor-village',costPpm:180000,flowUnits:750,status:'ACTIVE'});
redundant.state.infrastructure.push({infrastructureId:'road-3',kind:'ROUTE_CORRIDOR',fromSettlementId:'ridge-town',toSettlementId:'harbor-village',status:'ACTIVE',conditionPpm:840000,builtEpoch:20,lastActiveEpoch:40});
const redundantComposed=ADV.modelAdvancedCivilization(redundant.state,redundant.economy);
check(redundantComposed.resilience.criticalRouteIds.length===0,'triangulated modeled network provides alternate paths and no false bridge classification');
check(redundantComposed.resilience.routes.every(r=>r.alternatePathAvailable===true),'each route in a three-edge triangle has a modeled alternate path');

const recoveryFixture=fixture({stressedDelta:true,energyStarvedRidge:true});
const recoveryStateBefore=JSON.stringify(recoveryFixture.state),recoveryEconomyBefore=JSON.stringify(recoveryFixture.economy);
const recovery=ADV.projectRecoveryEnvelope(recoveryFixture.state,recoveryFixture.economy,{edgeId:'edge-1',shockSeverityPpm:800000,maxEpochs:16});
check(recovery.status==='PROJECTED'&&recovery.counterfactual===true&&recovery.canonicalForecast===false,'recovery envelope is explicit bounded counterfactual, never canonical forecast');
check(recovery.trajectory.length>=2&&recovery.trajectory.length<=ADV.RESILIENCE_LIMITS.projectionEpochs+1,'recovery trajectory stays inside hard epoch bound');
check(recovery.trajectory[0].conditionPpm<recovery.originalConditionPpm,'configured shock lowers modeled infrastructure condition');
check(recovery.trajectory.at(-1).conditionPpm>recovery.trajectory[0].conditionPpm,'bounded repair dynamics improve infrastructure condition across projected epochs');
check(recovery.trajectory.at(-1).routeCapacityUnits>=recovery.trajectory[0].routeCapacityUnits,'route capacity recovers monotonically with modeled condition envelope');
check(recovery.trajectory.every(x=>x.authority==='MODEL_DERIVED_SIMULATION'&&Array.isArray(x.urbanPhases)),'each recovery epoch recomposes society and urban phase under model-derived authority');
check(recovery.mutationPerformed===false&&recovery.persistentPersonIdentityCreated===false&&recovery.canonicalHistoryMutation===false&&recovery.planetOrLifeMutation===false,'counterfactual recovery preserves all semantic ownership boundaries');
check(JSON.stringify(recoveryFixture.state)===recoveryStateBefore&&JSON.stringify(recoveryFixture.economy)===recoveryEconomyBefore,'recovery envelope leaves source state/economy byte-logically unchanged');

const noEdgeRecovery=ADV.projectRecoveryEnvelope({...base.state,tradeEdges:[]},base.economy,{maxEpochs:4});
check(noEdgeRecovery.status==='NO_MODELED_EDGE'&&noEdgeRecovery.trajectory.length===0,'recovery refuses to fabricate an edge when no modeled route exists');
const noInfraRecovery=ADV.projectRecoveryEnvelope({...base.state,infrastructure:[]},base.economy,{edgeId:'edge-1',maxEpochs:4});
check(noInfraRecovery.status==='NO_MODELED_INFRASTRUCTURE_FOR_EDGE'&&noInfraRecovery.trajectory.length===0,'recovery refuses to fabricate infrastructure when route lacks modeled asset');

const inactive=fixture({energyStarvedRidge:true});
inactive.state.tradeEdges[0]={...inactive.state.tradeEdges[0],status:'INACTIVE'};
const inactiveNet=PROD.productionNetwork(inactive.state,inactive.economy),inactiveRoute=inactiveNet.routes.find(r=>r.edgeId==='edge-1');
check(inactiveRoute.capacityUnits===0&&inactiveRoute.routingEligible===false&&inactiveRoute.disableReason==='TRADE_EDGE_NOT_ACTIVE','inactive trade edge is retained as disabled witness and carries no capacity');
check(!inactiveNet.flows.some(f=>f.pathEdgeIds.includes('edge-1')),'inactive trade edge never carries direct or residual flow');
check(K.tradeDegree(inactive.state,'ridge-town')===0,'inactive trade edge does not inflate modeled trade degree');
const inactiveDyn=SOC.societyDynamics(inactive.state,inactiveNet);
check(inactiveDyn.settlementPressures.find(x=>x.settlementId==='ridge-town').routeStressPpm===700000,'social route stress treats settlement with no usable routes as isolated rather than averaging disabled routes');

const stale=fixture({energyStarvedRidge:true});
stale.state.settlements.find(x=>x.settlementId==='ridge-town').status='ABANDONED';
const staleNet=PROD.productionNetwork(stale.state,stale.economy),staleRoute=staleNet.routes.find(r=>r.edgeId==='edge-1'),staleRow=staleNet.settlements.find(x=>x.settlementId==='ridge-town');
check(staleRow.status==='ABANDONED'&&staleRoute.capacityUnits===0&&staleRoute.disableReason==='SETTLEMENT_ENDPOINT_NOT_ACTIVE','authoritative state abandonment overrides stale active economy snapshot and disables incident route');
check(!staleNet.flows.some(f=>f.transitSettlementIds?.includes('ridge-town')),'abandoned settlement can never become a residual transit node');

const missingEndpoint=fixture({energyStarvedRidge:true});
missingEndpoint.economy.settlements=missingEndpoint.economy.settlements.filter(x=>x.settlementId!=='ridge-town');
const missingNet=PROD.productionNetwork(missingEndpoint.state,missingEndpoint.economy),missingRoute=missingNet.routes.find(r=>r.edgeId==='edge-1');
check(missingRoute&&missingRoute.capacityUnits===0&&missingRoute.disableReason==='MISSING_SETTLEMENT_ENDPOINT','missing economy endpoint remains explicit disabled route evidence instead of disappearing silently');

const widestState={
  state:'MODELED_CIVILIZATION',worldIdentity:'world-widest',lineageId:'lineage-widest',epoch:1,
  regions:[{regionId:'r',waterPpm:0,biologicalResourcePpm:0,materialResourcePpm:0}],resources:[],
  settlements:[
    {settlementId:'a',regionId:'r',status:'ACTIVE',population:1000,infrastructurePpm:500000},
    {settlementId:'b',regionId:'r',status:'ACTIVE',population:1,infrastructurePpm:500000},
    {settlementId:'c',regionId:'r',status:'ACTIVE',population:500,infrastructurePpm:500000},
    {settlementId:'d',regionId:'r',status:'ACTIVE',population:1,infrastructurePpm:500000}
  ],
  tradeEdges:[
    {edgeId:'ab-narrow',from:'a',to:'b',costPpm:0,flowUnits:10,status:'ACTIVE'},
    {edgeId:'bc-narrow',from:'b',to:'c',costPpm:0,flowUnits:10,status:'ACTIVE'},
    {edgeId:'ad-wide',from:'a',to:'d',costPpm:0,flowUnits:1000,status:'ACTIVE'},
    {edgeId:'dc-wide',from:'d',to:'c',costPpm:0,flowUnits:1000,status:'ACTIVE'}
  ],
  technology:{production:1,transport:1,materials:0,energy:0,communication:0,medicine:0,construction:1,conflict:0,knowledgeContinuityPpm:500000},
  polities:[],infrastructure:[],history:{proposals:[]}
};
const widestEconomy={status:'STEPPED',epoch:1,settlements:[
  {settlementId:'a',regionId:'r',status:'ACTIVE',population:1000,stocks:{SUBSISTENCE_GOODS:1000,MATERIAL_GOODS:0,ENERGY_SERVICE:1000}},
  {settlementId:'b',regionId:'r',status:'ACTIVE',population:1,stocks:{SUBSISTENCE_GOODS:0,MATERIAL_GOODS:0,ENERGY_SERVICE:0}},
  {settlementId:'c',regionId:'r',status:'ACTIVE',population:500,stocks:{SUBSISTENCE_GOODS:0,MATERIAL_GOODS:0,ENERGY_SERVICE:0}},
  {settlementId:'d',regionId:'r',status:'ACTIVE',population:1,stocks:{SUBSISTENCE_GOODS:0,MATERIAL_GOODS:0,ENERGY_SERVICE:0}}
]};
const widest1=PROD.productionNetwork(widestState,widestEconomy),widest2=PROD.productionNetwork(widestState,widestEconomy);
eq(widest1,widest2,'residual widest-path routing is deterministic');
const widestFlow=widest1.flows.find(f=>f.fromSettlementId==='a'&&f.toSettlementId==='c'&&f.hopCount===2);
check(widestFlow&&JSON.stringify(widestFlow.pathEdgeIds)===JSON.stringify(['ad-wide','dc-wide']),'residual routing chooses globally wider corridor rather than first lexicographic narrow path');
check(widest1.routing.policy==='DIRECT_THEN_RESIDUAL_WIDEST_PATH'&&widest1.routing.maxHops===47&&widest1.routing.searchLimit===1024,'routing exposes bounded deterministic policy and natural 48-settlement simple-path limit');
check(widest1.closure.allClosed&&widest1.routes.every(r=>r.usedUnits<=r.capacityUnits),'widest routing preserves closure and per-edge capacity bounds');
for(const route of widest1.routes){const traversed=widest1.flows.filter(f=>f.pathEdgeIds.includes(route.edgeId)).reduce((n,f)=>n+f.amountUnits,0);check(traversed===route.usedUnits,'route usedUnits equals all direct/residual flow traversals for '+route.edgeId)}

const ghost=fixture({energyStarvedRidge:true});
ghost.state.infrastructure=[];
const ghostNet=PROD.productionNetwork(ghost.state,ghost.economy),ghostDyn=SOC.societyDynamics(ghost.state,ghostNet),ghostUrban=URB.urbanEvolution(ghost.state,ghostNet,ghostDyn),ghostDelta=ghostUrban.settlements.find(x=>x.settlementId==='delta-city');
check(ghostNet.routes.some(r=>r.evidenceClass==='TRADE_EDGE_WITHOUT_MODELED_INFRASTRUCTURE_ASSET'&&r.degradationPpm>=450000),'trade-only fallback route remains an explicit degraded network witness');
check(!ghostDelta.evidenceLayers.some(x=>x.kind==='CORRIDOR_DEGRADATION'),'trade-only fallback cannot masquerade as modeled infrastructure/archaeological corridor evidence');

console.log(JSON.stringify({status:'PASS',cases,contracts:[PROD.CONTRACT,SOC.CONTRACT,URB.CONTRACT,ADV.RESILIENCE_CONTRACT,ADV.RECOVERY_CONTRACT],healthyRouteCapacity:routeHealthy.capacityUnits,damagedRouteCapacity:routeDamaged.capacityUnits,starvedFlows:starvedNet.flows.length,stressedMigrationProposals:stressedDyn.migrationProposals.length,deltaFamily:deltaUrban.family,dryDeltaFamily:dryDelta.family,abandonedFamily:abandonedDelta.family,criticalRoutes:baseResilience.criticalRouteIds.length,redundantCriticalRoutes:redundantComposed.resilience.criticalRouteIds.length,recoveryEpochs:recovery.trajectory.length-1,recoveryCapacityDelta:recovery.summary.capacityDeltaUnits,recoveryConditionDeltaPpm:recovery.summary.conditionDeltaPpm,widestPath:widestFlow?.pathEdgeIds||[]}));
