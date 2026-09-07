import { assertRecord,boundedArray,boundedAscii,uniqueIds } from '../reference/bounded-math.mjs';
import { MATTER_AUTHORITY } from './reaction-network.mjs';
export const STRUCTURE_LIMITS=Object.freeze({atomSites:256,bonds:512});
const AUTHORITIES=new Set(['SOURCE_BACKED_EXPERIMENTAL_MODEL','MODEL_DERIVED_COMPUTED_STRUCTURE','PRESENTATION_ONLY_STYLIZATION','UNKNOWN']);

function normalizeSource(source,label='source'){
  assertRecord(source,label);
  return {
    id:boundedAscii(source.id,`${label}.id`,64),
    reference:boundedAscii(source.reference,`${label}.reference`,512),
    version:boundedAscii(source.version,`${label}.version`,128)
  };
}

export function validateStructure(s){
  assertRecord(s,'structure');
  if(!AUTHORITIES.has(s.authorityClass))throw new Error('invalid structure authorityClass');
  boundedArray(s.atomSites,'atomSites',STRUCTURE_LIMITS.atomSites);
  boundedArray(s.bonds??[],'bonds',STRUCTURE_LIMITS.bonds);
  const ids=uniqueIds(s.atomSites,'atomSites');
  for(const a of s.atomSites){
    if(!/^[A-Z][a-z]?$/.test(a.element))throw new Error('invalid element');
    if(a.positionFm!=null&&(!Array.isArray(a.positionFm)||a.positionFm.length!==3||a.positionFm.some(v=>!Number.isSafeInteger(v))))throw new Error('positionFm must contain three safe integers');
  }
  const bondKeys=new Set();
  for(const b of s.bonds??[]){
    assertRecord(b,'bond');
    if(!ids.has(b.a)||!ids.has(b.b)||b.a===b.b)throw new Error('invalid bond');
    const key=b.a<b.b?`${b.a}|${b.b}`:`${b.b}|${b.a}`;
    if(bondKeys.has(key))throw new Error(`duplicate bond ${key}`);
    bondKeys.add(key);
    if(!['SINGLE','DOUBLE','TRIPLE','AROMATIC','UNKNOWN'].includes(b.order??'UNKNOWN'))throw new Error('invalid bond order');
    if(b.order!=='UNKNOWN'&&s.authorityClass==='PRESENTATION_ONLY_STYLIZATION'&&b.scientificClaim===true)throw new Error('presentation bond cannot claim authority');
  }
  if(s.authorityClass==='SOURCE_BACKED_EXPERIMENTAL_MODEL'||s.authorityClass==='MODEL_DERIVED_COMPUTED_STRUCTURE'){
    normalizeSource(s.source);
    boundedAscii(s.method,'method',256);
  }else if(s.source!=null){
    normalizeSource(s.source);
  }
  return true;
}

export function structureSummary(s){
  validateStructure(s);
  return Object.freeze({
    authority:MATTER_AUTHORITY,
    structureAuthorityClass:s.authorityClass,
    atomSiteCount:s.atomSites.length,
    bondCount:(s.bonds??[]).length,
    unresolvedBonds:(s.bonds??[]).filter(b=>(b.order??'UNKNOWN')==='UNKNOWN').length,
    provenanceRequired:['SOURCE_BACKED_EXPERIMENTAL_MODEL','MODEL_DERIVED_COMPUTED_STRUCTURE'].includes(s.authorityClass),
    exactBulkInventoryClaim:false,
    trajectoryClaim:false
  });
}
