import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import vm from 'node:vm';

const ROOT=new URL('../../',import.meta.url);
const read=rel=>fs.readFileSync(new URL(rel,ROOT),'utf8');
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const sandbox={console,TextEncoder,TextDecoder,Uint8Array,Float64Array,Math,Number,Object,Array,Set,Map,Promise,JSON};
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
for(const rel of ['src/v1x-13-systemic-audio/context-map.js','src/v1x-13-systemic-audio/worklet-source.js','src/v1x-13-systemic-audio/systemic-audio.js','src/v1x-13-systemic-audio/controls.js'])vm.runInContext(read(rel),sandbox,{filename:rel});
const {systemicAudioContextV1:map,systemicAudioV1:audio,systemicAudioWorkletV1:worklet,systemicAudioControlsV1:controls}=sandbox.OFU;
let cases=0;
assert.equal(map.AUTHORITY,'PRESENTATION_ONLY');assert.equal(audio.AUTHORITY,'PRESENTATION_ONLY');cases++;

const vacuum={regime:'galaxy',domain:'macro',medium:{vacuum:true,supportsSound:false},motion:{travelIntensity:0.8}};
const vacuumBefore=hash(vacuum);const vacuumPlan=map.plan(vacuum,{volume:0.7});
assert.equal(hash(vacuum),vacuumBefore);assert.equal(vacuumPlan.claims.soundInVacuumLiteral,false);assert.equal(vacuumPlan.medium.vacuum,true);
assert(vacuumPlan.layers.some(x=>x.id==='orientation_sonification'));assert(vacuumPlan.layers.every(x=>x.diegetic===false));cases++;

const surface={regime:'human',domain:'surface',medium:{supportsSound:true,densityNormalized:0.9},environment:{windIntensity:0.8,weatherIntensity:0.5},life:{present:true,activity:0.7},civilization:{present:true,activity:0.6}};
const surfaceBefore=hash(surface);const surfacePlan=map.plan(surface,{volume:1});
assert.equal(hash(surface),surfaceBefore);assert(surfacePlan.layers.some(x=>x.id==='atmospheric_motion_cue'));assert(surfacePlan.layers.some(x=>x.id==='biophony_cue'));assert(surfacePlan.layers.some(x=>x.id==='civilization_activity_cue'));
assert(surfacePlan.layers.length<=6);assert(surfacePlan.layers.every(x=>x.authority==='PRESENTATION_ONLY'&&x.literalPhysicalEvidence===false));cases++;

const reduced=map.plan(surface,{reducedSensory:true,volume:1});
assert(!reduced.layers.some(x=>x.id==='civilization_activity_cue'));assert(Math.max(...reduced.layers.map(x=>x.gain))<=0.0350001);cases++;
const muted=map.plan(surface,{muted:true,volume:1});assert.equal(muted.layers.length,0);assert.equal(muted.silenceReason,'user-muted');cases++;
const micro=map.plan({regime:'atomic',domain:'micro',micro:{activity:0.8}},{volume:0.6});assert(micro.layers.some(x=>x.id==='micro_sonification'));assert(micro.layers.every(x=>x.diegetic===false));cases++;
assert(worklet.SOURCE.includes("registerProcessor('ofu-systemic-audio-v1'"));new vm.Script(worklet.SOURCE);cases++;

class Param{constructor(){this.value=0;}setTargetAtTime(v){this.value=v;}}
class FakeNode{constructor(kind){this.kind=kind;this.connected=false;this.disconnected=false;}connect(){this.connected=true;}disconnect(){this.disconnected=true;}}
class FakeGain extends FakeNode{constructor(){super('gain');this.gain=new Param();}}
class FakeOsc extends FakeNode{constructor(){super('osc');this.frequency=new Param();this.type='sine';this.started=false;this.stopped=false;}start(){this.started=true;}stop(){this.stopped=true;}}
class FakePort{constructor(){this.messages=[];}postMessage(v){this.messages.push(v);}}
class FakeWorkletNode extends FakeNode{constructor(){super('worklet');this.port=new FakePort();}}
class FakeContext{
  constructor({workletEnabled=false}={}){this.destination=new FakeNode('destination');this.currentTime=1;this.state='suspended';this.closed=false;this.suspended=false;this.added=[];if(workletEnabled)this.audioWorklet={addModule:async url=>{this.added.push(url);}};}
  createGain(){return new FakeGain();}
  createOscillator(){return new FakeOsc();}
  async resume(){this.state='running';}
  async suspend(){this.state='suspended';this.suspended=true;}
  async close(){this.state='closed';this.closed=true;}
}

