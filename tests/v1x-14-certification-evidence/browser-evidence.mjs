import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium, firefox, webkit} from 'playwright';
import {
  BASE_SHA,
  BASE_TREE,
  LANE_BRANCH,
  assertFrozenBase,
  assertMotionEvidence,
  assertNoRequiredNetwork,
  assertResourceEvidence,
  exactGitIdentity,
  writeJson
} from '../../tools/v1x-14-certification-evidence/evidence-core.mjs';

const browserName = (process.argv.find(x => x.startsWith('--browser=')) || '--browser=chromium').split('=')[1];
const engines = {chromium, firefox, webkit};
assert.ok(engines[browserName], `unsupported browser ${browserName}`);
const identity = assertFrozenBase({identity: exactGitIdentity({branch: process.env.V1X_BRANCH || ''})});
const outDir = path.resolve('reports/v1x-14-certification-evidence', identity.sha, browserName);
fs.mkdirSync(path.join(outDir, 'frames'), {recursive: true});
const launchOptions = {
  headless: true,
  ...(browserName === 'firefox'
    ? {firefoxUserPrefs: {'webgl.disabled': false, 'webgl.force-enabled': true, 'webgl.forbid-software': false}}
    : {})
};
const browser = await engines[browserName].launch(launchOptions);
const context = await browser.newContext({viewport: {width: 1280, height: 800}, reducedMotion: 'reduce'});
const page = await context.newPage();
const pageErrors = [];
const externalRequests = [];
page.on('pageerror', e => pageErrors.push(String(e.message || e)));
page.on('request', request => {
  const url = request.url();
  if (/^https?:/i.test(url)) externalRequests.push(url);
});
const target = pathToFileURL(path.resolve('dist/One_File_Universe.html')).href;
await page.goto(target, {waitUntil: 'load'});
await page.waitForFunction(() => OFU?.waveIVScaleRuntime?.snapshot && OFU?.waveIVInputRouter?.snapshot && OFU?.v1LivingProduct?.snapshot?.().initialized, null, {timeout: 30000});
assert.equal(new URL(page.url()).protocol, 'file:', 'journey must execute as direct-file');

const sample = async label => page.evaluate(label => {
  const scale = OFU.waveIVScaleRuntime.snapshot();
  const input = OFU.waveIVInputRouter.snapshot();
  const preview = globalThis.__OFU_PLANET_PREVIEW__?.snapshot?.() || null;
  const providers = OFU.v1Providers?.snapshot?.() || null;
  const living = OFU.v1LivingProduct?.runtime?.snapshot?.() || null;
  return {
    label,
    scaleContract: scale.contract,
    inputContract: input.contract,
    semanticScale: scale.semanticScale,
    distanceIntentRadii: scale.distanceIntentRadii,
    intentKind: scale.intentKind,
    activeSceneProvider: scale.activeSceneProvider,
    selectedCanonicalTarget: scale.selectedCanonicalTarget,
    cameraIntent: scale.cameraIntent,
    commandCount: scale.commandCount,
    cameraCommandCount: scale.cameraCommandCount,
    scaleChanges: scale.scaleChanges,
    selectionChanges: scale.selectionChanges,
    inputLastIntent: input.lastIntent,
    wheelCommands: input.wheelCommands,
    pinchIntents: input.pinchIntents,
    pointerIntents: input.pointerIntents,
    keyboardIntents: input.keyboardIntents,
    embeddedResources: OFU.pxResources?.snapshot?.() || null,
    providerCache: providers ? {entries: providers.cacheEntries, limit: providers.cacheLimit} : null,
    living: living ? {stage: living.stage, historyDepth: living.historyDepth, maxHistory: living.maxHistory, discoveryCacheEntries: living.discoveryCacheEntries, discoveryCacheLimit: living.discoveryCacheLimit} : null,
    workingSet: preview?.workingSet || null,
    gpu: preview?.gpu || null
  };
}, label);

