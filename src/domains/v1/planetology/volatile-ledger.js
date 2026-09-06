(function(root){
'use strict';
const O=root.OFU=root.OFU||{},V=O.v1Common,E=O.v1PlanetEnvironment,W=O.v1WorldContext;
if(!V||!E||!W||!O.v1PlanetaryCausalityTrace)throw new Error('v1 environment, world context and causality trace required for volatile ledger');
const VERSION='ofu-v11-volatile-ledger-1',SOURCE='research/v1x-16-planetary-causality-2026-09-06',PPM=1000000;
const AUTH=V.authority('v1.planetology.volatile-ledger','1.0.0',[SOURCE],
  'Exact accounting witness over the existing modeled volatile partition when its model-unit values are safe integers. This proves only internal ledger closure, not physical accuracy or canonical volatile genesis.',[
    'Model units are not kilograms, moles or observed inventories unless a future version explicitly supplies such units.',
    'Closure of the modeled ledger does not validate the escape/outgassing/condensation physics that generated the partition.',
    'The witness does not establish canonical volatile genesis, oceans, atmosphere history or P4 events.'
  ]);
const KEYS=Object.freeze(['escapedUnits','interiorUnits','surfaceCondensedUnits','atmosphereUnits']);
const encodeExact=n=>n>=BigInt(Number.MIN_SAFE_INTEGER)&&n<=BigInt(Number.MAX_SAFE_INTEGER)?Number(n):n.toString();
function normalize(values,total){
 const rows=KEYS.map((key,i)=>({key,value:BigInt(values[i])})),T=typeof total==='bigint'?total:BigInt(total),work=[];
 if(T<=0n)return Object.freeze(rows.map(r=>Object.freeze({reservoir:r.key,sharePpm:0})));
 let used=0n;
 for(let i=0;i<rows.length;i++){const scaled=rows[i].value*BigInt(PPM),share=scaled/T,rem=scaled-share*T;used+=share;work.push({key:rows[i].key,sharePpm:Number(share),rem,i});}
 let left=BigInt(PPM)-used;V.assert(left>=0n&&left<=BigInt(PPM),'volatile ledger normalized remainder');const rank=[...work].sort((a,b)=>a.rem===b.rem?a.i-b.i:a.rem>b.rem?-1:1);
 for(let i=0n;i<left;i++)rank[Number(i%BigInt(rank.length))].sharePpm++;
 return Object.freeze(work.sort((a,b)=>a.i-b.i).map(({key,sharePpm})=>Object.freeze({reservoir:key,sharePpm})));
}
function witness(planet){
 V.assert(planet&&planet.planetIdentity,'volatile ledger planet');
 const a=planet.causal?.atmosphere||null;
 if(!a)return V.freezeDeep({version:VERSION,worldIdentity:planet.planetIdentity,supported:false,reason:'NO_CAUSAL_ATMOSPHERE_STATE',authority:AUTH,canonicalPromotion:false});
 const values=[a.escapedUnits,a.interiorUnits,a.surfaceCondensedUnits,a.atmosphereUnits],all=[a.initialInventoryUnits,...values];
 if(!all.every(Number.isSafeInteger)||a.initialInventoryUnits<=0||values.some(x=>x<0))return V.freezeDeep({version:VERSION,worldIdentity:planet.planetIdentity,supported:false,reason:'LEDGER_OUTSIDE_EXACT_SAFE_INTEGER_DOMAIN',authority:AUTH,canonicalPromotion:false});
 const initial=BigInt(a.initialInventoryUnits),sum=values.reduce((n,x)=>n+BigInt(x),0n),residual=initial-sum,shares=normalize(values,sum),shareClosure=shares.reduce((n,x)=>n+x.sharePpm,0),shareClosureExpected=sum>0n?PPM:0;
 V.assert(shareClosure===shareClosureExpected,'volatile ledger share closure');
 return V.freezeDeep({version:VERSION,worldIdentity:planet.planetIdentity,supported:true,modelUnit:'NORMALIZED_VOLATILE_INVENTORY_UNIT',initialInventoryUnits:a.initialInventoryUnits,
   reservoirs:Object.freeze({escapedUnits:a.escapedUnits,interiorUnits:a.interiorUnits,surfaceCondensedUnits:a.surfaceCondensedUnits,atmosphereUnits:a.atmosphereUnits}),
   closure:Object.freeze({sumUnits:encodeExact(sum),residualUnits:encodeExact(residual),exactInternalClosure:residual===0n,sourceConservedFlag:a.conserved===true}),shares,shareClosurePpm:shareClosure,shareClosureExpectedPpm:shareClosureExpected,
   authority:AUTH,physicalUnitClaim:false,physicalModelValidationClaim:false,canonicalGenesisClaim:false,canonicalOceanClaim:false,p4Mutation:false,canonicalPromotion:false,
   provenance:V.provenance('v1.planetology.volatile-ledger','1.0.0',[SOURCE]),researchLineage:Object.freeze({sourceBranch:SOURCE,harvestedConcept:'FORMAL_VOLATILE_CONSERVATION_KERNEL',researchAuthorityPromoted:false})});
}
const previousEnrich=E.enrich;
function enrich(base,input){const state=previousEnrich(base,input),volatileLedger=witness(state);return V.freezeDeep({...state,volatileLedger});}
const previousLocalContext=W.localContext;
function localContext(world,point,options){const base=previousLocalContext(world,point,options),volatileLedger=world.planetology?.volatileLedger||witness(world.planetology);return V.freezeDeep({...base,volatileLedger});}
O.v1PlanetEnvironment=Object.freeze({...E,enrich});
O.v1WorldContext=Object.freeze({...W,localContext});
O.v1VolatileLedger=Object.freeze({VERSION,SOURCE,AUTHORITY:AUTH,PPM,KEYS,normalize,witness});
})(globalThis);