const fallbackContext=new FakeContext();
const fallback=audio.createRuntime({contextFactory:()=>fallbackContext});
await fallback.update(surface,{volume:0.8});let snap=await fallback.resume();
assert.equal(snap.backend,'fallback');assert(snap.fallbackVoices<=audio.LIMITS.fallbackVoices);assert(snap.liveNodes<=audio.LIMITS.liveNodes);assert.equal(snap.bufferBytes,0);assert.equal(snap.worldStateMutations,0);cases++;
snap=await fallback.setControls({muted:true,volume:0.8});assert.equal(snap.liveNodes,0);assert.equal(snap.backend,'silence');cases++;
await fallback.update(surface,{volume:0.4,reducedSensory:true});snap=await fallback.resume();assert.equal(snap.backend,'fallback');assert(snap.fallbackVoices<=3);cases++;
snap=await fallback.suspend();assert.equal(snap.liveNodes,0);assert.equal(snap.state,'suspended');snap=await fallback.dispose();assert.equal(snap.contextCount,0);assert.equal(snap.state,'disposed');cases++;

const workletContext=new FakeContext({workletEnabled:true});
const workletRuntime=audio.createRuntime({contextFactory:()=>workletContext,moduleUrlFactory:()=>({url:'blob:ofu-test',revoke(){}}),workletNodeFactory:()=>new FakeWorkletNode()});
await workletRuntime.update(surface,{volume:0.7});snap=await workletRuntime.resume();
assert.equal(snap.backend,'worklet');assert.equal(snap.workletNodes,1);assert.equal(snap.workletLoads,1);assert.equal(snap.liveNodes,2);assert.equal(snap.bufferBytes,0);cases++;
await workletRuntime.setContext(vacuum);snap=workletRuntime.snapshot();assert.equal(snap.liveNodes,2);assert.equal(snap.workletNodes,1);assert.equal(snap.workletLoads,1);cases++;
await workletRuntime.dispose();cases++;

const descriptor={id:audio.PROVIDER_ID,version:'1.0.0',kind:'representation',authority:{class:'PRESENTATION_ONLY',contract:'ofu-px-contracts-1',model:'v1x13.systemic-audio',version:'1.0.0',sources:['test'],assumptions:['test'],limitations:['test'],evidence:[]},fidelity:{regime:'product',validity:'presentation',resolution:'bounded',uncertainty:'non-evidentiary'}};
const binding=audio.createBinding(descriptor);let consumed=0;
const selection={sentinel:'unchanged'};const request={operation:'REPRESENT',payload:{context:surface,controls:{volume:0.5}},budget:{bytes:32768},selection};
const envelope=binding.handle(request,{consume(n,count){consumed+=n+count;}});
assert.equal(envelope.selection,selection);assert.equal(envelope.authority,descriptor.authority);assert.equal(envelope.value.authority,'PRESENTATION_ONLY');assert.equal(consumed,1);cases++;


class FakeElement{
  constructor(tag){this.tag=tag;this.children=[];this.parentNode=null;this.listeners=new Map();this.attributes={};this.checked=false;this.value='';this.type='';this.textContent='';}
  setAttribute(k,v){this.attributes[k]=String(v);}
  appendChild(child){child.parentNode=this;this.children.push(child);return child;}
  removeChild(child){this.children=this.children.filter(x=>x!==child);child.parentNode=null;}
  addEventListener(type,fn){const list=this.listeners.get(type)||[];list.push(fn);this.listeners.set(type,list);}
  removeEventListener(type,fn){this.listeners.set(type,(this.listeners.get(type)||[]).filter(x=>x!==fn));}
  dispatch(type){for(const fn of this.listeners.get(type)||[])fn({type,target:this});}
}
const fakeDoc={createElement:tag=>new FakeElement(tag)};const host=new FakeElement('div');let applied=[];
const mounted=controls.mount(host,{setControls(value){applied.push({...value});}},{document:fakeDoc,initial:{volume:0.55,muted:false,reducedSensory:true}});
assert.equal(host.children.length,1);assert.equal(mounted.element.attributes['data-ofu-systemic-audio-controls'],'v1');assert.equal(mounted.values().volume,0.55);assert.equal(mounted.values().reducedSensory,true);assert(applied.length>=1);mounted.dispose();assert.equal(host.children.length,0);cases++;

const after=hash(surface);assert.equal(after,surfaceBefore);cases++;
console.log(JSON.stringify({schema:'ofu-v1x13-systemic-audio-test-1',status:'PASS',cases,authority:'PRESENTATION_ONLY',vacuumLiteralSound:false,peakFallbackNodes:fallback.snapshot().peakLiveNodes,peakWorkletNodes:workletRuntime.snapshot().peakLiveNodes,maxLiveNodes:audio.LIMITS.liveNodes,maxBufferBytes:audio.LIMITS.bufferBytes,worldStateBefore:surfaceBefore,worldStateAfter:after,worldStateUnchanged:surfaceBefore===after,physicalDeviceEvidence:'NOT_VERIFIED'}));
