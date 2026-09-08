(function(root){
'use strict';
const O=root.OFU=root.OFU||{},base=O.v1LivingRenderer,sp=O.v1x02SpatialUniverse,systemProvider=O.v1x04SystemProvider,cameraComposition=O.v2x02LivingCameraComposition;
if(!base||!sp||!systemProvider||!cameraComposition)throw new Error('Cinematic macro director dependencies missing');
if(base.__v2CinematicMacroComposed)return;
const VERSION='ofu-v2-cinematic-macro-director-1',AUTHORITY='PRESENTATION_ONLY';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const short=x=>String(x||'').slice(0,8);
const title=x=>String(x||'').toLowerCase().replaceAll('_',' ');
const macroStages=new Set(['UNIVERSE','GALAXY','REGION','NEIGHBORHOOD','SYSTEM']);
function hash(text){let h=2166136261;for(const ch of String(text||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function create(canvas,glCanvas,options={}){
 const renderer=base.create(canvas,glCanvas,options),g=canvas.getContext('2d',{alpha:true});
 if(!g)throw new Error('Cinematic macro director requires Canvas2D');
 let latest=null,width=1,height=1,hits=[],frames=0,lastStage=null,lastHero=null;
 function size(){const box=canvas.getBoundingClientRect();width=Math.max(1,box.width);height=Math.max(1,box.height);}
 function cameraFor(s,scale,{system=false}={}){
  const state=renderer.cameraAuthority?.snapshot?.(),angles=state?cameraComposition.orientationAngles(state):{yaw:0,pitch:0},yaw=angles.yaw,pitch=angles.pitch;
  const anchors=O.waveIVScaleRuntime?.snapshot?.().anchors||{},anchor=anchors[s.semanticScale]||null,distance=Number(s.continuousDistanceRadii),ratio=anchor&&Number.isFinite(distance)&&distance>0?clamp(distance/anchor,.45,2.4):1,d=scale*(system?2.8:2.05)*ratio,cp=Math.cos(pitch),position=[Math.sin(yaw)*cp*d,Math.sin(pitch)*d,Math.cos(yaw)*cp*d];
  const norm=v=>{const n=Math.hypot(...v)||1;return v.map(x=>x/n)},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],forward=norm(position.map(x=>-x)),right=norm(cross(forward,[0,1,0])),up=norm(cross(right,forward));
  return base.adaptPresentationCamera({position,origin:position,target:[0,0,0],right,up,forward,focalLength:1.18,near:scale*.01,fovYRadians:Math.PI/3,aspect:width/height,far:scale*20});
 }
 function backdrop(stage){
  g.clearRect(0,0,width,height);
  const centerX=stage==='GALAXY'?width*.62:width*.56,centerY=height*.49,rad=Math.max(width,height)*.78,bg=g.createRadialGradient(centerX,centerY,0,centerX,centerY,rad);
  bg.addColorStop(0,stage==='SYSTEM'?'#101c25':'#0a1824');bg.addColorStop(.48,'#06111b');bg.addColorStop(1,'#02070d');g.fillStyle=bg;g.fillRect(0,0,width,height);
  const count=stage==='UNIVERSE'?34:stage==='GALAXY'?24:28,seed=hash(stage+'|'+(latest?.node?.entityId||latest?.galaxy?.entityId||latest?.system?.entityId||''));
  for(let i=0;i<count;i++){let n=(seed+Math.imul(i+1,2654435761))>>>0;n^=n<<13;n^=n>>>17;n^=n<<5;const x=(n>>>0)/4294967296*width;n^=n<<13;n^=n>>>17;n^=n<<5;const y=(n>>>0)/4294967296*height;n^=n<<13;n^=n>>>17;n^=n<<5;const b=(n>>>0)/4294967296;g.fillStyle='rgba(214,229,237,'+(.045+b*.16).toFixed(3)+')';g.beginPath();g.arc(x,y,.45+b*.9,0,Math.PI*2);g.fill();}
 }
 function radial(x,y,r,inner,outer='rgba(0,0,0,0)'){const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,inner);gr.addColorStop(1,outer);g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}
 function galaxy(x,y,r,node,{hero=false,ghost=false}={}){
  const profile=node?.metadata?.modelProfile||{},morph=String(profile.morphology||'UNKNOWN'),seed=hash(node?.canonicalId||node?.entityId||'galaxy'),rot=(seed%628)/100;
  g.save();g.translate(x,y);g.rotate(rot);g.scale(1,.58);
  radial(0,0,r*2.7,ghost?'rgba(88,124,151,.055)':hero?'rgba(105,155,190,.17)':'rgba(98,143,174,.11)');
  g.globalCompositeOperation='screen';
  const disk=g.createRadialGradient(0,0,r*.08,0,0,r*1.2);disk.addColorStop(0,ghost?'rgba(242,210,166,.12)':'rgba(246,215,170,.72)');disk.addColorStop(.18,ghost?'rgba(156,181,195,.08)':'rgba(176,198,208,.30)');disk.addColorStop(.72,ghost?'rgba(90,126,151,.03)':'rgba(92,132,162,.12)');disk.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=disk;g.beginPath();g.ellipse(0,0,r*1.18,r*.72,0,0,Math.PI*2);g.fill();
  if(morph.includes('SPIRAL')||morph.includes('DISK'))for(let arm=0;arm<3;arm++){g.beginPath();for(let j=0;j<=52;j++){const t=j/52,a=arm*Math.PI*2/3+t*5.45,rr=(.08+t*.96)*r,xx=Math.cos(a)*rr,yy=Math.sin(a)*rr;if(j===0)g.moveTo(xx,yy);else g.lineTo(xx,yy);}g.strokeStyle=ghost?'rgba(150,176,190,.08)':hero?'rgba(175,204,216,.40)':'rgba(157,190,204,.26)';g.lineWidth=hero?3.2:2;g.stroke();}
  g.globalCompositeOperation='source-over';
  if(!ghost){g.strokeStyle='rgba(35,28,25,.30)';g.lineWidth=Math.max(2,r*.065);g.beginPath();g.ellipse(0,r*.04,r*.93,r*.12,-.12,0,Math.PI*2);g.stroke();radial(-r*.04,-r*.02,r*.42,'rgba(255,224,177,.82)');}
  g.restore();
 }
 function text(label,x,y,{size=11,align='left',alpha=1,bold=false}={}){g.save();g.globalAlpha=alpha;g.font=(bold?'600 ':'500 ')+size+'px system-ui,sans-serif';g.textAlign=align;g.textBaseline='middle';g.fillStyle='#d5e1e4';g.shadowColor='rgba(0,0,0,.9)';g.shadowBlur=10;g.fillText(label,x,y);g.restore();}
 function labelSlots(items,maxLabels){
  const accepted=[];for(const item of items){if(accepted.length>=maxLabels)break;const w=Math.min(190,Math.max(68,item.label.length*6.2)),h=20,rect={l:item.x-w/2,r:item.x+w/2,t:item.y+item.r+9,b:item.y+item.r+9+h};if(rect.l<18||rect.r>width-18||rect.t<110||rect.b>height-72)continue;if(accepted.some(a=>!(rect.r<a.rect.l||rect.l>a.rect.r||rect.b<a.rect.t||rect.t>a.rect.b)))continue;accepted.push({...item,rect});}return accepted;
 }
 function drawSystem(s){
  backdrop('SYSTEM');const sys={id:s.system.canonicalId,facts:s.system.metadata?.facts||{}},stars=s.rows.filter(n=>n.kind==='star').map(n=>({id:n.canonicalId||n.entityId,facts:n.metadata?.facts||{}})),planets=s.rows.filter(n=>n.kind==='planet').map(n=>({id:n.canonicalId||n.entityId,facts:n.metadata?.facts||{}})),camera=cameraFor(s,28,{system:true}),rendered=systemProvider.render({system:sys,stars,planets},{camera:camera.systemFrame,viewport:{width,height}});hits=[];
  for(const orbit of rendered.projectedOrbits){if(orbit.points.length<2)continue;g.beginPath();orbit.points.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.strokeStyle='rgba(151,177,188,.13)';g.lineWidth=1;g.stroke();}
  const visible=[];for(const h of rendered.hitTargets){if(!h.visible)continue;const node=s.rows.find(n=>String(n.canonicalId||n.entityId)===String(h.canonicalEntityId));if(!node)continue;const star=node.kind==='star',r=star?Math.min(width,height)*.085:8;radial(h.x,h.y,star?r*2.8:30,star?'rgba(255,190,103,.25)':'rgba(100,157,184,.13)');g.fillStyle=star?'#ffe0a4':'#8ab7c9';g.beginPath();g.arc(h.x,h.y,r,0,Math.PI*2);g.fill();if(star){radial(h.x-r*.18,h.y-r*.22,r*.7,'rgba(255,248,218,.72)');lastHero=node.canonicalId||node.entityId;}hits.push({x:h.x,y:h.y,r:Math.max(star?r:18,18),node});visible.push({x:h.x,y:h.y,r,label:(star?'Star ':'World ')+short(h.canonicalEntityId),star});}
  for(const item of labelSlots(visible.sort((a,b)=>Number(b.star)-Number(a.star)),5))text(item.label,item.x,item.rect.t+10,{size:item.star?12:10,align:'center',alpha:item.star?1:.72,bold:item.star});
 }
 function drawSpatial(s){
  backdrop(s.stage);const context=s.stage==='UNIVERSE'?'UNIVERSE':s.stage==='GALAXY'?'GALAXY':s.stage==='REGION'?'REGION':'NEIGHBORHOOD',scopeId=s.stage==='UNIVERSE'?s.node.entityId:s.stage==='GALAXY'?s.galaxy.entityId:s.stage==='REGION'?s.region.entityId:s.neighborhood.entityId,profile=sp.profile({context}),camera=cameraFor(s,profile.scaleUnits),rep=sp.representation({context,scopeId,entities:s.rows,cameraFrame:camera.spatialFrame,limit:64});
  if(s.stage==='GALAXY')galaxy(width*.66,height*.50,Math.min(width,height)*.37,s.galaxy,{hero:true,ghost:true});
  const visible=[];for(const o of rep.objects){if(!o.view?.visible)continue;const node=s.rows.find(n=>String(n.canonicalId||n.entityId)===String(o.canonicalId||o.entityId||o.identity));if(!node)continue;const x=width*.5+o.view.x*Math.min(width,height)*.46,y=height*.5-o.view.y*Math.min(width,height)*.46,depth=Number(o.view.depth)||profile.scaleUnits,depthScale=clamp(profile.scaleUnits/depth,.48,1.45);visible.push({o,node,x,y,depth,depthScale});}
  visible.sort((a,b)=>a.depth-b.depth||String(a.node.canonicalId||a.node.entityId).localeCompare(String(b.node.canonicalId||b.node.entityId)));
  hits=[];const hero=visible[0]||null,labels=[];
  for(const item of visible.slice().reverse()){const {node,x,y,depthScale}=item,isGalaxy=node.kind==='galaxy',isStar=node.kind==='star',isHero=item===hero;let r;if(isGalaxy)r=(isHero&&s.stage==='UNIVERSE'?Math.min(width,height)*.125:30)*depthScale;else r=(isStar?10:7)*depthScale;if(isGalaxy)galaxy(x,y,r,node,{hero:isHero});else{const c=isStar?'rgba(255,215,154,.95)':'rgba(139,188,207,.86)';radial(x,y,r*(isStar?3.8:2.8),isStar?'rgba(255,197,111,.17)':'rgba(104,164,189,.10)');g.fillStyle=c;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();}
   const id=node.canonicalId||node.entityId,label=(isGalaxy?'Galaxy':node.kind==='galactic_region'?'Region':node.kind==='system'?'System':isStar?'Star':'World')+' '+short(id);hits.push({x,y,r:Math.max(20,r*.82),node});labels.push({x,y,r,label,hero:isHero,depth:item.depth});if(isHero)lastHero=id;}
  const ordered=labels.sort((a,b)=>Number(b.hero)-Number(a.hero)||a.depth-b.depth);for(const item of labelSlots(ordered,s.stage==='UNIVERSE'?3:5))text(item.label,item.x,item.rect.t+10,{size:item.hero?12:10,align:'center',alpha:item.hero?1:.68,bold:item.hero});
 }
 function drawMacro(s){if(!macroStages.has(s.stage))return false;size();latest=s;lastStage=s.stage;if(s.stage==='SYSTEM')drawSystem(s);else drawSpatial(s);frames++;return true;}
 async function render(s){latest=s;const result=await renderer.render(s);drawMacro(s);return result;}
 function rotate(dx,dy){const result=renderer.rotate(dx,dy);if(latest&&macroStages.has(latest.stage))drawMacro(latest);return result;}
 function resize(){const result=renderer.resize();if(latest&&macroStages.has(latest.stage))drawMacro(latest);return result;}
 function activateAt(x,y){if(latest&&macroStages.has(latest.stage)){for(let i=hits.length-1;i>=0;i--){const h=hits[i];if(Math.hypot(x-h.x,y-h.y)<=h.r){options.onActivate?.(h.node);return true;}}}return renderer.activateAt(x,y);}
 function state(){const value=renderer.state();return {...value,cinematicMacro:{version:VERSION,authority:AUTHORITY,active:macroStages.has(latest?.stage),stage:lastStage,frames,hitCount:hits.length,heroIdentity:lastHero,semanticMutation:false,cameraAuthority:false,networkResources:0}};}
 function dispose(){hits=[];latest=null;renderer.dispose();}
 return Object.freeze({...renderer,render,rotate,resize,activateAt,state,dispose});
}
O.v1LivingRenderer=Object.freeze({...base,create,__v2CinematicMacroComposed:true,CINEMATIC_MACRO_VERSION:VERSION});
O.v2CinematicMacroDirector=Object.freeze({VERSION,AUTHORITY,macroStages:Object.freeze([...macroStages])});
})(typeof globalThis!=='undefined'?globalThis:this);
