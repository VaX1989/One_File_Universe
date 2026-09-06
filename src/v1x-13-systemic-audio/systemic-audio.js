(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const planner=O.systemicAudioContextV1;
const worklet=O.systemicAudioWorkletV1;
if(!planner||!worklet)throw new Error('V1X-13 audio context/worklet modules required');
const VERSION='ofu-v1x13-systemic-audio-1';
const AUTHORITY='PRESENTATION_ONLY';
const PROVIDER_ID='v1x13.representation.systemic-audio';
const LIMITS=Object.freeze({
  audioContexts:1,
  workletNodes:1,
  fallbackVoices:6,
  liveNodes:13,
  bufferBytes:0,
  layers:6
});
const encoder=new (root.TextEncoder||TextEncoder)();
function invariant(ok,message){if(!ok)throw new Error('V1X13 audio: '+message);}
function setParam(param,value,time){
  if(!param)return;
  if(typeof param.setTargetAtTime==='function')param.setTargetAtTime(value,time||0,0.02);
  else param.value=value;
}
function safeCall(target,method){try{return target&&typeof target[method]==='function'?target[method]():undefined;}catch{return undefined;}}
function runtime(options={}){
  invariant(options&&typeof options==='object','options');
  const createContext=typeof options.contextFactory==='function'?options.contextFactory:()=>{
    const C=root.AudioContext||root.webkitAudioContext;
    if(!C)throw new Error('AudioContext unavailable');
    return new C({latencyHint:'interactive'});
  };
  const createWorkletNode=typeof options.workletNodeFactory==='function'?options.workletNodeFactory:(ctx,name)=>{
    if(typeof root.AudioWorkletNode!=='function')throw new Error('AudioWorkletNode unavailable');
    return new root.AudioWorkletNode(ctx,name,{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[2]});
  };
  const makeUrl=typeof options.moduleUrlFactory==='function'?options.moduleUrlFactory:source=>{
    invariant(typeof root.Blob==='function'&&root.URL&&typeof root.URL.createObjectURL==='function','Blob URL unavailable');
    const url=root.URL.createObjectURL(new root.Blob([source],{type:'text/javascript'}));
    return {url,revoke:()=>{try{root.URL.revokeObjectURL(url);}catch{}}};
  };
  let ctx=null,master=null,workletNode=null,voices=[],contextValue={},controlsValue={},plan=planner.plan(contextValue,controlsValue),state='idle',backend='silence';
  let workletReady=false,workletFailed=false,workletLoads=0,peakLiveNodes=0,contextCreations=0;
  function liveNodes(){return (master?1:0)+(workletNode?1:0)+voices.length*2;}
  function rememberPeak(){peakLiveNodes=Math.max(peakLiveNodes,liveNodes());invariant(liveNodes()<=LIMITS.liveNodes,'live node bound exceeded');}
  function disconnect(node){try{node&&typeof node.disconnect==='function'&&node.disconnect();}catch{}}
  function teardownRenderNodes(){
    if(workletNode){try{workletNode.port&&workletNode.port.postMessage({type:'plan',layers:[]});}catch{}disconnect(workletNode);workletNode=null;}
    for(const voice of voices){safeCall(voice.osc,'stop');disconnect(voice.osc);disconnect(voice.gain);}
    voices=[];disconnect(master);master=null;backend='silence';
  }
  function masterGain(){return plan.controls.enabled&&!plan.controls.muted?plan.controls.volume:0;}
  function connectMaster(){
    invariant(ctx&&typeof ctx.createGain==='function','GainNode unavailable');
    master=ctx.createGain();setParam(master.gain,masterGain(),ctx.currentTime||0);master.connect(ctx.destination);rememberPeak();
  }
  async function ensureWorklet(){
    if(workletReady)return true;
    if(workletFailed||!ctx?.audioWorklet||typeof ctx.audioWorklet.addModule!=='function')return false;
    let moduleUrl;
    try{
      moduleUrl=makeUrl(worklet.SOURCE);
      await ctx.audioWorklet.addModule(moduleUrl.url);
      workletLoads++;workletReady=true;return true;
    }catch{workletFailed=true;return false;}
    finally{try{moduleUrl&&moduleUrl.revoke&&moduleUrl.revoke();}catch{}}
  }
  function postPlan(){if(workletNode?.port)workletNode.port.postMessage({type:'plan',layers:plan.layers.map(({type,frequency,gain,activity})=>({type,frequency,gain,activity}))});}
  async function build(){
    teardownRenderNodes();
    if(!ctx||plan.silenceReason||plan.layers.length===0)return;
    connectMaster();
    if(await ensureWorklet()){
      try{
        workletNode=createWorkletNode(ctx,worklet.PROCESSOR_NAME);
        workletNode.connect(master);postPlan();backend='worklet';rememberPeak();return;
      }catch{workletFailed=true;disconnect(workletNode);workletNode=null;}
    }
    if(typeof ctx.createOscillator!=='function'){
      teardownRenderNodes();backend='silence';return;
    }
    const selected=plan.layers.slice(0,LIMITS.fallbackVoices);
    for(const layer of selected){
      const osc=ctx.createOscillator(),gain=ctx.createGain();
      osc.type=layer.type==='pulse'?'square':layer.type==='noise'?'triangle':'sine';
      setParam(osc.frequency,layer.frequency,ctx.currentTime||0);setParam(gain.gain,layer.gain,ctx.currentTime||0);
      osc.connect(gain);gain.connect(master);osc.start();voices.push({osc,gain});rememberPeak();
    }
    backend=voices.length?'fallback':'silence';
  }
  async function refresh(){
    if(state!=='running')return snapshot();
    if(plan.silenceReason||plan.layers.length===0){teardownRenderNodes();return snapshot();}
    if(backend==='worklet'&&workletNode&&master){setParam(master.gain,masterGain(),ctx.currentTime||0);postPlan();return snapshot();}
    await build();return snapshot();
  }
  function normalizeContext(value){
    const v=value&&typeof value==='object'?value:{};
    const sub=name=>v[name]&&typeof v[name]==='object'?v[name]:{};
    return {
      regime:typeof v.regime==='string'?v.regime:'unknown',domain:typeof v.domain==='string'?v.domain:'general',
      medium:{supportsSound:sub('medium').supportsSound===true,audible:sub('medium').audible===true,vacuum:sub('medium').vacuum===true,densityNormalized:Number(sub('medium').densityNormalized)},
      motion:{travelIntensity:Number(sub('motion').travelIntensity)},
      environment:{windIntensity:Number(sub('environment').windIntensity),weatherIntensity:Number(sub('environment').weatherIntensity)},
      life:{present:sub('life').present===true,activity:Number(sub('life').activity)},
      civilization:{present:sub('civilization').present===true,activity:Number(sub('civilization').activity)},
      micro:{activity:Number(sub('micro').activity)}
    };
  }
  function setContext(value){contextValue=normalizeContext(value);plan=planner.plan(contextValue,controlsValue);return refresh();}
  function setControls(value){controlsValue=planner.controls(value);plan=planner.plan(contextValue,controlsValue);return refresh();}
  function update(nextContext,nextControls){contextValue=normalizeContext(nextContext);controlsValue=planner.controls(nextControls);plan=planner.plan(contextValue,controlsValue);return refresh();}
  async function resume(){
    invariant(state!=='disposed','runtime disposed');
    if(plan.silenceReason||plan.layers.length===0){state='silent';backend='silence';return snapshot();}
    if(!ctx){
      try{ctx=createContext();contextCreations++;invariant(contextCreations<=LIMITS.audioContexts,'AudioContext bound exceeded');}
      catch{state='unsupported';backend='silence';return snapshot();}
    }
    try{if(typeof ctx.resume==='function')await ctx.resume();}catch{state='unsupported';backend='silence';return snapshot();}
    state='running';await build();return snapshot();
  }
  async function suspend(){
    if(state==='disposed')return snapshot();
    teardownRenderNodes();
    try{if(ctx&&typeof ctx.suspend==='function')await ctx.suspend();}catch{}
    state=ctx?'suspended':'idle';return snapshot();
  }
  async function dispose(){
    if(state==='disposed')return snapshot();
    teardownRenderNodes();
    try{if(ctx&&typeof ctx.close==='function')await ctx.close();}catch{}
    ctx=null;state='disposed';return snapshot();
  }
  function snapshot(){
    return Object.freeze({
      schema:'ofu-v1x13-audio-runtime-snapshot-1',version:VERSION,authority:AUTHORITY,optional:true,
      state,backend,contextCount:ctx?1:0,contextCreations,liveNodes:liveNodes(),peakLiveNodes,
      workletNodes:workletNode?1:0,workletLoads,fallbackVoices:voices.length,bufferBytes:0,
      limits:LIMITS,worldStateMutations:0,navigationDependency:false,accessibilityDependency:false,
      plan:Object.freeze({regime:plan.regime,domain:plan.domain,layers:plan.layers.length,silenceReason:plan.silenceReason,reducedSensory:plan.controls.reducedSensory})
    });
  }
  return Object.freeze({setContext,setControls,update,resume,suspend,dispose,snapshot});
}
function createBinding(descriptor){
  invariant(descriptor&&descriptor.id===PROVIDER_ID,'provider descriptor mismatch');
  invariant(descriptor.authority?.class===AUTHORITY,'provider authority mismatch');
  invariant(descriptor.kind==='representation','provider kind mismatch');
  return Object.freeze({
    handle(request,meter){
      invariant(request&&request.operation==='REPRESENT','REPRESENT request required');
      const payload=request.payload&&typeof request.payload==='object'?request.payload:{};
      const value=planner.plan(payload.context||{},payload.controls||{});
      const bytes=encoder.encode(JSON.stringify(value)).length;
      invariant(bytes<=request.budget.bytes,'request byte budget too small');
      if(meter&&typeof meter.consume==='function')meter.consume(1,0);
      return {
        contract:'ofu-px-contracts-1',provider:descriptor.id,version:descriptor.version,authority:descriptor.authority,
        selection:request.selection,fidelity:descriptor.fidelity,
        usage:{entities:0,bytes,operations:1,queue:0},value
      };
    }
  });
}
O.systemicAudioV1=Object.freeze({VERSION,AUTHORITY,PROVIDER_ID,LIMITS,createRuntime:runtime,createBinding});
})(globalThis);
