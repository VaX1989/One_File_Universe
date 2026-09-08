import assert from 'node:assert/strict';
import { createLifeState, applyLineageEvent } from '../../src/v2x-08-life-ecology-evolution-embodiment/model.js';
import { createLifeShippingAdapter, LIFE_V2_SHIPPING_ADAPTER_DESCRIPTOR } from '../../src/v2x-08-life-ecology-evolution-embodiment/shipping-adapter.js';
import { createLifeViewportBridge } from '../../src/v2x-08-life-ecology-evolution-embodiment/viewport-bridge.js';

function input(eventKey, opportunityPpm = 900_000, disturbancePpm = 0) {
  return {
    eventKey,
    lineages: [
      {
        id: 'lin-mobile',
        traits: [
          { key: 'body-size', valuePpm: 800_000 },
          { key: 'mobility', valuePpm: 850_000 },
          { key: 'structural-defense', valuePpm: 700_000 },
          { key: 'phototrophy', valuePpm: 100_000 },
        ],
        morphology: { symmetry: 'BILATERAL_LIKE_MODEL_DESCRIPTOR', supportMode: 'INTERNAL_SUPPORT_MODELED', locomotionMode: 'ACTIVE_SURFACE_TRAVEL', feedingMode: 'RESOURCE_CAPTURE' },
      },
      {
        id: 'lin-sessile',
        traits: [
          { key: 'body-size', valuePpm: 500_000 },
          { key: 'mobility', valuePpm: 100_000 },
          { key: 'structural-defense', valuePpm: 300_000 },
          { key: 'phototrophy', valuePpm: 900_000 },
        ],
        morphology: { symmetry: 'RADIAL_LIKE_MODEL_DESCRIPTOR', supportMode: 'ANCHOR_SUPPORT_MODELED', locomotionMode: 'SESSILE', feedingMode: 'PHOTOTROPHY_MODEL_DESCRIPTOR' },
      },
      {
        id: 'lin-modular',
        traits: [
          { key: 'body-size', valuePpm: 200_000 },
          { key: 'mobility', valuePpm: 200_000 },
          { key: 'structural-defense', valuePpm: 200_000 },
          { key: 'phototrophy', valuePpm: 200_000 },
        ],
        morphology: { symmetry: 'MODULAR_UNRESOLVED', supportMode: 'DISTRIBUTED_SUPPORT_MODELED', locomotionMode: 'LOW_MOBILITY', feedingMode: 'RESOURCE_CAPTURE' },
      },
    ],
    populations: [
      { id: 'pop-mobile', lineageId: 'lin-mobile', regionId: 'r-life', abundance: 100, lifecycleStagePpm: { juvenile: 0, mature: 1_000_000, senescent: 0 } },
      { id: 'pop-sessile', lineageId: 'lin-sessile', regionId: 'r-life', abundance: 100, lifecycleStagePpm: { juvenile: 0, mature: 1_000_000, senescent: 0 } },
      { id: 'pop-modular', lineageId: 'lin-modular', regionId: 'r-life', abundance: 100, lifecycleStagePpm: { juvenile: 0, mature: 1_000_000, senescent: 0 } },
    ],
    interactions: [
      { id: 'edge-competition', kind: 'COMPETITION', sourcePopulationId: 'pop-mobile', targetPopulationId: 'pop-modular', intensityPpm: 100_000, assimilationPpm: 0 },
    ],
    regions: {
      'r-life': { resourcePool: 100_000, nutrientPool: 100_000, opportunityPpm, disturbancePpm },
      'r-empty': { resourcePool: 1_000, nutrientPool: 1_000, opportunityPpm: 100_000, disturbancePpm: 900_000 },
    },
  };
}

let state = createLifeState(input('p4:life-shipping:1'));
const adapter = createLifeShippingAdapter({ getState: () => state });
assert.equal(LIFE_V2_SHIPPING_ADAPTER_DESCRIPTOR.additiveOnly, true);
assert.deepEqual(LIFE_V2_SHIPPING_ADAPTER_DESCRIPTOR.centralAuthorityOverrides, []);

