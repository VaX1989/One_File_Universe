import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  AUTHORITY,SPECIES_STATE_CONTRACT,GAS_MIXING_ASSUMPTION
} from '../../research/p5-environment-next-science/environment-next-research.mjs';
import {
  CONTRACT_ID,VOLATILE_TRANSFER_CONTRACT,MAX_TRANSFER_STEPS_PER_QUERY,
  applyVolatileTransfer,applyVolatileTransferSequence,atmosphericMixtureSummary,
  p6EnvironmentReadinessWitness
} from '../../research/p5-environment-next-science/environment-next-frontier-v3.mjs';
const golden=JSON.parse(readFileSync(new URL('./golden-frontier-v3.json',import.meta.url),'utf8'));
const r=(totalTg,atmosphereTg,condensedSurfaceTg=0n,subsurfaceInteriorTg=0n,lostTg=0n)=>({totalTg,atmosphereTg,condensedSurfaceTg,subsurfaceInteriorTg,lostTg});
const state={contractId:SPECIES_STATE_CONTRACT,authority:AUTHORITY,epistemicStatus:'HYPOTHETICAL_MODEL_VALUE',origin:{class:'RESEARCH_FIXTURE',sourceId:'frontier-v3-golden',sourceRevision:'1'},provenance:'P5_RESEARCH_FIXTURE_ONLY',compositionCompleteness:'COMPLETE',species:[
  {speciesId:'H2O',...r(1000000n,1000000n)},
  {speciesId:'N2',...r(9000000n,9000000n)}
],unresolved:r(0n,0n)};
const transfer=(overrides={})=>({contractId:VOLATILE_TRANSFER_CONTRACT,authority:AUTHORITY,epistemicStatus:'HYPOTHETICAL_MODEL_VALUE',origin:{class:'RESEARCH_FIXTURE',sourceId:'frontier-v3-golden',sourceRevision:'1'},provenance:'fixture transition witness',speciesId:'H2O',fromReservoir:'atmosphereTg',toReservoir:'condensedSurfaceTg',massTg:250000n,processClass:'INTERNAL_REPARTITION_WITNESS',dependencies:['explicit-research-transition'],...overrides});
assert.equal(CONTRACT_ID,golden.contractId);
assert.equal(MAX_TRANSFER_STEPS_PER_QUERY,golden.boundedness.maxTransferStepsPerQuery);
const initial=atmosphericMixtureSummary(state,9800000n,6371000n,GAS_MIXING_ASSUMPTION);
assert.equal(initial.totalPressurePa,BigInt(golden.initial.pressurePa));
assert.equal(initial.meanMolarMassNanoKgPerMol,BigInt(golden.initial.meanMolarMassNanoKgPerMol));
const c=applyVolatileTransfer(state,transfer());
assert.equal(c.state.species[0].atmosphereTg,750000n);
assert.equal(c.state.species[0].condensedSurfaceTg,250000n);
assert.equal(c.state.species[0].totalTg,1000000n);
const cMix=atmosphericMixtureSummary(c.state,9800000n,6371000n,GAS_MIXING_ASSUMPTION);
assert.equal(cMix.totalPressurePa,BigInt(golden.condensation.postPressurePa));
assert.equal(cMix.meanMolarMassNanoKgPerMol,BigInt(golden.condensation.postMeanMolarMassNanoKgPerMol));
const loss=transfer({fromReservoir:'atmosphereTg',toReservoir:'lostTg',massTg:50000n,processClass:'LOSS_TO_LOST_RESERVOIR_WITNESS'});
const seq=applyVolatileTransferSequence(state,[transfer(),loss]);
assert.equal(seq.appliedStepCount,2n);assert.equal(seq.retainedHistoryEntries,0);
assert.equal(seq.state.species[0].lostTg,50000n);
const seqMix=atmosphericMixtureSummary(seq.state,9800000n,6371000n,GAS_MIXING_ASSUMPTION);
assert.equal(seqMix.totalPressurePa,BigInt(golden.lossAfterCondensation.postPressurePa));
assert.equal(seqMix.meanMolarMassNanoKgPerMol,BigInt(golden.lossAfterCondensation.postMeanMolarMassNanoKgPerMol));
assert.throws(()=>applyVolatileTransfer(c.state,transfer({fromReservoir:'lostTg',toReservoir:'atmosphereTg'})),/terminal/);
assert.throws(()=>applyVolatileTransfer(c.state,transfer({massTg:800000n})),/exceeds source/);
assert.throws(()=>applyVolatileTransfer(c.state,transfer({speciesId:'CO2'})),/absent from supplied state/);
assert.throws(()=>applyVolatileTransferSequence(state,new Array(MAX_TRANSFER_STEPS_PER_QUERY+1).fill(transfer())),/bounded per-query limit/);
const partial={...state,compositionCompleteness:'PARTIAL',unresolved:r(1n,1n)};
assert.equal(atmosphericMixtureSummary(partial,9800000n,6371000n,GAS_MIXING_ASSUMPTION).epistemicStatus,'UNKNOWN');
const readiness=p6EnvironmentReadinessWitness({state,gravityMicroMs2:9800000n,meanRadiusM:6371000n,acceptedP4History:false});
assert.equal(readiness.epistemicStatus,'INSUFFICIENT_ENVIRONMENT');
assert.equal(readiness.canAuthorizeBiology,false);
assert.equal(readiness.canonicalGenesisAvailable,false);
assert.ok(readiness.insufficient.includes('surfaceTemperatureState'));
assert.ok(readiness.insufficient.includes('acceptedP4History'));
assert.ok(readiness.unsupported.includes('abiogenesisTrigger'));
assert.ok(readiness.unsupported.includes('usablePhototrophicOrChemotrophicEnergyState'));
const withTemp=p6EnvironmentReadinessWitness({state,gravityMicroMs2:9800000n,meanRadiusM:6371000n,acceptedP4History:true,surfaceTemperatureState:{milliK:300000n,epistemicStatus:'HYPOTHETICAL_MODEL_VALUE',authority:'P5_RESEARCH_DRAFT',provenance:'research fixture',evidenceClass:'HYPOTHETICAL',fidelity:'STYLIZED'}});
assert.equal(withTemp.canAuthorizeBiology,false);
assert.equal(withTemp.insufficient.length,0);
assert.ok(withTemp.unsupported.length>0);
console.log('P5 environment-next frontier v3 tests: PASS');
