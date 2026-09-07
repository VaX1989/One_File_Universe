import { assertRecord, boundedAscii } from '../reference/bounded-math.mjs';
import { MATTER_AUTHORITY } from './reaction-network.mjs';

export const REFERENCE_AUTHORITIES=Object.freeze([
  'SOURCE_BACKED_EXPERIMENTAL_MODEL',
  'CURATED_REFERENCE',
  'MODEL_DERIVED_COMPUTED_STRUCTURE',
  'MODEL_DERIVED_COMPUTED_PROPERTY',
  'PRESENTATION_ONLY_STYLIZATION',
  'UNKNOWN'
]);

function normalizeSource(source){
  assertRecord(source,'source');
  return Object.freeze({
    id:boundedAscii(source.id,'source.id',64),
    reference:boundedAscii(source.reference,'source.reference',512),
    version:boundedAscii(source.version,'source.version',128)
  });
}

function normalizeScalar(value,label,{allowNull=false}={}){
  if(value==null){if(allowNull)return null;throw new Error(`${label} is required`);}
  if(typeof value==='number'){
    if(!Number.isFinite(value))throw new RangeError(`${label} number must be finite`);
    return value;
  }
  if(typeof value==='string')return boundedAscii(value,label,256,{allowEmpty:false});
  if(typeof value==='boolean')return value;
  throw new TypeError(`${label} must be a bounded scalar`);
}

function normalizeValidity(validity){
  if(validity==null)return Object.freeze({});
  assertRecord(validity,'validity');
  const entries=Object.entries(validity);
  if(entries.length>16)throw new RangeError('validity exceeds field cap 16');
  const out={};
  for(const [key,value] of entries){
    const normalizedKey=boundedAscii(key,'validity key',64);
    out[normalizedKey]=normalizeScalar(value,`validity.${normalizedKey}`,{allowNull:false});
  }
  return Object.freeze(out);
}

export function normalizeReferenceRecord(r){
  assertRecord(r,'record');
  if(!REFERENCE_AUTHORITIES.includes(r.authorityClass))throw new Error('invalid reference authorityClass');
  const property=boundedAscii(r.property,'property',128);
  const value=normalizeScalar(r.value,'value');
  const unit=boundedAscii(r.unit,'unit',64);
  const source=normalizeSource(r.source);
  const method=r.method==null?null:boundedAscii(r.method,'method',256);
  if(r.authorityClass.startsWith('MODEL_DERIVED_COMPUTED')&&!method)throw new Error('computed reference records require method');
  if(r.authorityClass==='SOURCE_BACKED_EXPERIMENTAL_MODEL'&&!method)throw new Error('experimental record requires method');
  const uncertainty=normalizeScalar(r.uncertainty,'uncertainty',{allowNull:true});
  return Object.freeze({
    authority:MATTER_AUTHORITY,
    authorityClass:r.authorityClass,
    property,
    value,
    unit,
    source,
    method,
    validity:normalizeValidity(r.validity),
    uncertainty,
    empiricalAuthorityEscalationAllowed:false,
    provenanceCompleteness:'SOURCE_ID_REFERENCE_VERSION_REQUIRED'
  });
}