const packetA = adapter.buildViewportPacket({ regionId: 'r-life', viewportKey: 'local:r-life', maxSamples: 9, quality: 'HIGH' });
const packetB = adapter.buildViewportPacket({ regionId: 'r-life', viewportKey: 'local:r-life', maxSamples: 9, quality: 'HIGH' });
assert.deepEqual(packetA, packetB, 'same modeled state and request must produce byte-stable logical viewport data');
assert.equal(packetA.presence, 'VISIBLE_MODELED_LIFE');
assert.equal(packetA.samples.length, 9);
assert.equal(packetA.renderDescriptors.length, 9);
assert.deepEqual(
  new Set(packetA.renderDescriptors.map((descriptor) => descriptor.primitiveFamily)),
  new Set(['CHAINED_ELLIPSOIDS', 'BRANCHED_RADIAL_PATCHES', 'MODULAR_LOBES']),
  'model-derived morphology must remain visibly differentiated at the render packet boundary',
);
assert.ok(packetA.selectionTargets.every((target) => target.persistentIndividual === false));
assert.ok(packetA.selectionTargets.every((target) => target.individualIdentityPromoted === false));
assert.ok(packetA.selectionTargets.every((target) => target.selectionAuthorityClaimed === false));
assert.equal(adapter.revisit(packetA.revisitToken).status, 'REVISITED_EXACT');

const empty = adapter.buildViewportPacket({ regionId: 'r-empty', viewportKey: 'local:r-empty', maxSamples: 9 });
assert.equal(empty.presence, 'ABSENT_IN_REPRESENTED_REGION');
assert.equal(empty.absenceReason, 'NO_REPRESENTED_ABUNDANCE');
assert.match(empty.limitations[0], /not proof that life is impossible/);

const highMotion = packetA.renderDescriptors.map((descriptor) => descriptor.motion.amplitude);
state = createLifeState(input('p4:life-shipping:2', 100_000, 800_000));
const lowPacket = adapter.buildViewportPacket({ regionId: 'r-life', viewportKey: 'local:r-life', maxSamples: 9, quality: 'HIGH' });
assert.ok(lowPacket.renderDescriptors.every((descriptor, index) => descriptor.motion.amplitude < highMotion[index]), 'modeled opportunity/disturbance change must remain observable in viewport motion');

const changed = adapter.revisit(packetA.revisitToken);
assert.equal(changed.status, 'STATE_RESOLUTION_REQUIRED', 'revisit must not pretend a changed modeled state is the original state');
assert.equal(changed.persistenceAuthorityClaimed, false);

state = createLifeState(input('p4:life-shipping:resource'));

