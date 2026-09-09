(function(root){
'use strict';
const O=root.OFU=root.OFU||{},Base=O.v1LivingRenderer,M=O.v2x01MaterializationRuntime,C=O.pxContracts;
if(!Base||!M||!C||typeof Base.create!=='function')throw new Error('Living V2X01 runtime binding dependencies missing');
if(Base.__v2x01RuntimeBound)return;
const VERSION='ofu-v2-central-living-v2x01-runtime-binding-1',PROVIDER='living.central.detail';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function selectedToken(s){return String(s?.selectedObjectId||s?.body?.canonicalId||s?.body?.entityId||s?.world?.planetIdentity||s?.system?.canonicalId||s?.node?.canonicalId||'living-universe').slice(0,512)}
function create(canvas,glCanvas,options={}){
 const renderer=Base.create(canvas,glCanvas,options),runtime=M.create({budgets:{active:2,queue:32,cacheEntries:24,materializations:24,cpuEstimateBytes:4194304,heapBytes:8388608,gpuEstimateBytes:4194304,entities:2048,operations:16384,syncFallbackOperations:4096,transferBytes:1048576,taskBytes:65536},workerExecutor:false});
 runtime.registerMaterializer({providerId:PROVIDER,domain:'living-render',modelVersion:'ofu-living-detail-model-1',representationVersion:'ofu-living-detail-representation-1',load(payload){return {identity:payload.durable.identity,semanticDigest:payload.semanticDigest,state:payload.targetState,cpuEstimateBytes:2048,gpuEstimateBytes:0,entities:1,operations:8,transferBytes:0,value:{stage:payload.semantic.stage,semanticScale:payload.semantic.semanticScale,revision:payload.semantic.revision,selection:payload.semantic.selection}}}});
 let lastPacket=null,lastDecision=null,requests=0,failures=0,disposed=false;
 async function prepare(s){
  const selection=selectedToken(s),entityId=C.digest({selection}),stage=String(s?.stage||'UNIVERSE'),semanticScale=String(s?.semanticScale||stage),revision=Math.max(0,Number(s?.revision)||0),historyDepth=Math.max(0,Number(s?.historyDepth)||0),visible=typeof document==='undefined'?true:document.visibilityState!=='hidden';
  const scaleRelevancePpm=clamp(['HUMAN','LOCAL_SURFACE','REGIONAL_SURFACE','GLOBAL_SURFACE','MATERIAL','MICROSTRUCTURE','MOLECULAR','ATOMIC'].includes(stage)?820000:620000,0,1000000),causalRelevancePpm=historyDepth>0?420000:180000;
  const out=await runtime.requestAdaptive({durable:{identity:{providerId:PROVIDER,entityId,representationId:'living-detail'},commitmentDigest:C.digest({world:s?.world?.planetIdentity||null,body:s?.body?.canonicalId||s?.body?.entityId||null}),historyDigest:C.digest({historyDepth})},taskClass:'RENDER_PREP',semantic:{stage,semanticScale,revision,selection},presentation:{viewport:[Math.max(1,canvas.width||1),Math.max(1,canvas.height||1)]},estimate:{cpuEstimateBytes:4096,gpuEstimateBytes:0,entities:1,operations:32,transferBytes:0},signals:{visible,selected:Boolean(s?.selectedObjectId),scaleRelevancePpm,causalRelevancePpm},preferWorker:false});
  requests++;lastDecision=out.adaptiveDecision||null;lastPacket=runtime.runtimePacket();return out;
 }
 async function render(s){if(disposed)throw new Error('Living V2X01 runtime binding disposed');try{await prepare(s)}catch(error){failures++;throw error}return renderer.render(s)}
 function state(){const base=renderer.state();return {...base,v2x01:{version:VERSION,runtimeVersion:M.VERSION,finalGenerationBound:true,consumer:'WAVE_A_LIVING_RENDERER',requests,failures,lastAdaptiveDecision:lastDecision,runtimePacket:lastPacket,centralAuthorityClaims:{selection:false,semanticScale:false,camera:false,history:false,persistence:false,primaryRenderer:false}}}}
 function dispose(){if(disposed)return;disposed=true;try{runtime.pauseBackground('living-renderer-dispose');runtime.handleMemoryPressure('CRITICAL')}finally{return renderer.dispose()}}
 return Object.freeze({...renderer,render,state,dispose,v2x01Runtime:runtime});
}
O.v1LivingRenderer=Object.freeze({...Base,create,__v2x01RuntimeBound:true,V2X01_BINDING_VERSION:VERSION});
O.v2x01LivingRuntimeBinding=Object.freeze({VERSION,AUTHORITY:'MEASURED_RUNTIME_EVIDENCE',PROVIDER});
})(typeof globalThis!=='undefined'?globalThis:this);
