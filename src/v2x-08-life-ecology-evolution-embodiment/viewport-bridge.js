const MAX_VIEWPORT_ORGANISMS = 128;
const QUALITY = new Set(['LOW', 'BALANCED', 'HIGH']);

function invariant(condition, message) {
  if (!condition) throw new Error(`LIFE_V2_VIEWPORT_INVALID: ${message}`);
}

function token(value, name, max = 256) {
  const out = String(value ?? '');
  invariant(out.length > 0 && out.length <= max, `${name} required`);
  return out;
}

function boundedCount(value, fallback = 32) {
  const numeric = value == null ? fallback : Number(value);
  invariant(Number.isFinite(numeric) && numeric >= 0, 'maxSamples must be a non-negative finite number');
  return Math.min(MAX_VIEWPORT_ORGANISMS, Math.floor(numeric));
}

function stableValue(value, seen = new Set()) {
  if (typeof value === 'bigint') return { $bigint: value.toString() };
  if (value == null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    invariant(Number.isFinite(value), 'fingerprint values must be finite');
    return Object.is(value, -0) ? 0 : value;
  }
  invariant(typeof value === 'object', 'unsupported fingerprint value');
  invariant(!seen.has(value), 'cyclic fingerprint value');
  seen.add(value);
  let out;
  if (Array.isArray(value)) out = value.map((entry) => stableValue(entry, seen));
  else {
    out = {};
    for (const key of Object.keys(value).sort()) out[key] = stableValue(value[key], seen);
  }
  seen.delete(value);
  return out;
}

function hash32(text) {
  let hash = 2166136261 >>> 0;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash >>> 0;
}

export function fingerprintLifeViewport(value) {
  return hash32(JSON.stringify(stableValue(value))).toString(16).padStart(8, '0');
}

export const LIFE_V2_VIEWPORT_BRIDGE_DESCRIPTOR = Object.freeze({
  id: 'ofu.v2x-08.life-viewport-bridge',
  version: '2.0.0',
  authorityClass: 'MODEL_DERIVED_SIMULATION',
  maxViewportOrganisms: MAX_VIEWPORT_ORGANISMS,
  additiveOnly: true,
  ownsCentralSelection: false,
  ownsCameraOrScale: false,
  ownsSceneComposition: false,
  ownsPrimaryRenderer: false,
  ownsPersistenceReplay: false,
  capabilities: Object.freeze([
    'LIFE_VIEWPORT_PACKET',
    'LIFE_VIEWPORT_ABSENCE_REASON',
    'LIFE_SELECTION_TARGETS',
    'LIFE_REVISIT_TOKEN',
    'LIFE_V2X07_LOCAL_SPACE_HOOK',
    'LIFE_V2X13_RENDER_PACKET_HOOK',
  ]),
});

function validateDescriptor(sample, descriptor) {
  invariant(descriptor && typeof descriptor === 'object', 'renderer descriptor required');
  invariant(descriptor.authorityClass === 'PRESENTATION_ONLY', 'render descriptor must remain PRESENTATION_ONLY');
  invariant(descriptor.sampleId === sample.id, 'render descriptor sample identity mismatch');
  invariant(descriptor.populationId === sample.populationId, 'render descriptor population identity mismatch');
  invariant(descriptor.lineageId === sample.lineageId, 'render descriptor lineage identity mismatch');
  invariant(descriptor.primitiveFamily !== 'GENERIC_ELLIPSE', 'generic ellipse fallback is forbidden when rich morphology is available');
  invariant(descriptor.evidenceLink?.representativeOnly === true, 'render descriptor must preserve representative-only evidence guard');
}

function buildSelectionTarget(sample, descriptor) {
  return Object.freeze({
    selectionKind: 'MODELED_POPULATION_REPRESENTATIVE',
    targetId: `life:${sample.id}`,
    sampleId: sample.id,
    populationId: sample.populationId,
    lineageId: sample.lineageId,
    regionId: sample.regionId,
    renderDescriptorId: descriptor.id,
    persistentIndividual: false,
    individualIdentityPromoted: false,
    authorityClass: 'MODEL_DERIVED_SIMULATION',
    selectionAuthorityClaimed: false,
  });
}

