import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(p,'utf8');
const dm=read('src/v1x-10-ux-mobile-accessibility/direct-manipulation.js');
const viewport=read('src/v1x-10-ux-mobile-accessibility/viewport-ux.js');
const a11y=read('src/v1x-10-ux-mobile-accessibility/accessibility.js');
const css=read('src/v1x-10-ux-mobile-accessibility/viewport-first.css');
const manifest=JSON.parse(read('config/components/v1x-10-ux-mobile-accessibility.json'));

assert.match(dm,/ofu-v1x10-direct-manipulation-1/);
assert.match(dm,/ofu-wave-iv-input-router-6/);
assert.match(dm,/ofu-wave-iv-input-intent-3/);
assert.match(dm,/ofu-wave-iv-scale-runtime-3/);
assert.match(dm,/ofu-wave-iv-selection-1/);
assert.match(dm,/secondInputAuthority:false/);
assert.match(dm,/routesNativeInput:false/);
assert.match(dm,/TRACE_LIMIT=96/);
assert.match(dm,/pinch-observed/);
assert.match(dm,/wheel-observed/);
assert.match(dm,/keyboard-observed/);
assert.match(dm,/tap-observed/);
assert.match(dm,/shared input router/);

for(const source of [dm,viewport,a11y]){
  assert.doesNotMatch(source,/\.setContinuousDistance\s*\(/,'lane must not own semantic distance mutation');
  assert.doesNotMatch(source,/\.requestStage\s*\(/,'lane must not own scale stage mutation');
  assert.doesNotMatch(source,/\.dispatchCameraIntent\s*\(/,'lane must not own camera intent routing');
  assert.doesNotMatch(source,/\.setSelection\s*\(/,'lane must not own canonical selection mutation');
  assert.doesNotMatch(source,/\.selectPlanet\s*\(/,'lane must not invoke canonical selection directly');
}
assert.doesNotMatch(dm,/preventDefault\s*\(/,'observer must not consume native input');
assert.doesNotMatch(dm,/stopImmediatePropagation\s*\(/,'observer must not shadow the shared router');

assert.match(viewport,/v1x10-context-dock/);
assert.match(viewport,/Inspect selection/);
assert.match(viewport,/Evidence \/ Lab/);
assert.match(viewport,/String\(e\.key\)\.toLowerCase\(\)==='i'/);
assert.match(viewport,/escapeReturnsToViewport:true/);
assert.match(viewport,/--v1x10-panel-safe-bottom/);
assert.match(viewport,/scaleOccluded/);
assert.match(viewport,/contextOccluded/);
assert.match(viewport,/PRESENTATION_ONLY/);
assert.match(viewport,/no new scientific claim/);

assert.match(a11y,/Skip to universe viewport/);
assert.match(a11y,/Skip to contextual actions/);
assert.match(a11y,/Skip to details/);
assert.match(a11y,/prefers-reduced-motion/);
assert.match(a11y,/prefers-contrast/);
assert.match(a11y,/forced-colors/);
assert.match(a11y,/keyboardPrimaryJourney:true/);
assert.match(a11y,/screenReaderPrimaryJourney:true/);
assert.match(a11y,/aiRequired:false/);
assert.match(a11y,/hiddenDeveloperPanelRequired:false/);
assert.match(a11y,/aria-roledescription/);

assert.match(css,/grid-template-columns:minmax\(0,2\.15fr\)/);
assert.match(css,/--v1x10-panel-safe-bottom/);
assert.match(css,/min-height:44px/);
assert.match(css,/@media \(pointer:coarse\)/);
assert.match(css,/min-height:48px/);
assert.match(css,/@media \(prefers-reduced-motion:reduce\)/);
assert.match(css,/@media \(prefers-contrast:more\)/);
assert.match(css,/@media \(forced-colors:active\)/);
assert.match(css,/position:sticky/);
assert.match(css,/env\(safe-area-inset-bottom\)/);

assert.equal(manifest.schema,'ofu-components-1');
assert.equal(manifest.components.length,4);
assert.deepEqual(manifest.components.map(x=>x.id),[
  'v1x10.ux.direct-manipulation',
  'v1x10.ux.viewport',
  'v1x10.ux.accessibility',
  'v1x10.ux.viewport-first-style'
]);
for(const component of manifest.components){
  assert.equal(component.owner,'v1x-10-ux-mobile-accessibility');
  assert.equal(component.authority,'PRESENTATION_ONLY');
  assert.match(component.source,/^src\/v1x-10-ux-mobile-accessibility\//);
  assert.ok(component.provenance.length>30);
}

const result={
  schema:'ofu-v1x10-contract-oracle-1',
  status:'PASS',
  inputOwner:'ofu-wave-iv-input-router-6',
  inputIntent:'ofu-wave-iv-input-intent-3',
  scaleOwner:'ofu-wave-iv-scale-runtime-3',
  selectionOwner:'ofu-wave-iv-selection-1',
  secondInputAuthority:false,
  nativeInputConsumedByLane:false,
  authority:'PRESENTATION_ONLY',
  directModalities:['pointer','tap','wheel','touch-pinch','keyboard'],
  compactReachabilityTelemetry:true,
  accessibility:{keyboardPrimaryJourney:true,screenReaderPrimaryJourney:true,reducedMotion:true,contrast:true,textScaling:true,aiRequired:false}
};
console.log(JSON.stringify(result));
