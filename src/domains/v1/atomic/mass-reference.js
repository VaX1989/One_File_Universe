(function(root){
'use strict';
const O=root.OFU=root.OFU||{},V=O.v1Common,A=O.v1Atomic;
if(!V||!A)throw new Error('v1 common and atomic representative required for atomic mass reference');
const VERSION='ofu-v11-atomic-mass-reference-1';
const SOURCE_BRANCH='research/v1x-19-matter-microphysics-2026-09-06';
const REFERENCE=Object.freeze({
  schema:'ofu-v11-standard-atomic-weight-reference-1',scale:1000000000,unit:'u',referenceAuthority:'SOURCE_BACKED_REFERENCE',
  primarySource:Object.freeze({sourceId:'CIAAW-SAW-2024',title:'Standard Atomic Weights 2024',organization:'Commission on Isotopic Abundances and Atomic Weights (CIAAW)',uri:'https://ciaaw.org/atomic-weights.htm',accessedOn:'2026-09-06',relationship:'CRITICALLY_EVALUATED_STANDARD_ATOMIC_WEIGHT_REFERENCE'}),
  crossCheckSource:Object.freeze({sourceId:'NIST-AWIC',title:'Atomic Weights and Isotopic Compositions with Relative Atomic Masses',organization:'NIST Physical Measurement Laboratory',uri:'https://www.nist.gov/pml/atomic-weights-and-isotopic-compositions-relative-atomic-masses',accessedOn:'2026-09-06',relationship:'REFERENCE_AND_DEFINITION_CROSS_CHECK'}),
  elements:Object.freeze({
    H:Object.freeze(['1007840000','1008110000']),C:Object.freeze(['12009600000','12011600000']),N:Object.freeze(['14006430000','14007280000']),O:Object.freeze(['15999030000','15999770000']),
    Na:Object.freeze(['22989769260','22989769300']),Mg:Object.freeze(['24304000000','24307000000']),Al:Object.freeze(['26981538100','26981538700']),Si:Object.freeze(['28084000000','28086000000']),
    P:Object.freeze(['30973761993','30973762003']),S:Object.freeze(['32059000000','32076000000']),Cl:Object.freeze(['35446000000','35457000000']),K:Object.freeze(['39098200000','39098400000']),
    Ca:Object.freeze(['40074000000','40082000000']),Fe:Object.freeze(['55843000000','55847000000'])
  }),
  limitations:Object.freeze(['Standard atomic weights describe normal terrestrial materials and may be intervals because isotopic composition varies.','A standard atomic weight does not identify a specific isotope or isotopologue.','Reference intervals do not make the modeled representative atom inventory an exact bulk inventory.'])
});
const AUTH=V.authority('v1.atomic.mass-reference','1.0.0',[SOURCE_BRANCH,REFERENCE.primarySource.uri,REFERENCE.crossCheckSource.uri],
  'Source-backed standard atomic-weight intervals propagated over bounded representative atom inventories. External reference authority applies only to element weight intervals; represented composition remains whatever authority the upstream material/molecular model established.',[
    'Interval propagation is arithmetic over the represented atom sites only and is not an exact bulk sample mass.',
    'No isotope-specific composition is inferred.',
    'Atoms whose elements are absent from the bounded reference subset remain unresolved rather than receiving guessed masses.'
  ]);
function intervalForAtoms(atoms){
  V.assert(Array.isArray(atoms)&&atoms.length<=A.MAX_ATOMS,'atomic mass representation bound');
  const counts=new Map();for(const atom of atoms){const symbol=String(atom.element||'');counts.set(symbol,(counts.get(symbol)||0)+1);}
  let lower=0n,upper=0n;const unresolved=[];
  for(const [symbol,count] of [...counts.entries()].sort((a,b)=>a[0].localeCompare(b[0]))){const row=REFERENCE.elements[symbol];if(!row){unresolved.push(symbol);continue;}lower+=BigInt(row[0])*BigInt(count);upper+=BigInt(row[1])*BigInt(count);}
  const elementCounts=Object.freeze(Object.fromEntries([...counts.entries()].sort((a,b)=>a[0].localeCompare(b[0]))));
  return V.freezeDeep({scale:REFERENCE.scale,unit:REFERENCE.unit,lowerQ9:String(lower),upperQ9:String(upper),elementCounts,unresolvedElements:Object.freeze(unresolved),
    status:unresolved.length?'INCOMPLETE_REFERENCE':'SOURCE_BACKED_INTERVAL_PROPAGATION',referenceAuthority:REFERENCE.referenceAuthority,inventoryAuthority:'INHERITED_FROM_ATOMIC_REPRESENTATION',
    exactBulkMassClaim:false,isotopeSpecificClaim:false,representedSitesOnly:true,source:Object.freeze({primary:REFERENCE.primarySource,crossCheck:REFERENCE.crossCheckSource}),authority:AUTH});
}
const previousRepresent=A.represent;
function represent(material,molecular,options){const base=previousRepresent(material,molecular,options),standardAtomicWeightMassInterval=intervalForAtoms(base.atoms);return V.freezeDeep({...base,standardAtomicWeightMassInterval});}
O.v1Atomic=Object.freeze({...A,represent});
O.v1AtomicMassReference=Object.freeze({VERSION,AUTHORITY:AUTH,REFERENCE,intervalForAtoms});
})(globalThis);
