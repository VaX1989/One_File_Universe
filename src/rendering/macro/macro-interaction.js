(function(root){
'use strict';
const O=root.OFU=root.OFU||{},M=O.waveIVMacroScene;
if(!M)throw new Error('Wave IV macro interaction requires macro scene contract');
const VERSION='ofu-wave-iv-macro-interaction-1',CONTRACT='ofu-macro-hit-selection-1';
const MIN_TARGET_CSS_PX=44;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)));
function layout(scene,{width=1024,height=640,mobile=false}={}){
  M.validateScene(scene);width=Math.max(1,Number(width)||1);height=Math.max(1,Number(height)||1);mobile=!!mobile||width<640;
  const labelCap=mobile?M.CAPS.labelsMobile:M.CAPS.labelsDesktop,hitCap=M.CAPS.hitObjects,hits=[],labels=[];
  for(const object of scene.objects||[]){
    const p=object.presentationGeometry;if(!p||!Number.isFinite(Number(p.x))||!Number.isFinite(Number(p.y)))continue;
    const x=clamp(Number(p.x),0,1)*width,y=clamp(Number(p.y),0,1)*height,glyph=Math.max(2,Number(p.glyphRadiusPx)||5),eligible=object.interaction?.hitTargetEligible===true&&object.authority!==M.AUTHORITY.DECORATIVE_ONLY;
    if(eligible&&hits.length<hitCap){const target=Math.max(MIN_TARGET_CSS_PX,glyph*2+18);hits.push(Object.freeze({objectId:object.objectId,kind:object.kind,canonicalId:object.canonicalId||null,canonicalKey:object.canonicalKey||null,x,y,width:target,height:target,left:x-target/2,top:y-target/2,right:x+target/2,bottom:y+target/2,activation:object.interaction.activation,selectionAuthority:object.interaction.selectionAuthority||null,selectable:object.interaction.selectable===true,navigable:object.interaction.navigable===true,minTargetCssPx:MIN_TARGET_CSS_PX}))}
    if(object.label&&labels.length<labelCap&&(object.selectedPath||!mobile||labels.length<Math.max(3,labelCap-1)))labels.push(Object.freeze({objectId:object.objectId,text:String(object.label),x,y,priority:object.selectedPath?0:1}))
  }
  return Object.freeze({version:VERSION,contract:CONTRACT,width,height,mobile,labelCap,hitCap,hits:Object.freeze(hits),labels:Object.freeze(labels),noHorizontalOverflow:true});
}
function hitTest(layoutResult,x,y){
  x=Number(x);y=Number(y);if(!Number.isFinite(x)||!Number.isFinite(y))return null;let best=null,bestD=Infinity;
  for(const hit of layoutResult?.hits||[]){if(x<hit.left||x>hit.right||y<hit.top||y>hit.bottom)continue;const d=(x-hit.x)**2+(y-hit.y)**2;if(d<bestD){best=hit;bestD=d}}
  return best;
}
function orderedHits(layoutResult){return [...(layoutResult?.hits||[])].sort((a,b)=>a.y-b.y||a.x-b.x||String(a.objectId).localeCompare(String(b.objectId)))}
function keyboardTarget(layoutResult,currentObjectId,key){
  const hits=orderedHits(layoutResult);if(!hits.length)return null;let index=Math.max(0,hits.findIndex(h=>h.objectId===currentObjectId));if(index<0)index=0;
  if(key==='Home')index=0;else if(key==='End')index=hits.length-1;else if(key==='ArrowRight'||key==='ArrowDown')index=(index+1)%hits.length;else if(key==='ArrowLeft'||key==='ArrowUp')index=(index-1+hits.length)%hits.length;else return hits[index];return hits[index];
}
function activationIntent(hit){
  if(!hit)return null;
  if(hit.activation==='SELECT_CANONICAL_PLANET')return Object.freeze({type:'SELECT_CANONICAL_PLANET',canonicalKey:hit.canonicalKey,canonicalId:hit.canonicalId,requiredAuthority:'ofu-product-canonical-planet-selection-1'});
  if(hit.activation==='FOCUS_SYSTEM')return Object.freeze({type:'FOCUS_SYSTEM',canonicalKey:hit.canonicalKey,canonicalId:hit.canonicalId});
  if(hit.activation==='FOCUS_GALAXY')return Object.freeze({type:'FOCUS_GALAXY',canonicalKey:hit.canonicalKey,canonicalId:hit.canonicalId});
  return null;
}
function activate(hit,{selectionAuthority=null,onNavigate=null}={}){
  const intent=activationIntent(hit);if(!intent)return Object.freeze({handled:false,reason:'NO_ACTIVATION'});
  if(intent.type==='SELECT_CANONICAL_PLANET'){
    if(!selectionAuthority||selectionAuthority.contract!=='ofu-product-canonical-planet-selection-1'||typeof selectionAuthority.selectPlanet!=='function')throw new Error('normalized canonical selection authority required');
    const result=selectionAuthority.selectPlanet(intent.canonicalKey,{announce:true});return Object.freeze({handled:true,intent,result,shadowSelection:false});
  }
  if(typeof onNavigate!=='function')return Object.freeze({handled:false,reason:'NAVIGATION_CALLBACK_REQUIRED',intent});
  const result=onNavigate(intent);return Object.freeze({handled:true,intent,result,shadowSelection:false});
}
function keyActivation(layoutResult,currentObjectId,key,handlers){
  if(key!=='Enter'&&key!==' '&&key!=='Spacebar')return Object.freeze({handled:false,reason:'NOT_ACTIVATION_KEY'});const hit=(layoutResult?.hits||[]).find(h=>h.objectId===currentObjectId)||null;return activate(hit,handlers);
}
function pointerActivation(layoutResult,x,y,handlers){return activate(hitTest(layoutResult,x,y),handlers)}
O.waveIVMacroInteraction=Object.freeze({VERSION,CONTRACT,MIN_TARGET_CSS_PX,layout,hitTest,orderedHits,keyboardTarget,activationIntent,activate,keyActivation,pointerActivation});
})(typeof globalThis!=='undefined'?globalThis:this);
