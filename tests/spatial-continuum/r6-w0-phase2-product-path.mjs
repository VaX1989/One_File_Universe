import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const snapshot = page => page.evaluate(() => __OFU_SPATIAL_CONTINUUM__.snapshot());

const compactState = state => state ? {
  status: state.status,
  stage: state.state?.scale?.semanticStage,
  targetStage: state.state?.scale?.targetStage,
  coordinate: state.state?.scale?.coordinate,
  targetCoordinate: state.state?.scale?.targetCoordinate,
  moving: state.state?.scale?.moving,
  focusId: state.openUniverse?.focusId,
  focusKind: state.openUniverse?.focusKind,
  worldIdentity: state.worldIdentity,
  surfaceIdentity: state.openUniverse?.surfaceIdentity,
  address: state.openUniverse?.currentAddress?.serialized || state.openUniverse?.currentAddress,
  catalogue: Array.isArray(state.openUniverse?.catalogue) ? state.openUniverse.catalogue.map(item => ({ id: item.id, kind: item.kind })) : [],
  render: {
    sceneCount: state.render?.sceneCount,
    cameraCount: state.render?.cameraCount,
    rendererOwnedPicking: state.render?.rendererOwnedPicking,
    planetaryLod: state.render?.planetaryLod,
    surfaceConvergence: state.render?.surfaceConvergence
  }
} : null;

export function createProductPathDiagnostics(page, { evidenceDir, suite = 'r6-w0-phase2-product-path' } = {}) {
  const directory = path.resolve(evidenceDir || path.join(process.cwd(), 'reports', 'local', 'spatial-continuum-r6-w0-phase2-product-path'));
  fs.mkdirSync(directory, { recursive: true });
  const timeline = [];
  return Object.freeze({
    directory,
    timeline,
    async record(step, extra = {}) {
      const state = await snapshot(page);
      const entry = { index: timeline.length, step: String(step), at: Date.now(), state: compactState(state), ...extra };
      timeline.push(entry);
      fs.writeFileSync(path.join(directory, 'phase2-product-path-timeline.json'), JSON.stringify({ suite, timeline }, null, 2) + '\n');
      console.log('PHASE2_PRODUCT_PATH=' + JSON.stringify(entry));
      return state;
    }
  });
}

export async function waitForSemanticStage(page, stage, { timeout = 15000 } = {}) {
  const expected = String(stage).toUpperCase();
  await page.waitForFunction(expectedStage => {
    const state = globalThis.__OFU_SPATIAL_CONTINUUM__?.snapshot?.();
    return state?.state?.scale?.semanticStage === expectedStage && state?.state?.scale?.moving === false;
  }, expected, { timeout });
  return snapshot(page);
}

export async function waitForMacroCommit(page, { timeout = 30000, diagnostics = null, label = 'macro-commit' } = {}) {
  await page.waitForFunction(() => {
    const state = globalThis.__OFU_SPATIAL_CONTINUUM__?.snapshot?.();
    const macro = state?.render?.macro;
    const targets = state?.render?.pickTargets?.macro || {};
    const targetCount = Object.keys(targets).length;
    return !!macro && macro.pending === 0 && macro.signature === macro.targetSignature && Number(macro.selectable) > 0 && targetCount > 0;
  }, undefined, { timeout });
  const state = diagnostics ? await diagnostics.record(label + ':settled') : await snapshot(page);
  const macro = state?.render?.macro || {};
  assert.equal(macro.pending, 0, 'macro commit must have no pending materialization');
  assert.equal(macro.signature, macro.targetSignature, 'macro visible signature must match the committed target signature');
  assert.ok(Object.keys(state?.render?.pickTargets?.macro || {}).length > 0, 'macro commit must expose renderer-owned pick targets');
  return state;
}

export async function requestTravelAccepted(page, stage, { diagnostics = null, label = null } = {}) {
  const expected = String(stage).toUpperCase();
  if (diagnostics) await diagnostics.record((label || expected) + ':before-request');
  const requested = await page.evaluate(expectedStage => globalThis.__OFU_SPATIAL_CONTINUUM__.travelTo(expectedStage), expected);
  const after = diagnostics ? await diagnostics.record((label || expected) + ':after-request', { requested }) : await snapshot(page);
  const accepted = requested === true || requested?.targetStage === expected || requested?.semanticStage === expected || after?.state?.scale?.targetStage === expected || after?.state?.scale?.semanticStage === expected;
  assert.equal(accepted, true, 'travel to ' + expected + ' must be accepted by current semantic context');
  return { requested, after };
}