const states = [];
const frames = [];
const stages = ['system', 'orbit', 'approach', 'global_surface', 'approach', 'orbit', 'system'];
for (let i = 0; i < stages.length; i++) {
  const stage = stages[i];
  await page.evaluate(stage => OFU.waveIVScaleRuntime.requestStage(stage, {source: 'v1x14-evidence'}), stage);
  await page.waitForFunction(stage => OFU.waveIVScaleRuntime.snapshot().semanticScale === stage, stage, {timeout: 10000});
  await page.waitForTimeout(80);
  states.push(await sample(`${i}-${stage}`));
  const framePath = path.join(outDir, 'frames', `${String(i).padStart(2, '0')}-${stage}.png`);
  const bytes = await page.screenshot({path: framePath, fullPage: true});
  frames.push({path: path.relative(process.cwd(), framePath).replaceAll('\\', '/'), sha256: crypto.createHash('sha256').update(bytes).digest('hex')});
}

assert.equal(states.every(s => s.scaleContract === 'ofu-wave-iv-scale-runtime-3'), true, 'unexpected scale authority contract');
assert.equal(states.every(s => s.inputContract === 'ofu-wave-iv-input-intent-3'), true, 'unexpected input intent contract');
assert.equal(new Set(states.map(s => s.scaleContract)).size, 1, 'multiple scale authority contracts observed');
assertNoRequiredNetwork(externalRequests);
assertMotionEvidence({states: states.map(s => ({semanticScale: s.semanticScale, distanceIntentRadii: s.distanceIntentRadii, activeSceneProvider: s.activeSceneProvider})), frames});
const last = states.at(-1);
const embedded = last.embeddedResources || {entries: 0, totalDecodedBytes: 0};
assertResourceEvidence({
  embedded: {entries: embedded.entries || 0, totalDecodedBytes: embedded.totalDecodedBytes || 0},
  samples: states.map(s => ({
    providerCache: s.providerCache?.entries,
    providerCacheLimit: s.providerCache?.limit,
    livingHistory: s.living?.historyDepth,
    livingHistoryLimit: s.living?.maxHistory,
    livingCache: s.living?.discoveryCacheEntries,
    livingCacheLimit: s.living?.discoveryCacheLimit,
    activePatches: s.workingSet?.activePatches,
    cpuMeshes: s.workingSet?.cpuMeshes,
    liveMeshes: s.gpu?.gpu?.liveMeshes ?? s.gpu?.liveMeshes,
    liveTrackedBytes: s.gpu?.gpu?.liveTrackedBytes ?? s.gpu?.liveTrackedBytes
  }))
});
assert.equal(pageErrors.length, 0, pageErrors.join('\n'));

const trace = {
  schema: 'ofu-v1x14-browser-trace-1',
  laneId: 'V1X-14',
  branch: LANE_BRANCH,
  base: {sha: BASE_SHA, tree: BASE_TREE},
  checkpoint: {sha: identity.sha, tree: identity.tree},
  browser: browserName,
  directFile: true,
  requiredNetworkAttempts: externalRequests,
  states,
  frames,
  referenceFrameContinuity: 'NOT_VERIFIED_NO_PUBLIC_REFERENCE_FRAME_WITNESS',
  physicalDevices: {android: 'NOT_VERIFIED', ios: 'NOT_VERIFIED'},
  authority: 'MEASURED_RUNTIME_EVIDENCE'
};
writeJson(path.join(outDir, 'trace.json'), trace);
console.log(JSON.stringify({status: 'PASS', suite: 'v1x14-browser-evidence', browser: browserName, checkpoint: identity.sha, frames: frames.length, states: states.length, directFile: true, requiredNetworkAttempts: 0, referenceFrameContinuity: trace.referenceFrameContinuity, physicalDevices: trace.physicalDevices}));
await context.close();
await browser.close();