export const P4_BRIDGE_ID='ofu-r18-civ-p4-bridge-1';
export const P4_EVENT_FAMILIES=Object.freeze([
  'research.civ.stockflow.step@1',
  'research.civ.history.consequence@1',
  'research.civ.refinement.materialize@1'
]);

function assert(ok,message){if(!ok)throw new Error(`R18 P4 bridge: ${message}`);}

export function researchTransitionDescriptor(){
  return Object.freeze({transitionContractSchemaVersion:1n,contractId:'ofu.research.v1x18.civilization-transition',semanticVersion:'1.0.0',compatibility:'exact',eventFamilies:[...P4_EVENT_FAMILIES]});
}

function pushBounded(state,record){
  state.baseline=state.baseline&&typeof state.baseline==='object'?state.baseline:{};
  const current=Array.isArray(state.baseline.v1x18ResearchTrace)?state.baseline.v1x18ResearchTrace:[];
  state.baseline.v1x18ResearchTrace=[...current,record].slice(-256);
}

export function createResearchTransition(p4){
  assert(p4&&typeof p4.createTransitionContract==='function','P4 createTransitionContract required');
  const reducers=new Map();
  for(const family of P4_EVENT_FAMILIES){
    reducers.set(family,(state,event)=>pushBounded(state,{type:event.descriptor.type,version:event.descriptor.version,operationKey:event.descriptor.operationKey,time:event.descriptor.time,payload:event.descriptor.payload}));
  }
  return p4.createTransitionContract({contractId:'ofu.research.v1x18.civilization-transition',semanticVersion:'1.0.0',compatibility:'exact',eventFamilies:[...P4_EVENT_FAMILIES],reducers});
}

export function makeStepEventInput({universeIdentity,lineageId,time,target,payload,preconditionStateDigest=null,causes=[]}){
  assert(universeIdentity instanceof Uint8Array&&universeIdentity.length===32,'universeIdentity');
  assert(lineageId instanceof Uint8Array&&lineageId.length===32,'lineageId');
  assert(target instanceof Uint8Array&&target.length===32,'target');
  return Object.freeze({universeIdentity,lineageId,time,type:'research.civ.stockflow.step',version:1n,operationKey:'v1x18:stockflow-step',targets:[target],payload,causes,preconditionStateDigest});
}

export function makeHistoryEventInput({universeIdentity,lineageId,time,target,payload,preconditionStateDigest=null,causes=[]}){
  return Object.freeze({universeIdentity,lineageId,time,type:'research.civ.history.consequence',version:1n,operationKey:'v1x18:history-consequence',targets:[target],payload,causes,preconditionStateDigest});
}

export function compatibilityClaim(){
  return Object.freeze({
    bridgeId:P4_BRIDGE_ID,
    p4Protocol:'ofu-p4-temporal-v1',eventSchema:1,transitionSchema:1,
    status:'STRUCTURALLY_MATCHED_NOT_PROMOTED',
    rule:'Custom research event families require an exact P4 transition contract; they are not admissible under the frozen core transition contract.',
    promotionBoundary:'Convergence owner must explicitly admit a shipping transition contract; research events must never be injected into canonical history by this lane.'
  });
}
