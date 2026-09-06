import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

export const CONTRACT_SET = 'OFU-V1X-CONTRACT-SET-2026-09-06.1';
export const MATRIX_VERSION = '2026-09-06.1';
export const LANE_ID = 'V1X-14';
export const LANE_BRANCH = 'parallel/v1x-14-certification-evidence-2026-09-06';
export const OWNER_NAMESPACE = 'v1x-14-certification-evidence';
export const BASE_SHA = '760c0c70bccb6afd7c7b07600c0f5be3f80e7b19';
export const BASE_TREE = '3324e6354b5ff1b90156d1693e6051595b6f1219';
export const AUTHORITY_CLASSES = Object.freeze([
  'CANONICAL_PROVEN',
  'DERIVED',
  'MODEL_DERIVED_SIMULATION',
  'PRESENTATION_ONLY',
  'MEASURED_RUNTIME_EVIDENCE'
]);
export const MAX_EMBEDDED_RESOURCE_COUNT = 512;
export const MAX_DECODED_RESOURCE_BYTES = 64 * 1024 * 1024;

const SHA40 = /^[0-9a-f]{40}$/;
const SHA256 = /^[0-9a-f]{64}$/;
const OWNED_PREFIXES = Object.freeze([
  `tests/${OWNER_NAMESPACE}/`,
  `tools/${OWNER_NAMESPACE}/`,
  `docs/evidence/${OWNER_NAMESPACE}/`,
  `docs/parallel/handoffs/${OWNER_NAMESPACE}/`,
  `reports/${OWNER_NAMESPACE}/`
]);
const OWNED_EXACT = new Set([`config/conformance/${OWNER_NAMESPACE}.json`]);

const RESPONSIBLE_PATHS = Object.freeze({
  'experience.no-primary-grid': ['src/bootstrap/product/', 'src/scenes/v1/', 'src/rendering/v1/'],
  'experience.true-3d-system': ['src/bootstrap/product/', 'src/scenes/v1/', 'src/rendering/v1/'],
  'experience.one-camera-scale-authority': ['src/bootstrap/product/scale-runtime.js', 'src/bootstrap/product/input-router.js', 'src/bootstrap/product/living-universe.js'],
  'experience.continuous-travel': ['src/bootstrap/product/scale-runtime.js', 'src/bootstrap/product/input-router.js', 'src/bootstrap/product/living-universe.js', 'src/scenes/v1/'],
  'experience.identity-reference-frame-continuity': ['src/bootstrap/product/', 'src/scenes/v1/', 'src/rendering/v1/'],
  'experience.model-correlated-surface-life-civ': ['src/bootstrap/product/', 'src/domains/v1/', 'src/scenes/v1/', 'src/rendering/v1/'],
  'experience.micro-return': ['src/bootstrap/product/', 'src/domains/v1/', 'src/scenes/v1/', 'src/rendering/v1/'],
  'resource.bounded': ['src/extensions/resources.js', 'src/bootstrap/product/', 'src/rendering/v1/', 'src/scenes/v1/']
});

export function isOwnedPath(file) {
  const p = String(file).replaceAll('\\', '/');
  return OWNED_EXACT.has(p) || OWNED_PREFIXES.some(prefix => p.startsWith(prefix));
}

