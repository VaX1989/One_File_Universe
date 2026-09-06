(function (root) {
'use strict';
const O = root.OFU = root.OFU || {};
const CONTRACT = 'ofu-v1x05-planet-approach-provider-1';
const VERSION = '1.0.0';
const AUTHORITY = 'PRESENTATION_ONLY';
const PHYSICAL_CONTRACT = 'ofu-p5-planet-physical-v1';
const ENVIRONMENT_CONTRACT = 'ofu-p5-p6-environment-v2';
const MAX_TRACE_SAMPLES = 1025;
const VISIBLE_SOURCE_CLASSES = new Set(['CANONICAL_PROVEN', 'MODEL_DERIVED_SIMULATION']);
const EPS = 1e-12;
function fail(message) { throw new Error('V1X-05: ' + message); }
function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  if (ArrayBuffer.isView(value)) return value;
  for (const key of Object.keys(value)) deepFreeze(value[key]);
  return Object.freeze(value);
}
function cloneData(value) {
  if (value == null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(cloneData);
  if (ArrayBuffer.isView(value)) return Array.from(value);
  const out = {};
  for (const key of Object.keys(value)) out[key] = cloneData(value[key]);
  return out;
}
function finite(value, label) {
  const n = Number(value);
  if (!Number.isFinite(n)) fail(label + ' must be finite');
  return n;
}
function positive(value, label) {
  const n = finite(value, label);
  if (!(n > 0)) fail(label + ' must be positive');
  return n;
}
function exactNumber(value, label) {
  if (typeof value === 'bigint') {
    const limit = BigInt(Number.MAX_SAFE_INTEGER);
    if (value > limit || value < -limit) fail(label + ' exceeds exact Number range');
    return Number(value);
  }
  return finite(value, label);
}
function vec3(value, label) {
  if (!Array.isArray(value) || value.length !== 3) fail(label + ' must be vec3');
  return value.map((v, i) => finite(v, label + '[' + i + ']'));
}
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = a => Math.hypot(a[0], a[1], a[2]);
function unit(a, label) {
  const n = norm(a);
  if (!(n > EPS)) fail((label || 'vector') + ' has no direction');
  return mul(a, 1 / n);
}
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const smoothstep = t => { const x = clamp(t, 0, 1); return x * x * (3 - 2 * x); };
function orthogonal(v) {
  const a = v.map(Math.abs);
  const basis = a[0] <= a[1] && a[0] <= a[2] ? [1, 0, 0] : (a[1] <= a[2] ? [0, 1, 0] : [0, 0, 1]);
  return unit(cross(v, basis), 'antipodal tangent');
}
function slerpUnit(a, b, t) {
  const d = clamp(dot(a, b), -1, 1);
  if (d > 0.999999) return unit(add(mul(a, 1 - t), mul(b, t)), 'slerp');
  if (d < -0.999999) {
    const tangent = orthogonal(a);
    const angle = Math.PI * t;
    return unit(add(mul(a, Math.cos(angle)), mul(tangent, Math.sin(angle))), 'antipodal slerp');
  }
  const angle = Math.acos(d);
  const sinAngle = Math.sin(angle);
  return unit(add(mul(a, Math.sin((1 - t) * angle) / sinAngle), mul(b, Math.sin(t * angle) / sinAngle)), 'slerp');
}
function physicalFacts(payload) {
  if (!payload || payload.contractId !== PHYSICAL_CONTRACT || payload.status !== 'SUPPORTED' || !payload.physical) fail('supported P5 physical payload required');
  const radiusM = positive(exactNumber(payload.physical.meanRadiusM, 'meanRadiusM'), 'meanRadiusM');
  const gravityMicro = positive(exactNumber(payload.physical.surfaceGravityMicroMs2, 'surfaceGravityMicroMs2'), 'surfaceGravityMicroMs2');
  return deepFreeze({radiusM, surfaceGravityMs2: gravityMicro / 1e6, sourceContract: PHYSICAL_CONTRACT, sourceAuthorityClass: 'CANONICAL_PROVEN', presentationAuthorityClass: AUTHORITY});
}
function modelCue(kind, cue) {
  if (!cue) return deepFreeze({kind, enabled: false, reason: 'NO_SUPPORTED_SOURCE', sourceAuthorityClass: null, presentationAuthorityClass: AUTHORITY, scientificEvidence: false});
  const authorized = VISIBLE_SOURCE_CLASSES.has(cue.authorityClass) && cue.supported === true && typeof cue.sourceId === 'string' && cue.sourceId.length > 0;
  if (!authorized) return deepFreeze({kind, enabled: false, reason: 'SOURCE_NOT_AUTHORIZED', sourceAuthorityClass: cue.authorityClass || null, presentationAuthorityClass: AUTHORITY, scientificEvidence: false});
  return deepFreeze({kind, enabled: true, reason: 'SUPPORTED_SOURCE', sourceAuthorityClass: cue.authorityClass, sourceId: cue.sourceId, claim: typeof cue.claim === 'string' ? cue.claim : null, presentationAuthorityClass: AUTHORITY, scientificEvidence: false});
}
function cuePolicy(environment, modelCues = {}) {
  let atmosphere = deepFreeze({kind: 'atmosphere', enabled: false, reason: 'UNKNOWN_OR_UNSUPPORTED', sourceAuthorityClass: null, presentationAuthorityClass: AUTHORITY, scientificEvidence: false});
  if (environment && environment.contractId === ENVIRONMENT_CONTRACT && environment.atmosphere && environment.atmosphere.epistemicStatus === 'KNOWN') {
    const retained = exactNumber(environment.atmosphere.atmosphericRetainedMassTg ?? 0, 'atmosphericRetainedMassTg');
    atmosphere = deepFreeze({kind: 'atmosphere', enabled: retained > 0, reason: retained > 0 ? 'CANONICAL_KNOWN_RETAINED_MASS' : 'CANONICAL_KNOWN_ZERO_RETAINED_MASS', sourceAuthorityClass: 'CANONICAL_PROVEN', sourceId: environment.atmosphere.provenance || ENVIRONMENT_CONTRACT, presentationAuthorityClass: AUTHORITY, scientificEvidence: false});
  } else if (modelCues.atmosphere) {
    atmosphere = modelCue('atmosphere', modelCues.atmosphere);
  }
  return deepFreeze({atmosphere, water: modelCue('water', modelCues.water), ice: modelCue('ice', modelCues.ice), material: modelCue('material', modelCues.material), policy: 'VISIBLE_ONLY_WHEN_SOURCE_AUTHORIZED', authorityClass: AUTHORITY});
}
function normalizeLongitude(value) {
  let x = finite(value, 'longitudeDeg');
  x = ((x + 180) % 360 + 360) % 360 - 180;
  return x === -180 ? 180 : x;
}
function surfaceTarget({planetId, latitudeDeg, longitudeDeg, radiusM, surfaceTargetReferenceFrameId = null}) {
  if (typeof planetId !== 'string' || !planetId || planetId.includes('/nav-anchor/')) fail('stable planetId required');
  const lat = finite(latitudeDeg, 'latitudeDeg');
  if (lat < -90 || lat > 90) fail('latitudeDeg out of range');
  const lon = normalizeLongitude(longitudeDeg);
  const phi = lat * Math.PI / 180;
  const lambda = lon * Math.PI / 180;
  const direction = unit([Math.cos(phi) * Math.cos(lambda), Math.sin(phi), Math.cos(phi) * Math.sin(lambda)], 'surface direction');
  const quantized = direction.map(v => Math.round(v * 1e9));
  return deepFreeze({planetId, latitudeDeg: lat, longitudeDeg: lon, directionPlanetLocal: direction, pointOnMeanRadiusM: mul(direction, positive(radiusM, 'radiusM')), anchorToken: planetId + '/nav-anchor/' + quantized.join(','), referenceFrameId: surfaceTargetReferenceFrameId, projection: 'GEOCENTRIC_PRESENTATION_MEAN_RADIUS', authorityClass: AUTHORITY, canonicalGeodesyClaim: false, elevationClaim: false});
}
function splitVec3(value) {
  const v = vec3(value, 'split vector');
  const hi = v.map(x => Math.fround(x));
  return deepFreeze({hi, lo: v.map((x, i) => x - hi[i])});
}
function reconstructSplit(pair) { return pair.hi.map((v, i) => v + pair.lo[i]); }
function stageFor(radiusRatio, last) {
  if (last) return 'SURFACE_TARGET';
  if (radiusRatio > 1000) return 'SYSTEM_HANDOFF';
  if (radiusRatio > 50) return 'FAR_APPROACH';
  if (radiusRatio > 8) return 'ORBIT_CONTEXT';
  if (radiusRatio > 1.5) return 'APPROACH';
  return 'DESCENT';
}
function project(input = {}) {
  const selected = input.selectedCanonicalTarget;
  if (typeof selected !== 'string' || !selected) fail('selectedCanonicalTarget required');
  const facts = physicalFacts(input.physicalPlanet);
  const handoff = input.frameHandoff;
  if (!handoff || typeof handoff !== 'object') fail('frameHandoff required');
  if (handoff.planetId !== selected) fail('frameHandoff planet identity mismatch');
  if (typeof handoff.systemReferenceFrameId !== 'string' || !handoff.systemReferenceFrameId) fail('systemReferenceFrameId required');
  if (typeof handoff.planetReferenceFrameId !== 'string' || !handoff.planetReferenceFrameId) fail('planetReferenceFrameId required');
  const start = vec3(handoff.cameraPlanetLocalM, 'cameraPlanetLocalM');
  const startRadius = norm(start);
  if (!(startRadius > facts.radiusM)) fail('camera must begin above mean radius');
  const sampleCount = input.samples == null ? 257 : Number(input.samples);
  if (!Number.isInteger(sampleCount) || sampleCount < 2 || sampleCount > MAX_TRACE_SAMPLES) fail('samples out of range');
  const handoffAltitudeM = input.surfaceHandoffAltitudeM == null ? clamp(facts.radiusM * 0.002, 500, 100000) : positive(input.surfaceHandoffAltitudeM, 'surfaceHandoffAltitudeM');
  const finalRadius = facts.radiusM + handoffAltitudeM;
  if (!(startRadius > finalRadius)) fail('camera starts inside requested surface handoff radius');
  const target = surfaceTarget({planetId: selected, latitudeDeg: input.surfaceTarget?.latitudeDeg ?? 0, longitudeDeg: input.surfaceTarget?.longitudeDeg ?? 0, radiusM: facts.radiusM, surfaceTargetReferenceFrameId: input.surfaceTarget?.surfaceTargetReferenceFrameId ?? null});
  const cues = cuePolicy(input.environment || null, input.modelCues || {});
  const startDirection = unit(start, 'cameraPlanetLocalM');
  const targetDirection = target.directionPlanetLocal;
  const frames = [];
  let maxStepM = 0;
  let maxSplitReconstructionErrorM = 0;
  let previous = null;
  let previousRadius = Infinity;
  for (let i = 0; i < sampleCount; i++) {
    const t = i / (sampleCount - 1);
    const s = smoothstep(t);
    const radius = Math.exp(Math.log(startRadius) + (Math.log(finalRadius) - Math.log(startRadius)) * s);
    const direction = slerpUnit(startDirection, targetDirection, s);
    let position = mul(direction, radius);
    if (i === 0) position = start.slice();
    if (i === sampleCount - 1) position = mul(targetDirection, finalRadius);
    const split = splitVec3(position);
    const splitError = norm(sub(position, reconstructSplit(split)));
    maxSplitReconstructionErrorM = Math.max(maxSplitReconstructionErrorM, splitError);
    if (previous) {
      maxStepM = Math.max(maxStepM, norm(sub(position, previous)));
      if (radius > previousRadius + Math.max(1e-6, previousRadius * 1e-12)) fail('approach radius is not monotonic');
    }
    frames.push(deepFreeze({index: i, t, stage: stageFor(radius / facts.radiusM, i === sampleCount - 1), selectedCanonicalTarget: selected, referenceFrameId: handoff.planetReferenceFrameId, positionPlanetLocalM: position, positionHighLowM: split, lookAtPlanetLocalM: [0, 0, 0], altitudeAboveMeanRadiusM: Math.max(0, radius - facts.radiusM), authorityClass: AUTHORITY}));
    previous = position;
    previousRadius = radius;
  }
  const first = frames[0];
  const last = frames[frames.length - 1];
  return deepFreeze({contract: CONTRACT, version: VERSION, authorityClass: AUTHORITY, selectedCanonicalTarget: selected, physicalFacts: facts, cues, surfaceTarget: target, systemHandoff: {selectedCanonicalTarget: selected, referenceFrameId: handoff.systemReferenceFrameId, planetReferenceFrameId: handoff.planetReferenceFrameId, transformPreappliedByUpstream: true, systemContext: cloneData(handoff.systemContext ?? null)}, frames, continuity: {model: 'SMOOTHSTEP_LOG_RADIUS_GREAT_CIRCLE', sampleCount, maxStepM, maxSplitReconstructionErrorM, monotonicRadialDescent: true, teleportOperationCount: 0, startPositionPlanetLocalM: first.positionPlanetLocalM, endPositionPlanetLocalM: last.positionPlanetLocalM}, referenceFrameWitness: [{stage: 'SYSTEM_HANDOFF', selectedCanonicalTarget: selected, referenceFrameId: handoff.systemReferenceFrameId}, {stage: 'ORBIT_APPROACH', selectedCanonicalTarget: selected, referenceFrameId: handoff.planetReferenceFrameId}, {stage: 'SURFACE_TARGET', selectedCanonicalTarget: selected, referenceFrameId: target.referenceFrameId || handoff.planetReferenceFrameId, anchorToken: target.anchorToken}], resourcePolicy: {maxTraceSamples: MAX_TRACE_SAMPLES, absoluteSystemCoordinatesConsumed: false, planetLocalHighLowEncoding: true}, integration: {cameraStateMutation: false, selectionMutation: false, canonicalPromotion: false, upstreamFrameTransformRequired: true}});
}
function reverseExit(packet) {
  if (!packet || packet.contract !== CONTRACT || !Array.isArray(packet.frames) || packet.frames.length < 2) fail('approach packet required');
  const selected = packet.selectedCanonicalTarget;
  const frames = packet.frames.slice().reverse().map((frame, index) => deepFreeze({...frame, index, t: index / (packet.frames.length - 1), stage: index === packet.frames.length - 1 ? 'SYSTEM_RETURN_HANDOFF' : 'REVERSE_EXIT'}));
  return deepFreeze({contract: CONTRACT, version: VERSION, authorityClass: AUTHORITY, direction: 'EXIT_TO_SYSTEM', selectedCanonicalTarget: selected, frames, exitHandoff: packet.systemHandoff, selectionPreserved: frames.every(frame => frame.selectedCanonicalTarget === selected), canonicalPromotion: false});
}
const GLOBE_VERTEX_SHADER = `#version 300 es\nprecision highp float;\nlayout(location=0) in vec3 aPosition;\nlayout(location=1) in vec3 aNormal;\nuniform mat4 uMvp;\nout vec3 vNormal;\nvoid main(){vNormal=normalize(aNormal);gl_Position=uMvp*vec4(aPosition,1.0);}`;
const GLOBE_FRAGMENT_SHADER = `#version 300 es\nprecision highp float;\nin vec3 vNormal;\nuniform vec3 uLightDirection;\nuniform float uAtmosphereCue;\nuniform float uWaterCue;\nuniform float uIceCue;\nuniform float uMaterialCue;\nout vec4 outColor;\nvoid main(){float lit=0.20+0.80*max(dot(normalize(vNormal),normalize(uLightDirection)),0.0);vec3 neutral=vec3(0.42,0.43,0.45);vec3 supported=neutral;supported=mix(supported,vec3(0.20,0.38,0.56),clamp(uWaterCue,0.0,1.0)*0.28);supported=mix(supported,vec3(0.78,0.84,0.89),clamp(uIceCue,0.0,1.0)*0.25);supported=mix(supported,vec3(0.45,0.36,0.29),clamp(uMaterialCue,0.0,1.0)*0.18);float rim=pow(1.0-max(dot(normalize(vNormal),vec3(0.0,0.0,1.0)),0.0),3.0)*clamp(uAtmosphereCue,0.0,1.0);outColor=vec4(supported*lit+vec3(0.18,0.34,0.58)*rim,1.0);}`;
function shaderCueUniforms(cues) { return deepFreeze({uAtmosphereCue: cues.atmosphere.enabled ? 1 : 0, uWaterCue: cues.water.enabled ? 1 : 0, uIceCue: cues.ice.enabled ? 1 : 0, uMaterialCue: cues.material.enabled ? 1 : 0, authorityClass: AUTHORITY, scientificEvidence: false}); }
const provider = deepFreeze({id: 'v1x-05-planet-approach-rendering.planet-approach', contract: CONTRACT, version: VERSION, authorityClass: AUTHORITY, canonicalPromotion: false, operations: ['PROJECT'], project, reverseExit, physicalFacts, cuePolicy, surfaceTarget, splitVec3, shaderCueUniforms, shaders: {vertex: GLOBE_VERTEX_SHADER, fragment: GLOBE_FRAGMENT_SHADER}});
O.v1x05PlanetApproach = provider;
})(globalThis);
