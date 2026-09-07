(function(root){
'use strict';
const O=root.OFU=root.OFU||{},K=O.v2x09CivilizationCore,I=O.v2x09CivilizationEconomyInit,E=O.v2x09CivilizationEconomyStep,S=O.v2x09CivilizationInstitutions,M=O.v2x09CivilizationMorphology;
if(!K||!I||!E||!S||!M)throw new Error('V2X-09 module set required');
O.v2x09CivilizationEconomyCity=Object.freeze({VERSION:K.VERSION,ECONOMY_CONTRACT:K.ECONOMY_CONTRACT,MORPHOLOGY_CONTRACT:K.MORPHOLOGY_CONTRACT,IMPACT_CONTRACT:K.IMPACT_CONTRACT,AUTHORITY:K.AUTHORITY,LIMITS:K.LIMITS,GOODS:K.GOODS,CAPABILITY_GRAPH:K.CAPABILITY_GRAPH,LIMITATIONS:K.LIMITATIONS,technologyProfile:K.technologyProfile,initializeEconomy:I.initializeEconomy,stepEconomy:E.stepEconomy,environmentImpactProposals:E.environmentImpactProposals,institutionProfile:S.institutionProfile,cityMorphology:M.cityMorphology,cityRenderPlan:M.cityRenderPlan,inspector:M.inspector});
})(typeof globalThis!=='undefined'?globalThis:this);
