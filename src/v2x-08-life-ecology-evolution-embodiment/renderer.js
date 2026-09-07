function assert(condition, message) {
  if (!condition) throw new Error(`LIFE_V2_RENDER_INVALID: ${message}`);
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value)));
}

export function buildOrganismRenderDescriptors(samples, options = {}) {
  assert(Array.isArray(samples), 'samples array required');
  const maxDescriptors = Math.max(0, Math.min(Number(options.maxDescriptors ?? 128), 128));
  const quality = String(options.quality ?? 'BALANCED');
  assert(['LOW', 'BALANCED', 'HIGH'].includes(quality), 'unsupported quality profile');
  const segmentBudget = quality === 'LOW' ? 3 : quality === 'BALANCED' ? 5 : 8;

  return Object.freeze(samples.slice(0, maxDescriptors).map((sample) => {
    assert(sample?.morphology?.authorityClass === 'MODEL_DERIVED_SIMULATION', 'semantic morphology descriptor required');
    const sizeScale = sample.morphology.sizeBand === 'TINY' ? 0.35 : sample.morphology.sizeBand === 'LARGE' ? 1.35 : 0.8;
    const defenseScale = sample.morphology.defenseBand === 'HIGH' ? 1 : sample.morphology.defenseBand === 'MODERATE' ? 0.65 : 0.3;
    const motionAmplitude = clamp01(sample.presentation?.motionAmplitude ?? 0);

    return Object.freeze({
      id: `render:${sample.id}`,
      sampleId: sample.id,
      populationId: sample.populationId,
      lineageId: sample.lineageId,
      primitiveFamily: sample.morphology.semanticBodyPlan === 'MOBILE_ARTICULATED'
        ? 'CHAINED_ELLIPSOIDS'
        : sample.morphology.semanticBodyPlan === 'SESSILE_CAPTURE_SURFACE'
          ? 'BRANCHED_RADIAL_PATCHES'
          : 'MODULAR_LOBES',
      segmentBudget,
      sizeScale,
      defenseScale,
      position: sample.position,
      orientationTurns: sample.orientationTurns,
      motion: Object.freeze({
        phase: sample.presentation?.motionPhase ?? 0,
        amplitude: motionAmplitude,
        authorityClass: 'PRESENTATION_ONLY',
      }),
      visualGrammar: Object.freeze({
        symmetry: sample.morphology.symmetry,
        supportMode: sample.morphology.supportMode,
        locomotionMode: sample.morphology.locomotionMode,
        feedingMode: sample.morphology.feedingMode,
      }),
      authorityClass: 'PRESENTATION_ONLY',
      evidenceLink: Object.freeze({
        populationId: sample.populationId,
        aggregateAbundance: sample.aggregateAbundance,
        representativeOnly: true,
      }),
      limitations: Object.freeze([
        'Geometry is a deterministic presentation of semantic modeled traits.',
        'Rendered body plan is not an empirical prediction of alien anatomy.',
        'Motion is presentation-only and does not establish physiology or cognition.',
      ]),
    });
  }));
}

export function cullOrganismRenderDescriptors(descriptors, visibility) {
  assert(Array.isArray(descriptors), 'descriptor array required');
  const isVisible = typeof visibility === 'function' ? visibility : () => true;
  return Object.freeze(descriptors.filter((descriptor) => isVisible(descriptor.position, descriptor)));
}
