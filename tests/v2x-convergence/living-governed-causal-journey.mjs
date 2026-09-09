import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

globalThis.OFU={};
for(const file of [
  'src/kernel/sha256.js','src/kernel/p2-unicode.js','src/kernel/p2-canonical.js','src/temporal/p4-temporal.js',
  'src/gameplay/contracts.js','src/gameplay/p2-resource-normalizer.js','src/simulation/cross-domain/causal-engine.js',
  'src/simulation/temporal-adapters/p4-gameplay-bridge.js','src/gameplay/runtime.js'
]) vm.runInThisContext(fs.readFileSync(file,'utf8'),{filename:file});

const O=globalThis.OFU,P=O.p2,id=value=>P.hex(O.sha256.digest(new TextEncoder().encode(value))),target=id('living-governed-target');
const seed=Uint8Array.from({length:32},(_,i)=>i+1),manifest=Uint8Array.from({length:32},(_,i)=>255-i);
globalThis.__OFU_PLANET_PREVIEW__={ctx:{masterSeed:seed,semanticManifestHash:manifest}};
let baseImports=0;
O.v1Session=Object.freeze({
  VERSION:'test-central-base',MAX_BYTES:1024*1024,
  exportBytes(){return P.encode({format:'TEST-CENTRAL-BASE',selection:target})},
  validateBytes(bytes){const value=P.decode(bytes);assert.equal(value.format,'TEST-CENTRAL-BASE');assert.equal(value.selection,target);return value},
  importBytes(bytes){this.validateBytes(bytes);baseImports++;return Object.freeze({status:'BASE_IMPORTED',target})},
  hex:P.hex,unhex:P.unhex,
  snapshot(){return Object.freeze({version:'test-central-base',canonicalMutation:false})}
});
let captures=0,worldReads=0;
O.pxProduct={captured(){captures++;return{selection:{target:{entityId:target}}}}};
O.v1Providers={worldFor(selection){worldReads++;assert.equal(selection.target.entityId,target);return{planetIdentity:target,biology:{ecosystem:{state:'NO_MODELED_BIOSPHERE'}},civilization:{state:'NO_CIVILIZATION_MODEL'}}}};
vm.runInThisContext(fs.readFileSync('src/gameplay/session-bridge.js','utf8'),{filename:'src/gameplay/session-bridge.js'});
const S=O.v1Session;
assert.match(S.VERSION,/ofu-v2x11-central-session-1/);
assert.equal(O.v2x11CentralSessionBridge.BROWSER_KEY,'ofu.v1.session');
const first=S.performV2X11Action('SURVEY',{mode:'living-visible-context'},'living-user');
assert.equal(first.receipt.status,'ADMITTED');assert.equal(first.receipt.canonicalMutation,false);assert.equal(first.revisit.actions,'1');assert.equal(first.revisit.consequences.length,1);assert.equal(first.revisit.consequences[0].domain,'evidence');assert.equal(first.revisit.consequences[0].authority,'MODEL_DERIVED_SIMULATION');
const saved=S.exportBytes(),savedReplay=S.v2x11Revisit(target);assert.equal(savedReplay.actions,'1');
const second=S.performV2X11Action('SURVEY',{mode:'temporary-second-action'},'living-user');assert.equal(second.revisit.actions,'2');
const loaded=S.importBytes(saved);assert.equal(loaded.status,'BASE_IMPORTED');assert.equal(baseImports,1);const revisited=S.v2x11Revisit(target);assert.equal(revisited.actions,'1','central reload must restore saved action frontier');assert.equal(revisited.stateDigest,savedReplay.stateDigest);assert.deepEqual(revisited.consequences,savedReplay.consequences);assert.equal(revisited.consequences[0].payload.canonicalProven,false);assert.equal(S.snapshot().v2x11CanonicalMutation,false);
assert.ok(captures>=3,'governed actions and revisit must consume the central live target');assert.ok(worldReads>=2,'governed actions must consume the central modeled-world context');

const gameplayConfig=JSON.parse(fs.readFileSync('config/components/v2x-11-gameplay-causal-engine.json','utf8')),livingConfig=JSON.parse(fs.readFileSync('config/components/v2x-living-product-composition.json','utf8'));
const sessionComponent=gameplayConfig.components.find(x=>x.id==='v2x11.session.governed-gameplay'),livingComponent=livingConfig.components.find(x=>x.id==='v2x.living.governed-actions'),inspector=livingConfig.components.find(x=>x.id==='v2x.living.context-inspector');
assert.equal(sessionComponent?.source,'src/gameplay/session-bridge.js');assert.ok(sessionComponent.dependencies.includes('v2x10.session.retained-individuals'));assert.equal(livingComponent?.source,'src/bootstrap/product/living-governed-actions.js');assert.ok(livingComponent.dependencies.includes('v2x11.session.governed-gameplay'));assert.ok(inspector.dependencies.includes('v2x10.session.retained-individuals'));
const uiSource=fs.readFileSync('src/bootstrap/product/living-governed-actions.js','utf8'),bridgeSource=fs.readFileSync('src/gameplay/session-bridge.js','utf8');
assert.match(uiSource,/performV2X11Action\('SURVEY'/);assert.match(uiSource,/current central selection/);assert.doesNotMatch(uiSource,/localStorage/,'Living action consumer must not own persistence');assert.match(bridgeSource,/BROWSER_KEY='ofu\.v1\.session'/);assert.match(bridgeSource,/canonicalMutation:false/);
console.log(JSON.stringify({schema:'ofu-v2x11-living-governed-causal-journey-1',status:'PASS',action:'SURVEY',receipt:first.receipt.status,saveReloadRevisit:'PASS',restoredActions:revisited.actions,consequences:revisited.consequences.length,centralSelectionReads:captures,centralWorldReads:worldReads,persistenceAuthority:'O.v1Session',browserStorageKey:'ofu.v1.session',canonicalMutation:false}));
