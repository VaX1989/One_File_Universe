import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('./systemic-audio-research.js',import.meta.url),'utf8');
vm.runInThisContext(source,{filename:'systemic-audio-research.js'});
const api=globalThis.OFU_R6J_RESEARCH;
let cases=0;
const test=(name,fn)=>Promise.resolve().then(fn).then(()=>{cases++;process.stdout.write(`PASS ${name}\n`);});

const base={
  contextId:'surface:demo',regime:'local_surface',
  medium:{kind:'ATMOSPHERE',supportsAcousticPropagation:true,vacuum:false,densityNormalized:0.65,authority:'MODEL_DERIVED'},
  environment:{windIntensity:0.7,weatherIntensity:0.35,authority:'MODEL_DERIVED'},
  presentation:{travelIntensity:0.4},
  micro:{active:true,densityNormalized:0.5,energyNormalized:0.4,variationNormalized:0.6,authority:'PRESENTATION_ONLY'}
};

await test('deterministic plan',()=>{
  const a=api.deriveAudioPlan(base,{},{}),b=api.deriveAudioPlan(base,{},{});
  assert.deepEqual(a,b);
  assert.equal(a.render.voiceCount,4);
});

await test('vacuum suppresses environmental propagation cues',()=>{
  const plan=api.deriveAudioPlan({...base,medium:{...base.medium,supportsAcousticPropagation:false,vacuum:true}}, {}, {});
  assert.equal(plan.layers.some(item=>item.category==='environmental'),false);
  assert.equal(plan.layers.some(item=>item.id==='presentation.travel-orientation'),true);
  assert.equal(plan.claims.literalSoundInVacuum,false);
});

await test('missing medium fails closed for environmental audio',()=>{
  const plan=api.deriveAudioPlan({...base,medium:{}},{},{});
  assert.equal(plan.layers.some(item=>item.category==='environmental'),false);
});

await test('micro is explicit sonification not literal sound',()=>{
  const plan=api.deriveAudioPlan(base,{},{}),micro=plan.layers.find(item=>item.id==='sonification.micro-model');
  assert(micro);
  assert.equal(micro.diegetic,false);
  assert.match(micro.claim,/SONIFICATION_NOT_LITERAL_SOUND/);
  assert.equal(plan.claims.microIsLiteralAudibleAtomicSound,false);
});

await test('category mute is independent and preserves non-audio alternative',()=>{
  const plan=api.deriveAudioPlan(base,{categories:{environmental:{muted:true}}},{});
  const environmental=plan.layers.filter(item=>item.category==='environmental');
  assert(environmental.length>0);
  assert(environmental.every(item=>item.effectiveGain===0&&item.nonAudioAlternative.length>0));
  assert(plan.layers.every(item=>item.nonAudioAlternative.length>0));
});

await test('device adaptation changes render budget not semantic truth',()=>{
  const full=api.deriveAudioPlan(base,{}, {maxVoices:6,updateHz:60});
  const low=api.deriveAudioPlan(base,{}, {maxVoices:2,updateHz:15});
  assert.deepEqual(full.semanticTruth,low.semanticTruth);
  assert.equal(full.render.voiceCount,4);
  assert.equal(low.render.voiceCount,2);
  assert.equal(low.render.degraded,true);
  assert.equal(low.claims.adaptiveQualityChangesWorldTruth,false);
});

await test('input objects are not mutated',()=>{
  const original=JSON.stringify(base);
  api.deriveAudioPlan(base,{},{maxVoices:2});
  assert.equal(JSON.stringify(base),original);
});

await test('silence is a valid state',()=>{
  const plan=api.deriveAudioPlan({contextId:'quiet',regime:'unknown'},{},{});
  assert.equal(plan.render.voiceCount,0);
  assert.equal(plan.silenceReason,'no-supported-context-or-all-categories-muted');
});

class FakeParam{constructor(){this.value=0;}setTargetAtTime(value){this.value=value;}}
class FakeNode{constructor(){this.connections=0;}connect(){this.connections++;}disconnect(){this.connections=0;}}
class FakeGain extends FakeNode{constructor(){super();this.gain=new FakeParam();}}
class FakeOscillator extends FakeNode{constructor(){super();this.frequency=new FakeParam();this.type='sine';this.started=0;this.stopped=0;}start(){this.started++;}stop(){this.stopped++;}}
class FakeContext{
  constructor(){this.currentTime=0;this.destination=new FakeNode();this.resumeCalls=0;this.suspendCalls=0;this.closeCalls=0;}
  createGain(){return new FakeGain();}
  createOscillator(){return new FakeOscillator();}
  async resume(){this.resumeCalls++;}
  async suspend(){this.suspendCalls++;}
  async close(){this.closeCalls++;}
}

await test('runtime is lazy and gesture aware',async()=>{
  let created=0;const runtime=api.createRuntime({contextFactory:()=>{created++;return new FakeContext();}});
  runtime.apply(base,{},{});
  assert.equal(created,0);
  const blocked=await runtime.resume();
  assert.equal(created,0);
  assert.equal(blocked.resumeBlocked,'user-gesture-required');
  const running=await runtime.resume({userGesture:true});
  assert.equal(created,1);
  assert.equal(running.contextCount,1);
  assert.equal(running.voiceCount,4);
  assert(running.voiceCount<=api.MAX_VOICES);
});

await test('runtime suspend resume reuses one context and bounds voices',async()=>{
  let created=0;const runtime=api.createRuntime({contextFactory:()=>{created++;return new FakeContext();}});
  runtime.apply(base,{}, {maxVoices:6});
  await runtime.resume({userGesture:true});
  const suspended=await runtime.suspend();
  assert.equal(suspended.voiceCount,0);
  assert.equal(suspended.state,'suspended');
  const resumed=await runtime.resume({userGesture:true});
  assert.equal(created,1);
  assert(resumed.voiceCount<=api.MAX_VOICES);
  const disposed=await runtime.dispose();
  assert.equal(disposed.state,'disposed');
  assert.equal(disposed.contextCount,0);
  assert.equal(disposed.worldStateMutations,0);
});

await test('unsupported audio remains silent',async()=>{
  const runtime=api.createRuntime({contextFactory:()=>{throw new Error('unsupported');}});
  runtime.apply(base,{},{});
  const snapshot=await runtime.resume({userGesture:true});
  assert.equal(snapshot.state,'unsupported');
  assert.equal(snapshot.voiceCount,0);
});

await test('prototype requires no network assets or module imports',()=>{
  assert.equal(/\bfetch\s*\(|XMLHttpRequest|WebSocket|\bimport\s/.test(source),false);
  const plan=api.deriveAudioPlan(base,{},{});
  assert.equal(plan.render.networkAssetsRequired,0);
  assert.equal(plan.render.audioBufferBytesRequired,0);
});

await test('environment cues never claim literal physical evidence',()=>{
  const plan=api.deriveAudioPlan(base,{},{});
  const env=plan.layers.filter(item=>item.category==='environmental');
  assert(env.length>0);
  assert(env.every(item=>item.literalPhysicalEvidence===false&&item.authority==='PRESENTATION_ONLY'));
});

console.log(JSON.stringify({status:'PASS',cases,version:api.VERSION,maxVoices:api.MAX_VOICES},null,2));
