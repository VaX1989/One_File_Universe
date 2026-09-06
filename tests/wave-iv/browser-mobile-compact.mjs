import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const out = path.resolve('dist/evidence/wave-iv-convergence');
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];

for (const viewport of [{ width: 390, height: 844 }, { width: 360, height: 800 }, { width: 320, height: 700 }]) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  const errors = [];
  const requests = [];
  page.on('pageerror', e => errors.push(String(e.message || e)));
  page.on('request', r => {
    if (!r.url().startsWith('file:') && !r.url().startsWith('blob:') && !r.url().startsWith('data:')) requests.push(r.url());
  });

  await page.goto(pathToFileURL(path.resolve('dist/One_File_Universe.html')).href, { waitUntil: 'load' });
  await page.waitForFunction(() => OFU?.v1LivingProduct?.snapshot?.().initialized && OFU?.productUI, { timeout: 30000 });
  await page.evaluate(async () => {
    await OFU.v1LivingProduct.ready();
    OFU.productUI.workspace('explore', { focus: false, announceChange: false });
  });

  const healthy = async expected => {
    await page.waitForFunction(stage => {
      const product = OFU.v1LivingProduct.snapshot();
      const living = OFU.v1LivingProduct.runtime.snapshot();
      return living.stage === stage && product.uiError === null && product.render.readyRevision === living.revision && product.render.metrics.frames > 0;
    }, expected, { timeout: 30000 });
    const state = await page.evaluate(() => {
      const product = OFU.v1LivingProduct.snapshot();
      const living = OFU.v1LivingProduct.runtime.snapshot();
      const scale = OFU.waveIVScaleRuntime.snapshot();
      const mobile = OFU.v08MobileInteraction?.snapshot?.() || null;
      const canvas = document.getElementById('living-view');
      const box = canvas.getBoundingClientRect();
      return {
        stage: living.stage,
        semanticScale: living.semanticScale,
        scaleAuthority: scale.semanticScale,
        continuousDistanceRadii: living.continuousDistanceRadii,
        navigationCoherent: living.navigationCoherent,
        uiError: product.uiError,
        frames: product.render.metrics.frames,
        drawnObjects: product.render.metrics.drawnObjects,
        pickCount: product.render.pickCount,
        canvas: { left: box.left, right: box.right, width: box.width, height: box.height },
        canvasStage: document.getElementById('living-stage').dataset.stage,
        mobileCanvasId: mobile?.canvas?.id || null,
        mobileGestureOwner: mobile?.input?.gestureOwner || null,
        mobileActive: mobile?.active ?? null,
      };
    });
    assert.equal(state.uiError, null);
    assert.equal(state.navigationCoherent, true);
    assert.equal(state.stage, expected);
    assert.equal(state.semanticScale, state.scaleAuthority);
    assert.equal(state.canvasStage, expected);
    assert.equal(state.mobileCanvasId, 'living-view', `${viewport.width}: mobile diagnostics must follow the Living foreground`);
    assert.equal(state.mobileGestureOwner, 'v1-living-product', `${viewport.width}: mobile diagnostics must report Living gesture ownership`);
    assert.equal(state.mobileActive, true, `${viewport.width}: compact/mobile mode must stay active`);
    assert.ok(state.frames > 0);
    assert.ok(state.canvas.width > 0 && state.canvas.height > 0);
    return state;
  };

  const clickScale = async id => {
    const button = page.locator(`[data-living-scale="${id}"]:visible`).first();
    await button.waitFor({ state: 'visible', timeout: 5000 });
    await button.click();
    return healthy(id);
  };

  const layoutMetrics = () => page.evaluate(() => {
    const canvas = document.getElementById('living-view').getBoundingClientRect();
    const stage = document.getElementById('living-stage').getBoundingClientRect();
    const buttons = [...document.querySelectorAll('#living-rail button')].map(b => b.getBoundingClientRect().height);
    const mobile = OFU.v08MobileInteraction.snapshot();
    return {
      innerWidth,
      innerHeight,
      docWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      canvas: { left: canvas.left, right: canvas.right, width: canvas.width, height: canvas.height },
      stage: { left: stage.left, right: stage.right },
      minRailButtonHeight: Math.min(...buttons),
      eyebrow: document.querySelector('.living-eyebrow')?.textContent || '',
      mobileCanvasId: mobile.canvas?.id || null,
      mobileActive: mobile.active,
      resizeEvents: mobile.events.resize,
      viewport: mobile.viewport,
    };
  });

  const assertLayout = (metrics, label) => {
    assert.ok(metrics.docWidth <= metrics.clientWidth + 1, `horizontal overflow ${label}`);
    assert.ok(metrics.canvas.left >= -1 && metrics.canvas.right <= metrics.innerWidth + 1 && metrics.canvas.width > 0 && metrics.canvas.height > 0, `living canvas overflow ${label}`);
    assert.ok(metrics.stage.left >= -1 && metrics.stage.right <= metrics.innerWidth + 1, `living stage overflow ${label}`);
    assert.ok(metrics.minRailButtonHeight >= 44, `compact scale targets below 44px at ${label}`);
    assert.equal(metrics.mobileCanvasId, 'living-view', `mobile diagnostics drifted to legacy canvas at ${label}`);
    assert.equal(metrics.mobileActive, true, `mobile mode inactive at ${label}`);
  };

  const boot = await healthy('UNIVERSE');
  assert.ok(boot.pickCount > 0, `${viewport.width}: universe must remain pickable`);
  for (const stage of ['GALAXY', 'REGION', 'SYSTEM']) {
    const state = await clickScale(stage);
    assert.ok(state.drawnObjects > 0, `${viewport.width}: ${stage} must draw visible objects`);
    assert.ok(state.pickCount > 0, `${viewport.width}: ${stage} must remain pickable`);
  }

  await clickScale('REGION');
  const pinch = await page.evaluate(() => {
    const canvas = document.getElementById('living-view');
    const rect = canvas.getBoundingClientRect();
    const fire = (type, id, x) => canvas.dispatchEvent(new PointerEvent(type, {
      pointerId: id,
      pointerType: 'touch',
      isPrimary: id === 301,
      clientX: rect.left + x,
      clientY: rect.top + 100,
      bubbles: true,
      cancelable: true,
      buttons: type === 'pointerup' || type === 'pointercancel' ? 0 : 1,
    }));
    fire('pointerdown', 301, 90);
    fire('pointerdown', 302, 150);
    fire('pointermove', 301, 30);
    fire('pointermove', 302, 210);
    const stage = OFU.v1LivingProduct.runtime.snapshot().stage;
    fire('pointerup', 301, 30);
    fire('pointerup', 302, 210);
    return { stage, touchAction: getComputedStyle(canvas).touchAction, input: OFU.v1LivingProduct.snapshot().input, mobile: OFU.v08MobileInteraction.snapshot() };
  });
  assert.notEqual(pinch.stage, 'REGION', `${viewport.width}: compact touch pinch must cross a visible scale`);
  assert.equal(pinch.touchAction, 'none');
  assert.equal(pinch.input.activePointers, 0);
  assert.equal(pinch.input.pinchActive, false);
  assert.equal(pinch.mobile.canvas?.id, 'living-view');
  assert.equal(pinch.mobile.input.gestureOwner, 'v1-living-product');
  const pinchHealth = await healthy(pinch.stage);

  const portrait = await layoutMetrics();
  assertLayout(portrait, `${viewport.width}x${viewport.height}`);
  assert.ok(portrait.eyebrow.includes('1.0.0'), `frozen v1.0.0 identity missing at ${viewport.width}`);

  const landscape = { width: viewport.height, height: viewport.width };
  await page.setViewportSize(landscape);
  await page.waitForFunction(size => innerWidth === size.width && innerHeight === size.height, landscape, { timeout: 5000 });
  await page.waitForTimeout(120);
  const landscapeHealth = await healthy(pinch.stage);
  assert.ok(landscapeHealth.pickCount > 0, `${viewport.width}: stage must remain pickable after landscape resize`);
  assert.equal(landscapeHealth.continuousDistanceRadii, pinchHealth.continuousDistanceRadii, `${viewport.width}: presentation resize must not mutate continuous travel authority`);
  const landscapeLayout = await layoutMetrics();
  assertLayout(landscapeLayout, `${landscape.width}x${landscape.height}`);
  assert.ok(landscapeLayout.resizeEvents > portrait.resizeEvents, `${viewport.width}: resize must reach mobile runtime`);

  await page.setViewportSize(viewport);
  await page.waitForFunction(size => innerWidth === size.width && innerHeight === size.height, viewport, { timeout: 5000 });
  await page.waitForTimeout(120);
  const returned = await healthy(pinch.stage);
  assert.ok(returned.pickCount > 0, `${viewport.width}: stage must remain pickable after portrait return`);
  assert.equal(returned.continuousDistanceRadii, pinchHealth.continuousDistanceRadii, `${viewport.width}: portrait return must preserve continuous travel authority`);
  const returnedLayout = await layoutMetrics();
  assertLayout(returnedLayout, `${viewport.width}x${viewport.height}-return`);
  assert.ok(returnedLayout.resizeEvents > landscapeLayout.resizeEvents, `${viewport.width}: portrait return must reach mobile runtime`);

  assert.equal(errors.length, 0, errors.join('\n'));
  assert.equal(requests.length, 0, requests.join('\n'));

  await page.screenshot({ path: path.join(out, `mobile-${viewport.width}x${viewport.height}-living.png`), fullPage: true });
  results.push({
    viewport: `${viewport.width}x${viewport.height}@2`,
    stageAfterPinch: pinch.stage,
    continuousDistanceRadii: pinchHealth.continuousDistanceRadii,
    minRailButtonHeight: portrait.minRailButtonHeight,
    landscape: `${landscape.width}x${landscape.height}`,
    resizeEvents: returnedLayout.resizeEvents,
    primaryCanvas: returnedLayout.mobileCanvasId,
  });
  await context.close();
}

await browser.close();
console.log(JSON.stringify({ status: 'PASS', oracle: 'SHIPPING_V1_LIVING_COMPACT_MOBILE_ORIENTATION', results, physicalDevice: false }));