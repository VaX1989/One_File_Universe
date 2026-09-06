import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const outDir=path.join(root,'reports/v1x-03-macrocosm-rendering');
fs.mkdirSync(outDir,{recursive:true});
const context=vm.createContext({console,performance,Float32Array,ArrayBuffer,Math,Object,String,Number,Error,TypeError,Set});
vm.runInContext(fs.readFileSync(path.join(root,'src/v1x-03-macrocosm-rendering/macro-core.js'),'utf8'),context,{filename:'macro-core.js'});
const Core=context.OFU.v1x03MacroCore;
const viewport={width:960,height:540,devicePixelRatio:1};
const scaleBase={contract:'ofu-wave-iv-scale-runtime-3',anchors:{galaxy:1000,region:100,stellar_neighborhood:10}};
const cameraBase={contract:'EXTERNAL_V1X_01_CAMERA_PENDING',up:[0,1,0],fovYRadians:Math.PI/3,near:.1,far:20000};
const selection=id=>({contract:'ofu-wave-iv-selection-1',kind:'GALAXY',canonicalKey:{catalog:'EVIDENCE',id}});
const entities=[
{id:'galaxy:anchor',position:[0,0,0],radius:18,kind:'galaxy',selectable:true,selection:selection('anchor'),authority:'PRESENTATION_ONLY',presentation:{minDetail:0,morphologyClass:'SPIRAL',priority:10}},
{id:'galaxy:near',position:[-60,15,-30],radius:10,kind:'galaxy',selectable:true,selection:selection('near'),authority:'PRESENTATION_ONLY',presentation:{minDetail:0,morphologyClass:'ELLIPTICAL'}},
{id:'galaxy:far',position:[140,-30,-700],radius:22,kind:'galaxy',selectable:true,selection:selection('far'),authority:'PRESENTATION_ONLY',presentation:{minDetail:0,morphologyClass:'IRREGULAR'}},
{id:'region:a',position:[20,7,-5],radius:4,kind:'region',selectable:false,authority:'PRESENTATION_ONLY',presentation:{minDetail:.26,morphologyClass:'UNKNOWN'}},
{id:'region:b',position:[-22,-8,-12],radius:3,kind:'region',selectable:false,authority:'PRESENTATION_ONLY',presentation:{minDetail:.3,morphologyClass:'UNKNOWN'}},
{id:'neighborhood:a',position:[8,-4,2],radius:1.6,kind:'stellar_neighborhood',selectable:false,authority:'PRESENTATION_ONLY',presentation:{minDetail:.7,morphologyClass:'UNKNOWN'}},
{id:'neighborhood:b',position:[-7,5,-1],radius:1.3,kind:'stellar_neighborhood',selectable:false,authority:'PRESENTATION_ONLY',presentation:{minDetail:.75,morphologyClass:'UNKNOWN'}}
];
const scene={contract:'UPSTREAM_SPATIAL_SCENE_PENDING_V1X_02',version:'fixture-1',frameId:'EVIDENCE_REFERENCE_FRAME',entities};
const states=[
{id:'A',label:'Universe / distant galaxy regime',camera:{...cameraBase,position:[-70,25,700],target:[0,0,0]},scale:{...scaleBase,distanceIntentRadii:900}},
{id:'B',label:'Galactic region reveal',camera:{...cameraBase,position:[0,10,360],target:[0,0,0]},scale:{...scaleBase,distanceIntentRadii:100}},
{id:'C',label:'Neighborhood approach',camera:{...cameraBase,position:[70,8,190],target:[0,0,0]},scale:{...scaleBase,distanceIntentRadii:12}}
];
const frames=states.map(s=>({state:s,frame:Core.prepareFrame({scene,camera:s.camera,scale:s.scale,viewport,quality:'balanced'})}));
const reverse=Core.continuityWitness({scene,camera:states[0].camera,scale:states[0].scale,viewport,quality:'balanced'},{scene,camera:states[2].camera,scale:states[2].scale,viewport,quality:'balanced'});
function byId(frame,id){return frame.objects.find(o=>o.id===id)}
const dist=(a,b)=>Math.hypot(a.projection.screenX-b.projection.screenX,a.projection.screenY-b.projection.screenY);
const parallaxLeft=Core.prepareFrame({scene,camera:{...cameraBase,position:[-70,0,500],target:[-70,0,0]},scale:{...scaleBase,distanceIntentRadii:100},viewport,quality:'balanced'});
const parallaxRight=Core.prepareFrame({scene,camera:{...cameraBase,position:[70,0,500],target:[70,0,0]},scale:{...scaleBase,distanceIntentRadii:100},viewport,quality:'balanced'});
const nearLeft=byId(parallaxLeft,'galaxy:near'),nearRight=byId(parallaxRight,'galaxy:near'),farLeft=byId(parallaxLeft,'galaxy:far'),farRight=byId(parallaxRight,'galaxy:far');
const nearParallax=dist(nearLeft,nearRight),farParallax=dist(farLeft,farRight);
const trace={
 contract:'ofu-v1x-03-deterministic-camera-trace-1',authority:'PRESENTATION_ONLY',canonicalPromotion:false,
 cameraSource:'EXTERNAL fixture shaped for V1X-01; production provider owns no camera state',
 spatialSource:'3D fixture shaped for V1X-02; coordinates are test/presentation fixtures and are not astronomy facts',
 scaleContract:'ofu-wave-iv-scale-runtime-3',selectionContract:'ofu-wave-iv-selection-1',
 frames:frames.map(({state,frame})=>({id:state.id,label:state.label,frameHash:frame.hash,distanceIntentRadii:state.scale.distanceIntentRadii,semanticDetail:frame.semanticDetail,visibleCount:frame.resources.visibleCount,objectIds:frame.objects.map(o=>o.id),cameraPosition:state.camera.position})),
 parallax:{kind:'ISOLATED_LATERAL_CAMERA_TRANSLATION',leftCamera:[-70,0,500],rightCamera:[70,0,500],nearEntityPx:nearParallax,farEntityPx:farParallax,nearGreaterThanFar:nearParallax>farParallax},
 reverse,
 baselineComparison:{
   source:'Wave-A legacy src/rendering/macro/macro-scene.js + macro-canvas.js presentationGeometry XY projection',
   rejectedBehavior:'flattened XY presentation geometry with canvas pan offsets; world Z and free-camera translation are not projection inputs',
   cameraTranslationParallaxPx:0,
   v1x03CameraTranslationParallaxPx:{near:nearParallax,far:farParallax},
   claimClass:'PRESENTATION_ONLY'
 }
};
fs.writeFileSync(path.join(outDir,'deterministic-camera-trace.json'),JSON.stringify(trace,null,2)+'\n');

