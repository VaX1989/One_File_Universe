import assert from 'node:assert/strict';
import {loadComponents} from '../../tools/extensions/components.mjs';

const plan=loadComponents();
const byId=new Map(plan.map(component=>[component.id,component]));
const bootstrap=byId.get('ofu.extensions.product-bindings');
assert.ok(bootstrap,'product bindings component must exist');

const frontierCatalogs=[
  'v2x.frontier.providers.v2x02-camera-spatial-travel',
  'v2x.frontier.providers.v2x03-macrocosm',
  'v2x.frontier.providers.v2x05-deep-planet',
  'v2x.frontier.providers.v2x-06-surface-terrain-geology-hydrology',
  'v2x.frontier.providers.v2x08-life',
  'v2x.frontier.providers.v2x10-persistent-individuals',
  'v2x.frontier.providers.v2x12-matter-continuity'
];
const forbiddenShippingIds=[
  'px.providers.v2x02-camera-spatial-travel',
  'px.providers.v2x03-macrocosm',
  'px.providers.v2x05-deep-planet',
  'px.providers.v2x-06-surface-terrain-geology-hydrology',
  'px.providers.v2x08-life',
  'px.providers.v2x10-persistent-individuals',
  'px.providers.v2x12-matter-continuity'
];

for(const id of frontierCatalogs){
  const component=byId.get(id);
  assert.ok(component,`frontier provider catalog missing: ${id}`);
  assert.equal(component.kind,'data');
  assert.equal(component.placement,'resource');
  assert.ok(!bootstrap.dependencies.includes(id),`frontier catalog must not be auto-activated by product bootstrap: ${id}`);
}
for(const id of forbiddenShippingIds){
  assert.ok(!byId.has(id),`unbound V2X catalog must not occupy active shipping namespace: ${id}`);
  assert.ok(!bootstrap.dependencies.includes(id),`unbound V2X catalog must not be a product bootstrap dependency: ${id}`);
}

const travel=byId.get('v2x02.camera.continuous-travel');
assert.ok(travel?.dependencies.includes('v2x.frontier.providers.v2x02-camera-spatial-travel'),'V2X-02 runtime must retain its frontier metadata dependency');
assert.ok(!travel.dependencies.includes('px.providers.v2x02-camera-spatial-travel'),'V2X-02 runtime must not reactivate the old shipping catalog id');

console.log(JSON.stringify({status:'PASS',frontierCatalogs:frontierCatalogs.length,activeV2xShippingCatalogs:forbiddenShippingIds.filter(id=>byId.has(id)).length}));
