(function(root){
'use strict';
const O=root.OFU=root.OFU||{},V=O.v1Common,M=O.v1Molecular,R=O.v1MaterialReference;
if(!V||!M||!R)throw new Error('v1 molecular and material reference properties required');
const VERSION='ofu-v11-molecular-reference-mass-1';
const SOURCE='research/v1x-19-matter-microphysics-2026-09-06';
const AUTH=V.authority('v1.molecular.reference-mass','1.0.0',[SOURCE],
  'Adds source-backed standard atomic-weight formula-unit mass intervals to already resolved representative molecular/formula units without changing their chemistry authority or implying a bulk molar mass.',[
    'Standard atomic-weight intervals are reference constants for normal terrestrial materials, not measurements of the modeled world.',
    'Formula-unit reference mass does not establish isotope inventory, isotopologue, local bonding, phase thermodynamics or exact bulk composition.',
    'Representative molecular units remain representative; unit counts are not an exact molecular inventory.'
  ]);
const previousRepresent=M.represent;
function enrich(material,representation){
 const profile=R.profile(material),byComponent=new Map(profile.components.map(c=>[c.componentId,c]));
 const units=representation.units.map(unit=>{
  const component=byComponent.get(unit.componentId),referenceMass=component?.referenceMass||Object.freeze({supported:false,reason:'NO_COMPONENT_REFERENCE'});
  return Object.freeze({...unit,referenceMass,referencePropertyAuthority:profile.propertyAuthority,
    referenceSource:referenceMass.supported?profile.reference.sourceId:null,isotopeSpecific:false,referenceMassCanonicalClaim:false});
 });
 const resolvedUnits=units.filter(u=>u.referenceMass.supported).length;
 return V.freezeDeep({...representation,units:Object.freeze(units),referenceMassContext:Object.freeze({version:VERSION,authority:AUTH,
   propertyAuthority:profile.propertyAuthority,profileState:profile.state,resolvedUnits,totalUnits:units.length,reference:profile.reference,
   bulkMolarMassClaim:false,isotopeInventoryClaim:false,measuredWorldSample:false,canonicalPromotion:false,
   researchLineage:Object.freeze({sourceBranch:SOURCE,harvestedConcept:'SOURCE_BACKED_ATOMIC_REFERENCE_PROPAGATION',researchAuthorityPromoted:false})})});
}
function represent(material,microstructure,options){return enrich(material,previousRepresent(material,microstructure,options));}
O.v1Molecular=Object.freeze({...M,represent});
O.v1MolecularReferenceMass=Object.freeze({VERSION,SOURCE,AUTHORITY:AUTH,enrich});
})(globalThis);