export async function travelAccepted(page, stage, { timeout = 15000, visualSettleMs = 0, diagnostics = null, label = null } = {}) {
  const expected = String(stage).toUpperCase();
  await requestTravelAccepted(page, expected, { diagnostics, label });
  const settled = await waitForSemanticStage(page, expected, { timeout });
  if (diagnostics) await diagnostics.record((label || expected) + ':settled');
  if (visualSettleMs > 0) await page.waitForTimeout(visualSettleMs);
  return visualSettleMs > 0 ? snapshot(page) : settled;
}

async function chooseAndSettle(page, id, expectedStage, diagnostics, label, timeout = 15000) {
  if (diagnostics) await diagnostics.record(label + ':before-select', { selectedId: id });
  const outcome = await page.evaluate(selectedId => {
    try {
      const value = globalThis.__OFU_SPATIAL_CONTINUUM__.chooseDestination(selectedId);
      return { ok: true, returnedStage: value?.state?.scale?.semanticStage || value?.scale?.semanticStage || null };
    } catch (error) {
      return { ok: false, error: String(error?.stack || error) };
    }
  }, id);
  if (diagnostics) await diagnostics.record(label + ':after-select', { selectedId: id, outcome });
  if (!outcome.ok) return { ok: false, outcome };
  try {
    await page.evaluate(limit => globalThis.__OFU_SPATIAL_CONTINUUM__.waitForSettled(limit), timeout);
    await page.waitForFunction(({ selectedId, stage }) => {
      const state = globalThis.__OFU_SPATIAL_CONTINUUM__.snapshot();
      return state.openUniverse?.focusId === selectedId && state.state?.scale?.semanticStage === stage && state.state?.scale?.moving === false;
    }, { selectedId: id, stage: expectedStage }, { timeout });
  } catch (error) {
    if (diagnostics) await diagnostics.record(label + ':settle-failed', { selectedId: id, error: String(error?.message || error) });
    return { ok: false, outcome: { ok: false, error: String(error?.message || error) } };
  }
  const state = diagnostics ? await diagnostics.record(label + ':settled', { selectedId: id }) : await snapshot(page);
  return { ok: true, state };
}