const preEvolution = adapter.buildViewportPacket({ regionId: 'r-life', viewportKey: 'local:evolution', maxSamples: 6, quality: 'HIGH' });
state = applyLineageEvent(state, {
  type: 'SPECIATION',
  eventKey: 'p4:life-shipping:speciation',
  parentLineageId: 'lin-mobile',
  childLineageId: 'lin-mobile-derived',
  criterionWitness: {
    satisfied: true,
    kind: 'PROFILE_BOUND_SELECTION_WITNESS',
    profileId: 'shipping-visible-evolution-v1',
    authorityClass: 'MODEL_DERIVED_SIMULATION',
  },
  traitDeltasPpm: [{ key: 'mobility', deltaPpm: '-700000' }, { key: 'phototrophy', deltaPpm: '800000' }],
  morphology: { symmetry: 'RADIAL_LIKE_MODEL_DESCRIPTOR', supportMode: 'ANCHOR_SUPPORT_MODELED', locomotionMode: 'SESSILE', feedingMode: 'PHOTOTROPHY_MODEL_DESCRIPTOR' },
});
assert.equal(state.lineages.length, 4, 'externally admitted modeled speciation event must remain revisitable in aggregate lineage history');
assert.notEqual(state.eventKey, preEvolution.sourceEventKey, 'admitted evolution event must advance external temporal identity');
const evolutionRevisit = adapter.revisit(preEvolution.revisitToken);
assert.equal(evolutionRevisit.status, 'STATE_RESOLUTION_REQUIRED', 'pre-evolution viewport revisit must resolve against changed modeled history rather than fake exactness');
state = createLifeState({
  ...state,
  eventKey: 'p4:life-shipping:derived-population-represented',
  populations: [
    ...state.populations,
    { id: 'pop-mobile-derived', lineageId: 'lin-mobile-derived', regionId: 'r-life', abundance: 100, lifecycleStagePpm: { juvenile: 0, mature: 1_000_000, senescent: 0 } },
  ],
});
const postEvolution = adapter.buildViewportPacket({ regionId: 'r-life', viewportKey: 'local:evolution', maxSamples: 12, quality: 'HIGH' });
const derivedDescriptors = postEvolution.renderDescriptors.filter((descriptor) => descriptor.lineageId === 'lin-mobile-derived');
assert.ok(derivedDescriptors.length > 0, 'represented descendant lineage must become observable in the actual viewport packet');
assert.ok(derivedDescriptors.every((descriptor) => descriptor.primitiveFamily === 'BRANCHED_RADIAL_PATCHES'), 'modeled descendant morphology must visibly differ through richer render grammar');
assert.ok(postEvolution.selectionTargets.some((target) => target.lineageId === 'lin-mobile-derived'), 'modeled descendant lineage must be selectable as an aggregate representative without persistent-individual promotion');

const bounded = adapter.buildViewportPacket({ regionId: 'r-life', viewportKey: 'local:stress', maxSamples: 999_999, quality: 'HIGH' });
assert.equal(bounded.maxSamples, 128);
assert.equal(bounded.samples.length, 128);
assert.equal(bounded.renderDescriptors.length, 128);
const packetBytes = Buffer.byteLength(JSON.stringify(bounded, (_key, value) => typeof value === 'bigint' ? value.toString() : value));
assert.ok(packetBytes < 1_048_576, `bounded viewport packet must remain below 1 MiB lane budget; got ${packetBytes}`);

const fallbackBridge = createLifeViewportBridge({
  provider: adapter.modelProvider,
  getEventKey: () => state.eventKey,
  renderDescriptors: (rows) => rows.map((sample) => ({
    id: `render:${sample.id}`,
    sampleId: sample.id,
    populationId: sample.populationId,
    lineageId: sample.lineageId,
    primitiveFamily: 'GENERIC_ELLIPSE',
    authorityClass: 'PRESENTATION_ONLY',
    evidenceLink: { representativeOnly: true },
  })),
});
assert.throws(
  () => fallbackBridge.buildViewportPacket({ regionId: 'r-life', viewportKey: 'old-fallback', maxSamples: 3 }),
  /generic ellipse fallback is forbidden/,
  'adversarial witness must fail if shipping silently falls back to old generic embodiment',
);

const reachability = adapter.reachabilityWitness();
assert.equal(reachability.runtimeExport, 'createLifeShippingAdapter');
assert.equal(reachability.exactArtifactEvidenceStatus, 'LANE_BUNDLE_AND_ONE_FILE_INJECTION_PROVEN__CENTRAL_MANIFEST_AND_LIVING_WIRING_REQUIRED');
assert.ok(reachability.sourceChain.includes('src/v2x-08-life-ecology-evolution-embodiment/shipping-adapter.js'));
assert.ok(reachability.sourceChain.at(-1).endsWith('/shipping-bundle.mjs'));
console.log(`V2X-08 Life 2.0 shipping viewport: PASS (maxPacketBytes=${packetBytes})`);
