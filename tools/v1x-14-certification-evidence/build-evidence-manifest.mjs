#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  BASE_SHA,
  BASE_TREE,
  CONTRACT_SET,
  LANE_BRANCH,
  assertFrozenBase,
  diffPaths,
  exactGitIdentity,
  isOwnedPath,
  sha256File,
  validateEvidenceManifest,
  writeJson
} from './evidence-core.mjs';

const identity = assertFrozenBase({identity: exactGitIdentity({branch: process.env.V1X_BRANCH || ''})});
const root = path.resolve('reports/v1x-14-certification-evidence', identity.sha);
const files = [];
if (fs.existsSync(root)) {
  const walk = dir => { for (const entry of fs.readdirSync(dir, {withFileTypes: true})) { const p = path.join(dir, entry.name); if (entry.isDirectory()) walk(p); else if (entry.isFile()) files.push(p); } };
  walk(root);
}
const artifacts = files.filter(file => !file.endsWith('evidence-manifest.json')).sort().map(file => ({
  path: path.relative(process.cwd(), file).replaceAll('\\', '/'),
  sha256: sha256File(file),
  kind: file.endsWith('.png') ? 'FRAME' : file.endsWith('trace.json') ? 'STATE_TRACE' : file.endsWith('resource-soak.json') ? 'RESOURCE_SAMPLE' : 'TEST_RESULT',
  authorityClass: 'MEASURED_RUNTIME_EVIDENCE',
  claim: file.includes('resource-soak') ? 'resource.bounded' : 'experience.continuous-travel'
}));
const changed = diffPaths(BASE_SHA, identity.sha);
const productionDelta = changed.filter(file => !isOwnedPath(file));
const browsers = Object.fromEntries(['chromium','firefox','webkit'].map(name => [name, fs.existsSync(path.join(root, name, 'trace.json')) ? 'PASS' : 'NOT_RUN']));
const allBrowsers = Object.values(browsers).every(x => x === 'PASS');
const claims = [
  'experience.no-primary-grid',
  'experience.true-3d-system',
  'experience.one-camera-scale-authority',
  'experience.continuous-travel',
  'experience.identity-reference-frame-continuity',
  'experience.model-correlated-surface-life-civ',
  'experience.micro-return',
  'resource.bounded'
].map(id => ({id, status: 'NOT_RUN'}));
const manifest = {
  schema: 'ofu-v1x14-evidence-manifest-1',
  laneId: 'V1X-14',
  branch: LANE_BRANCH,
  contractSet: CONTRACT_SET,
  base: {sha: BASE_SHA, tree: BASE_TREE},
  checkpoint: {sha: identity.sha, tree: identity.tree},
  artifacts,
  productionDelta,
  claims,
  browserMatrix: {...browsers, directFile: true, requiredNetwork: false},
  physicalDevices: {android: 'NOT_VERIFIED', ios: 'NOT_VERIFIED'},
  founderAcceptance: 'NOT_GRANTED',
  certificationEligible: false,
  certificationReason: productionDelta.length === 0 ? 'NO_RESPONSIBLE_PRODUCTION_DELTA_ON_EVIDENCE_LANE' : allBrowsers ? 'REQUIRES_CLAIM_SPECIFIC_ORACLE_ADJUDICATION' : 'BROWSER_MATRIX_INCOMPLETE'
};
validateEvidenceManifest(manifest, {identity});
fs.mkdirSync(root, {recursive: true});
writeJson(path.join(root, 'evidence-manifest.json'), manifest);
console.log(JSON.stringify({status: 'PASS', suite: 'v1x14-evidence-manifest', checkpoint: identity.sha, artifacts: artifacts.length, productionDelta: productionDelta.length, browserMatrix: manifest.browserMatrix, certificationEligible: false, certificationReason: manifest.certificationReason}));
