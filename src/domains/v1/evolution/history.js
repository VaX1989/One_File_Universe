(function(root){
'use strict';
const O=root.OFU=root.OFU||{},V=O.v1Common,B=O.v1Biology;if(!V||!B)throw new Error('v1 evolution history prerequisites missing');
const VERSION='ofu-v1-evolution-history-1';
function advance(state,{epochs=1,generationsPerEpoch=96,environmentShiftPpm=0,disturbancePpm=null}={}){return B.projectHistory(state,{epochs,generationsPerEpoch,environmentShiftPpm,disturbancePpm});}
function lineageSummary(state,{limit=48}={}){V.int(limit,'limit',1,96);const active=(state.populations||[]).slice().sort((a,b)=>b.individuals-a.individuals||a.lineageId.localeCompare(b.lineageId)).slice(0,limit).map(x=>Object.freeze({lineageId:x.lineageId,parentLineageId:x.parentLineageId||null,populationId:x.populationId,individuals:x.individuals,role:x.role,generationBorn:x.generationBorn,complexityPpm:x.traits?.complexityPpm||0,multicellularityPpm:x.traits?.multicellularityPpm||0,cognitionPpm:x.traits?.cognitionPpm||0,socialityPpm:x.traits?.socialityPpm||0,manipulationPpm:x.traits?.manipulationPpm||0,communicationPpm:x.traits?.communicationPpm||0}));return Object.freeze({worldIdentity:state.worldIdentity,generation:state.generation,active,extinctions:state.extinctions||0,speciations:state.speciations||0,authority:'MODEL_DERIVED_SIMULATION'});}
function history(state,options={}){return B.queryHistory(state,options);}
function intelligenceHandoff(state){return B.intelligenceHandoff(state);}
function canonicalAdmissionProposal(state,type,details={}){return B.p4Proposal(state,type,details);}
function extinctEvidence(state){return B.traceEvidence(state);}
O.v1Evolution=Object.freeze({VERSION,advance,lineageSummary,history,intelligenceHandoff,canonicalAdmissionProposal,extinctEvidence});
})(globalThis);
