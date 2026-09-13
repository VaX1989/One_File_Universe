export const AUTHORITY = Object.freeze({
  CANONICAL: 'CANONICAL',
  MODEL_DERIVED: 'MODEL_DERIVED',
  PRESENTATION_ONLY: 'PRESENTATION_ONLY',
  UNKNOWN: 'UNKNOWN'
});

export const CONTINUUM_STOPS = Object.freeze([
  Object.freeze({stage:'SYSTEM', coordinate:0, frameId:'system-barycentric', label:'System', mode:'GEOMETRIC'}),
  Object.freeze({stage:'ORBIT', coordinate:1, frameId:'body-centered', label:'Orbit', mode:'GEOMETRIC'}),
  Object.freeze({stage:'APPROACH', coordinate:2, frameId:'body-centered', label:'Approach', mode:'GEOMETRIC'}),
  Object.freeze({stage:'GLOBAL_SURFACE', coordinate:3, frameId:'body-fixed', label:'Global', mode:'GEOMETRIC'}),
  Object.freeze({stage:'REGIONAL_SURFACE', coordinate:4, frameId:'local-tangent', label:'Regional', mode:'GEOMETRIC'}),
  Object.freeze({stage:'LOCAL_SURFACE', coordinate:5, frameId:'local-tangent', label:'Local', mode:'GEOMETRIC'}),
  Object.freeze({stage:'HUMAN', coordinate:6, frameId:'local-tangent', label:'Human', mode:'EMBODIED'}),
  Object.freeze({stage:'MATERIAL', coordinate:7, frameId:'sample', label:'Material', mode:'CONTEXTUAL'}),
  Object.freeze({stage:'MICROSTRUCTURE', coordinate:8, frameId:'sample-micro', label:'Microstructure', mode:'CONTEXTUAL'}),
  Object.freeze({stage:'MOLECULAR', coordinate:9, frameId:'sample-micro', label:'Molecular', mode:'CONTEXTUAL'}),
  Object.freeze({stage:'ATOMIC', coordinate:10, frameId:'sample-micro', label:'Atomic', mode:'CONTEXTUAL'})
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
