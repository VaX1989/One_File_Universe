(function(root){
'use strict';
const O=root.OFU=root.OFU||{},V=O.v1Common,M=O.v1Molecular,R=O.v1MaterialReference;
if(!V||!M||!R)throw new Error('v1 molecular and material reference properties required for stoichiometric reference');
const VERSION='ofu-v11-molecular-stoichiometric-reference-1';
const SOURCE='research/v1x-19-matter-microphysics-2026-09-06';
const AUTH=V.authority('v1.molecular.stoichiometric-reference','1.0.0',[SOURCE],
  'Adds bounded formula-unit atom-count fractions and source-backed standard-atomic-weight contribution intervals to already resolved representative molecular units. This is reference-property bookkeeping, not a bulk composition measurement or isotope inventory.',[
    'Atom-count fractions describe only the resolved representative formula unit; unit counts are not exact bulk molecular inventory.',
    'Reference mass contribution intervals use CIAAW standard atomic-weight ranges and do not identify isotopes or isotopologues.',
    'Model-derived or schematic world chemistry retains its original authority and is never promoted by reference constants.'
  ]);
const LIMIT=1000000,MAX_DISTINCT_ELEMENTS=R.MAX_DISTINCT_ELEMENTS||32,MAX_ATOMS_PER_FORMULA=MAX_DISTINCT_ELEMENTS*256;
function countShares(elements){
  V.assert(elements&&typeof elements==='object'&&!Array.isArray(elements),'formula elements');
  const symbols=Object.keys(elements).sort();V.assert(symbols.length>0&&symbols.length<=MAX_DISTINCT_ELEMENTS,'stoichiometric distinct element bound');
  let total=0;for(const symbol of symbols){V.int(elements[symbol],'formula element count',1,256);total+=elements[symbol];}
  V.assert(total<=MAX_ATOMS_PER_FORMULA,'stoichiometric formula atom bound');
  let used=0;
  const rows=symbols.map((symbol,index)=>{const scaled=elements[symbol]*LIMIT,share=Math.floor(scaled/total),remainder=scaled-share*total;used+=share;return{symbol,count:elements[symbol],countFractionPpm:share,remainder,index};});
  let left=LIMIT-used;const rank=[...rows].sort((a,b)=>b.remainder-a.remainder||a.symbol.localeCompare(b.symbol));
  for(let i=0;i<left;i++)rank[i%rank.length].countFractionPpm++;
  return Object.freeze(rows.sort((a,b)=>a.index-b.index).map(({symbol,count,countFractionPpm})=>Object.freeze({symbol,count,countFractionPpm})));
}
function unitStoichiometry(component,unit){
  if(!component?.elements||typeof component.elements!=='object'||Array.isArray(component.elements))return Object.freeze({supported:false,reason:'UNRESOLVED_FORMULA_ELEMENTS'});
  if(!unit?.referenceMass?.supported)return Object.freeze({supported:false,reason:'REFERENCE_MASS_UNRESOLVED'});
  const shares=countShares(component.elements),elements=[];let lower=0n,upper=0n,totalAtoms=0;
  for(const share of shares){
    const ref=R.ELEMENTS[share.symbol];if(!ref)return Object.freeze({supported:false,reason:'UNSUPPORTED_REFERENCE_ELEMENT',element:share.symbol});
    const count=BigInt(share.count),lo=BigInt(ref.lowerQ9)*count,hi=BigInt(ref.upperQ9)*count;lower+=lo;upper+=hi;totalAtoms+=share.count;
    elements.push(Object.freeze({...share,atomicNumber:ref.z,referenceMassContribution:Object.freeze({lowerQ9:String(lo),upperQ9:String(hi),scaleQ9:R.REFERENCE.scaleQ9,unit:R.REFERENCE.unit,referenceSource:R.REFERENCE.sourceId})}));
  }
  V.assert(String(lower)===String(unit.referenceMass.lowerQ9)&&String(upper)===String(unit.referenceMass.upperQ9),'stoichiometric reference mass closure');
  V.assert(elements.reduce((a,x)=>a+x.countFractionPpm,0)===LIMIT,'stoichiometric count fraction closure');
  return V.freezeDeep({supported:true,totalAtomCount:totalAtoms,elementCount:elements.length,elements:Object.freeze(elements),countFractionClosurePpm:LIMIT,
    formulaReferenceMass:Object.freeze({lowerQ9:String(lower),upperQ9:String(upper),scaleQ9:R.REFERENCE.scaleQ9,unit:R.REFERENCE.unit}),
    referenceMassClosure:true,referenceSource:R.REFERENCE.sourceId,isotopeSpecific:false,bulkCompositionClaim:false,bulkMassFractionClaim:false,measuredWorldSample:false,canonicalClaim:false});
}
const previousRepresent=M.represent;
function enrich(material,representation){
  const byComponent=new Map((material.components||[]).map(c=>[c.id,c]));
  const units=representation.units.map(unit=>Object.freeze({...unit,stoichiometry:unitStoichiometry(byComponent.get(unit.componentId),unit)}));
  const resolvedUnits=units.filter(u=>u.stoichiometry.supported).length;
  return V.freezeDeep({...representation,units:Object.freeze(units),stoichiometricReferenceContext:Object.freeze({version:VERSION,authority:AUTH,
    resolvedUnits,totalUnits:units.length,maxDistinctElements:MAX_DISTINCT_ELEMENTS,maxAtomsPerFormula:MAX_ATOMS_PER_FORMULA,
    formulaUnitOnly:true,bulkCompositionClaim:false,bulkMassFractionClaim:false,isotopeInventoryClaim:false,measuredWorldSample:false,canonicalPromotion:false,
    reference:R.REFERENCE,researchLineage:Object.freeze({sourceBranch:SOURCE,harvestedConcept:'FORMULA_STOICHIOMETRY_AND_REFERENCE_MASS_CLOSURE',researchAuthorityPromoted:false})})});
}
function represent(material,microstructure,options){return enrich(material,previousRepresent(material,microstructure,options));}
O.v1Molecular=Object.freeze({...M,represent});
O.v1MolecularStoichiometry=Object.freeze({VERSION,SOURCE,AUTHORITY:AUTH,LIMIT,MAX_DISTINCT_ELEMENTS,MAX_ATOMS_PER_FORMULA,countShares,unitStoichiometry,enrich});
})(globalThis);
