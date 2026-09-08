import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { addComponents, planComponents } from '../../tools/extensions/components.mjs';
import {
  bundleLifeShippingRuntime,
  LIFE_V2_SHIPPING_COMPONENT_CANDIDATE,
} from '../../src/v2x-08-life-ecology-evolution-embodiment/shipping-bundle.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const artifactPath = path.join(root, 'dist', 'One_File_Universe.html');
assert.ok(fs.existsSync(artifactPath), 'actual full-stage One_File_Universe.html must be built before reachability witness');

const runtimeA = bundleLifeShippingRuntime();
const runtimeB = bundleLifeShippingRuntime();
const moduleDir = path.join(root, 'src', 'v2x-08-life-ecology-evolution-embodiment');
assert.throws(
  () => bundleLifeShippingRuntime({
    readSource(moduleName) {
      const source = fs.readFileSync(path.join(moduleDir, moduleName), 'utf8');
      return moduleName === 'viewport-bridge.js' ? `import { forbidden } from './outside-lane.js';\n${source}` : source;
    },
  }),
  /external or unknown dependency outside-lane\.js/,
  'bundler must fail closed on undeclared or external module reachability',
);
assert.equal(runtimeA, runtimeB, 'Life shipping bundle must be byte-deterministic');
const runtimeSha256 = crypto.createHash('sha256').update(runtimeA).digest('hex');
assert.ok(Buffer.byteLength(runtimeA) < 512 * 1024, 'Life classic-script runtime must remain below 512 KiB lane shipping budget');

const plan = planComponents([LIFE_V2_SHIPPING_COMPONENT_CANDIDATE], {
  root,
  read(relative) {
    assert.equal(relative, LIFE_V2_SHIPPING_COMPONENT_CANDIDATE.source, 'candidate component may read only generated Life runtime bytes');
    return Buffer.from(runtimeA);
  },
  maxBytes: 1024 * 1024,
});
assert.equal(plan.length, 1);
assert.equal(plan[0].placement, 'script');
assert.equal(plan[0].authority, 'MODEL_DERIVED_SIMULATION');
assert.equal(plan[0].sourceSha256, runtimeSha256);

const shippingHtml = fs.readFileSync(artifactPath, 'utf8').replace(/\r\n?/g, '\n');
const composedA = addComponents(shippingHtml, plan, 'full');
const composedB = addComponents(shippingHtml, plan, 'full');
assert.equal(composedA, composedB, 'additive injection into the actual full-stage HTML must be byte-deterministic');
assert.match(composedA, /data-ofu-component="v2x08\.runtime\.life-v2"/);
assert.match(composedA, /ofu-v2x-08-life-shipping-runtime-2/);
assert.ok(composedA.length > shippingHtml.length, 'Life runtime must add executable bytes to the one-file HTML witness');

const sandbox = {};
vm.createContext(sandbox);
new vm.Script(runtimeA, { filename: 'life-v2-one-file-runtime.js' }).runInContext(sandbox);
const runtime = sandbox.OFU?.v2x08LifeV2;
assert.ok(runtime, 'classic-script runtime must export OFU.v2x08LifeV2');
assert.equal(typeof runtime.createLifeState, 'function');
assert.equal(typeof runtime.createLifeShippingAdapter, 'function');
assert.equal(runtime.descriptor.additiveOnly, true);

const state = runtime.createLifeState({
  eventKey: 'p4:artifact-witness:1',
  lineages: [{
    id: 'lin-visible',
    traits: [
      { key: 'body-size', valuePpm: 800_000 },
      { key: 'mobility', valuePpm: 850_000 },
      { key: 'structural-defense', valuePpm: 700_000 },
      { key: 'phototrophy', valuePpm: 100_000 },
    ],
    morphology: { symmetry: 'BILATERAL_LIKE_MODEL_DESCRIPTOR', supportMode: 'INTERNAL_SUPPORT_MODELED', locomotionMode: 'ACTIVE_SURFACE_TRAVEL', feedingMode: 'RESOURCE_CAPTURE' },
  }],
  populations: [{ id: 'pop-visible', lineageId: 'lin-visible', regionId: 'r-visible', abundance: 12 }],
  interactions: [],
  regions: {
    'r-visible': { resourcePool: 1000, nutrientPool: 1000, opportunityPpm: 900_000, disturbancePpm: 0 },
    'r-absent': { resourcePool: 1000, nutrientPool: 1000, opportunityPpm: 100_000, disturbancePpm: 900_000 },
  },
});
const adapter = runtime.createLifeShippingAdapter({ getState: () => state });
const visible = adapter.buildViewportPacket({ regionId: 'r-visible', viewportKey: 'artifact:r-visible', maxSamples: 4, quality: 'HIGH' });
assert.equal(visible.presence, 'VISIBLE_MODELED_LIFE');
assert.equal(visible.renderDescriptors.length, 4);
assert.ok(visible.renderDescriptors.every((descriptor) => descriptor.primitiveFamily === 'CHAINED_ELLIPSOIDS'));
assert.ok(visible.selectionTargets.every((target) => target.persistentIndividual === false));
const absent = adapter.buildViewportPacket({ regionId: 'r-absent', viewportKey: 'artifact:r-absent', maxSamples: 4 });
assert.equal(absent.presence, 'ABSENT_IN_REPRESENTED_REGION');
assert.equal(absent.absenceReason, 'NO_REPRESENTED_ABUNDANCE');

const composedSha256 = crypto.createHash('sha256').update(composedA).digest('hex');
console.log(JSON.stringify({
  status: 'PASS',
  actualShippingArtifact: path.relative(root, artifactPath),
  runtimeBytes: Buffer.byteLength(runtimeA),
  runtimeSha256,
  additiveArtifactBytes: Buffer.byteLength(composedA),
  additiveArtifactSha256: composedSha256,
  runtimeExport: 'OFU.v2x08LifeV2.createLifeShippingAdapter',
  visibleWorldWitness: { regionId: 'r-visible', descriptors: visible.renderDescriptors.length, selectableTargets: visible.selectionTargets.length },
  absentWorldWitness: { regionId: 'r-absent', reason: absent.absenceReason },
  centralManifestMutationPerformed: false,
  centralLivingMutationPerformed: false,
}, null, 2));
