import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { individualId, householdId, identityCommitment } from '../../src/domains/v1/individuals/identity.js';
import { createDemographyLedger, applyDemographicStep, isLivingBirthOrdinal, selectLivingMembers } from '../../src/domains/v1/demography/ledger.js';
import { materializeIndividual, retainIndividual, proposeIndividualAction } from '../../src/domains/v1/individuals/runtime.js';
import { reconcileIndividuals, reconcilePopulationRefinement } from '../../src/domains/v1/individuals/reconcile.js';
import { recordStructuredExposure } from '../../src/domains/v1/individuals/learning.js';

let checks=0;const check=(v,m)=>{assert.ok(v,m);checks++};

assert.throws(()=>individualId({worldId:'a|b',settlementId:'c',birthOrdinal:7}),/reserved delimiter/);checks++;
assert.throws(()=>householdId({worldId:'a',settlementId:'b|c',householdOrdinal:7}),/reserved delimiter/);checks++;
assert.throws(()=>identityCommitment({worldId:'w',settlementId:'s',birthOrdinal:0,provenance:'CANONICAL_PROVEN'}),/provenance/);checks++;

let ledger=createDemographyLedger({settlementId:'overflow',population:0,currentYear:0,cohortSpan:1});
for(let year=1;year<=65;year++)ledger=applyDemographicStep(ledger,{year,births:1,deaths:0});
check(ledger.population===65,'65 living cohorts preserved');
check(ledger.cohorts.length===65,'living cohorts are not silently truncated');
assert.throws(()=>applyDemographicStep(createDemographyLedger({settlementId:'max',population:Number.MAX_SAFE_INTEGER,currentYear:0}),{year:1,births:1,deaths:0}),/safe integer/);checks++;
const first=selectLivingMembers(ledger,{start:0,count:1})[0];
check(isLivingBirthOrdinal(ledger,first.birthOrdinal)===true,'deep liveness predicate preserves living member');

const aggregate={population:2,nextBirthOrdinal:2,roles:['resident']};
const person=materializeIndividual({worldId:'w',settlementId:'s',birthOrdinal:0,birthYear:10,currentYear:20,aggregate});
assert.throws(()=>materializeIndividual({worldId:'w',settlementId:'s',birthOrdinal:0,birthYear:20,currentYear:10,aggregate}),/precede birthYear/);checks++;
assert.throws(()=>proposeIndividualAction({}, {kind:'MOVE'}),/person.id/);checks++;
const parameters={nested:{value:1}};const proposal=proposeIndividualAction(person,{kind:'MOVE',parameters});parameters.nested.value=9;check(proposal.parameters.nested.value===1,'proposal parameters are deep-copied');check(Object.isFrozen(proposal.parameters.nested),'proposal parameters are deeply frozen');
assert.throws(()=>retainIndividual({...person,culture:{conventions:['x'.repeat(300000)]}}),/bounded text|byte budget/);checks++;

const forged={...person,id:'person:forged'};check(reconcileIndividuals({aggregate,people:[forged]}).status==='FAIL','forged deterministic identity rejected');
const second=materializeIndividual({worldId:'w',settlementId:'s',birthOrdinal:1,birthYear:10,currentYear:20,aggregate});
const duplicateOrdinal={...second,birthOrdinal:0};check(reconcileIndividuals({aggregate,people:[person,duplicateOrdinal]}).status==='FAIL','duplicate birth ordinal rejected');
assert.throws(()=>reconcileIndividuals({aggregate:{population:3,nextBirthOrdinal:2},people:[]}),/nextBirthOrdinal/);checks++;

let deathLedger=createDemographyLedger({settlementId:'s',population:0,currentYear:0,cohortSpan:1});
deathLedger=applyDemographicStep(deathLedger,{year:1,births:2,deaths:1});
const living=selectLivingMembers(deathLedger,{start:0,count:2});check(living.length===1,'one death retires one birth address');
const livingPerson=materializeIndividual({worldId:'w',settlementId:'s',birthOrdinal:living[0].birthOrdinal,birthYear:living[0].birthYear,currentYear:2,aggregate:{population:1,nextBirthOrdinal:2}});
const retiredOrdinal=living[0].birthOrdinal===0?1:0;const retired=materializeIndividual({worldId:'w',settlementId:'s',birthOrdinal:retiredOrdinal,birthYear:1,currentYear:2,aggregate:{population:1,nextBirthOrdinal:2}});
check(reconcilePopulationRefinement({ledger:deathLedger,people:[livingPerson]}).status==='PASS','living refinement reconciles');
check(reconcilePopulationRefinement({ledger:deathLedger,people:[retired]}).status==='FAIL','retired ordinal cannot reconcile as living');

let learner={skills:[],education:[],knowledge:[],socialTies:[]};learner=recordStructuredExposure(learner,{kind:'SKILL',topic:'a|b',sourceRef:'c',provenance:'MODEL_DERIVED_SIMULATION'});learner=recordStructuredExposure(learner,{kind:'SKILL',topic:'a',sourceRef:'b|c',provenance:'MODEL_DERIVED_SIMULATION'});check(learner.skills.length===2,'tuple-distinct learning records do not collide');

const sandbox={console,TextEncoder,Object,Array,Map,Set,WeakMap,WeakSet,BigInt,Number,String,Math,JSON};sandbox.globalThis=sandbox;vm.createContext(sandbox);vm.runInContext(fs.readFileSync(new URL('../../src/domains/v1/individuals/provider.js',import.meta.url),'utf8'),sandbox,{filename:'provider.js'});const P=sandbox.OFU.v2x10Individuals;
check(typeof P.refinePopulation==='function'&&typeof P.project==='function'&&typeof P.reconcile==='function','shipping provider exposes mortality-aware refine/project/reconcile');
assert.throws(()=>P.propose({}, {kind:'MOVE'}),/person.id/);checks++;
assert.throws(()=>P.refine({worldId:'w',settlementId:'s',aggregate:{population:3,nextBirthOrdinal:2}}),/nextBirthOrdinal/);checks++;
const shippingLiving=P.refinePopulation({worldId:'w',ledger:deathLedger,aggregate:{roles:['resident']},start:0,count:2,currentYear:2});check(shippingLiving.length===1&&shippingLiving[0].birthOrdinal===living[0].birthOrdinal,'shipping provider preserves mortality-aware survivor identity');

console.log(JSON.stringify({schema:'ofu-v2x10-convergence-blockers-1',status:'PASS',checks}));
