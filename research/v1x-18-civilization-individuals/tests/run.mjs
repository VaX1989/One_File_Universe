import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createWorld,seedSettlement,simulate,stepWorld,settlementSummary,LIMITS,MODEL_FAMILY} from '../civilization-model.mjs';
import {refineIndividuals,reconcileIndividuals,personAddress,materializePerson,INDIVIDUAL_LIMITS} from '../individual-refinement.mjs';
import {researchTransitionDescriptor,P4_EVENT_FAMILIES,compatibilityClaim,createResearchTransition} from '../p4-bridge.mjs';

function fixture(){
  return createWorld({
    worldId:'r18-fixture',year:1000,
    settlements:[
      seedSettlement({id:'river',xKm:0,yKm:0,year:1000,population:12000,landFoodCapacity:1_500_000,foodStock:700_000,technologyPpm:350_000,infrastructure:180_000,productiveCapacity:140_000,culturalMarkerPpm:300_000}),
      seedSettlement({id:'hill',xKm:80,yKm:20,year:1000,population:7000,landFoodCapacity:850_000,foodStock:300_000,technologyPpm:220_000,infrastructure:90_000,productiveCapacity:90_000,culturalMarkerPpm:700_000})
    ],
    birthLedger:[
      {settlementId:'river',birthYear:965,count:7800},{settlementId:'river',birthYear:973,count:3500},{settlementId:'hill',birthYear:965,count:4500},{settlementId:'hill',birthYear:973,count:2100}
    ],history:[]
  });
}

const oracle=JSON.parse(fs.readFileSync(new URL('../fixtures/causal-oracle.json',import.meta.url),'utf8'));
const a=simulate(fixture(),30);
const b=simulate(fixture(),30);
assert.deepEqual(a,b,'deterministic aggregate simulation');
assert.equal(a.world.modelId,MODEL_FAMILY.stockFlow);

const dry=simulate(fixture(),30,(world)=>({ecologyPpmBySettlement:{river:world.year>=1005&&world.year<1016?350_000:1_000_000,hill:1_000_000}}));
const baseRiver=settlementSummary(a.world,'river'),dryRiver=settlementSummary(dry.world,'river');
assert.notDeepEqual(baseRiver,dryRiver,'drought creates causal divergence');
assert.ok(dryRiver.foodStock<=baseRiver.foodStock || dryRiver.population<=baseRiver.population || dryRiver.conflictPpm>=baseRiver.conflictPpm,'drought consequence visible');
assert.deepEqual({riverPopulation:baseRiver.population,riverConflictPpm:baseRiver.conflictPpm,riverTechnologyPpm:baseRiver.technologyPpm},oracle.baselineYear30,'baseline oracle');
assert.deepEqual({riverPopulation:dryRiver.population,riverConflictPpm:dryRiver.conflictPpm,riverRouteLegacy:dryRiver.routeLegacy},oracle.droughtYear30,'drought oracle');

const shockWorld=fixture();
shockWorld.settlements.find(s=>s.id==='river').conflictPpm=950_000;
const afterShock=simulate(shockWorld,8);
const shocked=settlementSummary(afterShock.world,'river');
assert.ok(shocked.ruins>0,'conflict produces persistent ruins');
assert.ok(afterShock.world.history.some(e=>e.type==='HIGH_TENSION_CONFLICT'),'history event retained');
assert.deepEqual({riverRuins:shocked.ruins,riverConflictPpm:shocked.conflictPpm},oracle.conflictShockYear8,'conflict oracle');

const late=simulate(fixture(),12).world;
const addr=personAddress(late,'river',10);
const p1=materializePerson(late,addr),p2=materializePerson(late,addr);
assert.deepEqual(p1,p2,'stable selected identity and attributes');
const refined=refineIndividuals(late,{settlementId:'river',start:5,count:Math.min(32,settlementSummary(late,'river').population-5)});
assert.equal(refined.people.length,Math.min(32,settlementSummary(late,'river').population-5));
assert.equal(reconcileIndividuals(late,refined).status,'PASS');
assert.ok(refined.people.every(p=>p.memories.length<=INDIVIDUAL_LIMITS.maxMemories&&p.knowledge.length<=INDIVIDUAL_LIMITS.maxKnowledge&&p.goals.length<=INDIVIDUAL_LIMITS.maxGoals),'bounded person state');

let eager=fixture();
for(let i=0;i<12;i++){
  // Deliberately materialize a few people before every aggregate step; refinement must be observational only.
  refineIndividuals(eager,{settlementId:'river',start:0,count:Math.min(4,settlementSummary(eager,'river').population)});
  eager=stepWorld(eager).world;
}
assert.deepEqual(eager,late,'late materialization consistency');
assert.ok(eager.settlements.every(s=>s.slices.length<=LIMITS.maxSlicesPerSettlement),'bounded cohort slices');
assert.ok(eager.birthLedger.length<=LIMITS.maxBirthLedgerEntries&&eager.history.length<=LIMITS.maxHistoryEvents,'bounded ledgers');

const descriptor=researchTransitionDescriptor();
assert.equal(descriptor.contractId,'ofu.research.v1x18.civilization-transition');
assert.deepEqual(descriptor.eventFamilies,[...P4_EVENT_FAMILIES]);
assert.equal(compatibilityClaim().p4Protocol,'ofu-p4-temporal-v1');
assert.equal(compatibilityClaim().status,'STRUCTURALLY_MATCHED_NOT_PROMOTED');
const fakeP4={createTransitionContract:x=>x};const transition=createResearchTransition(fakeP4);
assert.deepEqual(transition.eventFamilies,[...P4_EVENT_FAMILIES]);
const fakeState={baseline:{}};transition.reducers.get('research.civ.stockflow.step@1')(fakeState,{descriptor:{type:'research.civ.stockflow.step',version:1n,operationKey:'v1x18:stockflow-step',time:{seconds:1n,micros:0n},payload:{year:1001}}});
assert.equal(fakeState.baseline.v1x18ResearchTrace.length,1,'P4 reducer prototype is deterministic and bounded');

const stress=simulate(createWorld({worldId:'stress',year:0,settlements:[seedSettlement({id:'a',population:10000,landFoodCapacity:1200000}),seedSettlement({id:'b',xKm:50,population:8000,landFoodCapacity:900000})],birthLedger:[],history:[]}),300);
assert.ok(Math.max(...stress.world.settlements.map(s=>s.slices.length))<=110,'300-year aggregate slice bound');

assert.throws(()=>refineIndividuals(late,{settlementId:'river',start:0,count:INDIVIDUAL_LIMITS.maxMaterialized+1}),/count budget/,'materialization budget enforced');
console.log(JSON.stringify({status:'PASS',tests:17,baseRiver,dryRiver,shocked,lateMaterialized:refined.people.length,limits:{settlements:LIMITS.maxSettlements,slicesPerSettlement:LIMITS.maxSlicesPerSettlement,individuals:INDIVIDUAL_LIMITS.maxMaterialized},p4:compatibilityClaim()},null,2));
