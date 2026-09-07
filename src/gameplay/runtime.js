(function(root){
'use strict';
const O=root.OFU=root.OFU||{},P=O.p2,C=O.v2x11GameplayContracts,E=O.v2x11CausalEngine,B=O.v2x11P4GameplayBridge;
if(!P||!C||!E||!B)throw new Error('V2X-11 gameplay runtime prerequisites missing');
const VERSION='ofu-v2x-11-gameplay-runtime-1';
const CAPABILITY=Object.freeze({id:'v2x11.gameplay.causal-engine',version:'1.0.0',authority:C.AUTHORITY});
const DEFAULT_RESOURCES=Object.freeze([{resourceId:'energy',units:1000},{resourceId:'supplies',units:500},{resourceId:'storage_capacity',units:250}]);
const SPECS=Object.freeze({
 SURVEY:Object.freeze({resources:[{resourceId:'energy',units:1}],timeMicros:1000000}),
 MEASURE:Object.freeze({resources:[{resourceId:'energy',units:1}],timeMicros:2000000}),
 SAMPLE:Object.freeze({resources:[{resourceId:'energy',units:2},{resourceId:'supplies',units:1}],timeMicros:5000000}),
 DEPLOY_PROBE:Object.freeze({resources:[{resourceId:'energy',units:5},{resourceId:'supplies',units:3}],timeMicros:20000000}),
 DEPLOY_STATION:Object.freeze({resources:[{resourceId:'energy',units:10},{resourceId:'supplies',units:8}],timeMicros:60000000}),
 RESOURCE_EXTRACT:Object.freeze({resources:[{resourceId:'energy',units:4},{resourceId:'storage_capacity',units:1}],timeMicros:15000000}),
 ECOLOGY_INTERVENTION:Object.freeze({resources:[{resourceId:'energy',units:6},{resourceId:'supplies',units:5}],timeMicros:30000000}),
 ADVANCE_TIME:Object.freeze({resources:[],timeMicros:0})
});
function fail(message){throw new Error('OFU V2X-11 gameplay runtime: '+message)}
function integer(v,label,min,max){return C.integer(v,label,min,max)}
function string(v,label,max=160){return C.text(v,label,max)}
function normalizeParameters(kind,input={}){
  if(!input||typeof input!=='object'||Array.isArray(input))fail('parameters required');const out={};
  if(kind==='SURVEY'){C.exact(input,[],['mode'],'survey parameters');if('mode'in input)out.mode=string(input.mode,'mode',96)}
  else if(kind==='MEASURE'){C.exact(input,['instrument'],['note'],'measure parameters');out.instrument=string(input.instrument,'instrument',96);if('note'in input)out.note=string(input.note,'note',240)}
  else if(kind==='SAMPLE'){C.exact(input,['medium'],['units','label'],'sample parameters');out.medium=string(input.medium,'medium',96);out.units='units'in input?integer(input.units,'sample units',1,1000000):1;if('label'in input)out.label=string(input.label,'label',160)}
  else if(kind==='DEPLOY_PROBE'||kind==='DEPLOY_STATION'){C.exact(input,[],['purpose','label'],'deployment parameters');if('purpose'in input)out.purpose=string(input.purpose,'purpose',160);if('label'in input)out.label=string(input.label,'label',160)}
  else if(kind==='RESOURCE_EXTRACT'){C.exact(input,['resourceId','units'],['method'],'resource extraction parameters');out.resourceId=string(input.resourceId,'resourceId',96);out.units=integer(input.units,'extraction units',1,1000000);if('method'in input)out.method=string(input.method,'method',160)}
  else if(kind==='ECOLOGY_INTERVENTION'){C.exact(input,['intervention'],['magnitudePpm','method'],'ecology intervention parameters');out.intervention=string(input.intervention,'intervention',160);out.magnitudePpm='magnitudePpm'in input?integer(input.magnitudePpm,'magnitudePpm',-1000000,1000000):0;if('method'in input)out.method=string(input.method,'method',160)}
  else if(kind==='ADVANCE_TIME'){C.exact(input,['timeMicros'],['civilizationEpochStep','biologyEpochs','generationsPerEpoch'],'advance time parameters');out.timeMicros=integer(input.timeMicros,'timeMicros',1,C.LIMITS.timeMicros);out.civilizationEpochStep='civilizationEpochStep'in input?integer(input.civilizationEpochStep,'civilizationEpochStep',1,10000):1;out.biologyEpochs='biologyEpochs'in input?integer(input.biologyEpochs,'biologyEpochs',0,16):1;out.generationsPerEpoch='generationsPerEpoch'in input?integer(input.generationsPerEpoch,'generationsPerEpoch',1,256):32}
  else fail('unsupported action '+kind);return C.safe(out,'normalized action parameters');
}
function actionCost(kind,parameters){const spec=SPECS[kind];if(!spec)fail('action spec missing');return C.cost({resources:spec.resources,timeMicros:kind==='ADVANCE_TIME'?parameters.timeMicros:spec.timeMicros})}
function priorDependency(priorEffects,domains){const candidates=priorEffects.filter(e=>domains.includes(e.domain));return candidates.length?[candidates[candidates.length-1].effectId]:[]}
function registerDefaults(){const existing=new Set(E.adapterSnapshot().map(x=>x.domain));const add=a=>{if(!existing.has(a.domain)){E.registerAdapter(a);existing.add(a.domain)}};
  add({id:'v2x11.adapter.evidence',version:'1.0.0',domain:'evidence',authority:C.AUTHORITY,
    plan(proposal,{priorEffects}){return [C.effect({domain:'evidence',kind:'EVIDENCE_RECEIPT',targetId:proposal.targetId,dependsOn:priorDependency(priorEffects,['material','infrastructure']),authority:C.AUTHORITY,payload:{actionKind:proposal.kind,parameters:proposal.parameters,claim:'player evidence/action record; not scientific measurement truth'}})]},
    apply(effect){return{status:'APPLIED',payload:{recorded:true,recordClass:'PLAYER_EVIDENCE_OVERLAY',sourceEffectId:effect.effectId,canonicalProven:false}}}}
  );
  add({id:'v2x11.adapter.infrastructure',version:'1.0.0',domain:'infrastructure',authority:C.AUTHORITY,
    plan(proposal){if(!['DEPLOY_PROBE','DEPLOY_STATION'].includes(proposal.kind))return[];return[C.effect({domain:'infrastructure',kind:proposal.kind==='DEPLOY_PROBE'?'PROBE_DEPLOYED':'STATION_DEPLOYED',targetId:proposal.targetId,dependsOn:[],authority:C.AUTHORITY,payload:{parameters:proposal.parameters,playerAuthored:true}})]},
    apply(effect){return{status:'APPLIED',payload:{deployment:effect.kind,parameters:effect.payload.parameters,persistentOverlay:true,canonicalMutation:false}}}
  });
  add({id:'v2x11.adapter.material',version:'1.0.0',domain:'material',authority:C.AUTHORITY,
    plan(proposal){if(!['SAMPLE','RESOURCE_EXTRACT','ADVANCE_TIME'].includes(proposal.kind))return[];const kind=proposal.kind==='SAMPLE'?'SAMPLE_REMOVED':proposal.kind==='RESOURCE_EXTRACT'?'RESOURCE_EXTRACTION_RECORDED':'MATERIAL_TIME_INPUT';return[C.effect({domain:'material',kind,targetId:proposal.targetId,dependsOn:[],authority:C.AUTHORITY,payload:{parameters:proposal.parameters,scientificResponseMode:'INPUT_ONLY_UNLESS_DOMAIN_MODEL_EXPLICITLY_SUPPORTS_TRANSITION'}})]},
    apply(effect){return{status:'APPLIED',payload:{kind:effect.kind,parameters:effect.payload.parameters,modelEffect:'PLAYER_OVERLAY_INPUT',scientificMaterialEquationApplied:false,canonicalMutation:false}}}
  });
  add({id:'v2x11.adapter.ecology',version:'1.0.0',domain:'ecology',authority:C.AUTHORITY,
    plan(proposal,{priorEffects}){if(!['ECOLOGY_INTERVENTION','ADVANCE_TIME'].includes(proposal.kind))return[];return[C.effect({domain:'ecology',kind:proposal.kind==='ADVANCE_TIME'?'ECOLOGY_TIME_PROJECTION':'ECOLOGY_INTERVENTION_INPUT',targetId:proposal.targetId,dependsOn:priorDependency(priorEffects,['material']),authority:C.AUTHORITY,payload:{parameters:proposal.parameters}})]},
    apply(effect,{context}){if(effect.kind==='ECOLOGY_INTERVENTION_INPUT')return{status:'APPLIED',payload:{recordedInput:true,parameters:effect.payload.parameters,domainTransitionApplied:false,reason:'no biology equation is inferred from intervention parameters'}};const ecosystem=context.modelWorld?.biology?.ecosystem;if(!ecosystem)return{status:'UNSUPPORTED_DOMAIN_EFFECT',payload:{reason:'modeled biology context unavailable'}};if(ecosystem.state!=='MODELED_BIOSPHERE')return{status:'APPLIED',payload:{projectionStatus:'NO_MODELED_BIOSPHERE',state:ecosystem.state,domainTransitionApplied:false}};if(!O.v1Biology?.projectHistory)return{status:'UNSUPPORTED_DOMAIN_EFFECT',payload:{reason:'v1 biology temporal projection unavailable'}};const p=effect.payload.parameters,next=O.v1Biology.projectHistory(ecosystem,{epochs:p.biologyEpochs,generationsPerEpoch:p.generationsPerEpoch});return{status:'APPLIED',payload:{projectionStatus:'MODELED_BIOSPHERE_PROJECTED',beforeGeneration:ecosystem.generation,afterGeneration:next.generation,summary:next.summary||null,traceEvidence:O.v1Biology.traceEvidence?O.v1Biology.traceEvidence(next):null,authority:C.AUTHORITY,canonicalP6Mutation:false}}}
  });
  add({id:'v2x11.adapter.civilization',version:'1.0.0',domain:'civilization',authority:C.AUTHORITY,
    plan(proposal,{priorEffects}){if(!['RESOURCE_EXTRACT','ECOLOGY_INTERVENTION','ADVANCE_TIME'].includes(proposal.kind))return[];const kind=proposal.kind==='ADVANCE_TIME'?'CIVILIZATION_TIME_PROJECTION':proposal.kind==='RESOURCE_EXTRACT'?'RESOURCE_PRESSURE_INPUT':'ECOLOGICAL_PRESSURE_INPUT';return[C.effect({domain:'civilization',kind,targetId:proposal.targetId,dependsOn:priorDependency(priorEffects,['material','ecology']),authority:C.AUTHORITY,payload:{parameters:proposal.parameters}})]},
    apply(effect,{context}){if(effect.kind!=='CIVILIZATION_TIME_PROJECTION')return{status:'APPLIED',payload:{recordedInput:true,inputKind:effect.kind,parameters:effect.payload.parameters,domainTransitionApplied:false,reason:'no civilization equation is inferred from gameplay pressure'}};const state=context.modelWorld?.civilization;if(!state)return{status:'UNSUPPORTED_DOMAIN_EFFECT',payload:{reason:'modeled civilization context unavailable'}};if(state.state!=='MODELED_CIVILIZATION')return{status:'APPLIED',payload:{projectionStatus:'NO_MODELED_CIVILIZATION',state:state.state,domainTransitionApplied:false}};if(!O.v1Civilization?.step)return{status:'UNSUPPORTED_DOMAIN_EFFECT',payload:{reason:'v1 civilization temporal projection unavailable'}};const next=O.v1Civilization.step(state,{epochStep:effect.payload.parameters.civilizationEpochStep});return{status:'APPLIED',payload:{projectionStatus:'MODELED_CIVILIZATION_PROJECTED',beforeEpoch:state.epoch,afterEpoch:next.epoch,population:next.population,settlementCount:Array.isArray(next.settlements)?next.settlements.length:0,eventProposalIds:Array.isArray(next.events)?next.events.slice(-16).map(x=>x.eventProposalId):[],authority:C.AUTHORITY,requiresP4AdmissionForDomainEvents:true}}}
  });
}
function liveContext(session){const targetId=session.targetId;if(!O.pxProduct?.captured||!O.v1Providers?.worldFor)return Object.freeze({targetId,modelWorld:null,source:'NO_PRODUCT_CONTEXT'});const captured=O.pxProduct.captured();if(captured.selection?.target?.entityId!==targetId)fail('current canonical selection differs from gameplay target');return C.safe({targetId,modelWorld:O.v1Providers.worldFor(captured.selection),source:'V1_MODELED_WORLD'},'live gameplay context',262144)}
function createSession(input){C.exact(input,['universeIdentity','targetId'],['initialResources'],'gameplay session input');registerDefaults();return B.createSession({universeIdentity:input.universeIdentity,targetId:input.targetId,initialResources:input.initialResources||DEFAULT_RESOURCES,capabilities:[CAPABILITY]})}
function propose(input){C.exact(input,['session','actorId','kind','parameters'],['context','causes'],'propose input');registerDefaults();const kind=C.normalizeKind(input.kind),parameters=normalizeParameters(kind,input.parameters),current=B.replay(input.session),context=input.context===undefined?liveContext(current.session):C.safe(input.context,'gameplay context',262144),operationKey='v2x11.'+kind.toLowerCase()+'.'+C.digest('OFU-V2X11-OPERATION-v1',{actorId:input.actorId,targetId:current.session.targetId,stateDigest:current.stateDigest,parameters}).slice(0,32);const proposal=C.proposal({kind,actorId:input.actorId,targetId:current.session.targetId,operationKey,authority:C.AUTHORITY,capability:CAPABILITY,preconditionStateDigest:current.stateDigest,cost:actionCost(kind,parameters),parameters,causes:input.causes||[]});return Object.freeze({proposal,context,current})}
function perform(input){C.exact(input,['session','actorId','kind','parameters'],['context','causes'],'perform input');const prepared=propose(input),orchestrated=E.orchestrate({proposal:prepared.proposal,context:prepared.context}),committed=B.commit({session:prepared.current.session,proposal:prepared.proposal,execution:orchestrated.execution});return Object.freeze({proposal:prepared.proposal,plan:orchestrated.plan,execution:orchestrated.execution,...committed})}
function revisit(session){return B.replay(session)}
function exportSession(session){return B.exportSession(session)}
function importSession(bytes){registerDefaults();return B.importSession(bytes)}
function catalog(){return Object.freeze(C.ACTIONS.map(kind=>Object.freeze({kind,routes:C.ROUTES[kind],baseCost:SPECS[kind],authority:C.AUTHORITY,canonicalMutation:false})))}
registerDefaults();
O.v2x11Gameplay=Object.freeze({VERSION,CAPABILITY,DEFAULT_RESOURCES,SPECS,catalog,createSession,normalizeParameters,propose,perform,revisit,exportSession,importSession});
})(typeof globalThis!=='undefined'?globalThis:this);
