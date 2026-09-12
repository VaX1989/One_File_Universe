(function(root){
'use strict';
const O=root.OFU=root.OFU||{},V=O.v1Common,M=O.v1Materials;
if(!V||!M)throw new Error('v1 common and materials required for material reference properties');
const VERSION='ofu-v11-material-reference-properties-1';
const SOURCE='research/v1x-19-matter-microphysics-2026-09-06';
const REFERENCE=Object.freeze({
 sourceId:'CIAAW-SAW-2024',title:'Standard Atomic Weights 2024',unit:'u',scaleQ9:1000000000,
 authority:'SOURCE_BACKED_REFERENCE',accessedOn:'2026-09-06',isotopeSpecific:false,
 limitations:Object.freeze([
  'Standard atomic weights describe normal terrestrial materials and may be intervals because isotopic composition varies.',
  'A standard atomic weight does not identify a specific isotope or isotopologue.',
  'Reference masses do not make model-derived world chemistry observational or canonical.'
 ])
});
const ELEMENTS=Object.freeze({
 H:Object.freeze({z:1,lowerQ9:'1007840000',upperQ9:'1008110000'}),
 C:Object.freeze({z:6,lowerQ9:'12009600000',upperQ9:'12011600000'}),
 N:Object.freeze({z:7,lowerQ9:'14006430000',upperQ9:'14007280000'}),
 O:Object.freeze({z:8,lowerQ9:'15999030000',upperQ9:'15999770000'}),
 Na:Object.freeze({z:11,lowerQ9:'22989769260',upperQ9:'22989769300'}),
 Mg:Object.freeze({z:12,lowerQ9:'24304000000',upperQ9:'24307000000'}),
 Al:Object.freeze({z:13,lowerQ9:'26981538100',upperQ9:'26981538700'}),
 Si:Object.freeze({z:14,lowerQ9:'28084000000',upperQ9:'28086000000'}),
 P:Object.freeze({z:15,lowerQ9:'30973761993',upperQ9:'30973762003'}),
 S:Object.freeze({z:16,lowerQ9:'32059000000',upperQ9:'32076000000'}),
 Cl:Object.freeze({z:17,lowerQ9:'35446000000',upperQ9:'35457000000'}),
 K:Object.freeze({z:19,lowerQ9:'39098200000',upperQ9:'39098400000'}),
 Ca:Object.freeze({z:20,lowerQ9:'40074000000',upperQ9:'40082000000'}),
 Fe:Object.freeze({z:26,lowerQ9:'55843000000',upperQ9:'55847000000'})
});
const MAX_COMPONENTS=M.MAX_COMPONENTS||16,MAX_DISTINCT_ELEMENTS=32;
function formulaMassInterval(component){
 V.assert(component&&typeof component==='object','material component');
 if(!component.elements||typeof component.elements!=='object'||Array.isArray(component.elements))return Object.freeze({supported:false,reason:'UNRESOLVED_FORMULA_ELEMENTS'});
 const symbols=Object.keys(component.elements).sort();
 V.assert(symbols.length<=MAX_DISTINCT_ELEMENTS,'material reference element bound');
 let lower=0n,upper=0n;
 for(const symbol of symbols){
  const count=component.elements[symbol];V.int(count,'formula element count',1,256);
  const ref=ELEMENTS[symbol];if(!ref)return Object.freeze({supported:false,reason:'UNSUPPORTED_REFERENCE_ELEMENT',element:symbol});
  lower+=BigInt(ref.lowerQ9)*BigInt(count);upper+=BigInt(ref.upperQ9)*BigInt(count);
 }
 return Object.freeze({supported:true,lowerQ9:String(lower),upperQ9:String(upper),scaleQ9:REFERENCE.scaleQ9,unit:REFERENCE.unit,
  elementSymbols:Object.freeze(symbols),referenceSource:REFERENCE.sourceId,isotopeSpecific:false});
}
function authorityFor(material){
 const c=material.chemistryAuthority;
 if(c===M.CHEMISTRY.SOURCE_BACKED)return 'DERIVED_FROM_SOURCE_BACKED_CHEMISTRY_AND_REFERENCE';
 if(c===M.CHEMISTRY.MODEL_DERIVED)return 'DERIVED_FROM_MODEL_CHEMISTRY_AND_SOURCE_BACKED_REFERENCE';
 if(c===M.CHEMISTRY.SCHEMATIC)return 'PRESENTATION_ONLY_REFERENCE';
 return 'INSUFFICIENT_CHEMISTRY_FOR_REFERENCE_PROPERTIES';
}
function profile(input){
 const material=input?.contract==='ofu-v1-material-1'?input:M.materialize(input);
 V.assert(Array.isArray(material.components)&&material.components.length<=MAX_COMPONENTS,'material component bound');
 const components=[],elements=new Set();let resolvedPpm=0;
 for(const component of material.components){
  const mass=formulaMassInterval(component);
  if(mass.supported){resolvedPpm+=component.ppm;for(const s of mass.elementSymbols)elements.add(s);}
  components.push(Object.freeze({componentId:component.id,ppm:component.ppm,formula:component.formula||null,
   chemistryAuthority:component.authority||material.chemistryAuthority,referenceMass:mass}));
 }
 V.assert(elements.size<=MAX_DISTINCT_ELEMENTS,'material reference distinct element bound');
 const unresolvedPpm=1000000-resolvedPpm;
 return V.freezeDeep({version:VERSION,contract:'ofu-v11-material-reference-profile-1',materialId:material.materialId,sourceEntityId:material.sourceEntityId,
  sourceKind:material.sourceKind,chemistryAuthority:material.chemistryAuthority,propertyAuthority:authorityFor(material),
  state:resolvedPpm===0?'CHEMISTRY_UNRESOLVED':unresolvedPpm===0?'FORMULA_COMPONENTS_REFERENCE_RESOLVED':'PARTIALLY_REFERENCE_RESOLVED',
  resolvedFormulaPpm:resolvedPpm,unresolvedFormulaPpm:unresolvedPpm,distinctElements:Object.freeze([...elements].sort()),components:Object.freeze(components),
  reference:REFERENCE,canonicalClaim:false,materialTruthClaim:false,bulkMolarMassClaim:false,isotopeInventoryClaim:false,measuredWorldSample:false,
  deterministic:true,bounded:true,maxComponents:MAX_COMPONENTS,maxDistinctElements:MAX_DISTINCT_ELEMENTS,
  researchLineage:Object.freeze({sourceBranch:SOURCE,harvestedConcept:'SOURCE_AUTHORITY_AND_FIXED_POINT_REFERENCE_PROPERTIES',researchAuthorityPromoted:false}),
  limitations:Object.freeze([
   'Component ppm is not assumed to be mole fraction, so no bulk mixture molar mass is inferred.',
   'Resolved formula-unit reference mass does not resolve impurities, isotope inventory, defects, local bonding, pressure effects or phase thermodynamics.',
   material.chemistryAuthority===M.CHEMISTRY.MODEL_DERIVED?'World chemistry is model-derived; source-backed atomic-weight reference does not promote it to observation.':null,
   resolvedPpm===0?'No supported formula-bearing chemistry is available for this material source.':null
  ].filter(Boolean))
 });
}
O.v1MaterialReference=Object.freeze({VERSION,SOURCE,REFERENCE,ELEMENTS,MAX_COMPONENTS,MAX_DISTINCT_ELEMENTS,formulaMassInterval,profile});
})(globalThis);
