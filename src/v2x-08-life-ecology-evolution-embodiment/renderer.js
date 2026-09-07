function assert(condition, message) {
  if (!condition) throw new Error(`LIFE_V2_RENDER_INVALID: ${message}`);
}

function boundedNumber(value, name, min, max) {
  const numeric = Number(value);
  assert(Number.isFinite(numeric), `${name} must be finite`);
  assert(numeric >= min && numeric <= max, `${name} out of bounds`);
  return numeric;
}

function boundedDescriptorCount(value) {
  const numeric = Number(value);
  assert(Number.isFinite(numeric) && numeric >= 0, 'maxDescriptors must be a non-negative finite number');
  return Math.max(0, Math.min(Math.floor(numeric), 128));
}

export function buildOrganismRenderDescriptors(samples, options = {}) {
  assert(Array.isArray(samples), 'samples array required');
  const maxDescriptors = boundedDescriptorCount(options.maxDescriptors ?? 128);
  const quality = String(options.quality ?? 'BALANCED');
  assert(['LOW', 'BALANCED', 'HIGH'].includes(quality), 'unsupported quality profile');
  const segmentBudget = quality === 'LOW' ? 3 : quality === 'BALANCED' ? 5 : 8;

  return Object.freeze(samples.slice(0, maxDescriptors).map((sample) => {
    assert(sample?.morphology?.authorityClass === 'MODEL_DERIVED_SIMULATION', 'semantic morphology descriptor required');
    assert(sample?.lifecycle?.authorityClass === 'MODEL_DERIVED_SIMULATION', 'representative lifecycle descriptor required');
    assert(sample.lifecycle.representativeOnly === true && sample.lifecycle.persistentIndividualFact === false, 'representative lifecycle semantics required');
    assert(['JUVENILE', 'MATURE', 'SENESCENT'].includes(sample.lifecycle.stage), 'unsupported representative lifecycle stage');
    assert(sample?.behavior?.authorityClass === 'MODEL_DERIVED_SIMULATION', 'modeled behavior opportunity descriptor required');
    assert(sample.behavior.cognitionClaimed === false && sample.behavior.empiricalEthologyClaimed === false, 'behavior claim guards required');
    assert(typeof sample.behavior.activityOpportunityPpm === 'bigint' && sample.behavior.activityOpportunityPpm >= 0n && sample.behavior.activityOpportunityPpm <= 1_000_000n, 'activity opportunity ppm out of bounds');
    assert(sample?.presentation?.authorityClass === 'PRESENTATION_ONLY', 'presentation-only motion descriptor required');
    assert(sample?.representativeOfAggregate === true, 'representative aggregate sample required');
    assert(String(sample.id ?? '').length > 0, 'sample id required');
    assert(String(sample.populationId ?? '').length > 0, 'population id required');
    assert(String(sample.lineageId ?? '').length > 0, 'lineage id required');
    assert(typeof sample.aggregateAbundance === 'bigint' && sample.aggregateAbundance >= 0n, 'aggregate abundance evidence must be a non-negative bigint');

    const position = Object.freeze({
      x: boundedNumber(sample.position?.x, 'position.x', -1, 1),
      y: boundedNumber(sample.position?.y, 'position.y', -1, 1),
      z: boundedNumber(sample.position?.z, 'position.z', -1, 1),
    });
    const orientationTurns = boundedNumber(sample.orientationTurns, 'orientationTurns', 0, 1);
    const motionPhase = boundedNumber(sample.presentation.motionPhase ?? 0, 'motionPhase', 0, 1);
    const baseMotionAmplitude = boundedNumber(sample.presentation.motionAmplitude ?? 0, 'motionAmplitude', 0, 1);
    const modeledActivityAmplitude = Number(sample.behavior.activityOpportunityPpm) / 1_000_000;
    assert(Math.abs(baseMotionAmplitude - modeledActivityAmplitude) <= Number.EPSILON * 4, 'presentation motion amplitude must remain bound to modeled activity opportunity');
    const baseSizeScale = sample.morphology.sizeBand === 'TINY' ? 0.35 : sample.morphology.sizeBand === 'LARGE' ? 1.35 : 0.8;
    const lifecycleScale = sample.lifecycle.stage === 'JUVENILE' ? 0.65 : sample.lifecycle.stage === 'SENESCENT' ? 0.9 : 1;
    const lifecycleMotionScale = sample.lifecycle.stage === 'SENESCENT' ? 0.65 : sample.lifecycle.stage === 'JUVENILE' ? 0.85 : 1;
    const sizeScale = baseSizeScale * lifecycleScale;
    const defenseScale = sample.morphology.defenseBand === 'HIGH' ? 1 : sample.morphology.defenseBand === 'MODERATE' ? 0.65 : 0.3;
    const motionAmplitude = baseMotionAmplitude * lifecycleMotionScale;

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
      position,
      orientationTurns,
      motion: Object.freeze({
        phase: motionPhase,
        amplitude: motionAmplitude,
        activityCue: String(sample.presentation.activityCue ?? 'BASELINE_ACTIVITY_PRESENTATION'),
        authorityClass: 'PRESENTATION_ONLY',
      }),
      visualGrammar: Object.freeze({
        symmetry: sample.morphology.symmetry,
        supportMode: sample.morphology.supportMode,
        locomotionMode: sample.morphology.locomotionMode,
        feedingMode: sample.morphology.feedingMode,
        representativeLifecycleStage: sample.lifecycle.stage,
        modeledBehaviorClass: sample.behavior.behaviorClass,
      }),
      authorityClass: 'PRESENTATION_ONLY',
      evidenceLink: Object.freeze({
        populationId: sample.populationId,
        aggregateAbundance: sample.aggregateAbundance,
        representativeLifecycleStage: sample.lifecycle.stage,
        modeledBehaviorClass: sample.behavior.behaviorClass,
        activityOpportunityPpm: sample.behavior.activityOpportunityPpm,
        representativeOnly: true,
      }),
      limitations: Object.freeze([
        'Geometry is a deterministic presentation of semantic modeled traits.',
        'Rendered body plan and lifecycle scaling are not empirical predictions of alien anatomy or ontogeny.',
        'Motion responds to bounded modeled activity opportunity but remains presentation-only and does not establish physiology, cognition, or empirical ethology.',
      ]),
    });
  }));
}

export function cullOrganismRenderDescriptors(descriptors, visibility) {
  assert(Array.isArray(descriptors), 'descriptor array required');
  const isVisible = typeof visibility === 'function' ? visibility : () => true;
  return Object.freeze(descriptors.filter((descriptor) => isVisible(descriptor.position, descriptor)));
}
