import { AUTHORITY } from './constants.js';

const VALUES=new Set(Object.values(AUTHORITY));

export function authorityValue(value,label='authority'){
  const normalized=String(value||'').toUpperCase();
  if(!VALUES.has(normalized))throw new TypeError(`${label} must be one of ${[...VALUES].join(', ')}`);
  return normalized;
}

export function spatialAuthority(spec={}){
  return Object.freeze({
    contract:'ofu-spatial-authority-1',
    entity:authorityValue(spec.entity,'entity authority'),
    position:authorityValue(spec.position,'position authority'),
    orientation:authorityValue(spec.orientation,'orientation authority'),
    phase:authorityValue(spec.phase,'phase authority'),
    bounds:authorityValue(spec.bounds,'bounds authority'),
    geometry:authorityValue(spec.geometry,'geometry authority'),
    elevation:authorityValue(spec.elevation,'elevation authority')
  });
}

export function presentationOrbitAuthority(entity=AUTHORITY.CANONICAL,{bounds=AUTHORITY.PRESENTATION_ONLY}={}){
  return spatialAuthority({
    entity,
    position:AUTHORITY.PRESENTATION_ONLY,
    orientation:AUTHORITY.UNKNOWN,
    phase:AUTHORITY.PRESENTATION_ONLY,
    bounds,
    geometry:AUTHORITY.PRESENTATION_ONLY,
    elevation:AUTHORITY.UNKNOWN
  });
}
