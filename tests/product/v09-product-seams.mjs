import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {loadComponents} from '../../tools/extensions/components.mjs';
import {loadProduct} from '../extensions/product-helpers.mjs';
const root=new URL('../../',import.meta.url);
const read=rel=>fs.readFileSync(new URL(rel,root),'utf8');
const core=read('src/bootstrap/product/explorer-beta-core.js');
const scene=read('src/bootstrap/product/explorer-scene-adapter.js');
const inspector=read('src/bootstrap/product/inspector-beta.js');
const baseBuild=read('tools/build-ofu-rendering-v08.mjs');
const build=read('tools/build-ofu-rendering-v09.mjs');
const bridge=read('src/bootstrap/product/visual-universe-bridge.js');
// The source composition now uses the certified canonical service rather than
// the retired v0.9 UI-array mock. This retains the same scene/selection contract.
const {O,key:baseKey}=loadProduct();
const key={...baseKey,siteX:98n,orbitSlot:0n},second={...key,orbitSlot:1n};
__OFU_PLANET_PREVIEW__.chosen={key:second};__OFU_PLANET_PREVIEW__.targetStatus='SUPPORTED';
O.waveIVScaleRuntime.setSelection(second,{planetId:O.pxProduct.captured(second).selection.target.entityId,presentationStatus:'SUPPORTED'});
O.waveIVScaleRuntime.requestStage('orbit',{driveCamera:false});
vm.runInThisContext(core);vm.runInThisContext(scene);
const sandbox=globalThis;
const snap=sandbox.OFU.v09ExplorerScene.snapshot();
assert.equal(sandbox.OFU.v09ExplorerScene.seamVersion,3);assert.equal(snap.ready,true);assert.equal(snap.bodies.length,Number(O.p3Astronomy.resolveSystem(__OFU_PLANET_PREVIEW__.ctx,key).facts.planetCount));assert(snap.bodies.length>=2);assert.equal(snap.selection.orbitIndex,1);assert.equal(snap.stage,'orbit');assert.equal(snap.bodies[1].presentationStatus,'SUPPORTED');assert.equal(String(snap.system.canonicalKey.siteX),'98');assert.equal(String(snap.selection.canonicalKey.orbitSlot),'1');
let delivered=null;sandbox.OFU.v09ExplorerScene.register({update:value=>{delivered=value}});sandbox.OFU.v09ExplorerScene.publish();assert.equal(delivered.selection.orbitIndex,1);
assert.match(inspector,/atmosphere, pressure, climate/);assert.match(inspector,/unknown or unsupported/);assert.doesNotMatch(inspector,/canonical model establishes/);
assert.match(baseBuild,/v09-explorer-beta-fragments-1/);assert.match(build,/build-ofu-rendering-v08\.mjs/);const composed=loadComponents();assert(composed.some(c=>c.source==='src/bootstrap/product/visual-universe-bridge.js'&&c.stage==='full'));assert(composed.some(c=>c.source==='src/bootstrap/product/visual-universe.js'&&c.stage==='full'));assert.match(bridge,/v09ExplorerScene/);assert.match(bridge,/clearInterval/);
console.log('v09 product seams: PASS');
