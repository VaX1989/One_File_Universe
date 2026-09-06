import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
globalThis.OFU={};
for(const file of ['macro-core.js','shaders.js','webgl2-provider.js'])vm.runInThisContext(fs.readFileSync(path.join(root,'src/v1x-03-macrocosm-rendering',file),'utf8'),{filename:file});
const C=globalThis.OFU.v1x03MacroCore;
const scale=d=>({contract:'ofu-wave-iv-scale-runtime-3',semanticScale:'galaxy',distanceIntentRadii:d,anchors:{galaxy:1000,region:100,stellar_neighborhood:10}});
const camera=(x=0)=>({contract:'v1x-01-external-camera-fixture',position:[x,0,-1000],target:[0,0,2500],up:[0,1,0],fovYRadians:Math.PI/3,near:1,far:10000});
const viewport={width:1000,height:600,devicePixelRatio:1};
const selection=Object.freeze({contract:'ofu-wave-iv-selection-1',canonicalId:'fixture:galaxy:center',canonicalKey:Object.freeze({fixture:'galaxy-center'})});
const scene={contract:'v1x-02-spatial-fixture',dimension:3,frameId:'universe-origin',entities:[
  {id:'galaxy:center',kind:'GALAXY',authority:'PRESENTATION_ONLY',position:[0,0,0],radius:80,selectable:true,selection,selected:true,presentation:{morphologyClass:'SPIRAL',minDetail:0}},
  {id:'galaxy:far',kind:'GALAXY',authority:'PRESENTATION_ONLY',position:[320,40,4200],radius:150,presentation:{morphologyClass:'ELLIPTICAL',minDetail:0}},
  {id:'region:center',kind:'GALACTIC_REGION',authority:'PRESENTATION_ONLY',position:[110,-30,700],radius:35,presentation:{minDetail:.18,morphologyClass:'IRREGULAR'}},
  {id:'neighborhood:center',kind:'STELLAR_NEIGHBORHOOD',authority:'PRESENTATION_ONLY',position:[-60,20,450],radius:12,presentation:{minDetail:.52,morphologyClass:'UNSPECIFIED'}}
]};

const far=C.prepareFrame({scene,camera:camera(),scale:scale(900),viewport,quality:'balanced'});
const mid=C.prepareFrame({scene,camera:camera(),scale:scale(100),viewport,quality:'balanced'});
const near=C.prepareFrame({scene,camera:camera(),scale:scale(12),viewport,quality:'balanced'});
assert.equal(far.contract,'ofu-v1x-03-macro-frame-1');
assert.equal(far.authority,'PRESENTATION_ONLY');
assert.equal(far.camera.source,'EXTERNAL');
assert.equal(far.scale.source,'EXTERNAL');
assert.ok(far.semanticDetail<mid.semanticDetail&&mid.semanticDetail<near.semanticDetail,'semantic detail must vary continuously with shared distance');
const alpha=(f,id)=>f.objects.find(o=>o.id===id)?.alpha??0;
assert.ok(alpha(far,'region:center')<alpha(mid,'region:center'),'region reveal must grow continuously on approach');
assert.ok(alpha(mid,'neighborhood:center')<alpha(near,'neighborhood:center'),'neighborhood reveal must grow continuously on approach');

const pickFrame=C.prepareFrame({scene,camera:camera(),scale:scale(100),viewport,quality:'balanced'});
const center=pickFrame.objects.find(o=>o.id==='galaxy:center').projection;
const picked=C.pick(pickFrame,center.screenX,center.screenY);
assert.equal(picked.entityId,'galaxy:center');
assert.deepEqual(picked.selection,selection,'direct picking must return upstream canonical selection payload unchanged');
assert.equal(picked.selectionContract,'ofu-wave-iv-selection-1');
assert.equal(picked.canonicalPromotion,false);

const p0=C.prepareFrame({scene,camera:camera(-80),scale:scale(100),viewport,quality:'balanced'});
const p1=C.prepareFrame({scene,camera:camera(80),scale:scale(100),viewport,quality:'balanced'});
const motion=id=>Math.abs(p1.objects.find(o=>o.id===id).projection.screenX-p0.objects.find(o=>o.id===id).projection.screenX);
assert.ok(motion('galaxy:center')>motion('galaxy:far'),'nearer object must exhibit stronger parallax under external camera translation');

const witness=C.continuityWitness({scene,camera:camera(),scale:scale(900),viewport,quality:'balanced'},{scene,camera:camera(35),scale:scale(12),viewport,quality:'balanced'});
assert.equal(witness.reversible,true,'reverse travel must reconstruct the deterministic start frame');
assert.equal(witness.startHash,witness.returnHash);

const many={contract:'v1x-02-spatial-fixture',dimension:3,frameId:'dense-field',entities:Array.from({length:5000},(_,i)=>({id:'g:'+String(i).padStart(4,'0'),kind:'GALAXY',authority:'PRESENTATION_ONLY',position:[((i%50)-25)*12,(Math.floor(i/50)%20-10)*10,800+Math.floor(i/100)*15],radius:8,presentation:{minDetail:0,priority:i===4999?100:0}}))};
const bounded=C.prepareFrame({scene:many,camera:camera(),scale:scale(500),viewport,quality:'balanced'});
assert.ok(bounded.resources.visibleCount<=C.QUALITY.balanced.maxInstances);
assert.equal(bounded.resources.maxInstances,2048);
assert.ok(bounded.resources.budgetRejected>0,'dense field must prove deterministic budget culling');
assert.equal(bounded.resources.drawCallsPlanned,bounded.resources.visibleCount?1:0);

assert.throws(()=>C.prepareFrame({scene:{dimension:3,entities:[{id:'bad',kind:'GALAXY',authority:'CANONICAL_GEOMETRY',position:[0,0,0],radius:1}]},camera:camera(),scale:scale(100),viewport}),/ungoverned authority/);
assert.throws(()=>C.prepareFrame({scene:{dimension:3,entities:[{id:'badpick',kind:'GALAXY',authority:'PRESENTATION_ONLY',position:[0,0,0],radius:1,selectable:true}]},camera:camera(),scale:scale(100),viewport}),/upstream selection payload/);

console.log(JSON.stringify({status:'PASS',version:C.VERSION,hashes:{far:far.hash,mid:mid.hash,near:near.hash},semanticDetail:{far:far.semanticDetail,mid:mid.semanticDetail,near:near.semanticDetail},parallaxPx:{near:motion('galaxy:center'),far:motion('galaxy:far')},pick:{entityId:picked.entityId,hitMode:picked.hitMode,frameHash:picked.frameHash},reverse:witness,resourceBounds:bounded.resources},null,2));
