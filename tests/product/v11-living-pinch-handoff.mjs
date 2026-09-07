import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {loadComponents} from '../../tools/extensions/components.mjs';
const source=fs.readFileSync('src/bootstrap/product/living-pinch-handoff.js','utf8'),plan=loadComponents();
let cases=0;const ok=(value,message)=>{assert.ok(value,message);cases++;};
const component=plan.find(c=>c.id==='v1.product.living-pinch-handoff');
ok(component,'pinch handoff component is registered');
ok(component.version==='1.1.0','hardened pinch handoff contract version is registered');
ok(component.authority==='PRESENTATION_ONLY','pinch handoff remains presentation-only');
ok(component.dependencies.includes('v1.product.living-universe'),'pinch handoff depends on the shipping Living product');
ok(plan.findIndex(c=>c.id==='v1.product.living-pinch-handoff')>plan.findIndex(c=>c.id==='v1.product.living-universe'),'pinch handoff is emitted after Living input ownership is established');
assert.match(source,/VERSION='ofu-v11-living-pinch-handoff-4'/);cases++;
assert.match(source,/DRAG_THRESHOLD_PX=5/);cases++;
assert.match(source,/pointers\.size===1&&hadPinch/);cases++;
assert.match(source,/coreInput\?\.lastGesture==='drag'/);cases++;
assert.match(source,/renderer\.rotate\(dx,dy\)/);cases++;
assert.match(source,/pointercancel/);cases++;
assert.match(source,/lostpointercapture/);cases++;
assert.match(source,/OWNER_KEY='__OFU_LIVING_PINCH_HANDOFF_OWNER__'/);cases++;
assert.match(source,/previous\.dispose\?\.\('superseded'\)/);cases++;
assert.match(source,/removeEventListener\('pointermove',move,false\)/);cases++;
assert.match(source,/if\(boundCanvas===target&&state\.ready\)return/);cases++;
assert.match(source,/if\(cancelled\)\{[\s\S]*pinchSeen=false;handoff=null/);cases++;
assert.match(source,/if\(!pointers\.has\(event\.pointerId\)\)return;/);cases++;
assert.doesNotMatch(source,/selectPlanet|enterKey|setNavigationCoordinate|runtime\./);cases++;

// Re-evaluation is a realistic bundle/repair hazard. It must dispose the old
// closure rather than leave two pointermove owners on the shipping canvas.
const listeners=new Map();
const canvas={id:'living-view',dataset:{},getBoundingClientRect:()=>({left:0,top:0}),addEventListener(type,fn){const rows=listeners.get(type)||[];rows.push(fn);listeners.set(type,rows)},removeEventListener(type,fn){listeners.set(type,(listeners.get(type)||[]).filter(row=>row!==fn))}};
const sandbox={document:{getElementById:id=>id==='living-view'?canvas:null},OFU:{v1LivingProduct:{snapshot:()=>({input:{lastGesture:'pinch'}}),renderer:{rotate(){}}}},setTimeout,clearTimeout};
vm.createContext(sandbox);vm.runInContext(source,sandbox,{filename:'living-pinch-handoff.js'});const first=sandbox.OFU.v11LivingPinchHandoff;
assert.equal((listeners.get('pointermove')||[]).length,1,'first evaluation owns exactly one pointermove listener');cases++;
vm.runInContext(source,sandbox,{filename:'living-pinch-handoff.js'});const second=sandbox.OFU.v11LivingPinchHandoff;
assert.notEqual(second,first,'second evaluation replaces the helper API');cases++;
assert.equal(first.snapshot().disposed,true,'superseded helper is disposed');cases++;
assert.equal(second.snapshot().activeOwner,true,'replacement helper owns the global handoff slot');cases++;
assert.equal((listeners.get('pointermove')||[]).length,1,'re-evaluation leaves exactly one pointermove listener');cases++;
second.attach();assert.equal((listeners.get('pointermove')||[]).length,1,'idempotent attach cannot duplicate pointermove ownership');cases++;
assert.equal(canvas.dataset.ofuPinchHandoffInstance,String(second.instanceSerial),'canvas ownership marker tracks the active helper');cases++;

console.log(JSON.stringify({status:'PASS',suite:'v11-living-pinch-handoff',cases,version:'ofu-v11-living-pinch-handoff-4',authority:'PRESENTATION_ONLY',dragThresholdPx:5,cancelFailsClosed:true,lostCaptureFailsClosed:true,idempotentOwnership:true}));
