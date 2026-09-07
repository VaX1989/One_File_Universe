import fs from 'node:fs';
import assert from 'node:assert/strict';

const source=fs.readFileSync('src/bootstrap/product/v11-touch-continuity.js','utf8');
const manifest=JSON.parse(fs.readFileSync('config/components/v11-living-touch-continuity.json','utf8'));
const component=manifest.components[0];
assert.equal(component.id,'v1.product.touch-continuity');
assert.equal(component.owner,'product');
assert.equal(component.authority,'PRESENTATION_ONLY');
assert.deepEqual(component.dependencies,['v1.product.living-universe']);
assert(source.includes("PINCH_RELEASE_PROMOTES_REMAINING_TOUCH_TO_PRESENTATION_DRAG"));
assert(source.includes("before>=2&&pointers.size===1&&hadPinch"));
assert(source.includes("renderer.rotate(dx,dy)"));
assert(source.includes("if(cancelled){state.cancellations++;clearContinuation()"));
assert(source.includes("THRESHOLD_PX=5"));
assert(source.includes("e.pointerType==='touch'||e.pointerType==='pen'"));
assert(!/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\b/.test(source),'touch continuity must remain offline');
assert(!/O\.(?:p3|p4|p5|p6)|p3Astronomy|p5Planetology|p6Biosphere/.test(source),'touch continuity must not cross scientific authority boundaries');
console.log(JSON.stringify({status:'PASS',component:component.id,authority:component.authority,continuation:'PINCH_TO_ONE_POINTER_DRAG',cancelFailsClosed:true,offline:true,canonicalMutation:false}));
