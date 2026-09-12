import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const provider = readFileSync(new URL('../../src/domains/v1/individuals/provider.js', import.meta.url), 'utf8');
const bridge = readFileSync(new URL('../../src/domains/v1/individuals/session-bridge.js', import.meta.url), 'utf8');
const inspector = readFileSync(new URL('../../src/bootstrap/product/v2x-context-inspector.js', import.meta.url), 'utf8');
const components = JSON.parse(readFileSync(new URL('../../config/components/v2x-10-persistent-individuals.json', import.meta.url), 'utf8'));

assert.match(provider, /O\.v2x10Individuals=Object\.freeze/);
assert.match(provider, /function refinePopulation\(/);
assert.match(provider, /mortalityAwareRefinement:true/);

assert.match(bridge, /Base=O\.v1Session/);
assert.match(bridge, /BROWSER_KEY='ofu\.v1\.session'/);
assert.doesNotMatch(bridge, /localStorage[^\n]*ofu:v2x10/i);
assert.match(bridge, /Base\.exportBytes\(\)/);
assert.match(bridge, /Base\.validateBytes\(body\.base\)/);
assert.match(bridge, /Base\.importBytes\(value\.base\)/);
assert.match(bridge, /retainV2X10Individual/);
assert.match(bridge, /observeV2X10Population/);
assert.match(bridge, /NET_CHANGE_MINIMUM_FLOW_NO_FABRICATED_CHURN/);
assert.match(bridge, /extension integrity mismatch/);

const sessionComponent = components.components.find((entry) => entry.id === 'v2x10.session.retained-individuals');
assert.ok(sessionComponent, 'V2X-10 retained session bridge must ship in the component manifest');
assert.equal(sessionComponent.source, 'src/domains/v1/individuals/session-bridge.js');
assert.ok(sessionComponent.dependencies.includes('v1.session.runtime'), 'bridge must extend the central session authority');
assert.ok(sessionComponent.dependencies.includes('v2x10.model.persistent-individuals'), 'bridge must use the final individual provider');

assert.match(inspector, /People\.refinePopulation\s*\(/);
assert.match(inspector, /Session\.observeV2X10Population\s*\(/);
assert.match(inspector, /Session\.v2x10RetainedMap\s*\(/);
assert.match(inspector, /Session\.retainV2X10Individual\s*\(/);
assert.match(inspector, /retainedMemoryPersistence:true/);
assert.match(inspector, /mortalityAwareRefinement:true/);
assert.match(inspector, /Simultaneous unobserved birth\/death churn, genealogy and canonical personhood are not invented/);

console.log(JSON.stringify({
  schema: 'ofu-v2x10-central-session-bridge-contract-1',
  status: 'PASS',
  centralSessionAuthority: 'v1.session.runtime',
  browserStorageKey: 'ofu.v1.session',
  retainedPersistence: true,
  mortalityAwareRefinement: true,
  demographicInference: 'NET_CHANGE_MINIMUM_FLOW_NO_FABRICATED_CHURN'
}));
