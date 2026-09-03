import fs from 'node:fs';
import assert from 'node:assert/strict';
import {conformanceFixture,findCanonicalTerrestrial,loadP6} from './p6-test-helpers.mjs';

const O=loadP6(),P=O.p2,T=O.p4,P5E=O.p5EnvironmentV2,B=O.p6Biosphere,h=P.hex;
const real=findCanonicalTerrestrial(O),environment=P5E.environmentV2Projection(real.planet,real.topology),adapted=B.adaptEnvironment(environment),eligibility=B.eligibility(adapted);
assert.equal(eligibility.state,B.STATES.INSUFFICIENT_ENVIRONMENT);
assert.equal(eligibility.canGenerateBiosphere,false);
assert.equal(h(eligibility.source.environmentDigest),h(P5E.environmentDigest(environment)));

const binding=B.bindings({masterSeed:real.masterSeed,canonicalUniverseIdentity:real.universeIdentity}),fixture=conformanceFixture(B,binding,real.planet.planetId);
assert.equal(fixture.budget.primaryProductivityCeilingU,2100000000n);
assert.equal(fixture.budget.sustainableBiomassCeilingU,1680000000n);
assert.equal(fixture.budget.energySource,B.ENERGY_SOURCES.PHOTOTROPHIC);
assert.equal(B.assertLod(fixture.macro,fixture.meso,fixture.micro),true);
assert.equal(fixture.micro.persistent,false);
assert.equal(fixture.micro.individualIdentityPromoted,false);
assert.throws(()=>B.energyBudget({phototrophicUsableEnergyU:B.U64_MAX,phototrophicCaptureEfficiencyPpm:B.PPM,chemotrophicUsableEnergyU:B.U64_MAX,chemotrophicCaptureEfficiencyPpm:B.PPM,biomassSupportEfficiencyPpm:B.PPM}),/overflow/);
assert.throws(()=>B.transferCeilings(1n,[1000001n]),/ppm/);
const trophic=B.transferCeilings(1000000n,[100000n,100000n,50000n]);
for(let index=1;index<trophic.length;index++)assert.ok(trophic[index].energyCeilingU<=trophic[index-1].energyCeilingU);

const lineage=T.lineageId(real.universeIdentity,null,'p6-v1-canonical-negative'),baseline=B.canonicalBaseline(environment);
const full=T.replay({universeIdentity:real.universeIdentity,lineage,baseline,events:[],transition:B.TRANSITION_CONTRACT});
const checkpoint=T.checkpoint({universeIdentity:real.universeIdentity,lineage,baseline,events:[],transition:B.TRANSITION_CONTRACT});
const fromCheckpoint=T.replayFromCheckpoint({checkpoint,events:[],transition:B.TRANSITION_CONTRACT});
assert.equal(h(full.digest),h(fromCheckpoint.digest));
const compacted=T.compact({universeIdentity:real.universeIdentity,lineage,baseline,events:[],keepTail:0,transition:B.TRANSITION_CONTRACT});
const fromCompact=T.replayFromCheckpoint({checkpoint:compacted.checkpoint,events:compacted.events,transition:B.TRANSITION_CONTRACT});
assert.equal(h(full.digest),h(fromCompact.digest));
const compactedAgain=T.compact({universeIdentity:real.universeIdentity,lineage,baseline,events:compacted.events,keepTail:0,transition:B.TRANSITION_CONTRACT});
const fromCompactAgain=T.replayFromCheckpoint({checkpoint:compactedAgain.checkpoint,events:compactedAgain.events,transition:B.TRANSITION_CONTRACT});
assert.equal(h(full.digest),h(fromCompactAgain.digest));
const archive=T.exportArchive({universeIdentity:real.universeIdentity,lineage,baseline,checkpoint:compacted.checkpoint,events:compacted.events,transition:B.TRANSITION_CONTRACT});
const reopened=T.replayLiveWorld(T.importArchive(archive,{transition:B.TRANSITION_CONTRACT}),B.TRANSITION_CONTRACT);
assert.equal(h(full.digest),h(reopened.digest));
assert.deepEqual(Object.keys(reopened.state.entities),[]);
assert.throws(()=>T.importArchive(archive),/transition contract/);
assert.deepEqual(B.OWNERSHIP,{privateClock:false,ownsOrdering:false,ownsEventIdentity:false,ownsReplay:false,ownsCheckpoints:false,ownsCompaction:false,ownsLineage:false});

const evidence={status:'PASS',phase:'P6',version:B.VERSION,contractId:B.CONTRACT_ID,p5EnvironmentContract:B.P5_ENV_CONTRACT,p5EnvironmentVersion:B.P5_ENV_VERSION.toString(),p5EnvironmentModel:B.P5_ENV_MODEL,p5EnvironmentAuthority:B.P5_ENV_AUTHORITY,realPlanetId:h(real.planet.planetId),realEligibility:eligibility.state,canGenerateRealBiosphere:eligibility.canGenerateBiosphere,eligibilityContract:B.ELIGIBILITY_CONTRACT,eligibilityWitnessDigest:h(eligibility.witnessDigest),environmentDigest:h(eligibility.source.environmentDigest),identityPolicy:B.IDENTITY_POLICY,semanticManifestHash:h(B.manifestHash()),numericContract:B.NUMERIC_CONTRACT,transitionContract:B.TRANSITION_ID+'@'+B.TRANSITION_VERSION,transitionScope:B.TRANSITION_SCOPE,transitionDigest:h(T.transitionContractDigest(B.TRANSITION_CONTRACT.descriptor)),biosphereId:h(fixture.ids.biosphereId),lineageId:h(fixture.ids.lineageId),speciesId:h(fixture.ids.speciesId),primaryProductivityCeilingU:fixture.budget.primaryProductivityCeilingU.toString(),sustainableBiomassCeilingU:fixture.budget.sustainableBiomassCeilingU.toString(),persistentStateDigest:h(full.digest),archiveDigest:O.sha256.hex(archive),replayCheckpointCompaction:true,lodInvariant:true,individualIdentityPromoted:false,persistentLineageTransitions:false,acceptedBiologicalTransitions:0,privateClock:B.OWNERSHIP.privateClock};
fs.mkdirSync('dist/evidence/p6',{recursive:true});
fs.writeFileSync('dist/evidence/p6/p6-node.json',JSON.stringify(evidence,null,2)+'\n');
console.log('P6 canonical v1 hardening conformance: PASS');
console.log(JSON.stringify(evidence));