function requestFromToken(revisitToken) {
  invariant(revisitToken?.schema === 'ofu-v2x-08-life-revisit-token-1', 'valid revisit token required');
  return {
    regionId: revisitToken.regionId,
    viewportKey: revisitToken.viewportKey,
    maxSamples: revisitToken.maxSamples,
    quality: revisitToken.quality,
  };
}

export function createLifeViewportBridge({ provider, renderDescriptors, getEventKey }) {
  invariant(provider && typeof provider === 'object', 'provider required');
  invariant(typeof provider.summary === 'function', 'provider.summary required');
  invariant(typeof provider.inspectRegion === 'function', 'provider.inspectRegion required');
  invariant(typeof provider.localSamples === 'function', 'provider.localSamples required');
  invariant(typeof renderDescriptors === 'function', 'renderDescriptors function required');
  invariant(typeof getEventKey === 'function', 'getEventKey function required');

  function buildViewportPacket(request = {}) {
    const regionId = token(request.regionId, 'regionId');
    const viewportKey = token(request.viewportKey ?? `life:${regionId}`, 'viewportKey');
    const maxSamples = boundedCount(request.maxSamples, 32);
    const quality = String(request.quality ?? 'BALANCED');
    invariant(QUALITY.has(quality), 'unsupported quality profile');

    const sourceEventKey = token(getEventKey(), 'source event key');
    const summary = provider.summary();
    const region = provider.inspectRegion(regionId);
    const samples = region == null || maxSamples === 0
      ? []
      : provider.localSamples({ regionId, viewportKey, maxSamples });
    invariant(Array.isArray(samples), 'provider localSamples must return an array');
    invariant(samples.length <= maxSamples && samples.length <= MAX_VIEWPORT_ORGANISMS, 'provider exceeded viewport sample bound');
    invariant(samples.every((sample) => sample?.representativeOfAggregate === true), 'viewport samples must be aggregate representatives');
    invariant(samples.every((sample) => sample?.persistent === false && sample?.individualIdentityPromoted === false), 'viewport samples must not become persistent individuals');

    const descriptors = renderDescriptors(samples, { quality, maxDescriptors: maxSamples });
    invariant(Array.isArray(descriptors), 'renderer must return an array');
    invariant(descriptors.length === samples.length, 'renderer/sample cardinality mismatch');
    invariant(descriptors.length <= MAX_VIEWPORT_ORGANISMS, 'renderer exceeded viewport descriptor bound');
    for (let index = 0; index < descriptors.length; index += 1) validateDescriptor(samples[index], descriptors[index]);

    const selectionTargets = Object.freeze(samples.map((sample, index) => buildSelectionTarget(sample, descriptors[index])));
    const presence = samples.length > 0 ? 'VISIBLE_MODELED_LIFE' : 'ABSENT_IN_REPRESENTED_REGION';
    const absenceReason = samples.length > 0
      ? null
      : region == null
        ? 'REGION_NOT_REPRESENTED_BY_LIFE_MODEL'
        : (region.totalRepresentedAbundance ?? 0n) === 0n
          ? 'NO_REPRESENTED_ABUNDANCE'
          : maxSamples === 0
            ? 'VIEWPORT_SAMPLE_BUDGET_ZERO'
            : 'NO_LOCAL_SAMPLES_AFTER_BOUNDED_MATERIALIZATION';

    const packetCore = {
      schema: 'ofu-v2x-08-life-viewport-packet-1',
      sourceEventKey,
      regionId,
      viewportKey,
      maxSamples,
      quality,
      presence,
      absenceReason,
      summary,
      region,
      samples,
      renderDescriptors: descriptors,
      selectionTargets,
      authority: {
        ecology: 'MODEL_DERIVED_SIMULATION',
        morphology: 'MODEL_DERIVED_SIMULATION',
        behaviorOpportunity: 'MODEL_DERIVED_SIMULATION',
        renderGeometry: 'PRESENTATION_ONLY',
        temporalAdmission: 'EXTERNAL_P4_OR_GOVERNED_GAMEPLAY',
      },
      claimGuards: {
        canonicalAlienBiology: false,
        persistentIndividualIdentity: false,
        globalAbundanceFromLocalSamples: false,
        empiricalEthology: false,
        cognitionInference: false,
      },
      convergenceHooks: {
        localSpace: {
          owner: 'V2X-07_OR_CONVERGENCE',
          operation: 'MAP_NORMALIZED_LOCAL_POSITION',
          sourceDomain: 'NORMALIZED_LOCAL_CUBE',
          mutatesCameraAuthority: false,
        },
        primaryRenderer: {
          owner: 'V2X-13_OR_CONVERGENCE',
          packetFamily: 'LIFE_ORGANISM_DESCRIPTOR_SET',
          mutatesPrimaryRendererAuthority: false,
        },
        selection: {
          owner: 'CONVERGENCE_OWNER',
          operation: 'REGISTER_ADDITIVE_SELECTION_TARGETS',
          mutatesSelectionAuthority: false,
        },
        persistence: {
          owner: 'CONVERGENCE_OWNER',
          operation: 'PERSIST_REVISIT_TOKEN_WITH_GOVERNED_STATE',
          mutatesPersistenceReplayAuthority: false,
        },
      },
      limitations: [
        'Absence means no represented life in this bounded model/region, not proof that life is impossible.',
        'Organism samples are deterministic representatives of aggregate modeled populations, never persistent individual facts.',
        'Geometry and motion are presentation-only projections of bounded model-derived descriptors.',
      ],
    };
    const packetFingerprint = fingerprintLifeViewport(packetCore);
    const revisitToken = Object.freeze({
      schema: 'ofu-v2x-08-life-revisit-token-1',
      sourceEventKey,
      regionId,
      viewportKey,
      maxSamples,
      quality,
      packetFingerprint,
      authorityClass: 'MODEL_DERIVED_SIMULATION',
      persistencePerformed: false,
    });
    return Object.freeze({ ...packetCore, packetFingerprint, revisitToken });
  }

  function revisit(revisitToken) {
    const request = requestFromToken(revisitToken);
    const currentEventKey = token(getEventKey(), 'current event key');
    if (currentEventKey !== revisitToken.sourceEventKey) {
      return Object.freeze({
        status: 'STATE_RESOLUTION_REQUIRED',
        sourceEventKey: revisitToken.sourceEventKey,
        currentEventKey,
        regionId: revisitToken.regionId,
        packetFingerprint: revisitToken.packetFingerprint,
        persistenceAuthorityClaimed: false,
      });
    }
    const packet = buildViewportPacket(request);
    if (packet.packetFingerprint !== revisitToken.packetFingerprint) {
      return Object.freeze({
        status: 'STATE_RESOLUTION_REQUIRED',
        reason: 'STATE_FINGERPRINT_MISMATCH',
        sourceEventKey: revisitToken.sourceEventKey,
        currentEventKey,
        regionId: revisitToken.regionId,
        packetFingerprint: revisitToken.packetFingerprint,
        currentPacketFingerprint: packet.packetFingerprint,
        persistenceAuthorityClaimed: false,
      });
    }
    return Object.freeze({ status: 'REVISITED_EXACT', packet });
  }

  function reachabilityWitness() {
    return Object.freeze({
      schema: 'ofu-v2x-08-life-reachability-hook-1',
      runtimeExport: 'createLifeShippingAdapter',
      sourceChain: Object.freeze([
        'src/v2x-08-life-ecology-evolution-embodiment/model.js',
        'src/v2x-08-life-ecology-evolution-embodiment/provider.js',
        'src/v2x-08-life-ecology-evolution-embodiment/embodiment.js',
        'src/v2x-08-life-ecology-evolution-embodiment/renderer.js',
        'src/v2x-08-life-ecology-evolution-embodiment/viewport-bridge.js',
        'src/v2x-08-life-ecology-evolution-embodiment/shipping-adapter.js',
        'src/v2x-08-life-ecology-evolution-embodiment/shipping-bundle.mjs',
      ]),
      centralManifestHook: 'ADD_LIFE_SHIPPING_ADAPTER_WITHOUT_REPLACING_CENTRAL_AUTHORITIES',
      livingConsumerHook: 'REGISTER packet.selectionTargets + map renderDescriptors through V2X-07/V2X-13 additive seams',
      exactArtifactEvidenceStatus: 'LANE_BUNDLE_AND_ONE_FILE_INJECTION_PROVEN__CENTRAL_MANIFEST_AND_LIVING_WIRING_REQUIRED',
      authorityClass: 'MEASURED_RUNTIME_EVIDENCE',
    });
  }

  return Object.freeze({ descriptor: LIFE_V2_VIEWPORT_BRIDGE_DESCRIPTOR, buildViewportPacket, revisit, reachabilityWitness });
}
