// RESEARCH ONLY: source-bound geochemical free-energy supply arithmetic.
export const CONTRACT_ID='ofu-p5-geochemical-free-energy-supply-research-v1';
export const SOURCE_RECORD_CONTRACT='ofu-scientific-source-record-v1';
export const U64_MAX=(1n<<64n)-1n;
export const MAX_REACTIONS=16;
const EVIDENCE=Object.freeze({evidenceClass:'ESTABLISHED',fidelity:'FORMAL',claimLimit:'multiplies separately supplied reaction free-energy yield by separately supplied reaction extent; does not infer geochemical occurrence, flux, biological capture, maintenance sufficiency, or nutrient availability'});
function fail(m){throw new Error('P5 geochemical energy Wave IV: '+m)}
function text(v,n,max=256){if(typeof v!=='string'||!v.length||v.length>max||v!==v.normalize('NFC'))fail(n+' invalid');return v}
function u64(v,n){if(typeof v!=='bigint'||v<0n||v>U64_MAX)fail(n+' must be u64');return v}
function source(s){if(!s||s.contractId!==SOURCE_RECORD_CONTRACT)fail('scientific source record required');text(s.sourceId,'sourceId',128);text(s.sourceVersion,'sourceVersion',128);text(s.validityDomain,'validityDomain',1024);return s}
function add(a,b){const x=a+b;if(x>U64_MAX)fail('energy total overflow');return x}
export function geochemicalFreeEnergySupply(reactions){
  if(!Array.isArray(reactions)||reactions.length===0||reactions.length>MAX_REACTIONS)fail('reactions must be bounded non-empty array');let total=0n;const rows=[];
  for(const r of reactions){if(!r||Object.keys(r).sort().join('|')!==['reactionId','availableFreeEnergyMicroJPerMol','reactionExtentNanoMolPerStep','thermodynamicSource','extentSource'].sort().join('|'))fail('reaction fields invalid');text(r.reactionId,'reactionId',128);const dg=u64(r.availableFreeEnergyMicroJPerMol,'availableFreeEnergyMicroJPerMol'),extent=u64(r.reactionExtentNanoMolPerStep,'reactionExtentNanoMolPerStep');source(r.thermodynamicSource);source(r.extentSource);const femtoJ=dg*extent;if(femtoJ>U64_MAX)fail('reaction energy overflow');total=add(total,femtoJ);rows.push(Object.freeze({reactionId:r.reactionId,freeEnergySupplyFemtoJPerStep:femtoJ,thermodynamicSourceId:r.thermodynamicSource.sourceId,extentSourceId:r.extentSource.sourceId}));}
  return Object.freeze({contractId:CONTRACT_ID,authority:'P5_RESEARCH_DERIVED',epistemicStatus:'DERIVED_FROM_SOURCE_BOUND_REACTION_STATE',freeEnergySupplyFemtoJPerStep:total,reactions:Object.freeze(rows),biologicallyUsableEnergyEstablished:false,nutrientAvailabilityEstablished:false,geologicalProcessEstablished:false,evidence:EVIDENCE});
}
export const evidence=EVIDENCE;