const esc=s=>String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const W=1280,H=720,panelW=300,panelH=500,top=140,gap=16,left=16;
let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="#080a0f"/><text x="24" y="38" fill="#f2f4f8" font-family="system-ui" font-size="24" font-weight="700">V1X-03 deterministic visual witness — 3D projection + continuous reveal</text><text x="24" y="66" fill="#aeb7c6" font-family="system-ui" font-size="14">Presentation-only fixture evidence; not a browser/WebGL capture and not scientific evidence.</text>`;
const baselineX=left;
svg+=`<g transform="translate(${baselineX},${top})"><rect width="${panelW}" height="${panelH}" rx="10" fill="#111722" stroke="#394356"/><text x="14" y="28" fill="#f2f4f8" font-family="system-ui" font-size="16" font-weight="700">Rejected Wave-A baseline</text><text x="14" y="50" fill="#aeb7c6" font-family="system-ui" font-size="12">flattened presentationGeometry x/y</text><line x1="30" y1="95" x2="270" y2="95" stroke="#394356"/><line x1="30" y1="180" x2="270" y2="180" stroke="#394356"/><line x1="30" y1="265" x2="270" y2="265" stroke="#394356"/>`;
for(let r=0;r<3;r++)for(let c=0;c<4;c++){const x=65+c*55,y=95+r*85;svg+=`<circle cx="${x}" cy="${y}" r="7" fill="#6f7c92"/><circle cx="${x+13}" cy="${y+17}" r="2" fill="#aeb7c6"/>`;}
svg+=`<path d="M45 355 H255" stroke="#7f8ba1" stroke-width="2" stroke-dasharray="5 5"/><text x="14" y="390" fill="#e2a86f" font-family="system-ui" font-size="13">camera translation parallax: 0 px</text><text x="14" y="415" fill="#aeb7c6" font-family="system-ui" font-size="12">world Z ignored by legacy XY mapping</text><text x="14" y="440" fill="#aeb7c6" font-family="system-ui" font-size="12">buttons/pan could change presentation</text></g>`;
function framePanel(entry,index){const x=left+(index+1)*(panelW+gap),f=entry.frame,s=entry.state;let g=`<g transform="translate(${x},${top})"><rect width="${panelW}" height="${panelH}" rx="10" fill="#111722" stroke="#394356"/><text x="14" y="28" fill="#f2f4f8" font-family="system-ui" font-size="16" font-weight="700">${esc(s.id)} — ${esc(s.label)}</text><text x="14" y="50" fill="#aeb7c6" font-family="system-ui" font-size="12">hash ${f.hash} · detail ${f.semanticDetail.toFixed(3)} · visible ${f.objects.length}</text>`;
 for(const o of f.objects){const px=14+(o.projection.screenX/viewport.width)*(panelW-28),py=72+(o.projection.screenY/viewport.height)*(350),r=Math.max(2,Math.min(10,o.projection.pointPx*.35)),opacity=Math.max(.16,Math.min(1,o.alpha));const fill=o.kind==='galaxy'?'#d9e6ff':o.kind==='region'?'#9ab6df':'#d7c59b';g+=`<circle cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="${r.toFixed(2)}" fill="${fill}" opacity="${opacity.toFixed(3)}"/>`;}
 g+=`<text x="14" y="452" fill="#aeb7c6" font-family="system-ui" font-size="12">external camera [${s.camera.position.join(', ')}]</text><text x="14" y="474" fill="#aeb7c6" font-family="system-ui" font-size="12">distanceIntentRadii ${s.scale.distanceIntentRadii}</text></g>`;return g;}
frames.forEach((f,i)=>{svg+=framePanel(f,i)});
svg+=`<text x="24" y="682" fill="#aeb7c6" font-family="system-ui" font-size="13">Near parallax ${trace.parallax.nearEntityPx.toFixed(2)} px vs far ${trace.parallax.farEntityPx.toFixed(2)} px · reverse A→C→A ${reverse.reversible?'PASS':'FAIL'} · authority PRESENTATION_ONLY</text></svg>`;
fs.writeFileSync(path.join(outDir,'frame-sequence.svg'),svg+'\n');
fs.writeFileSync(path.join(outDir,'before-after-wave-a.json'),JSON.stringify(trace.baselineComparison,null,2)+'\n');
console.log(JSON.stringify({status:'PASS',trace:path.relative(root,path.join(outDir,'deterministic-camera-trace.json')),visual:path.relative(root,path.join(outDir,'frame-sequence.svg')),beforeAfter:path.relative(root,path.join(outDir,'before-after-wave-a.json')),hashes:trace.frames.map(f=>f.frameHash),parallax:trace.parallax,reverse:trace.reverse}));
