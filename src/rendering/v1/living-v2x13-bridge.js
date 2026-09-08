(function(root){
'use strict';
const O=root.OFU,Base=O?.v1LivingRenderer,R=O?.renderWebGL2Resources;
if(!O||!Base||!R||typeof Base.create!=='function'||typeof R.createFrameConsumer!=='function')throw new Error('Living V2X13 bridge dependencies required');
const VERSION='ofu-v2-central-living-v2x13-bridge-1';
const IDENTITY=Object.freeze([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
const COLORS=Object.freeze({MACRO:[.52,.72,.86],SYSTEM:[.95,.72,.38],PLANET:[.24,.62,.78],TERRAIN:[.48,.39,.27],WATER:[.16,.54,.73],VEGETATION:[.25,.63,.36],ORGANISM:[.72,.49,.32],STRUCTURE:[.63,.67,.72],MATTER:[.68,.49,.86]});
const SURFACE=new Set(['GLOBAL_SURFACE','REGIONAL_SURFACE','LOCAL_SURFACE','HUMAN']);
const MATTER=new Set(['CELL','MOLECULAR','ATOMIC']);
function hash(text){let h=2166136261>>>0;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0}return h>>>0}
function clean(value,fallback='entity'){const s=String(value??fallback).replace(/[^A-Za-z0-9:._/-]+/g,'-').slice(0,120);return s||fallback}
function identityOf(item,index){return clean(item?.canonicalId??item?.entityId??item?.planetIdentity??item?.settlementId??item?.lineageId??item?.id,'entity:'+index)}
function domainFor(stage,item){
 const kind=String(item?.kind??item?.type??'').toUpperCase(),role=String(item?.population?.role??item?.role??'').toUpperCase();
 if(MATTER.has(stage))return 'MATTER';
 if(stage==='SYSTEM'||(stage==='ORBIT'&&!item?.planetIdentity&&kind==='STAR'))return 'SYSTEM';
 if(stage==='ORBIT'||stage==='APPROACH')return 'PLANET';
 if(SURFACE.has(stage)){
  if(kind.includes('SETTLEMENT')||kind.includes('RUIN')||kind.includes('STRUCTURE'))return 'STRUCTURE';
  if(kind.includes('WATER')||kind.includes('ICE')||kind.includes('OCEAN'))return 'WATER';
  if(role.includes('PRODUCER')||role.includes('PHOTO')||kind.includes('VEGETATION')||kind.includes('PLANT'))return 'VEGETATION';
  if(item?.population||kind.includes('ORGANISM')||kind.includes('ANIMAL'))return 'ORGANISM';
  return 'TERRAIN';
 }
 return 'MACRO';
}
function sourceItems(s){
 const stage=String(s?.stage||'UNIVERSE').toUpperCase();let rows=[];
 if(MATTER.has(stage)&&s?.micro?.current)rows=[{id:s.micro.sourceEntityId||'matter:source',kind:'MATTER'}];
 else if(SURFACE.has(stage)&&Array.isArray(s?.local?.objects)&&s.local.objects.length)rows=s.local.objects;
 else if(Array.isArray(s?.rows)&&s.rows.length)rows=s.rows;
 else if(s?.world)rows=[{planetIdentity:s.world.planetIdentity,kind:'PLANET'}];
 else if(s?.body)rows=[s.body];
 else if(s?.node)rows=[s.node];
 if(!rows.length)rows=[{id:'living:'+stage.toLowerCase(),kind:stage}];
 return rows.slice(0,24);
}
function marker(item,index,total,stage,selected){
 const id=identityOf(item,index),h=hash(id),cols=Math.max(1,Math.ceil(Math.sqrt(total))),row=Math.floor(index/cols),col=index%cols;
 const jitterX=((h&255)/255-.5)*.055,jitterY=(((h>>>8)&255)/255-.5)*.055;
 const x=total===1?0:((col+.5)/cols*1.56-.78)+jitterX,y=total===1?0:(.68-(row+.5)/Math.ceil(total/cols)*1.36)+jitterY;
 const chosen=Boolean(selected&&id===selected),size=chosen ? .045 : .026+(h%5)*.002;
 const positions=[x-size,y-size,0,x+size,y-size,0,x,y+size,0],normals=[0,0,1,0,0,1,0,0,1],domain=domainFor(stage,item),base=COLORS[domain]||COLORS.MACRO;
 return {id:'living:'+clean(id).toLowerCase(),domain,primitive:'TRIANGLES',lit:true,positions,normals,material:{baseColor:base,roughness:.55,metallic:.04,opacity:chosen ? .9 : .52},lod:{level:1,transition:0}};
}
function frameFor(s,baseState,width,height){
 const stage=String(s?.stage||'UNIVERSE').toUpperCase(),items=sourceItems(s),selected=clean(s?.selectedObjectId??s?.world?.planetIdentity??s?.body?.canonicalId??'', ''),draws=items.map((item,i)=>marker(item,i,items.length,stage,selected));
 const domains=new Set(draws.map(d=>d.domain)),effects=domains.has('PLANET')||domains.has('TERRAIN')||domains.has('WATER')||domains.has('VEGETATION')||domains.has('ORGANISM')||domains.has('STRUCTURE');
 const frame={frameId:'living:v2x13:'+Math.max(0,Number(s?.revision)||0),sceneId:'living:scene:'+stage.toLowerCase(),selectionId:selected||null,semanticSignature:'living:'+clean(s?.semanticScale??stage).toLowerCase()+':'+clean(baseState?.sceneSourceId??stage).toLowerCase(),viewport:{width,height},camera:{viewProjection:IDENTITY,position:[0,0,1]},clearColor:[0,0,0,0],aaMode:'NONE',fog:false,lighting:{direction:[.28,-.82,.49],color:[1,.94,.82],intensity:1.05,ambient:.22},draws};
 if(effects)frame.shadow={enabled:true,id:'living:shadow:'+stage.toLowerCase(),viewProjection:IDENTITY,atlasSize:256,bias:{constant:.0008}};
 if(domains.has('PLANET')||domains.has('TERRAIN')||domains.has('WATER'))frame.volumetric={enabled:true,profile:{density:.004,extinction:.22,anisotropy:.1,steps:8,maxDistance:1.5},direction:[0,0,1],color:[.12,.18,.23]};
 return frame;
}
function ensurePixelCanvas(canvas){
 let pixel=document.getElementById('living-v2x13-gl');
 if(!pixel){pixel=document.createElement('canvas');pixel.id='living-v2x13-gl';pixel.setAttribute('aria-hidden','true');pixel.setAttribute('data-pixel-backend','V2X13_WEBGL2_PIXEL_CONSUMER');pixel.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block;z-index:3;pointer-events:none;background:transparent';canvas.parentNode?.append(pixel)}
 return pixel;
}
function createBridge(canvas){
 const pixel=ensurePixelCanvas(canvas);let gl=null,consumer=null,last=null,error=null,frames=0,disposed=false,lost=0,restored=0,resets=0;
 const options={maxDraws:32,maxVertices:128,maxIndices:256,maxFrameBytes:262144,maxRetainedBytes:262144,maxTrackedBytes:8388608,maxTextureDimension:2048};
 function makeConsumer(width,height){
  try{consumer?.dispose()}catch(x){error=String(x?.message||x)}
  if(pixel.width!==width)pixel.width=width;if(pixel.height!==height)pixel.height=height;
  gl=pixel.getContext('webgl2',{alpha:true,antialias:false,premultipliedAlpha:false,preserveDrawingBuffer:false,depth:true});if(!gl)throw new Error('V2X13 requires WebGL2');consumer=R.createFrameConsumer(gl,options);resets++;
 }
 makeConsumer(Math.max(1,canvas.width||1),Math.max(1,canvas.height||1));pixel.hidden=false;
 const onLost=e=>{e.preventDefault();lost++;try{consumer?.contextLost()}catch(x){error=String(x?.message||x)}};
 const onRestored=()=>{restored++;try{makeConsumer(Math.max(1,canvas.width||1),Math.max(1,canvas.height||1));error=null}catch(x){error=String(x?.message||x)}};
 pixel.addEventListener('webglcontextlost',onLost,false);pixel.addEventListener('webglcontextrestored',onRestored,false);
 function render(s,baseState){
  if(disposed)return null;const w=Math.max(1,canvas.width||1),h=Math.max(1,canvas.height||1);
  try{if(pixel.width!==w||pixel.height!==h)makeConsumer(w,h);last=consumer.render(frameFor(s,baseState,w,h));frames++;error=null;pixel.hidden=false;return last}catch(x){error=String(x?.message||x);return null}
 }
 function snapshot(){const c=consumer?.snapshot?.()||{};return {version:VERSION,active:Boolean(last)&&!disposed&&!error,backend:last?.backend||'V2X13_WEBGL2_PIXEL_CONSUMER',pixelConsumer:last?.pixelConsumer||'V2X-13',centralRendererAuthority:'WAVE_A_LIVING_RENDERER',consumerPrimaryRendererAuthority:last?.primaryRendererAuthority??c.primaryRendererAuthority??false,canvas2dFallbackUsed:last?.canvas2dFallbackUsed??c.canvas2dFallbackUsed??false,cameraAuthority:last?.cameraAuthority||'EXTERNAL_READ_ONLY',sceneCompositionAuthority:last?.sceneCompositionAuthority||'EXTERNAL_READ_ONLY',semanticScaleAuthority:last?.semanticScaleAuthority||'EXTERNAL_READ_ONLY',frames,lastWitness:last,error,contextLostEvents:lost,contextRestoredEvents:restored,consumerResets:resets,canvas:{id:pixel.id,width:pixel.width,height:pixel.height,hidden:pixel.hidden},resourceManager:c.resourceManager||null}}
 function dispose(){if(disposed)return;disposed=true;pixel.removeEventListener('webglcontextlost',onLost);pixel.removeEventListener('webglcontextrestored',onRestored);try{consumer?.dispose()}catch(x){error=String(x?.message||x)}consumer=null;pixel.hidden=true}
 return Object.freeze({render,snapshot,dispose,pixel});
}
const Wrapped=Object.freeze({...Base,VERSION:Base.VERSION+'+v2x13',create(canvas,legacyGl,options={}){
 const base=Base.create(canvas,legacyGl,options);let bridge=null,bridgeError=null,lastSnapshot=null;
 try{bridge=createBridge(canvas)}catch(x){bridgeError=String(x?.message||x)}
 async function render(s){lastSnapshot=s;await base.render(s);bridge?.render(s,base.state())}
 function state(){const b=base.state(),v=bridge?.snapshot()||{version:VERSION,active:false,backend:'V2X13_WEBGL2_PIXEL_CONSUMER',centralRendererAuthority:'WAVE_A_LIVING_RENDERER',consumerPrimaryRendererAuthority:false,error:bridgeError,frames:0,lastWitness:null};return {...b,primaryRendererAuthority:'WAVE_A_LIVING_RENDERER',primaryPixelBackend:v.active?'V2X13_WEBGL2_PIXEL_CONSUMER':(b.gpu?'LEGACY_WORLD_WEBGL2':'CANVAS2D_CONTINUITY'),v2x13:v,legacyPresentationUnderlay:true,authority:'PRESENTATION_ONLY'} }
 function resize(){const result=base.resize();if(lastSnapshot)bridge?.render(lastSnapshot,base.state());return result}
 function dispose(){bridge?.dispose();return base.dispose()}
 return Object.freeze({...base,render,state,resize,dispose});
}});
O.v1LivingRenderer=Wrapped;
O.v1LivingV2X13Bridge=Object.freeze({VERSION,frameFor,domainFor,sourceItems});
})(globalThis);
