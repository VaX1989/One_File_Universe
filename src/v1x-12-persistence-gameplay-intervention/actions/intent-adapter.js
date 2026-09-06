(function(root){
'use strict';
const O=root.OFU=root.OFU||{},C=O.pxContracts,X=O.pxProduct,R=O.waveIVScaleRuntime,S=O.v1Session,B=O.v1x12TemporalBridge;
if(!C||!X||!R||!S||!B)throw new Error('V1X-12 governed action prerequisites missing');
const VERSION='ofu-v1x-12-governed-actions-1',INTENT_CONTRACT='ofu-v1x-12-action-intent-1',ADMISSION_CONTRACT='ofu-v1x-12-action-admission-1';
const PROVIDER_ID='v1.interaction.player-agency',PERSISTENCE_ID='v1.persistence.session',AUTHORITY='MODEL_DERIVED_SIMULATION';
const KEY_FIELDS=Object.freeze(['galaxyX','galaxyY','galaxyZ','sectorX','sectorY','sectorZ','siteX','siteY','siteZ','orbitSlot']);
const RULES=Object.freeze({
 MEASURE:Object.freeze({scales:Object.freeze(['orbit','approach','global_surface','regional_surface','local_surface','human']),required:Object.freeze(['instrument']),optional:Object.freeze(['note'])}),
 SAMPLE:Object.freeze({scales:Object.freeze(['global_surface','regional_surface','local_surface','human']),required:Object.freeze(['medium']),optional:Object.freeze(['label'])}),
 EXPERIMENT:Object.freeze({scales:Object.freeze(['local_surface','human']),required:Object.freeze(['protocol']),optional:Object.freeze(['label'])}),
 ECOLOGY_INTERVENTION:Object.freeze({scales:Object.freeze(['regional_surface','local_surface','human']),required:Object.freeze(['deltaPpm']),optional:Object.freeze(['method'])}),
 BIOLOGICAL_SEEDING:Object.freeze({scales:Object.freeze(['local_surface','human']),required:Object.freeze(['strain','inoculumUnits']),optional:Object.freeze(['label'])})
});
function fail(message){throw new Error('OFU V1X-12 governed action: '+message)}
function exact(value,required,optional=[],label='record'){
 if(!value||typeof value!=='object'||Array.isArray(value))fail(label+' required');
 const allowed=new Set([...required,...optional]),keys=Reflect.ownKeys(value);
 if(keys.some(k=>typeof k!=='string'))fail(label+' symbol key');
 for(const key of keys)if(!allowed.has(key))fail(label+' unknown field '+key);
 for(const key of required)if(!Object.prototype.hasOwnProperty.call(value,key))fail(label+' missing field '+key);
}
function text(value,label,max=160){if(typeof value!=='string')fail(label+' must be text');const v=value.normalize('NFC').trim();if(v.length<1||v.length>max)fail(label+' length');return v}
function integer(value,label,min,max){if(!Number.isSafeInteger(value)||value<min||value>max)fail(label+' out of range');return value}
function normalizeKind(kind){const value=String(kind||'').toUpperCase();if(!Object.prototype.hasOwnProperty.call(RULES,value)||!S.ACTIONS.includes(value))fail('unsupported action '+value);return value}
function normalizeParameters(kind,input={}){
 kind=normalizeKind(kind);const rule=RULES[kind],clean=C.data(input,{bytes:8192,nodes:512});exact(clean,rule.required,rule.optional,'parameters');const out={};
 if(kind==='MEASURE'){out.instrument=text(clean.instrument,'instrument',96);if('note'in clean)out.note=text(clean.note,'note',240);}
 else if(kind==='SAMPLE'){out.medium=text(clean.medium,'medium',96);if('label'in clean)out.label=text(clean.label,'label',160);}
 else if(kind==='EXPERIMENT'){out.protocol=text(clean.protocol,'protocol',160);if('label'in clean)out.label=text(clean.label,'label',160);}
 else if(kind==='ECOLOGY_INTERVENTION'){out.deltaPpm=integer(clean.deltaPpm,'deltaPpm',-100,100);if(out.deltaPpm===0)fail('deltaPpm must be non-zero');if('method'in clean)out.method=text(clean.method,'method',160);}
 else if(kind==='BIOLOGICAL_SEEDING'){out.strain=text(clean.strain,'strain',128);out.inoculumUnits=integer(clean.inoculumUnits,'inoculumUnits',1,1000000);if('label'in clean)out.label=text(clean.label,'label',160);}
 return C.data(out,{bytes:8192,nodes:512});
}
function canonicalKey(input){exact(input,KEY_FIELDS,[],'canonical key');const out={};for(const field of KEY_FIELDS){const value=input[field];if(typeof value!=='string'||!/^-?(0|[1-9][0-9]{0,19})$/.test(value))fail('canonical key field '+field);out[field]=value;}return C.data(out);}
function descriptorWitness(){
 const action=X.registry.descriptor(PROVIDER_ID),persistence=X.registry.descriptor(PERSISTENCE_ID);
 if(action.version!=='1.0.0'||action.owner!=='v1'||action.kind!=='interaction'||action.authority.class!==AUTHORITY||!action.operations.includes('TRANSITION'))fail('agency provider contract mismatch');
 if(persistence.version!=='1.0.0'||persistence.owner!=='v1'||persistence.kind!=='persistence'||persistence.authority.class!=='DERIVED'||!persistence.operations.includes('ENCODE')||!persistence.operations.includes('DECODE'))fail('persistence provider contract mismatch');
 return C.data({action:{id:action.id,version:action.version,authority:action.authority.class},persistence:{id:persistence.id,version:persistence.version,authority:persistence.authority.class}});
}
function currentContext(){
 B.assertContracts();const scale=R.snapshot();if(scale.version!=='ofu-wave-iv-scale-runtime-3'||scale.selectionContract!=='ofu-wave-iv-selection-1')fail('scale/selection contract mismatch');const selected=scale.selectedCanonicalTarget;if(!selected?.canonicalKey||typeof selected.planetId!=='string')fail('canonical planet selection required');const captured=X.captured(selected.canonicalKey);if(captured.selection.target.entityId!==selected.planetId)fail('captured target mismatch');return C.data({targetId:selected.planetId,canonicalKey:canonicalKey(captured.canonicalKey),semanticScale:scale.semanticScale,providers:descriptorWitness()});
}
function availability(kind,parameters={}){
 try{
  kind=normalizeKind(kind);const clean=normalizeParameters(kind,parameters),context=currentContext(),allowed=RULES[kind].scales.includes(context.semanticScale);
  if(!allowed)return C.data({available:false,reason:'UNSUPPORTED_SEMANTIC_SCALE',kind,context});
  let gate;try{gate=S.validateAction(kind,clean).gate}catch(error){return C.data({available:false,reason:'SHARED_PROVIDER_REJECTED',detail:String(error?.message||error).slice(0,512),kind,context});}
  return C.data({available:true,reason:'ADMISSIBLE',kind,context,gate});
 }catch(error){return C.data({available:false,reason:'INVALID_INTENT',detail:String(error?.message||error).slice(0,512),kind:String(kind||'').toUpperCase()});}
}
function intentMaterial(kind,parameters,context){return C.data({contract:INTENT_CONTRACT,version:'1.0.0',kind,targetId:context.targetId,canonicalKey:context.canonicalKey,semanticScale:context.semanticScale,parameters,provider:context.providers.action,persistence:context.providers.persistence,authority:AUTHORITY,canonicalMutation:false,canonicalP6Mutation:false});}
function createIntent(kind,parameters={}){
 kind=normalizeKind(kind);const clean=normalizeParameters(kind,parameters),a=availability(kind,clean);if(!a.available)fail('action unavailable: '+a.reason+(a.detail?' - '+a.detail:''));const material=intentMaterial(kind,clean,a.context),intentDigest=C.digest(material);return C.data({...material,intentDigest});
}
function validateIntent(input){
 const value=C.data(input,{bytes:16384,nodes:1024});exact(value,['contract','version','kind','targetId','canonicalKey','semanticScale','parameters','provider','persistence','authority','canonicalMutation','canonicalP6Mutation','intentDigest'],[],'intent');
 if(value.contract!==INTENT_CONTRACT||value.version!=='1.0.0'||value.authority!==AUTHORITY||value.canonicalMutation!==false||value.canonicalP6Mutation!==false)fail('intent contract/authority mismatch');
 const kind=normalizeKind(value.kind),parameters=normalizeParameters(kind,value.parameters),key=canonicalKey(value.canonicalKey);if(typeof value.targetId!=='string'||!/^[0-9a-f]{64}$/.test(value.targetId))fail('intent target id');if(typeof value.semanticScale!=='string'||!R.LADDER.includes(value.semanticScale))fail('intent semantic scale');
 exact(value.provider,['id','version','authority'],[],'provider witness');exact(value.persistence,['id','version','authority'],[],'persistence witness');if(value.provider.id!==PROVIDER_ID||value.provider.version!=='1.0.0'||value.provider.authority!==AUTHORITY)fail('intent provider witness mismatch');if(value.persistence.id!==PERSISTENCE_ID||value.persistence.version!=='1.0.0'||value.persistence.authority!=='DERIVED')fail('intent persistence witness mismatch');
 const material=intentMaterial(kind,parameters,{targetId:value.targetId,canonicalKey:key,semanticScale:value.semanticScale,providers:{action:value.provider,persistence:value.persistence}});if(C.digest(material)!==value.intentDigest)fail('intent digest mismatch');return C.data({...material,intentDigest:value.intentDigest});
}
function admit(input){
 const intent=validateIntent(input),context=currentContext();if(context.targetId!==intent.targetId||C.stable(context.canonicalKey)!==C.stable(intent.canonicalKey))fail('stale intent target');if(context.semanticScale!==intent.semanticScale)fail('stale intent semantic scale');if(C.stable(context.providers.action)!==C.stable(intent.provider)||C.stable(context.providers.persistence)!==C.stable(intent.persistence))fail('stale provider contract');const a=availability(intent.kind,intent.parameters);if(!a.available)fail('action no longer admissible: '+a.reason+(a.detail?' - '+a.detail:''));return C.data({contract:ADMISSION_CONTRACT,version:'1.0.0',intentDigest:intent.intentDigest,kind:intent.kind,targetId:intent.targetId,semanticScale:intent.semanticScale,authority:AUTHORITY,provider:a.context.providers.action,persistence:a.context.providers.persistence,canonicalMutation:false,canonicalP6Mutation:false});
}
function commit(input){
 const intent=validateIntent(input),admission=admit(intent),before=S.snapshot(),parameters=C.data({...intent.parameters,v1x12Intent:{contract:INTENT_CONTRACT,version:'1.0.0',intentDigest:intent.intentDigest,targetId:intent.targetId,semanticScale:intent.semanticScale}},{bytes:16384,nodes:1024}),result=S.submit(intent.kind,parameters),after=S.snapshot();if(!result.eventId||result.canonicalMutation!==false||result.canonicalP6Mutation!==false)fail('shared session returned invalid transition witness');if(before.p4StateDigest!==null&&before.p4StateDigest===after.p4StateDigest)fail('P4 state digest did not advance');return C.data({contract:ADMISSION_CONTRACT,version:'1.0.0',intentDigest:intent.intentDigest,admission,kind:intent.kind,targetId:intent.targetId,semanticScale:intent.semanticScale,eventId:result.eventId,beforeStateDigest:before.p4StateDigest,afterStateDigest:after.p4StateDigest,compacted:result.compacted===true,authority:AUTHORITY,canonicalMutation:false,canonicalP6Mutation:false});
}
function catalog(){return C.data(Object.entries(RULES).map(([kind,rule])=>({kind,semanticScales:rule.scales,requiredParameters:rule.required,optionalParameters:rule.optional,authority:AUTHORITY})));
}
function save(){return B.exportPortable()}
function load(bytes){return B.importPortable(bytes)}
function revisit(targetId=null){return B.revisit(targetId)}
B.assertContracts();descriptorWitness();
O.v1x12GovernedActions=Object.freeze({VERSION,INTENT_CONTRACT,ADMISSION_CONTRACT,AUTHORITY,RULES,catalog,availability,createIntent,validateIntent,admit,commit,save,load,revisit});
})(typeof globalThis!=='undefined'?globalThis:this);
