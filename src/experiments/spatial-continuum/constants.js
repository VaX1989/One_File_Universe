export const AUTHORITY = Object.freeze({
  CANONICAL: 'CANONICAL',
  MODEL_DERIVED: 'MODEL_DERIVED',
  PRESENTATION_ONLY: 'PRESENTATION_ONLY',
  UNKNOWN: 'UNKNOWN'
});

export const CONTINUUM_STOPS = Object.freeze([
  Object.freeze({stage:'UNIVERSE', coordinate:0, frameId:'macro-universe', label:'Universe', mode:'GEOMETRIC'}),
  Object.freeze({stage:'GALAXY', coordinate:1, frameId:'macro-galaxy', label:'Galaxy', mode:'GEOMETRIC'}),
  Object.freeze({stage:'REGION', coordinate:2, frameId:'macro-region', label:'Region', mode:'GEOMETRIC'}),
  Object.freeze({stage:'NEIGHBORHOOD', coordinate:3, frameId:'macro-neighborhood', label:'Neighborhood', mode:'GEOMETRIC'}),
  Object.freeze({stage:'SYSTEM', coordinate:4, frameId:'system-barycentric', label:'System', mode:'GEOMETRIC'}),
  Object.freeze({stage:'ORBIT', coordinate:5, frameId:'body-centered', label:'Orbit', mode:'GEOMETRIC'}),
  Object.freeze({stage:'APPROACH', coordinate:6, frameId:'body-centered', label:'Approach', mode:'GEOMETRIC'}),
  Object.freeze({stage:'GLOBAL_SURFACE', coordinate:7, frameId:'body-fixed', label:'Global', mode:'GEOMETRIC'}),
  Object.freeze({stage:'REGIONAL_SURFACE', coordinate:8, frameId:'local-tangent', label:'Regional', mode:'GEOMETRIC'}),
  Object.freeze({stage:'LOCAL_SURFACE', coordinate:9, frameId:'local-tangent', label:'Local', mode:'GEOMETRIC'}),
  Object.freeze({stage:'HUMAN', coordinate:10, frameId:'local-tangent', label:'Human', mode:'EMBODIED'}),
  Object.freeze({stage:'MATERIAL', coordinate:11, frameId:'sample', label:'Material', mode:'CONTEXTUAL'}),
  Object.freeze({stage:'MICROSTRUCTURE', coordinate:12, frameId:'sample-micro', label:'Microstructure', mode:'CONTEXTUAL'}),
  Object.freeze({stage:'MOLECULAR', coordinate:13, frameId:'sample-micro', label:'Molecular', mode:'CONTEXTUAL'}),
  Object.freeze({stage:'ATOMIC', coordinate:14, frameId:'sample-micro', label:'Atomic', mode:'CONTEXTUAL'})
]);

export const STAGE_INDEX = Object.freeze(Object.fromEntries(CONTINUUM_STOPS.map(stop => [stop.stage, stop.coordinate])));
export const MAX_SCALE_COORDINATE = CONTINUUM_STOPS.at(-1).coordinate;

export function stopForStage(stage) {
  const coordinate = STAGE_INDEX[String(stage || '').toUpperCase()];
  if (!Number.isInteger(coordinate)) throw new RangeError('Unknown continuum stage: ' + stage);
  return CONTINUUM_STOPS[coordinate];
}

export function stageForCoordinate(value) {
  const coordinate = Math.max(0, Math.min(MAX_SCALE_COORDINATE, Number(value)));
  return CONTINUUM_STOPS[Math.round(coordinate)];
}