export function sha256Bytes(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function sha256File(file) {
  return sha256Bytes(fs.readFileSync(file));
}

export function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

export function git(args, {cwd = process.cwd(), allowFailure = false} = {}) {
  const result = spawnSync('git', args, {cwd, encoding: 'utf8'});
  if (result.error) throw result.error;
  if (result.status !== 0 && !allowFailure) {
    throw new Error(`git ${args.join(' ')} failed: ${String(result.stderr || result.stdout).trim()}`);
  }
  return result;
}

export function gitText(args, options) {
  return String(git(args, options).stdout).trim();
}

export function exactGitIdentity({cwd = process.cwd(), branch = process.env.V1X_BRANCH} = {}) {
  const sha = gitText(['rev-parse', 'HEAD'], {cwd});
  const tree = gitText(['show', '-s', '--format=%T', 'HEAD'], {cwd});
  const actualBranch = String(branch || gitText(['branch', '--show-current'], {cwd})).replace(/^refs\/heads\//, '').replace(/^origin\//, '');
  assert.match(sha, SHA40, 'HEAD SHA must be a Git SHA-1 identity');
  assert.match(tree, SHA40, 'HEAD tree must be a Git SHA-1 identity');
  return Object.freeze({sha, tree, branch: actualBranch});
}

export function assertFrozenBase({cwd = process.cwd(), identity = exactGitIdentity({cwd})} = {}) {
  assert.equal(gitText(['show', '-s', '--format=%T', BASE_SHA], {cwd}), BASE_TREE, 'frozen base tree mismatch');
  assert.equal(git(['merge-base', '--is-ancestor', BASE_SHA, identity.sha], {cwd, allowFailure: true}).status, 0, 'frozen base is not an ancestor of target HEAD');
  if (identity.branch) assert.equal(identity.branch, LANE_BRANCH, 'execution is not on the write-authorized lane branch');
  return identity;
}

export function diffPaths(base = BASE_SHA, head = 'HEAD', {cwd = process.cwd()} = {}) {
  return gitText(['diff', '--name-only', `${base}..${head}`], {cwd}).split(/\r?\n/).filter(Boolean).sort();
}

export function responsibleProductionDelta(claimId, changedPaths) {
  const patterns = RESPONSIBLE_PATHS[claimId];
  assert.ok(patterns, `unknown founder-critical claim: ${claimId}`);
  const paths = [...new Set(changedPaths.map(String))].sort();
  const responsible = paths.filter(file => !isOwnedPath(file) && patterns.some(prefix => file === prefix || file.startsWith(prefix)));
  return Object.freeze({claimId, responsible, pass: responsible.length > 0});
}

export function assertResponsibleProductionDelta(claimId, changedPaths) {
  const result = responsibleProductionDelta(claimId, changedPaths);
  assert.equal(result.pass, true, `${claimId} cannot close without a responsible production-file delta`);
  return result;
}

export function assertAuthorityClass(value) {
  assert.ok(AUTHORITY_CLASSES.includes(value), `ungoverned authority class: ${value}`);
  return value;
}

export function assertNoAuthorityPromotion({sourceAuthority, claimedAuthority}) {
  assertAuthorityClass(sourceAuthority);
  assertAuthorityClass(claimedAuthority);
  const nonCanonical = new Set(['DERIVED', 'MODEL_DERIVED_SIMULATION', 'PRESENTATION_ONLY', 'MEASURED_RUNTIME_EVIDENCE']);
  assert.ok(!(nonCanonical.has(sourceAuthority) && claimedAuthority === 'CANONICAL_PROVEN'), `${sourceAuthority} evidence cannot be promoted to CANONICAL_PROVEN`);
  return true;
}

export function assertExactHead(manifest, identity) {
  assert.ok(manifest && manifest.checkpoint, 'evidence manifest checkpoint is required');
  assert.equal(manifest.checkpoint.sha, identity.sha, 'stale evidence SHA: rerun certification at exact HEAD');
  assert.equal(manifest.checkpoint.tree, identity.tree, 'stale evidence tree: rerun certification at exact HEAD');
  return true;
}

export function assertMotionEvidence(evidence) {
  assert.ok(evidence && Array.isArray(evidence.states) && evidence.states.length >= 2, 'motion claim requires deterministic state trace, not screenshots alone');
  assert.ok(Array.isArray(evidence.frames) && evidence.frames.length >= 2, 'motion claim requires a frame sequence');
  const stateDigests = new Set(evidence.states.map(stableJson));
  const frameDigests = new Set(evidence.frames.map(frame => frame.sha256));
  assert.ok(stateDigests.size >= 2, 'motion trace did not change state');
  assert.ok(frameDigests.size >= 2, 'frame sequence did not change pixels');
  for (const frame of evidence.frames) assert.match(frame.sha256, SHA256, 'frame digest must be SHA-256');
  return true;
}

export function assertContinuity(samples) {
  assert.ok(Array.isArray(samples) && samples.length >= 2, 'continuity requires multiple state samples');
  const first = samples[0];
  assert.ok(first.selectionId, 'continuity witness requires selection identity');
  assert.ok(first.referenceFrameId, 'continuity witness requires reference-frame identity');
  for (const sample of samples.slice(1)) {
    assert.equal(sample.selectionId, first.selectionId, 'selection identity changed across scale travel');
    assert.equal(sample.referenceFrameId, first.referenceFrameId, 'reference frame changed without governed reconciliation witness');
  }
  return true;
}

export function assertSingleRuntimeAuthority(samples) {
  assert.ok(Array.isArray(samples) && samples.length >= 2, 'authority witness requires multiple samples');
  const scaleAuthorities = new Set(samples.map(sample => sample.scaleAuthority).filter(Boolean));
  const inputAuthorities = new Set(samples.map(sample => sample.inputAuthority).filter(Boolean));
  assert.equal(scaleAuthorities.size, 1, 'multiple scale authorities observed');
  assert.equal(inputAuthorities.size, 1, 'multiple input authorities observed');
  assert.equal(samples.some(sample => Number(sample.duplicatePrimaryOwners || 0) > 0), false, 'duplicate primary ownership observed');
  return true;
}

export function assertNoRequiredNetwork(attempts) {
  assert.ok(Array.isArray(attempts), 'network witness must be an array');
  assert.equal(attempts.length, 0, `required-network activity observed: ${attempts.join(', ')}`);
  return true;
}

export function assertResourceEvidence({embedded, samples = []}) {
  assert.ok(embedded && Number.isSafeInteger(embedded.entries) && Number.isSafeInteger(embedded.totalDecodedBytes), 'embedded resource snapshot required');
  assert.ok(embedded.entries <= MAX_EMBEDDED_RESOURCE_COUNT, 'embedded resource count exceeds governed budget');
  assert.ok(embedded.totalDecodedBytes <= MAX_DECODED_RESOURCE_BYTES, 'decoded resource bytes exceed governed budget');
  for (const sample of samples) {
    if (sample.providerCache !== undefined && sample.providerCacheLimit !== undefined) assert.ok(sample.providerCache <= sample.providerCacheLimit, 'provider cache exceeds runtime limit');
    if (sample.livingHistory !== undefined && sample.livingHistoryLimit !== undefined) assert.ok(sample.livingHistory <= sample.livingHistoryLimit, 'history exceeds runtime limit');
    if (sample.livingCache !== undefined && sample.livingCacheLimit !== undefined) assert.ok(sample.livingCache <= sample.livingCacheLimit, 'discovery cache exceeds runtime limit');
    if (sample.activePatches !== undefined) assert.ok(sample.activePatches <= 28, 'active surface patches exceed frozen upstream soak bound');
    if (sample.cpuMeshes !== undefined) assert.ok(sample.cpuMeshes <= 64, 'CPU mesh count exceeds frozen upstream soak bound');
    if (sample.liveMeshes !== undefined) assert.ok(sample.liveMeshes <= 48, 'GPU live mesh count exceeds frozen upstream soak bound');
    if (sample.liveTrackedBytes !== undefined) assert.ok(sample.liveTrackedBytes <= 8 * 1024 * 1024, 'GPU tracked bytes exceed frozen upstream soak bound');
  }
  return true;
}

export function validateEvidenceManifest(manifest, {identity = null} = {}) {
  assert.equal(manifest?.schema, 'ofu-v1x14-evidence-manifest-1');
  assert.equal(manifest.laneId, LANE_ID);
  assert.equal(manifest.branch, LANE_BRANCH);
  assert.equal(manifest.contractSet, CONTRACT_SET);
  assert.deepEqual(manifest.base, {sha: BASE_SHA, tree: BASE_TREE});
  assert.match(manifest.checkpoint?.sha || '', SHA40);
  assert.match(manifest.checkpoint?.tree || '', SHA40);
  assert.ok(Array.isArray(manifest.artifacts));
  for (const artifact of manifest.artifacts) {
    assert.equal(typeof artifact.path, 'string');
    assert.match(artifact.sha256, SHA256);
    assertAuthorityClass(artifact.authorityClass);
  }
  assert.ok(Array.isArray(manifest.claims));
  for (const claim of manifest.claims) {
    assert.ok(RESPONSIBLE_PATHS[claim.id], `unregistered critical claim ${claim.id}`);
    assert.ok(['PASS', 'FAIL', 'NOT_RUN'].includes(claim.status));
    if (claim.status === 'PASS') {
      assert.ok(claim.implementationEvidence, `${claim.id} PASS lacks implementation evidence`);
      assert.ok(claim.semanticEvidence, `${claim.id} PASS lacks semantic evidence`);
      assert.ok(claim.journeyEvidence, `${claim.id} PASS lacks visual/journey evidence`);
      assertResponsibleProductionDelta(claim.id, manifest.productionDelta || []);
      if (claim.id === 'resource.bounded') assert.ok(claim.resourceEvidence, 'resource PASS lacks measured resource evidence');
    }
  }
  assert.equal(manifest.founderAcceptance, 'NOT_GRANTED');
  assert.equal(manifest.physicalDevices?.android, 'NOT_VERIFIED');
  assert.equal(manifest.physicalDevices?.ios, 'NOT_VERIFIED');
  if (identity) assertExactHead(manifest, identity);
  return true;
}
