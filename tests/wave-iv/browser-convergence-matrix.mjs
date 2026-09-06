import assert from 'node:assert/strict';
import { chromium, firefox, webkit } from 'playwright';

const name = process.env.BROWSER || 'chromium';
const engine = { chromium, firefox, webkit }[name];
if (!engine) throw new Error('unsupported BROWSER ' + name);

// Preserve the Wave IV WebGL2 baseline capability requirement on every matrix
// browser/platform, but evaluate product behavior through the shipping v1 Living
// foreground rather than retired #wave-iv-macro-view / #planet-view backends.
const headed = process.env.HEADED === '1';
const launchOptions = {
  headless: !headed,
  ...(name === 'firefox'
    ? { firefoxUserPrefs: { 'webgl.disabled': false, 'webgl.force-enabled': true, 'webgl.forbid-software': false } }
    : {}),
};
const browser = await engine.launch(launchOptions);
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: Number(process.env.DPR || 1),
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(String(error.message || error)));
await page.goto(new URL('../../dist/One_File_Universe.html', import.meta.url).href, { waitUntil: 'load' });
await page.waitForFunction(
  () => globalThis.OFU?.v1LivingProduct?.snapshot?.().initialized && globalThis.OFU?.waveIVScaleRuntime?.snapshot?.().semanticScale,
  { timeout: 30000 },
);
const capability = await page.evaluate(() => {
  const probe = document.createElement('canvas');
  const gl = probe.getContext('webgl2');
  const product = OFU.v1LivingProduct.snapshot();
  const living = OFU.v1LivingProduct.runtime.snapshot();
  const scale = OFU.waveIVScaleRuntime.snapshot();
  const canvas = document.getElementById('living-view');
  const box = canvas?.getBoundingClientRect();
  return {
    webgl2: !!gl,
    renderer: gl ? String(gl.getParameter(gl.RENDERER) || '') : null,
    vendor: gl ? String(gl.getParameter(gl.VENDOR) || '') : null,
    uiError: product.uiError,
    navigationCoherent: living.navigationCoherent,
    livingStage: living.stage,
    semanticScale: living.semanticScale,
    scaleAuthority: scale.semanticScale,
    frames: product.render?.metrics?.frames || 0,
    canvasVisible: !!box && box.width > 0 && box.height > 0,
  };
});
assert.equal(capability.webgl2, true, `${name} certification runtime must expose WebGL2`);
assert.equal(capability.uiError, null, `${name} shipping Living product must boot without UI error`);
assert.equal(capability.navigationCoherent, true, `${name} shipping Living navigation must be coherent`);
assert.equal(capability.semanticScale, capability.scaleAuthority, `${name} must expose one semantic scale authority`);
assert.ok(capability.frames > 0, `${name} shipping Living renderer must draw frames`);
assert.equal(capability.canvasVisible, true, `${name} shipping Living canvas must be visible`);
assert.equal(errors.length, 0, errors.join('\n'));
await context.close();
await browser.close();

// The definitive v1 browser oracle performs the full Galaxy-to-Human and return
// journey, visible canvas-delta checks, selector/wheel/pinch traversal, pickability,
// identity continuity, persistence/replay, responsive/mobile checks, offline
// direct-file enforcement and zero-error assertions. Running it here keeps this
// historical Wave IV matrix at least as strict as the shipping release oracle.
process.env.BROWSER = name;
await import('../v1/browser-v1-product.mjs');
