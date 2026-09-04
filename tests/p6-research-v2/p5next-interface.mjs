import assert from 'node:assert/strict';
import {AUTHORITY as P5_AUTHORITY,SPECIES_STATE_CONTRACT} from '../../research/p5-environment-next-science/environment-next-research.mjs';
import {CONTRACT_ID as P5_FRONTIER_CONTRACT,p6EnvironmentReadinessWitness} from '../../research/p5-environment-next-science/environment-next-frontier-v3.mjs';
import {RESEARCH_AUTHORITY} from '../../research/p6/biology-v2-bounded.mjs';
import {CONTRACT_ID,MODE,canonicalEligibilityFromP5Next,postGenesisFixtureEligibility,dependencyStatus} from '../../research/p6/p5next-environment-interface.mjs';

const reservoir=(totalTg,atmosphereTg)=>({totalTg,atmosphereTg,condensedSurfaceTg:0n,subsurfaceInteriorTg:0n,lostTg:0n});
const state={contractId:SPECIES_STATE_CONTRACT,authority:P5_AUTHORITY,epistemicStatus:'HYPOTHETICAL_MODEL_VALUE',origin:{class:'RESEARCH_FIXTURE',sourceId:'p6-stack-test',sourceRevision:'1'},provenance:'P6_STACK_TEST_FIXTURE_ONLY',compositionCompleteness:'COMPLETE',species:[
  {speciesId:'H2O',...reservoir(1000000n,1000000n)},
  {speciesId:'N2',...reservoir(9000000n,9000000n)}
],unresolved:reservoir(0n,0n)};
const readiness=p6EnvironmentReadinessWitness({state,gravityMicroMs2:9800000n,meanRadiusM:6371000n,acceptedP4History:true,surfaceTemperatureState:{milliK:300000n,epistemicStatus:'HYPOTHETICAL_MODEL_VALUE',authority:'P5_RESEARCH_DRAFT',provenance:'explicit stack-test fixture',evidenceClass:'HYPOTHETICAL',fidelity:'STYLIZED'}});
const canonical=canonicalEligibilityFromP5Next(readiness);
assert.equal(canonical.contractId,CONTRACT_ID);
assert.equal(canonical.state,'INSUFFICIENT_ENVIRONMENT');
assert.equal(canonical.canGenerateBiosphere,false);
assert.equal(canonical.biologyEstablished,false);
assert.equal(canonical.canonicalGenesisAvailable,false);
assert.ok(canonical.unsupported.includes('abiogenesisTrigger'));

const bytes=(x)=>new Uint8Array(32).fill(x);
const env={authority:RESEARCH_AUTHORITY,sourceContract:P5_FRONTIER_CONTRACT,sourceModel:'p5-frontier-v3-explicit-post-genesis-fixture',sourceDigest:bytes(1),planetId:bytes(2),environmentEpochKey:'fixture-epoch-1',viableMedium:'AQUEOUS',phototrophicUsableEnergyU:1000n,chemotrophicUsableEnergyU:null,stressPpm:100000n};
const fixture=postGenesisFixtureEligibility({p5ReadinessWitness:readiness,researchEnvironment:env});
assert.equal(fixture.mode,MODE);
assert.equal(fixture.canGenerateBiosphere,false);
assert.equal(fixture.canonicalGenesisAvailable,false);
assert.equal(fixture.canExercisePostGenesisTransitions,true);
assert.equal(fixture.fixtureIsCanonicalPlanetFact,false);
assert.equal(fixture.fixtureEnvironmentAuthority,RESEARCH_AUTHORITY);

assert.throws(()=>postGenesisFixtureEligibility({p5ReadinessWitness:readiness,researchEnvironment:{...env,sourceContract:'wrong-contract'}}),/exact P5-next/);
assert.throws(()=>canonicalEligibilityFromP5Next({...readiness,canAuthorizeBiology:true}),/fail-closed/);
const status=dependencyStatus();
assert.equal(status.canonicalPositivePath,false);
assert.equal(status.postGenesisFixturePath,true);
assert.equal(status.abiogenesisEstablished,false);
assert.equal(status.readiness,'ORACLE_READY');
console.log('P6 Biology v2 on P5-next interface tests: PASS');