export async function enterSupportedOrbit(page, { diagnostics = null, timeout = 20000 } = {}) {
  if (diagnostics) await diagnostics.record('ready');
  const ready = await waitForMacroCommit(page, { diagnostics, timeout, label: 'initial-macro' });
  const galaxyIds = Object.keys(ready.render?.pickTargets?.macro || {}).sort();
  if (diagnostics) await diagnostics.record('initial-macro-catalogue', { galaxyIds });
  assert.ok(galaxyIds.length, 'a selectable galaxy is required');

  const galaxyId = galaxyIds[0];
  const galaxy = await chooseAndSettle(page, galaxyId, 'GALAXY', diagnostics, 'galaxy', timeout);
  assert.equal(galaxy.ok, true, 'galaxy selection must settle');
  const galaxyState = galaxy.state || await snapshot(page);
  const regionId = galaxyState.openUniverse?.catalogue?.[0]?.id;
  if (diagnostics) await diagnostics.record('region-catalogue-ready', { regionId });
  assert.ok(regionId, 'a region is required');

  const region = await chooseAndSettle(page, regionId, 'REGION', diagnostics, 'region', timeout);
  assert.equal(region.ok, true, 'region selection must settle');
  await travelAccepted(page, 'NEIGHBORHOOD', { timeout, diagnostics, label: 'neighborhood' });
  await page.waitForFunction(() => {
    try { return globalThis.__OFU_SPATIAL_CONTINUUM__.openUniverse.catalogueFor('NEIGHBORHOOD').length > 0; }
    catch { return false; }
  }, undefined, { timeout });
  const systemIds = await page.evaluate(() => globalThis.__OFU_SPATIAL_CONTINUUM__.openUniverse.catalogueFor('NEIGHBORHOOD').map(item => item.id).sort());
  if (diagnostics) await diagnostics.record('system-catalogue-ready', { systemIds });
  assert.ok(systemIds.length, 'a system catalogue is required');

  const attempts = [];
  for (const systemId of systemIds) {
    const system = await chooseAndSettle(page, systemId, 'SYSTEM', diagnostics, 'system:' + systemId.slice(0, 10), timeout);
    if (!system.ok) { attempts.push({ systemId, outcome: system.outcome }); continue; }
    const systemState = system.state || await snapshot(page);
    const bodies = (systemState.openUniverse?.catalogue || []).filter(item => item.kind === 'PLANET' || item.kind === 'MOON').sort((a, b) => String(a.id).localeCompare(String(b.id)));
    if (diagnostics) await diagnostics.record('body-catalogue-ready', { systemId, bodies: bodies.map(item => ({ id: item.id, kind: item.kind })) });
    if (!bodies.length) { attempts.push({ systemId, outcome: 'NO_PLANETARY_BODY' }); continue; }
    for (const body of bodies) {
      if (diagnostics) await diagnostics.record('body:before-materialize', { systemId, bodyId: body.id, kind: body.kind });
      const result = await page.evaluate(bodyId => {
        try { globalThis.__OFU_SPATIAL_CONTINUUM__.chooseDestination(bodyId); return { ok: true }; }
        catch (error) { return { ok: false, error: String(error?.stack || error) }; }
      }, body.id);
      if (diagnostics) await diagnostics.record('body:after-materialize-request', { systemId, bodyId: body.id, result });
      if (!result.ok) { attempts.push({ systemId, bodyId: body.id, outcome: result.error }); continue; }
      try {
        await page.evaluate(limit => globalThis.__OFU_SPATIAL_CONTINUUM__.waitForSettled(limit), timeout);
        await page.waitForFunction(bodyId => {
          const state = globalThis.__OFU_SPATIAL_CONTINUUM__.snapshot();
          return state.worldIdentity === bodyId && state.state?.scale?.semanticStage === 'ORBIT' && state.state?.scale?.moving === false;
        }, body.id, { timeout });
        const orbit = diagnostics ? await diagnostics.record('orbit:settled', { systemId, bodyId: body.id, attempts }) : await snapshot(page);
        assert.equal(orbit.worldIdentity, body.id, 'supported body identity must be active at ORBIT');
        return orbit;
      } catch (error) {
        attempts.push({ systemId, bodyId: body.id, outcome: String(error?.message || error) });
        if (diagnostics) await diagnostics.record('body:orbit-settle-failed', { systemId, bodyId: body.id, error: String(error?.message || error) });
      }
    }
  }
  if (diagnostics) await diagnostics.record('orbit:failed', { attempts });
  assert.fail('a supported planetary body must materialize: ' + JSON.stringify(attempts));
}

export async function enterHumanWithSelectedSample(page, { diagnostics = null, timeout = 30000 } = {}) {
  const human = await travelAccepted(page, 'HUMAN', { timeout, diagnostics, label: 'human' });
  await page.waitForFunction(() => Object.keys(globalThis.__OFU_SPATIAL_CONTINUUM__.snapshot().render?.pickTargets?.samples || globalThis.__OFU_SPATIAL_CONTINUUM__.snapshot().render?.pickTargets?.local || {}).length > 0, undefined, { timeout });
  const sampleId = await page.evaluate(() => {
    const state = globalThis.__OFU_SPATIAL_CONTINUUM__.snapshot();
    return Object.keys(state.render?.pickTargets?.samples || state.render?.pickTargets?.local || {}).sort()[0] || null;
  });
  if (diagnostics) await diagnostics.record('human:sample-ready', { sampleId });
  assert.ok(sampleId, 'a visible HUMAN source sample is required');
  const selected = await page.evaluate(id => {
    try {
      const api = globalThis.__OFU_SPATIAL_CONTINUUM__;
      if (typeof api.chooseSample === 'function') api.chooseSample(id); else api.chooseDestination(id);
      return { ok: true };
    } catch (error) { return { ok: false, error: String(error?.stack || error) }; }
  }, sampleId);
  if (diagnostics) await diagnostics.record('human:sample-selected', { sampleId, selected });
  assert.equal(selected.ok, true, 'HUMAN source sample selection must succeed');
  await page.waitForFunction(id => globalThis.__OFU_SPATIAL_CONTINUUM__.snapshot().sourceSampleIdentity === id, sampleId, { timeout });
  if (diagnostics) await diagnostics.record('human:sample-authoritative', { sampleId });
  return { human, sampleId, state: await snapshot(page) };
}
