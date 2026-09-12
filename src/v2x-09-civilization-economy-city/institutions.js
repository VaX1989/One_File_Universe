(function(root){
'use strict';
const O=root.OFU=root.OFU||{},K=O.v2x09CivilizationCore;if(!K)throw new Error('V2X-09 core required');
const {AUTHORITY,LIMITS,LIMITATIONS,freeze,text,clamp,arr,sortId,validateCivilization,technologyProfile,techLevel,deriveId}=K;
function institutionProfile(state){
  if(!validateCivilization(state))return freeze({status:'NO_MODELED_CIVILIZATION',institutions:[],authority:AUTHORITY.MODEL_DERIVED_SIMULATION,limitations:LIMITATIONS});
  const tech=technologyProfile(state),institutions=[];
  for(const p of sortId(arr(state.polities),'polityId')){
    const ids=arr(p.settlementIds),members=arr(state.settlements).filter(s=>ids.includes(s.settlementId)),trade=arr(state.tradeEdges).filter(e=>ids.includes(e.from)||ids.includes(e.to)).length,scarcity=Math.floor(members.reduce((n,s)=>n+clamp(s.scarcityPpm||0),0)/Math.max(1,members.length));
    const legitimacy=clamp(p.legitimacyPpm||0),cohesion=clamp(p.cohesionPpm||0),authority=clamp(p.authorityPpm||0),coordination=clamp(Math.floor(legitimacy*.35+cohesion*.35+Math.min(1000000,trade*90000)*.15+tech.knowledgeContinuityPpm*.15)),centralization=clamp(Math.floor(authority*.55+Math.min(1000000,ids.length*130000)*.25+techLevel(state.technology,'communication')*25000));
    const transition=legitimacy<140000||cohesion<140000?'FRAGMENTATION_PRESSURE':scarcity>750000?'SCARCITY_STRAIN':coordination>720000&&ids.length>1?'COORDINATED_CONSOLIDATION':'STABLE_OR_AMBIGUOUS';
    const mechanisms=['COORDINATION'];if(trade>0)mechanisms.push('EXCHANGE_COORDINATION');if(tech.activeCapabilities.includes('PUBLIC_WORKS'))mechanisms.push('INFRASTRUCTURE_MAINTENANCE');if(tech.activeCapabilities.includes('CENTRAL_RECORDS'))mechanisms.push('RECORD_AND_ALLOCATION');if(arr(state.relations).some(r=>r.aPolityId===p.polityId||r.bPolityId===p.polityId))mechanisms.push('INTERPOLITY_RELATION');
    institutions.push(freeze({institutionId:text(p.institutionId||deriveId('institution',p.polityId)),polityId:text(p.polityId),settlementIds:ids.slice().sort(),coordinationPpm:coordination,centralizationPpm:centralization,legitimacyPpm:legitimacy,cohesionPpm:cohesion,scarcityPressurePpm:scarcity,transition,mechanisms:mechanisms.slice(0,8),authority:AUTHORITY.MODEL_DERIVED_SIMULATION,universalSociologicalClaim:false}));
    if(institutions.length>=LIMITS.institutions)break;
  }
  return freeze({contract:'ofu-v2x-09-institution-mechanism-profile-1',status:'MODELED',institutions,authority:AUTHORITY.MODEL_DERIVED_SIMULATION,bounded:true,limitations:LIMITATIONS});
}

O.v2x09CivilizationInstitutions=Object.freeze({institutionProfile});
})(typeof globalThis!=='undefined'?globalThis:this);
