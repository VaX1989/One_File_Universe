(function(root){
'use strict';
const O=root.OFU,C=O.v1PresentationCore,W=O.v1WorldContext;
if(!C||!W||!O.v1WorldPresentation)throw new Error('Living renderer dependencies required');
const VERSION='ofu-wave-a-living-renderer-1';
const MAP_W=96,MAP_H=48,MAX_MAPS=2,MAX_TERRAIN=192;
const rgb=c=>'rgb('+c.map(x=>Math.round(x)).join(',')+')';
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*Math.max(0,Math.min(1,t)));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const short=x=>String(x||'').slice(0,8);
const title=x=>String(x||'').toLowerCase().replaceAll('_',' ');
function sampleColor(s,world){
 const p=world.planetology,water=s.hydrology.surfaceLiquid,ice=s.hydrology.surfaceState==='ICE_OR_GLACIER';
 if(water){const depth=Math.max(0,p.hydrology.seaLevelDatumMeters-s.topography.elevationMeters);return mix([25,116,147],[10,47,83],Math.min(1,depth/2500));}
 if(ice)return mix([106,167,187],[210,229,231],clamp((245000-s.climate.localMeanTemperatureMilliK)/70000,0,1));
 let c=s.geology.province==='VOLCANIC_PROVINCE'?[104,98,94]:[165,132,96];
 c=mix(c,[195,172,130],s.climate.aridityPpm/1e6*.55);
 const env=W.localEnvironment(p,s),bio=world.biology.occupancy.biosphereEstablished&&O.v1Biology.environmentEligibility(env).eligible;
 if(bio)c=mix(c,[69,110,85],Math.min(.68,env.nutrientAvailabilityPpm/1e6*.8));
 return mix(c,[184,183,169],clamp((s.topography.elevationMeters-1000)/12000,0,.6));
}
function create(canvas,glCanvas,{onActivate=null,onPoint=null,onObject=null}={}){
 const g=canvas.getContext('2d',{alpha:true}),maps=new Map(),budget=O.v1RenderBudget.create({mobile:false,dpr:1});
 if(!g)throw new Error('Canvas2D unavailable');
 let gpu=null,gpuError=null,snapshot=null,scene=null,token=0,readyRevision=-1,width=1,height=1,dpr=1,disposed=false,picks=[];
 let yaw=0,pitch=0,bodyId=null,selectedPick=-1,terrain=[];
 const metrics={frames:0,mapBuilds:0,mapEvictions:0,modelSamples:0,terrainSamples:0,maxMapCells:0,maxTerrainCells:0,drawnObjects:0,cancellations:0};
 const pause=()=>new Promise(resolve=>setTimeout(resolve,0));
 function resize(){const b=canvas.getBoundingClientRect();width=Math.max(1,b.width);height=Math.max(1,b.height);dpr=Math.min(2,root.devicePixelRatio||1);const w=Math.round(width*dpr),h=Math.round(height*dpr);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}g.setTransform(dpr,0,0,dpr,0,0);}
 function label(text,x,y,{size=12,color='#9aaebc',align='left',bold=false}={}){g.font=(bold?'600 ':'')+size+'px system-ui';g.fillStyle=color;g.textAlign=align;g.fillText(text,x,y);}
 function background(space=true){g.clearRect(0,0,width,height);if(!space)return;const gr=g.createRadialGradient(width*.48,height*.44,0,width*.5,height*.5,width*.72);gr.addColorStop(0,'#102335');gr.addColorStop(.65,'#081521');gr.addColorStop(1,'#050e17');g.fillStyle=gr;g.fillRect(0,0,width,height);for(let i=0;i<72;i++){const x=C.rand('living-depth',i*3)*width,y=C.rand('living-depth',i*3+1)*height;g.fillStyle='rgba(205,225,242,'+(.10+C.rand('living-depth',i*3+2)*.25)+')';g.beginPath();g.arc(x,y,.5+C.rand('living-depth',i*5)*.9,0,Math.PI*2);g.fill();}}
 function glow(x,y,r,color){const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,color);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}
 function rowNode(sourceId){return snapshot.rows.find(n=>String(n.canonicalId||n.entityId)===String(sourceId));}
 function pick(x,y,r,data,labelText){picks.push({x,y,r,data,label:labelText});}
 function galaxyGlyph(x,y,r,node){const m=node.metadata.modelProfile,morph=m?.morphology||'UNKNOWN',seed=C.hash(node.canonicalId);g.save();g.translate(x,y);g.rotate(seed%628/100);g.scale(1,.62);glow(0,0,r*2.2,'rgba(113,171,218,.16)');if(morph.includes('SPIRAL')||morph.includes('DISK')){for(let arm=0;arm<3;arm++){g.beginPath();for(let j=0;j<=40;j++){const t=j/40,a=arm*Math.PI*2/3+t*5.7,rr=t*r;const xx=Math.cos(a)*rr,yy=Math.sin(a)*rr;if(j===0)g.moveTo(xx,yy);else g.lineTo(xx,yy);}g.strokeStyle='rgba(152,187,206,.70)';g.lineWidth=2.5;g.stroke();}}else{g.beginPath();g.ellipse(0,0,r,r*.6,0,0,Math.PI*2);g.fillStyle='rgba(162,175,188,.22)';g.fill();}glow(0,0,r*.7,'rgba(243,209,160,.85)');g.restore();}
 function macro(s){
  background();
  if(s.stage==='UNIVERSE'){
   const galaxies=s.rows.map(n=>({...n,...n.metadata.modelProfile,canonicalId:n.canonicalId,authority:'CANONICAL_PROVEN'}));scene=O.v1WorldPresentation.galaxyScene({discovery:{galaxies,authority:'CANONICAL_PROVEN'}});
  }else if(s.stage==='GALAXY'){
   scene=C.scene('REGION',s.galaxy.canonicalId,s.rows.map((n,i)=>C.object('GALACTIC_REGION',n.entityId,n,{x:.12+.76*((i%6)+.5)/6,y:.18+.61*(Math.floor(i/6)+.5)/Math.max(1,Math.ceil(s.rows.length/6))})));
   g.save();g.globalAlpha=.3;galaxyGlyph(width*.5,height*.48,Math.min(width,height)*.38,s.galaxy);g.restore();
  }else if(['REGION','NEIGHBORHOOD'].includes(s.stage)){
   scene=O.v1WorldPresentation.neighborhoodScene({centerId:s.neighborhood.entityId,systems:s.rows.map(n=>({...n,canonicalId:n.canonicalId,primary:{temperatureK:Number(n.metadata.primaryStar?.facts.baselineTemperatureK)||null},componentCount:Number(n.metadata.facts.stellarComponentCount)}))});
  }else{
   const stars=s.rows.filter(n=>n.kind==='star').map(n=>({...n,canonicalId:n.canonicalId,temperatureK:Number(n.metadata.facts.baselineTemperatureK),radiusMilliSolar:Number(n.metadata.facts.baselineRadiusMilliSolar)}));
   const planets=s.rows.filter(n=>n.kind==='planet').map(n=>({...n,canonicalId:n.canonicalId,orbitMilliAu:Number(n.metadata.facts.baselineSemiMajorAxisMicroAu)/1000,radiusKm:O.v1World.radiusEstimateKm(n.metadata.facts.bulkPriorClass,Number(n.metadata.facts.baselineMassMilliEarth))}));
   scene=O.v1WorldPresentation.systemScene({system:{canonicalId:s.system.canonicalId,stars,planets,authority:'CANONICAL_PROVEN'}});
   for(const l of scene.links){g.beginPath();g.ellipse(width*.5,height*.5,l.visual.radius*width,l.visual.radius*height*.66,0,0,Math.PI*2);g.strokeStyle='rgba(154,189,209,.17)';g.lineWidth=1;g.stroke();}
  }
  for(const [i,o] of scene.objects.entries()){
   const node=rowNode(o.sourceId)||s.rows.find(n=>n.entityId===o.sourceId);if(!node)continue;
   const v=o.visual,cols=Math.min(4,Math.max(2,Math.floor(width/180))),macroRow=Math.floor(i/cols),macroRows=Math.ceil(scene.objects.length/cols),x=s.stage==='UNIVERSE'?width*(.10+.80*((i%cols)+.5)/cols):v.x*width,y=s.stage==='UNIVERSE'?height*(.15+.66*(macroRow+.5)/macroRows):v.y*height,r=s.stage==='UNIVERSE'?21:node.kind==='star'?Math.min(32,v.sizePx):node.kind==='planet'?13:7;
   if(node.kind==='galaxy')galaxyGlyph(x,y,r,node);
   else{const c=node.kind==='star'?(v.color||[1,.8,.5]):node.kind==='planet'?([.42,.70,.78]):[.63,.8,.89];glow(x,y,r*2.7,'rgba('+c.map(n=>Math.round(n*255)).join(',')+',.24)');g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fillStyle=rgb(c.map(n=>n*255));g.fill();if(node.kind==='planet'){g.beginPath();g.arc(x,y,r+4,0,Math.PI*2);g.strokeStyle='rgba(172,221,239,.30)';g.stroke();}}
   const name=(node.kind==='galaxy'?'Galaxy':node.kind==='galactic_region'?'Region':node.kind==='system'?'System':node.kind==='star'?'Star':'World')+' '+short(node.canonicalId||node.entityId);
   label(name,x,y+r+20,{align:'center',color:'#c0d1de',size:11});pick(x,y,Math.max(24,r+8),{node},name);
  }
  label('P3 identities / model context / schematic positions',22,height-20,{size:10});
  if(!s.rows.length)label('No entities in this bounded page. Continue the survey.',width/2,height/2,{align:'center',size:16});
 }
 async function mapFor(world,myToken){
  const id=world.planetIdentity,cacheKey=id+':'+world.canonicalInputDigest;
  if(maps.has(cacheKey)){const value=maps.get(cacheKey);maps.delete(cacheKey);maps.set(cacheKey,value);return value;}
  const data=new Uint8Array(MAP_W*MAP_H*4),cloud=['GAS_GIANT','ICE_GIANT'].includes(world.planetology.bulkPriorClass);
  for(let y=0;y<MAP_H;y++){
   for(let x=0;x<MAP_W;x++){
    let color;
    if(cloud){const p=world.planetology,t=.5+.5*Math.sin(y*.92+Math.sin(x*.11)*.42);color=mix(p.bulkPriorClass==='ICE_GIANT'?[70,133,153]:[174,141,102],p.bulkPriorClass==='ICE_GIANT'?[151,197,205]:[91,80,69],t);}
    else{const point=W.location(id,Math.round(90000000-(y+.5)*180000000/MAP_H),Math.round(-180000000+(x+.5)*360000000/MAP_W));const sample=W.sample(world.planetology,point);color=sampleColor(sample,world);metrics.modelSamples++;}
    const offset=(y*MAP_W+x)*4;data[offset]=color[0];data[offset+1]=color[1];data[offset+2]=color[2];data[offset+3]=255;
   }
   if(y%4===3){await pause();if(myToken!==token||disposed){metrics.cancellations++;return null;}}
  }
  const map={key:cacheKey,width:MAP_W,height:MAP_H,data,worldIdentity:id,geometryAuthority:'MODEL_DERIVED_SIMULATION',colorAuthority:'PRESENTATION_ONLY',cloudPatternOnly:cloud};
  if(maps.size>=MAX_MAPS){maps.delete(maps.keys().next().value);metrics.mapEvictions++;}maps.set(cacheKey,map);metrics.mapBuilds++;metrics.maxMapCells=Math.max(metrics.maxMapCells,MAP_W*MAP_H);return map;
 }
 function screenForPoint(point,scale=.76){
  const lat=point.latMicroDeg/1e6*Math.PI/180,lon=point.lonMicroDeg/1e6*Math.PI/180-yaw,yy=Math.sin(lat),z=Math.cos(lat)*Math.cos(lon),x=Math.cos(lat)*Math.sin(lon),y=yy*Math.cos(pitch)-z*Math.sin(pitch),front=yy*Math.sin(pitch)+z*Math.cos(pitch),r=Math.min(width,height)*scale/2;
  return front>0?{x:width/2+x*r,y:height/2-y*r,visible:true}:null;
 }
 function pointFromScreen(x,y,scale=.76){const r=Math.min(width,height)*scale/2,nx=(x-width/2)/r,ny=-(y-height/2)/r,r2=nx*nx+ny*ny;if(r2>1)return null;const z=Math.sqrt(1-r2),wy=ny*Math.cos(pitch)+z*Math.sin(pitch),wz=z*Math.cos(pitch)-ny*Math.sin(pitch),lat=Math.asin(clamp(wy,-1,1)),lon=Math.atan2(nx,wz)+yaw;return W.location(snapshot.world.planetIdentity,Math.round(lat*180e6/Math.PI),Math.round(lon*180e6/Math.PI));}
 function settlementGlyph(x,y,s,size=8){const active=s.status==='ACTIVE';g.fillStyle=active?'#e8bc77':'#a38b78';g.strokeStyle=active?'#f1d29c':'#c4a68c';g.lineWidth=1.5;g.beginPath();g.moveTo(x,y-size);g.lineTo(x+size*.9,y+size*.7);g.lineTo(x-size*.9,y+size*.7);g.closePath();if(active)g.fill();else g.stroke();}
 function projectedCivilization(s,{globe=false,project=null}={}){
  const c=O.v1WorldPresentation.civilizationScene({world:s.world});
  const positions=new Map();
  for(const settlement of s.world.civilization.settlements||[]){const p=globe?screenForPoint(settlement.location,s.stage==='APPROACH'?.88:.76):project(settlement.location);if(!p)continue;positions.set(settlement.settlementId,p);settlementGlyph(p.x,p.y,settlement,globe?5:7);pick(p.x,p.y,14,{point:settlement.location,settlement},title(settlement.type)+' '+short(settlement.settlementId));if(!globe)label(short(settlement.settlementId),p.x+10,p.y-5,{size:9,color:'#d8b88b'});}
  if(!globe)for(const link of c.links){const a=positions.get(link.from),b=positions.get(link.to);if(!a||!b)continue;g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.strokeStyle='rgba(226,185,118,.40)';g.setLineDash([3,5]);g.stroke();g.setLineDash([]);}
 }
 function fallbackGlobe(map,scale){
  // The CPU fallback uses the same source texture and inverse projection as WebGL.
  const size=Math.min(420,Math.floor(Math.min(width,height)*scale)),off=document.createElement('canvas');off.width=off.height=size;const o=off.getContext('2d'),image=o.createImageData(size,size),r=size/2;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const nx=(x-r)/r,ny=-(y-r)/r,q=nx*nx+ny*ny;if(q>1)continue;const z=Math.sqrt(1-q),wy=ny*Math.cos(pitch)+z*Math.sin(pitch),wz=z*Math.cos(pitch)-ny*Math.sin(pitch),lat=Math.asin(wy),lon=Math.atan2(nx,wz)+yaw,u=((lon/(Math.PI*2)+.5)%1+1)%1,v=.5-lat/Math.PI,si=(Math.min(map.height-1,Math.floor(v*map.height))*map.width+Math.min(map.width-1,Math.floor(u*map.width)))*4,j=(y*size+x)*4,light=.22+.78*Math.max(0,-nx*.5+ny*.36+z*.8);for(let k=0;k<3;k++)image.data[j+k]=map.data[si+k]*light;image.data[j+3]=255;}
  o.putImageData(image,0,0);background();g.drawImage(off,(width-size)/2,(height-size)/2,size,size);
 }
 async function globe(s,myToken){
  if(bodyId!==s.world.planetIdentity){bodyId=s.world.planetIdentity;yaw=0;pitch=0;}
  background();label('Resolving model surface...',width/2,height/2,{align:'center',size:14});
  const map=await mapFor(s.world,myToken);if(!map||myToken!==token)return;
  scene=registeredScene(s,'PLANET');const scale=s.stage==='APPROACH'?.88:.76;
  scene={...scene,scale:s.stage==='APPROACH'?'APPROACH':'PLANET',surfaceTexture:map,camera:{yaw,pitch},globeScale:scale};
  try{if(gpuError&&!gpu)throw new Error(gpuError);if(!gpu)gpu=O.v1WorldWebGL2.create(glCanvas,{maxDpr:2});glCanvas.hidden=false;gpu.render(scene);background(false);}
  catch(error){gpuError=String(error.message);gpu?.dispose();gpu=null;glCanvas.hidden=true;fallbackGlobe(map,scale);}
  projectedCivilization(s,{globe:true});
  label(s.world.bodyContext.kind==='MOON'?'Satellite forcing: parent orbit; modeled composition / radius':'Surface colors sample the same environment used on descent',22,height-42,{size:10});
  label(map.cloudPatternOnly?'Cloud-deck encoding; no solid-surface landing':'Drag to rotate / select any visible surface location',22,height-22,{size:11,color:'#bbd1df'});
 }
 function star(s){background();const f=s.body.metadata.facts,temp=Number(f.baselineTemperatureK),c=temp>9000?'rgba(160,199,255,.8)':temp>5000?'rgba(255,222,162,.8)':'rgba(244,132,91,.8)',r=Math.min(width,height)*.16;glow(width/2,height/2,r*2.1,c);g.beginPath();g.arc(width/2,height/2,r,0,Math.PI*2);g.fillStyle=temp>9000?'#d1e5ff':temp>5000?'#ffe4b2':'#fda176';g.fill();label(temp.toLocaleString()+' K / '+title(f.baselineEvolutionaryClass),width/2,height*.78,{align:'center',size:16,color:'#d5e2eb'});label('Stellar surface is not a landable solid-world regime',width/2,height*.84,{align:'center',size:11});scene=C.scene('ORBIT',s.body.canonicalId,[]);}
 function cellsFor(s){const grid=W.surfaceWindow(s.world,s.point,s.stage);metrics.terrainSamples+=grid.cells.length;metrics.maxTerrainCells=Math.max(metrics.maxTerrainCells,grid.cells.length);return grid;}
 function registeredScene(s,regime){
  const P=O.pxProduct,d=P.registry.descriptor('v1.scene.living-world'),payload={regime,latMicroDeg:s.point?.latMicroDeg??0,lonMicroDeg:s.point?.lonMicroDeg??0,objectId:s.selectedObjectId,historyEpoch:s.world?.civilization?.epoch??null};
  if(s.body.kind==='moon')payload.satelliteSlot=Number(s.body.canonicalKey.satelliteSlot);
  return P.registry.invoke(d.id,{contract:O.pxContracts.VERSION,provider:d.id,operation:'REPRESENT',selection:P.captured(s.body.canonicalKey).selection,fidelity:d.fidelity,budget:d.budget,payload}).value;
 }
 function terrainDraw(s){
  background(false);g.fillStyle='#0b1a24';g.fillRect(0,0,width,height);
  if(s.local.surface.hydrology.surfaceState==='NO_SOLID_SURFACE_REFERENCE'){
   const sky=g.createLinearGradient(0,0,0,height);sky.addColorStop(0,'#274957');sky.addColorStop(1,'#172c39');g.fillStyle=sky;g.fillRect(0,0,width,height);label('Atmosphere sampling volume',width/2,height*.25,{align:'center',size:24,color:'#cbdde5'});localObjects(s,width/2,height*.56);scene=C.scene('LOCAL_SURFACE',s.world.planetIdentity,[]);return;
  }
  const grid=cellsFor(s);terrain=grid.cells;
  const input=grid.cells.map(c=>({...c.sample,cellId:c.cellId,x:c.x/grid.cols,y:c.y/grid.rows}));
  scene=registeredScene(s,s.stage);
  const global=s.stage==='GLOBAL_SURFACE',m=32,mapW=width-2*m,mapH=height-145;
  if(global){
   for(const c of grid.cells){g.fillStyle=rgb(sampleColor(c.sample,s.world));g.fillRect(m+c.x/grid.cols*mapW,72+c.y/grid.rows*mapH,mapW/grid.cols+1,mapH/grid.rows+1);pick(m+(c.x+.5)/grid.cols*mapW,72+(c.y+.5)/grid.rows*mapH,Math.min(mapW/grid.cols,mapH/grid.rows)/2,{point:c.point},title(c.sample.regime.surface));}
   for(let x=0;x<=6;x++){g.beginPath();g.moveTo(m+x*mapW/6,72);g.lineTo(m+x*mapW/6,72+mapH);g.strokeStyle='rgba(213,228,235,.17)';g.stroke();label(String(-180+x*60),m+x*mapW/6,60,{size:10,align:'center'});}
   const project=p=>({x:m+(p.lonMicroDeg+180000000)/360000000*mapW,y:72+(90000000-p.latMicroDeg)/180000000*mapH});
   projectedCivilization(s,{project});const selected=project(s.point);g.strokeStyle='#fff0bb';g.beginPath();g.arc(selected.x,selected.y,8,0,Math.PI*2);g.stroke();
   label('Coarse global model map / click to inspect a region',m,height-34,{size:11});return;
  }
  const centerSample=s.local.surface,base=centerSample.topography.elevationMeters,vertical=s.stage==='REGIONAL_SURFACE'?.012:s.stage==='LOCAL_SURFACE'?.04:.04;
  const cellW=width*.036,cellH=height*.027,ox=width*.5,oy=height*.45;
  const projectCell=(x,y,e)=>({x:ox+(x-y)*cellW,y:oy+(x+y)*cellH-clamp((e-base)*vertical,-height*.17,height*.17)});
  for(const c of grid.cells){const x=c.x-grid.cols/2,y=c.y-grid.rows/2,e=c.sample.hydrology.surfaceLiquid?s.world.planetology.hydrology.seaLevelDatumMeters:c.sample.topography.elevationMeters,pts=[[x,y],[x+1,y],[x+1,y+1],[x,y+1]].map(p=>projectCell(p[0],p[1],e));g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.closePath();g.fillStyle=rgb(sampleColor(c.sample,s.world));g.fill();g.strokeStyle='rgba(8,18,25,.15)';g.lineWidth=.65;g.stroke();const p=projectCell(x+.5,y+.5,e);pick(p.x,p.y,cellW*.75,{point:c.point},title(c.sample.regime.surface));}
  const wrap=d=>((d+180e6)%360e6+360e6)%360e6-180e6;
  const project=p=>{const dx=wrap(p.lonMicroDeg-s.point.lonMicroDeg)/(grid.span*1e6)*grid.cols,dy=(s.point.latMicroDeg-p.latMicroDeg)/(grid.latSpan*1e6)*grid.rows;if(Math.abs(dx)>grid.cols/2||Math.abs(dy)>grid.rows/2)return null;const sample=W.sample(s.world.planetology,p);return projectCell(dx,dy,sample.topography.elevationMeters);};
  projectedCivilization(s,{project});
  const anchor=projectCell(0,0,base);
  for(const settlement of s.world.civilization.settlements||[]){if(settlement.location.locationIdentity!==s.point.locationIdentity)continue;const active=settlement.status==='ACTIVE',count=Math.min(24,Math.max(4,Math.round(Math.log2(1+settlement.population)*1.5)));
   for(let i=0;i<count;i++){const col=i%6,row=Math.floor(i/6),xx=anchor.x+(col-row)*9-14,yy=anchor.y+(col+row)*4-20,h=active?9+C.rand(settlement.settlementId,i)*14:2+C.rand(settlement.settlementId,i)*6;g.fillStyle=active?'#ba9870':'#6b6960';g.beginPath();g.moveTo(xx,yy);g.lineTo(xx+8,yy-4);g.lineTo(xx+8,yy-h-4);g.lineTo(xx,yy-h);g.closePath();g.fill();g.fillStyle=active?'#856e55':'#565953';g.beginPath();g.moveTo(xx+8,yy-4);g.lineTo(xx+14,yy);g.lineTo(xx+14,yy-h);g.lineTo(xx+8,yy-h-4);g.closePath();g.fill();g.fillStyle=active?'#d8bb89':'#8c8c7e';g.beginPath();g.moveTo(xx,yy-h);g.lineTo(xx+8,yy-h-4);g.lineTo(xx+14,yy-h);g.lineTo(xx+6,yy-h+4);g.closePath();g.fill();}
   label((active?title(settlement.type):'Ruins')+' / schematic settlement aggregate',anchor.x,anchor.y-61,{align:'center',color:'#dbc299',size:10});
  }
  g.strokeStyle='rgba(235,235,199,.8)';g.beginPath();g.arc(anchor.x,anchor.y,6,0,Math.PI*2);g.stroke();
  if(['LOCAL_SURFACE','HUMAN'].includes(s.stage))localObjects(s,width*.5,height*.76,anchor);
  label(title(centerSample.geology.province)+' / '+title(centerSample.climate.climateZone),22,30,{size:12,color:'#c2d6df'});
  label('Elevation '+base.toLocaleString()+' m (model datum) / '+(centerSample.climate.localMeanTemperatureMilliK/1000).toFixed(1)+' K',22,51,{size:11});
  label(s.stage==='HUMAN'?'Human reference frame / coarse environmental fields; representative object symbols':'Terrain, water phase and life eligibility share one location model',22,height-20,{size:10});
 }
 function localObjects(s,x,y,anchor=null){
  const objects=s.local.objects.filter(o=>!['SETTLEMENT','RUIN'].includes(o.kind)),n=objects.length,spacing=Math.min(70,(width-80)/Math.max(1,n));
  for(let i=0;i<n;i++){const o=objects[i],xx=x+(i-(n-1)/2)*spacing,sel=o.entityId===s.selectedObjectId;
   if(anchor){g.beginPath();g.moveTo(anchor.x,anchor.y+8);g.lineTo(xx,y-18);g.strokeStyle='rgba(182,208,215,.16)';g.stroke();}
   g.save();g.translate(xx,y);g.strokeStyle=sel?'#ffda91':'#9ebcbe';g.lineWidth=sel?2:1;
   if(o.kind==='ORGANISM'){g.fillStyle='#79b99b';g.beginPath();g.ellipse(0,0,11,6+Number(o.population.traits?.multicellularityPpm||0)/100000,Math.sin(i),0,Math.PI*2);g.fill();g.stroke();g.beginPath();g.arc(-2,-2,2,0,Math.PI*2);g.fillStyle='#c4dfb2';g.fill();}
   else if(o.kind==='WATER'||o.kind==='ICE'){g.fillStyle=o.kind==='ICE'?'#aed6df':'#4babc8';g.beginPath();g.moveTo(0,-13);g.lineTo(13,8);g.lineTo(-11,12);g.closePath();g.fill();g.stroke();}
   else if(o.kind==='ARTIFACT'){g.fillStyle='#cba779';g.fillRect(-10,-10,20,20);g.strokeRect(-10,-10,20,20);g.beginPath();g.moveTo(-10,0);g.lineTo(10,0);g.stroke();}
   else{g.fillStyle='#a79b88';g.beginPath();for(let j=0;j<6;j++){const a=j*Math.PI/3,r=10+C.rand(o.entityId,j)*5;const px=Math.cos(a)*r,py=Math.sin(a)*r;j?g.lineTo(px,py):g.moveTo(px,py);}g.closePath();g.fill();g.stroke();}g.restore();
   label(o.kind==='ORGANISM'?title(o.population.role).split(' ')[0]:title(o.kind),xx,y+30,{align:'center',size:9,color:sel?'#ffe1a7':'#bbced5'});pick(xx,y,24,{objectId:o.entityId},o.label);
  }
 }
 function microDraw(s){
  background();scene=registeredScene(s,s.stage);
  const box={x:width*.12,y:height*.16,w:width*.76,h:height*.66};g.strokeStyle='rgba(122,170,189,.24)';g.strokeRect(box.x,box.y,box.w,box.h);
  for(const o of scene.objects){const v=o.visual,x=v.x*width,y=v.y*height;
   if(o.kind==='MATERIAL_COMPONENT'){const palette=['#92b3ba','#baaa91','#85a79b','#526b7e'];g.fillStyle=palette[C.hash(v.label)%palette.length];g.fillRect(x,y,v.width*width,v.height*height);if(v.width>.08)label((v.ppm/10000).toFixed(1)+'%',x+8,y+30,{size:13,color:'#07151f'});label(title(v.label).slice(0,23),x,y+v.height*height+22,{size:10});}
   else if(o.kind==='ATOM'){glow(x,y,21,o.visual.element==='O'?'rgba(224,133,106,.22)':'rgba(160,199,227,.22)');g.fillStyle=o.visual.element==='O'?'#dc937c':'#bdd9e8';g.beginPath();g.arc(x,y,o.visual.element==='O'?15:9,0,Math.PI*2);g.fill();label(v.element,x,y+4,{align:'center',size:10,color:'#18313d'});}
   else if(o.kind==='MOLECULAR_COMPLEX'){g.beginPath();g.arc(x,y,22,0,Math.PI*2);g.strokeStyle='#88b3c7';g.lineWidth=1.5;g.stroke();label(v.label,x,y+5,{align:'center',size:13,color:'#d0e2e9'});}
   else{const pore=/PORE|VOID/.test(o.kind),boundary=/BOUNDARY/.test(o.kind);g.beginPath();const r=v.sizePx;g.ellipse(x,y,r*1.3,r,.4+C.rand(o.sourceId),0,Math.PI*2);g.fillStyle=pore?'#0c1620':/CELL|BIOLOGICAL/.test(o.kind)?'rgba(99,157,135,.45)':'rgba(156,170,180,.26)';g.strokeStyle=boundary?'#b2ced1':'rgba(152,185,198,.40)';if(!boundary)g.fill();g.stroke();}
  }
  if(!scene.objects.length){label('The model does not resolve this chemistry.',width/2,height*.46,{align:'center',size:19,color:'#cedde5'});label('No molecules or atoms have been invented to fill the gap.',width/2,height*.52,{align:'center',size:12});}
  label(s.stage==='ATOMIC'?'Structural atoms only / no electron orbits, trajectories or quantum dynamics':'Representative '+title(s.stage)+' / source '+short(s.micro.sourceEntityId),22,height-44,{size:11,color:'#c3d5df'});
  label('Semantic regime change, not literal infinite geometric zoom',22,height-23,{size:10});
 }
 async function render(s){
  if(disposed)return;const myToken=++token;snapshot=s;readyRevision=-1;picks=[];selectedPick=-1;resize();glCanvas.hidden=true;
  if(s.world&&['ORBIT','APPROACH'].includes(s.stage))await globe(s,myToken);
  else if(s.stage==='ORBIT'&&s.body?.kind==='star')star(s);
  else if(O.v1LivingRuntime.SURFACE.includes(s.stage))terrainDraw(s);
  else if(O.v1LivingRuntime.REGIMES.includes(s.stage))microDraw(s);
  else macro(s);
  if(myToken!==token||disposed)return;metrics.frames++;metrics.drawnObjects=scene?.objects.length||0;budget.request('TERRAIN','visible',{objects:terrain.length,bytes:terrain.length*512,draws:1});readyRevision=s.revision;
 }
 function rotate(dx,dy){yaw+=dx*.006;pitch=clamp(pitch+dy*.004,-1.35,1.35);if(snapshot)render(snapshot);}
 function activateAt(x,y){for(let i=picks.length-1;i>=0;i--){const p=picks[i];if(Math.hypot(x-p.x,y-p.y)>p.r)continue;const d=p.data;if(snapshot?.stage==='GLOBAL_SURFACE'&&d.point&&!d.settlement)continue;if(d.node)onActivate?.(d.node);else if(d.objectId)onObject?.(d.objectId);else if(d.point)onPoint?.(d.point,{settlement:d.settlement||null});return true;}if(snapshot?.world&&['ORBIT','APPROACH'].includes(snapshot.stage)){const p=pointFromScreen(x,y,snapshot.stage==='APPROACH'?.88:.76);if(p){onPoint?.(p,{});return true;}}if(snapshot?.stage==='GLOBAL_SURFACE'&&x>=32&&x<=width-32&&y>=72&&y<=height-73){const p=W.location(snapshot.world.planetIdentity,Math.round(90000000-(y-72)/(height-145)*180000000),Math.round(-180000000+(x-32)/(width-64)*360000000));onPoint?.(p,{});return true;}return false;}
 function keyboard(key){if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(key)&&picks.length){selectedPick=(selectedPick+(key==='ArrowLeft'||key==='ArrowUp'?-1:1)+picks.length)%picks.length;canvas.setAttribute('aria-label','Universe viewport. Focused '+picks[selectedPick].label);const p=picks[selectedPick];g.strokeStyle='#eac680';g.lineWidth=2;g.beginPath();g.arc(p.x,p.y,p.r+3,0,Math.PI*2);g.stroke();return true;}if(key==='Enter'&&selectedPick>=0){const p=picks[selectedPick];return activateAt(p.x,p.y);}return false;}
 function state(){return {version:VERSION,readyRevision,worldIdentity:snapshot?.world?.planetIdentity||null,stage:snapshot?.stage,sceneScale:scene?.scale,sceneSourceId:scene?.sourceId,sourceIds:scene?.objects.map(o=>o.sourceId)||[],pickCount:picks.length,metrics:{...metrics},mapCacheEntries:maps.size,mapCacheLimit:MAX_MAPS,mapResolution:[MAP_W,MAP_H],gpu:gpu?.snapshot()||null,gpuError,budget:budget.snapshot(),authority:'PRESENTATION_ONLY',networkResources:0};}
 function dispose(){disposed=true;token++;maps.clear();picks=[];terrain=[];gpu?.dispose();budget.clear('dispose');}
 return Object.freeze({VERSION,render,rotate,activateAt,keyboard,state,dispose,resize,sampleColor});
}
O.v1LivingRenderer=Object.freeze({VERSION,MAP_W,MAP_H,MAX_MAPS,MAX_TERRAIN,sampleColor,create});
})(globalThis);
