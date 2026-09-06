import assert from 'node:assert/strict';
import {
  AUTHORITY_CLASSES,
  BASE_SHA,
  BASE_TREE,
  CONTRACT_SET,
  LANE_BRANCH,
  assertAuthorityClass,
  assertContinuity,
  assertExactHead,
  assertMotionEvidence,
  assertNoAuthorityPromotion,
  assertNoRequiredNetwork,
  assertResourceEvidence,
  assertResponsibleProductionDelta,
  assertSingleRuntimeAuthority,
  evidenceJson,
  responsibleProductionDelta,
  stableJson,
  validateEvidenceManifest
} from '../../tools/v1x-14-certification-evidence/evidence-core.mjs';

const fail = (fn, rx) => assert.throws(fn, rx);
const ID = {sha: '1'.repeat(40), tree: '2'.repeat(40)};
const FRAME_A = 'a'.repeat(64), FRAME_B = 'b'.repeat(64);

assert.deepEqual(JSON.parse(evidenceJson({signed: -1n, unsigned: 18446744073709551615n})), {signed: '-1', unsigned: '18446744073709551615'});
assert.equal(stableJson({value: 18446744073709551615n}), '{"value":"18446744073709551615"}');

for (const authority of AUTHORITY_CLASSES) assert.equal(assertAuthorityClass(authority), authority);
fail(() => assertAuthorityClass('CONFIDENCE_HIGH'), /ungoverned authority class/);
assert.equal(assertNoAuthorityPromotion({sourceAuthority: 'PRESENTATION_ONLY', claimedAuthority: 'PRESENTATION_ONLY'}), true);
fail(() => assertNoAuthorityPromotion({sourceAuthority: 'PRESENTATION_ONLY', claimedAuthority: 'CANONICAL_PROVEN'}), /cannot be promoted/);
fail(() => assertNoAuthorityPromotion({sourceAuthority: 'MODEL_DERIVED_SIMULATION', claimedAuthority: 'CANONICAL_PROVEN'}), /cannot be promoted/);

const laneOnly = [
  'tests/v1x-14-certification-evidence/anti-regression.mjs',
  'tools/v1x-14-certification-evidence/evidence-core.mjs',
  'docs/evidence/v1x-14-certification-evidence/README.md'
];
assert.equal(responsibleProductionDelta('experience.continuous-travel', laneOnly).pass, false);
fail(() => assertResponsibleProductionDelta('experience.continuous-travel', laneOnly), /responsible production-file delta/);
assert.equal(responsibleProductionDelta('experience.continuous-travel', ['src/bootstrap/product/input-router.js']).pass, true);
assert.equal(responsibleProductionDelta('experience.true-3d-system', ['src/rendering/v1/living-renderer.js']).pass, true);
assert.equal(responsibleProductionDelta('experience.micro-return', ['docs/README.md']).pass, false);

assert.equal(assertMotionEvidence({states: [{z: 1}, {z: 2}], frames: [{sha256: FRAME_A}, {sha256: FRAME_B}]}), true);
fail(() => assertMotionEvidence({states: [], frames: [{sha256: FRAME_A}, {sha256: FRAME_B}]}), /state trace/);
fail(() => assertMotionEvidence({states: [{z: 1}, {z: 1}], frames: [{sha256: FRAME_A}, {sha256: FRAME_B}]}), /did not change state/);
fail(() => assertMotionEvidence({states: [{z: 1}, {z: 2}], frames: [{sha256: FRAME_A}, {sha256: FRAME_A}]}), /did not change pixels/);

const continuity = [
  {selectionId: 'planet:42', referenceFrameId: 'frame:planet:42'},
  {selectionId: 'planet:42', referenceFrameId: 'frame:planet:42'}
];
assert.equal(assertContinuity(continuity), true);
fail(() => assertContinuity([continuity[0], {...continuity[1], selectionId: 'planet:43'}]), /selection identity changed/);
fail(() => assertContinuity([continuity[0], {...continuity[1], referenceFrameId: 'frame:planet:43'}]), /reference frame changed/);

const authorities = [
  {scaleAuthority: 'ofu-wave-iv-scale-runtime-3', inputAuthority: 'ofu-wave-iv-input-router-6', duplicatePrimaryOwners: 0},
  {scaleAuthority: 'ofu-wave-iv-scale-runtime-3', inputAuthority: 'ofu-wave-iv-input-router-6', duplicatePrimaryOwners: 0}
];
assert.equal(assertSingleRuntimeAuthority(authorities), true);
fail(() => assertSingleRuntimeAuthority([authorities[0], {...authorities[1], scaleAuthority: 'second-scale'}]), /multiple scale authorities/);
fail(() => assertSingleRuntimeAuthority([authorities[0], {...authorities[1], duplicatePrimaryOwners: 1}]), /duplicate primary ownership/);

assert.equal(assertNoRequiredNetwork([]), true);
fail(() => assertNoRequiredNetwork(['https://example.invalid/data']), /required-network activity/);
assert.equal(assertResourceEvidence({embedded: {entries: 2, totalDecodedBytes: 1024}, samples: [{activePatches: 28, cpuMeshes: 64, liveMeshes: 48, liveTrackedBytes: 8 * 1024 * 1024}]}), true);
fail(() => assertResourceEvidence({embedded: {entries: 513, totalDecodedBytes: 1024}}), /resource count/);
fail(() => assertResourceEvidence({embedded: {entries: 2, totalDecodedBytes: 64 * 1024 * 1024 + 1}}), /decoded resource bytes/);
fail(() => assertResourceEvidence({embedded: {entries: 2, totalDecodedBytes: 1024}, samples: [{activePatches: 29}]}), /active surface patches/);

const emptyManifest = {
  schema: 'ofu-v1x14-evidence-manifest-1',
  laneId: 'V1X-14',
  branch: LANE_BRANCH,
  contractSet: CONTRACT_SET,
  base: {sha: BASE_SHA, tree: BASE_TREE},
  checkpoint: ID,
  artifacts: [],
  productionDelta: [],
  claims: [],
  physicalDevices: {android: 'NOT_VERIFIED', ios: 'NOT_VERIFIED'},
  founderAcceptance: 'NOT_GRANTED'
};
assert.equal(validateEvidenceManifest(emptyManifest, {identity: ID}), true);
fail(() => assertExactHead({...emptyManifest, checkpoint: {...ID, sha: '3'.repeat(40)}}, ID), /stale evidence SHA/);
fail(() => validateEvidenceManifest({...emptyManifest, founderAcceptance: 'FOUNDER_ACCEPTED'}), /NOT_GRANTED/);
const falseClosure = {...emptyManifest, claims: [{id: 'experience.continuous-travel', status: 'PASS', implementationEvidence: 'test-only', semanticEvidence: 'assertion-only', journeyEvidence: 'screenshot-only'}]};
fail(() => validateEvidenceManifest(falseClosure), /responsible production-file delta/);

console.log(JSON.stringify({
  schema: 'ofu-v1x14-anti-regression-1',
  status: 'PASS',
  negativeOracles: 18,
  exactHeadInvalidation: true,
  antiTestOnlyClosure: true,
  authorityPromotionRejected: true,
  screenshotOnlyMotionRejected: true,
  continuityMismatchRejected: true,
  duplicateAuthorityRejected: true,
  requiredNetworkRejected: true,
  governedResourceBoundsChecked: true,
  physicalDevices: 'NOT_VERIFIED'
}));
