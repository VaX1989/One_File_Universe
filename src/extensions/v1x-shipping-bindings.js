(function(root){
'use strict';
const O=root.OFU=root.OFU||{},C=O.pxContracts,P=O.pxProduct;
if(!C||!P)throw new Error('V1X shipping bindings require the sealed PX descriptor graph');
const registry=P.registry,encoder=new TextEncoder();
const SAFE_LIMITS=Object.freeze({nodes:32768,depth:24,stringBytes:1048576,typedArrayItems:32768}),forbiddenKeys=new Set(['__proto__','prototype','constructor']);
function safe(value){
 let nodes=0,stringBytes=0;const seen=new Set();
 const addString=(text,label)=>{const bytes=encoder.encode(text).length;stringBytes+=bytes;C.assert(bytes<=65536&&stringBytes<=SAFE_LIMITS.stringBytes,'DATA_BUDGET',label);return text;};
 function copy(item,depth){
  C.assert(++nodes<=SAFE_LIMITS.nodes&&depth<=SAFE_LIMITS.depth,'DATA_BUDGET','provider output nodes/depth');
  if(item===null||typeof item==='boolean')return item;
  if(typeof item==='string')return addString(item,'provider output string bytes');
  if(typeof item==='number'){C.assert(Number.isFinite(item)&&Math.abs(item)<=Number.MAX_SAFE_INTEGER&&!Object.is(item,-0),'NUMBER','provider output finite safe-magnitude number required');return item;}
  if(typeof item==='bigint')return addString(String(item),'provider output BigInt bytes');
  if(item instanceof Uint8Array){
   C.assert(item.length<=SAFE_LIMITS.typedArrayItems&&nodes+item.length<=SAFE_LIMITS.nodes,'DATA_BUDGET','provider output Uint8Array');
   const out=new Array(item.length);for(let i=0;i<item.length;i++)out[i]=copy(item[i],depth+1);return out;
  }
  C.assert(item&&typeof item==='object','DATA_TYPE','provider output JSON data required');
  const prototype=Object.getPrototypeOf(item);C.assert(Array.isArray(item)?prototype===Array.prototype:prototype===Object.prototype||prototype===null,'DATA_TYPE','provider output plain data required');
  C.assert(!seen.has(item),'DATA_CYCLE','provider output cyclic value');seen.add(item);
  const names=Reflect.ownKeys(item);let out;
  if(Array.isArray(item)){
   C.assert(item.length<=SAFE_LIMITS.nodes&&names.length===item.length+1,'DATA_TYPE','provider output dense array without extra fields required');out=new Array(item.length);
   for(let i=0;i<item.length;i++){const descriptor=Object.getOwnPropertyDescriptor(item,String(i));C.assert(descriptor&&descriptor.enumerable&&'value'in descriptor,'DATA_TYPE','provider output array accessor/hole');out[i]=copy(descriptor.value,depth+1);}
  }else{
   C.assert(names.length<=SAFE_LIMITS.nodes,'DATA_BUDGET','provider output record fields');out=Object.create(null);
   for(const key of names)C.assert(typeof key==='string'&&!forbiddenKeys.has(key)&&key.length<=128,'DATA_KEY','provider output unsupported key');
   for(const key of names.sort()){
    const descriptor=Object.getOwnPropertyDescriptor(item,key);C.assert(descriptor&&descriptor.enumerable&&'value'in descriptor,'DATA_TYPE','provider output accessor/hidden field');addString(key,'provider output key bytes');out[key]=copy(descriptor.value,depth+1);
   }
  }
  seen.delete(item);return out;
 }
 return C.data(copy(value,0));
}
function entityCount(value){
 for(const path of [['objects'],['hitTargets'],['frames'],['terrain'],['visual','organismInstances'],['trace']]){
  let current=value;for(const part of path)current=current?.[part];if(Array.isArray(current))return current.length;
 }
 return value==null?0:1;
}
function envelope(id,derive,methods={}){
 const descriptor=registry.descriptor(id),implementation={
  handle(request,meter){
   const value=safe(derive(request));const entities=entityCount(value),bytes=Math.max(1,encoder.encode(C.stable(value)).length);
   meter.consume(1,entities);
   return {contract:C.VERSION,provider:id,version:descriptor.version,authority:descriptor.authority,selection:request.selection,fidelity:descriptor.fidelity,usage:{entities,bytes,operations:1,queue:0},value};
  },
  ...methods
 };
 registry.bind(id,descriptor.owner,descriptor.version,implementation);
}
function surfaceJourney(request){
 const payload=request.payload||{},journey=O.v1x06SurfaceJourney.createJourney(payload.initial||payload),actions=Array.isArray(payload.actions)?payload.actions:[];
 C.assert(actions.length<=256,'BUDGET','surface journey actions');
 for(const action of actions){
  C.assert(action&&typeof action==='object','SCHEMA','surface journey action');
  if(action.type==='ZOOM')journey.zoom(action.delta);
  else if(action.type==='MOVE')journey.move(action.movement||{});
  else if(action.type==='SET_ALTITUDE')journey.setAltitude(action.altitudeMeters);
  else if(action.type==='RETURN')journey.returnTowardGlobe();
  else if(action.type==='ACCEPT_TARGET')journey.acceptSurfaceTarget(action.target);
  else C.fail('CAPABILITY','unknown surface journey action');
 }
 return request.operation==='RECONCILE'?journey.witness():journey.state();
}
function microExperience(payload){
 const experience=O.v1x09MicroMatterExperience.create(payload.sourceSpec,payload.options||{}),actions=Array.isArray(payload.actions)?payload.actions:[];
 C.assert(actions.length<=64,'BUDGET','micro journey actions');
 for(const action of actions){
  if(action==='REFINE')experience.refine();
  else if(action==='PROJECT')experience.recede();
  else if(action==='RECONCILE')return {experience,result:experience.returnToSource()};
  else C.fail('CAPABILITY','unknown micro journey action');
 }
 return {experience,result:null};
}
const spatial=O.v1x02SpatialUniverse,system=O.v1x04SystemProvider,approach=O.v1x05PlanetApproach,surface=O.v1x06SurfaceProvider,life=O.v1x07LifeEcologyPresentation,handoff=O.v1x07OrganismHandoff,micro=O.v1x09MicroMatterPresentation,audio=O.systemicAudioV1;
if(!spatial||!system||!approach||!surface||!life||!handoff||!micro||!audio)throw new Error('V1X shipping provider API missing');
envelope('v1x02.representation.spatial-universe',request=>request.operation==='DISCOVER'?spatial.sampleNeighborhood(request.payload):request.operation==='PROJECT'?spatial.projectEntities(request.payload):spatial.representation(request.payload),{render:spatial.representation,probe:spatial.sampleNeighborhood});
envelope('v1x04.system.renderer',request=>request.operation==='INSPECT'?system.pick(request.payload.rendered,request.payload.x,request.payload.y,request.payload.options):system.render(request.payload.input,request.payload.options),{render:system.render,probe:system.pick,snapshot:system.continuityWitness});
envelope('v1x-05.planet-approach',request=>request.payload?.reverse===true?approach.reverseExit(request.payload.packet):approach.project(request.payload),{render:approach.project,probe:approach.reverseExit});
envelope('v1x-06.scene.surface-human',request=>surface.buildFrame(request.payload),{render:surface.buildFrame});
envelope('v1x-06.renderer.surface-human',request=>surface.buildFrame(request.payload),{render:surface.renderCanvas2D});
envelope('v1x-06.interaction.surface-local-travel',surfaceJourney,{probe:O.v1x06SurfaceJourney.createJourney});
envelope('v1x-07.life-ecology-presentation',request=>life.project(request.payload),{render:life.project,probe:life.visualWitness});
envelope('v1x-07.organism-selection-handoff',request=>handoff.refine(request.payload),{probe:handoff.refine});
envelope('v1x09.model.micro-journey',request=>{const run=microExperience(request.payload||{});return run.result||run.experience.snapshot();},{probe:O.v1x09MicroMatterExperience.deterministicJourney});
envelope('v1x09.representation.micro-matter',request=>{const run=microExperience(request.payload||{});return run.result||micro.present(run.experience);},{render:micro.present});
const audioDescriptor=registry.descriptor(audio.PROVIDER_ID);registry.bind(audioDescriptor.id,audioDescriptor.owner,audioDescriptor.version,audio.createBinding(audioDescriptor));
O.v1xShippingBindings=Object.freeze({VERSION:'ofu-v1x-shipping-bindings-1',providerIds:Object.freeze(['v1x02.representation.spatial-universe','v1x04.system.renderer','v1x-05.planet-approach','v1x-06.scene.surface-human','v1x-06.renderer.surface-human','v1x-06.interaction.surface-local-travel','v1x-07.life-ecology-presentation','v1x-07.organism-selection-handoff','v1x09.model.micro-journey','v1x09.representation.micro-matter','v1x13.representation.systemic-audio'])});
})(globalThis);
