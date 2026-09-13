import { CONTINUUM_STOPS, MAX_SCALE_COORDINATE, stageForCoordinate, stopForStage } from './constants.js';

const clamp = value => Math.max(0, Math.min(MAX_SCALE_COORDINATE, Number(value)));
const smooth = value => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

export function representationHandoff(coordinate) {
  const value = clamp(coordinate);
  const lower = Math.floor(value);
  const upper = Math.ceil(value);
  if (lower === upper) return Object.freeze({
    from: CONTINUUM_STOPS[lower], to: CONTINUUM_STOPS[upper], progress: 1,
    weights: Object.freeze({[CONTINUUM_STOPS[lower].stage]: 1})
  });
  const progress = smooth(value - lower);
  return Object.freeze({
    from: CONTINUUM_STOPS[lower],
    to: CONTINUUM_STOPS[upper],
    progress,
    weights: Object.freeze({[CONTINUUM_STOPS[lower].stage]: 1 - progress, [CONTINUUM_STOPS[upper].stage]: progress})
  });
}

export function createContinuousScale({initial='SYSTEM', durationMs=1050, reducedMotion=false} = {}) {
  let coordinate = stopForStage(initial).coordinate;
  let startCoordinate = coordinate;
  let targetCoordinate = coordinate;
  let startedAt = 0;
  let duration = 0;
  let revision = 0;
  let interruptions = 0;
  const defaultDuration = Number(durationMs);
  if (!(defaultDuration > 0)) throw new TypeError('durationMs must be positive');

  function sample(now = 0) {
    now = Number(now);
    if (!Number.isFinite(now)) throw new TypeError('sample time must be finite');
    if (duration > 0) {
      const progress = Math.max(0, Math.min(1, (now - startedAt) / duration));
      const eased = progress < .5 ? 4 * progress ** 3 : 1 - ((-2 * progress + 2) ** 3) / 2;
      coordinate = startCoordinate + (targetCoordinate - startCoordinate) * eased;
      if (progress >= 1) { coordinate = targetCoordinate; duration = 0; }
    }
    const handoff = representationHandoff(coordinate);
    return Object.freeze({
      contract: 'ofu-spatial-continuum-scale-1',
      coordinate,
      targetCoordinate,
      semanticStage: stageForCoordinate(coordinate).stage,
      targetStage: CONTINUUM_STOPS[Math.round(targetCoordinate)].stage,
      moving: duration > 0,
      handoff,
      revision,
      interruptions
    });
  }

  function setTarget(value, now = 0, options = {}) {
    const current = sample(now);
    const target = clamp(value);
    if (current.moving && Math.abs(target - targetCoordinate) > 1e-9) interruptions++;
    startCoordinate = current.coordinate;
    coordinate = current.coordinate;
    targetCoordinate = target;
    startedAt = Number(now);
    const distance = Math.abs(target - coordinate);
    duration = distance < 1e-9 ? 0 : (reducedMotion || options.reducedMotion ? 80 : Math.max(180, defaultDuration * Math.min(1.5, Math.max(.35, distance))));
    revision++;
    return sample(now);
  }

  return Object.freeze({
    sample,
    setTarget,
    setStage(stage, now, options) { return setTarget(stopForStage(stage).coordinate, now, options); },
    travelBy(delta, now, options) { return setTarget(sample(now).coordinate + Number(delta), now, options); },
    settle(now) { coordinate = targetCoordinate; startCoordinate = coordinate; duration = 0; return sample(now); }
  });
}
