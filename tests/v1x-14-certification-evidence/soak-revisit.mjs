import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {assertFrozenBase, assertNoRequiredNetwork, assertResourceEvidence, exactGitIdentity, writeJson} from '../../tools/v1x-14-certification-evidence/evidence-core.mjs';

const identity = assertFrozenBase({identity: exactGitIdentity({branch: process.env.V1X_BRANCH || ''})});
const outDir = path.resolve('reports/v1x-14-certification-evidence', identity.sha, 'soak');
fs.mkdirSync(outDir, {recursive: true});
const browser = await chromium.launch({headless: true});
const context = await browser.newContext({viewport: {width: 1280, height: 800}, reducedMotion: 'reduce'});
const page = await context.newPage();
const errors = [], externalRequests = [];
page.on('pageerror', e => errors.push(String(e.message || e)));
page.on('request', r => { if (/^https?:/i.test(r.url())) externalRequests.push(r.url()); });
await page.goto(pathToFileURL(path.resolve('dist/One_File_Universe.html')).href, {waitUntil: 'load'});
await page.waitForFunction(() => OFU?.waveIVScaleRuntime?.snapshot && OFU?.v1Session && OFU?.v1Providers?.snapshot && OFU?.v1LivingProduct?.snapshot?.().initialized, null, {timeout: 30000});
const stages = ['galaxy', 'galactic_region', 'stellar_neighborhood', 'system', 'orbit', 'approach', 'global_surface', 'human', 'global_surface', 'approach', 'system', 'galaxy'];
const samples = [];
for (let cycle = 0; cycle < 12; cycle++) {
  for (const stage of stages) {
    await page.evaluate(stage => OFU.waveIVScaleRuntime.requestStage(stage, {source: 'v1x14-soak'}), stage);
    await page.waitForFunction(stage => OFU.waveIVScaleRuntime.snapshot().semanticScale === stage, stage, {timeout: 10000});
    await page.waitForTimeout(35);
  }
  const saveHex = await page.evaluate(() => OFU.v1Session.hex(OFU.v1Session.exportBytes()));
  await page.evaluate(hex => OFU.v1Session.importBytes(OFU.v1Session.unhex(hex)), saveHex);
  samples.push(await page.evaluate(cycle => {
    const p = globalThis.__OFU_PLANET_PREVIEW__?.snapshot?.() || null;
    const v = OFU.v1Providers.snapshot();
    const l = OFU.v1LivingProduct.runtime.snapshot();
    const s = OFU.v1Session.snapshot();
    const e = OFU.pxResources?.snapshot?.() || {entries: 0, totalDecodedBytes: 0};
    return {
      cycle,
      scale: OFU.waveIVScaleRuntime.snapshot().semanticScale,
      providerCache: v.cacheEntries,
      providerCacheLimit: v.cacheLimit,
      livingHistory: l.historyDepth,
      livingHistoryLimit: l.maxHistory,
      livingCache: l.discoveryCacheEntries,
      livingCacheLimit: l.discoveryCacheLimit,
      sessionBytes: OFU.v1Session.exportBytes().length,
      canonicalMutation: s.canonicalMutation,
      canonicalP6Mutation: s.canonicalP6Mutation,
      embedded: {entries: e.entries || 0, totalDecodedBytes: e.totalDecodedBytes || 0},
      activePatches: p?.workingSet?.activePatches,
      cpuMeshes: p?.workingSet?.cpuMeshes,
      liveMeshes: p?.gpu?.gpu?.liveMeshes ?? p?.gpu?.liveMeshes,
      liveTrackedBytes: p?.gpu?.gpu?.liveTrackedBytes ?? p?.gpu?.liveTrackedBytes
    };
  }, cycle));
}
for (const s of samples) {
  assert.equal(s.scale, 'galaxy');
  assert.ok(s.sessionBytes < 1048576, 'session evidence exceeds upstream bounded-save expectation');
  assert.equal(s.canonicalMutation, false, 'session mutated canonical state');
  assert.equal(s.canonicalP6Mutation, false, 'session mutated canonical P6 state');
  assertResourceEvidence({embedded: s.embedded, samples: [s]});
}
assertNoRequiredNetwork(externalRequests);
assert.equal(errors.length, 0, errors.join('\n'));
writeJson(path.join(outDir, 'resource-soak.json'), {schema: 'ofu-v1x14-resource-soak-1', checkpoint: {sha: identity.sha, tree: identity.tree}, cycles: samples.length, stages, samples, requiredNetworkAttempts: externalRequests, authority: 'MEASURED_RUNTIME_EVIDENCE', physicalDevices: {android: 'NOT_VERIFIED', ios: 'NOT_VERIFIED'}});
console.log(JSON.stringify({status: 'PASS', suite: 'v1x14-soak-revisit', checkpoint: identity.sha, cycles: samples.length, requiredNetworkAttempts: 0, maxSessionBytes: Math.max(...samples.map(s => s.sessionBytes)), physicalDevices: 'NOT_VERIFIED'}));
await context.close();
await browser.close();
