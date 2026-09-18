import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=path=>fs.readFileSync(path,'utf8');
const absent=(source,pattern,label)=>assert.doesNotMatch(source,pattern,label);
const present=(source,pattern,label)=>assert.match(source,pattern,label);

const coreFiles=[
  'src/kernel/sha256.js',
  'src/kernel/p2-unicode.js',
  'src/kernel/p2-canonical.js',
  'src/kernel/p2-address-parser.js',
  'src/temporal/p4-temporal.js'
];

for(const path of coreFiles){
  const source=read(path);
  absent(source,/\bdocument\b/,'candidate core must not require DOM: '+path);
  absent(source,/\bwindow\b/,'candidate core must not require browser window: '+path);
  absent(source,/BABYLON|@babylonjs/,'candidate core must not require Babylon: '+path);
  absent(source,/localStorage|sessionStorage|indexedDB/,'candidate core must not require browser storage: '+path);
  absent(source,/requestAnimationFrame/,'candidate core must not require a frame loop: '+path);
}

const pxContracts=read('src/extensions/contracts.js');
present(pxContracts,/keys\(r,\s*\['contract',\s*'provider',\s*'operation',\s*'selection'/,'current PX request must still expose the product-selection coupling being characterized');

const product=read('src/extensions/product-bindings.js');
present(product,/function inspect\(/,'PX product inspection surface expected');
present(product,/captured\(\)/,'PX product request path must still capture product state');
present(product,/surface.*camera|camera.*surface/i,'PX scale bridge camera coupling expected');
present(product,/\bdocument\b/,'PX product binding readiness is browser coupled');

const v1=read('src/domains/v1/bindings.js');
present(v1,/pxProduct/,'V1 provider binding currently depends on pxProduct');
present(v1,/verifySelection\(q\.selection\)/,'V1 provider binding currently verifies product selection');
present(v1,/__OFU_PLANET_PREVIEW__/,'V1 provider binding currently uses released preview context');

const runtimeContracts=read('src/runtime/v2x-01-contracts.js');
present(runtimeContracts,/'RENDER_PREP'/,'RENDER_PREP must remain visible as current private runtime policy');
present(runtimeContracts,/\['visible','selected','scaleRelevancePpm','causalRelevancePpm'\]/,'adaptive visibility/selection policy must remain characterized');

const materialization=read('src/simulation/materialization/materialization-runtime.js');
present(materialization,/centralAuthorityClaims:\{selection:false,semanticScale:false,travelDistance:false,cameraSpatialFrame:false,sceneComposition:false,primaryRenderer:false,inputRouter:false,persistenceReplay:false\}/,'runtime packet must continue denying semantic/product central authority');
present(materialization,/handleContextLoss/,'context-loss handling is runtime policy');
present(materialization,/taskClass==='RENDER_PREP'/,'context loss currently knows RENDER_PREP');

const bootstrap=read('src/bootstrap/app.js');
for(const marker of [/\bdocument\b/,/DOMContentLoaded/,/performance\.now/,/location\.protocol/,/O\.renderer\.probe/])present(bootstrap,marker,'browser bootstrap coupling expected');

const renderer=read('src/experiments/spatial-continuum/renderer.js');
present(renderer,/@babylonjs\/core/,'shipping R6 renderer must remain a Babylon adapter');

const experience=read('src/experiments/spatial-continuum/experience.js');
present(experience,/\bdocument\b/,'R6 experience remains browser product orchestration');
present(experience,/renderer-phase2/,'R6 experience remains connected to active renderer');

const worldAdapter=read('src/experiments/spatial-continuum/world-adapter.js');
present(worldAdapter,/__OFU_PLANET_PREVIEW__/,'R6 world adapter still captures product preview state');
present(worldAdapter,/runtime\.enterKey/,'R6 world adapter still drives released product runtime');

const save=read('src/persistence/save.js');
absent(save,/localStorage|sessionStorage|indexedDB/,'portable save codec itself must not be confused with browser storage');

console.log('IND-BRIDGE-A coupling characterization: PASS');
