import fs from 'node:fs';
import assert from 'node:assert/strict';

const source=fs.readFileSync('src/bootstrap/product/v11-wheel-normalization.js','utf8');
const manifest=JSON.parse(fs.readFileSync('config/components/v11-living-wheel-normalization.json','utf8'));
const component=manifest.components[0];

assert.equal(component.id,'v1.product.input-wheel-normalization');
assert.equal(component.owner,'product');
assert.equal(component.authority,'PRESENTATION_ONLY');
assert.deepEqual(component.dependencies,['v1.rendering.living-renderer']);
assert(source.includes("UNIT_AWARE_REDISPATCH_TO_SHIPPING_PIXEL_WHEEL_PATH"));
assert(source.includes("event.deltaMode===LINE"));
assert(source.includes("event.deltaMode===PAGE"));
assert(source.includes("new WheelEvent('wheel'"));
assert(source.includes("deltaMode:PIXEL"));
assert(source.includes('event.stopImmediatePropagation()'));
assert(source.includes('target.dispatchEvent(synthetic)'));
assert(source.includes('new WeakSet()'));
assert(!/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\b/.test(source),'wheel normalization must remain offline');
assert(!/O\.(?:p3|p4|p5|p6)|p3Astronomy|p5Planetology|p6Biosphere/.test(source),'wheel normalization must not cross scientific authority boundaries');
console.log(JSON.stringify({status:'PASS',component:component.id,authority:component.authority,unitAware:true,offline:true,canonicalMutation:false}));
