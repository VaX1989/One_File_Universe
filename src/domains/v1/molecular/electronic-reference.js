(function(root){
'use strict';
const O=root.OFU=root.OFU||{},V=O.v1Common,M=O.v1Molecular,S=O.v1MolecularStoichiometry;
if(!V||!M||!S)throw new Error('v1 molecular stoichiometry required for electronic reference');
const VERSION='ofu-v11-molecular-electronic-reference-1';
const SOURCE='research/v1x-19-matter-microphysics-2026-09-06';
const MAX_ATOMIC_NUMBER=118,MAX_ATOMS_PER_FORMULA=S.MAX_ATOMS_PER_FORMULA,MAX_NUCLEAR_CHARGE_NUMBER=MAX_ATOMIC_NUMBER*MAX_ATOMS_PER_FORMULA;
const AUTH=V.authority('v1.molecular.electronic-reference','1.0.0',[SOURCE],
  'Derives exact formula-unit nuclear-charge bookkeeping from already resolved stoichiometry and exposes a neutral-electron reference count only under an explicit hypothetical neutrality assumption.',[
    'Actual molecular/formula-unit charge state and actual electron count remain UNKNOWN.',
    'No oxidation state, bond order, molecular orbital, electron geometry, wavefunction or quantum dynamics is inferred.',
    'The reference applies only to the bounded representative formula unit and does not establish bulk inventory or canonical world truth.'
  ]);
const RESEARCH_LINEAGE=Object.freeze({sourceBranch:SOURCE,harvestedConcept:'FORMULA_NUCLEAR_CHARGE_AND_NEUTRAL_ELECTRON_REFERENCE',researchAuthorityPromoted:false,quantumProviderIntroduced:false});
function unsupported(reason){return V.freezeDeep({contract:'ofu-v11-formula-electronic-reference-1',supported:false,reason,authority:AUTH,researchLineage:RESEARCH_LINEAGE,actualChargeState:'UNKNOWN',actualElectronCount:null,neutralityAssumption:false,canonicalPromotion:false});}
function referenceForUnit(unit){
  const stoich=unit?.stoichiometry;if(!stoich||stoich.supported!==true)return unsupported('STOICHIOMETRY_UNRESOLVED');
  V.assert(Array.isArray(stoich.elements)&&stoich.elements.length>0&&stoich.elements.length<=S.MAX_DISTINCT_ELEMENTS,'stoichiometric element bound');
  let atoms=0,total=0;
  const elements=stoich.elements.map((row,i)=>{V.assert(row&&typeof row.symbol==='string','stoichiometric element '+i);V.int(row.count,'formula element count',1,256);V.int(row.atomicNumber,'atomic number',1,MAX_ATOMIC_NUMBER);const contribution=row.count*row.atomicNumber;V.assert(Number.isSafeInteger(contribution)&&contribution>0,'nuclear charge contribution');atoms+=row.count;total+=contribution;return Object.freeze({symbol:row.symbol,count:row.count,atomicNumber:row.atomicNumber,nuclearChargeContribution:contribution});});
  V.assert(atoms===stoich.totalAtomCount&&atoms<=MAX_ATOMS_PER_FORMULA,'formula atom-count closure');
  V.assert(total>0&&total<=MAX_NUCLEAR_CHARGE_NUMBER,'formula nuclear-charge bound');
  V.assert(elements.reduce((n,row)=>n+row.nuclearChargeContribution,0)===total,'formula nuclear-charge closure');
  return V.freezeDeep({contract:'ofu-v11-formula-electronic-reference-1',supported:true,formula:unit.formula||null,formulaAtomCount:atoms,formulaNuclearChargeNumber:total,neutralElectronReferenceCount:total,actualChargeState:'UNKNOWN',actualElectronCount:null,chargeStateKnown:false,neutralityAssumption:true,nuclearChargeClosure:true,elements:Object.freeze(elements),authority:AUTH,researchLineage:RESEARCH_LINEAGE,formulaUnitOnly:true,bulkInventoryClaim:false,isotopeSpecificClaim:false,oxidationStateClaim:false,bondOrderClaim:false,molecularOrbitalClaim:false,electronGeometryClaim:false,wavefunctionClaim:false,quantumDynamicsClaim:false,measuredWorldSample:false,canonicalPromotion:false});
}
const previousRepresent=M.represent;
function enrich(representation){V.assert(representation&&representation.contract==='ofu-v1-molecular-representation-1','molecular representation');const units=representation.units.map(unit=>Object.freeze({...unit,electronicReference:referenceForUnit(unit)})),resolvedUnits=units.filter(unit=>unit.electronicReference.supported).length;return V.freezeDeep({...representation,units:Object.freeze(units),electronicReferenceContext:Object.freeze({version:VERSION,authority:AUTH,researchLineage:RESEARCH_LINEAGE,totalUnits:units.length,resolvedUnits,maxAtomicNumber:MAX_ATOMIC_NUMBER,maxAtomsPerFormula:MAX_ATOMS_PER_FORMULA,maxNuclearChargeNumber:MAX_NUCLEAR_CHARGE_NUMBER,formulaUnitOnly:true,neutralReferenceOnly:true,actualChargeStateAuthority:'UNKNOWN',actualElectronCountClaim:false,bulkInventoryClaim:false,isotopeSpecificClaim:false,oxidationStateClaim:false,bondOrderClaim:false,molecularOrbitalClaim:false,electronGeometryClaim:false,wavefunctionClaim:false,quantumDynamicsClaim:false,measuredWorldSample:false,canonicalPromotion:false})});}
function represent(material,microstructure,options){return enrich(previousRepresent(material,microstructure,options));}
O.v1Molecular=Object.freeze({...M,represent});
O.v1MolecularElectronicReference=Object.freeze({VERSION,SOURCE,AUTHORITY:AUTH,RESEARCH_LINEAGE,MAX_ATOMIC_NUMBER,MAX_ATOMS_PER_FORMULA,MAX_NUCLEAR_CHARGE_NUMBER,referenceForUnit,enrich});
})(globalThis);
