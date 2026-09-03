import assert from 'node:assert/strict';
import {findCanonicalTerrestrial,loadP6} from './p6-test-helpers.mjs';

const O=loadP6(),P=O.p2,B=O.p6Biosphere,T=O.p4,E=O.p5EnvironmentV2,h=P.hex;
const oldSeed='11'.repeat(32),oldManifest='22'.repeat(32),legacyText=O.save.exportPortable({masterSeed256:oldSeed,manifestHash:oldManifest,events:[{type:'P5_LEGACY_MARKER',data:{phase:'P5',biology:null}}]}),legacy=O.save.importPortable(legacyText,{masterSeed256:oldSeed,manifestHash:oldManifest});
assert.equal(legacy.schemaVersion,1);
assert.equal(legacy.events[0].data.biology,null);
assert.equal(Object.hasOwn(legacy,'p6'),false);
assert.equal(B.renderingProjection(null).state,B.STATES.INSUFFICIENT_ENVIRONMENT);
assert.equal(B.renderingProjection(null).biologyEstablished,false);

const real=findCanonicalTerrestrial(O),projection=E.environmentV2Projection(real.planet,real.topology),baseline=B.canonicalBaseline(projection),lineage=T.lineageId(real.universeIdentity,null,'p6-save-negative');
const checkpoint=T.checkpoint({universeIdentity:real.universeIdentity,lineage,baseline,events:[],transition:B.TRANSITION_CONTRACT});
const archive=T.exportArchive({universeIdentity:real.universeIdentity,lineage,baseline,checkpoint,events:[],transition:B.TRANSITION_CONTRACT});
const imported=T.importArchive(archive,{transition:B.TRANSITION_CONTRACT}),reopened=T.replayLiveWorld(imported,B.TRANSITION_CONTRACT);
assert.deepEqual(Object.keys(reopened.state.entities),[]);
assert.equal(reopened.state.baseline.persistentBiologyEstablished,false);
assert.equal(reopened.state.baseline.persistentLineageTransitions,'DEFERRED');
assert.equal(h(reopened.state.baseline.manifestHash),h(B.manifestHash()));
assert.equal(h(reopened.state.baseline.p5EnvironmentDigest),h(E.environmentDigest(projection)));
assert.throws(()=>T.importArchive(archive),/transition contract/);
console.log('P6 save compatibility: PASS');
