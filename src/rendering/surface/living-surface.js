(function(root){
'use strict';
const O=root.OFU=root.OFU||{},A=O.v2x06SurfaceAddress,T=O.v2x06HierarchicalTerrain;
if(!A||!T)throw new Error('V2X-06 address/terrain required');
const VERSION='ofu-v2x-06-living-surface-renderer-3';
const AUTHORITY='PRESENTATION_ONLY';
const DEFAULT_LIMITS=Object.freeze({maxPatches:16,maxPolygons:16384,maxCoastlines:4096,maxRivers:1024,maxCommands:20000,maxSvgBytes:4*1024*1024});
const MATERIALS=Object.freeze({LIQUID_SURFACE_PRESENTATION:'#184f70',ICE_COVERED_LIQUID_PRESENTATION:'#9cc7d7',ICE_SNOW_SUBSTRATE_PRESENTATION:'#dcecf1',VOLCANIC_ROCK_PRESENTATION:'#3f3a38',SEDIMENTARY_SUBSTRATE_PRESENTATION:'#728064',ARID_REGOLITH_PRESENTATION:'#a98a5e',ROCK_REGOLITH_PRESENTATION:'#626f5b',NONE:'#20242a'});
const PROVINCES=Object.freeze({OROGENIC_PRESENTATION:'#776d60',RIFT_PRESENTATION:'#574f49',VOLCANIC_PRESENTATION:'#3d3835',IMPACT_PRESENTATION:'#766a5c',BASIN_PRESENTATION:'#68785e',PLATEAU_PRESENTATION:'#80745f',CRATONIC_OR_CONTINENTAL_PRESENTATION:'#61705a',BASIN_OCEANIC_PRESENTATION:'#174965',OCEANIC_PRESENTATION:'#184f70'});
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;for(const k of Object.keys(v))freeze(v[k]);return Object.freeze(v)}
function clamp(v,a,b){return Math.max(a,Math.min(b,Number(v)||0))}
function esc(s){return String(s).replace(/[&<>\"]/g,c=>c==='&'?'&amp;':c==='<'?'&lt;':c==='>'?'&gt;':'&quot;')}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}
function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function unit(v){const n=Math.hypot(v[0],v[1],v[2]);return n>1e-12?[v[0]/n,v[1]/n,v[2]/n]:[1,0,0]}
function tangentBasis(anchor){const up=unit(anchor),axis=Math.abs(up[1])>.95?[1,0,0]:[0,1,0],east=unit(cross(axis,up)),north=unit(cross(up,east));return{east,north,up}}
function hash32(text){let h=2166136261>>>0;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}h^=h>>>16;return h>>>0}
function stableDigest(value){return ('00000000'+hash32(JSON.stringify(value)).toString(16)).slice(-8)}
function baseFill(vertex){if(vertex.surfaceClass==='LIQUID')return vertex.cryosphereCuePpm>700000?MATERIALS.ICE_COVERED_LIQUID_PRESENTATION:MATERIALS.LIQUID_SURFACE_PRESENTATION;if(vertex.cryosphereCuePpm>700000)return MATERIALS.ICE_SNOW_SUBSTRATE_PRESENTATION;if(vertex.impactCuePpm>120000)return'#5a514b';if(vertex.volcanicCuePpm>150000)return'#3d3734';if(vertex.landformAnalog==='DUNE_FIELD_ANALOG_PRESENTATION')return MATERIALS.ARID_REGOLITH_PRESENTATION;if(vertex.orogenCuePpm>180000)return'#988d79';if(vertex.orogenCuePpm<-120000)return'#4e5e53';if(vertex.reliefCuePpm>520000)return'#a79b82';if(vertex.reliefCuePpm>380000)return'#827866';return PROVINCES[vertex.provinceClass]||MATERIALS[vertex.materialFamily]||MATERIALS.ROCK_REGOLITH_PRESENTATION}
function shadeHex(hex,amount){const m=/^#([0-9a-f]{6})$/i.exec(String(hex));if(!m)return hex;const n=parseInt(m[1],16),a=clamp(amount,-.35,.35),f=a>=0?255:0,p=Math.abs(a),r=(n>>16)&255,g=(n>>8)&255,b=n&255,q=x=>Math.round(x+(f-x)*p);return'#'+[q(r),q(g),q(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
function normalizeLimits(input={}){const out={...DEFAULT_LIMITS,...input};for(const k of Object.keys(DEFAULT_LIMITS)){if(!Number.isInteger(out[k])||out[k]<=0)throw new RangeError('invalid surface renderer bound '+k)}return Object.freeze(out)}
function buildFrame(materialization,{patchLimit=9,limits={}}={}){
 if(!materialization)throw new TypeError('terrain materialization required');const bound=normalizeLimits(limits);
 if(materialization.status==='NO_SOLID_SURFACE')return freeze({version:VERSION,authority:AUTHORITY,status:'NO_SOLID_SURFACE',planetIdentity:materialization.planetIdentity,patches:[],commands:[],summary:{patches:0,polygons:0,coastlines:0,rivers:0,sourceVertices:0},limits:bound,truncated:{patches:0,polygons:0,coastlines:0,rivers:0},claims:{fabricatedSurface:false}});
 const requestedPatchLimit=Math.max(1,Math.floor(Number(patchLimit)||1)),patchCap=Math.min(bound.maxPatches,requestedPatchLimit),patches=materialization.patches.slice(0,patchCap),basis=tangentBasis(materialization.anchorAddress.unit),rawPanels=[],all=[],activePatchIds=new Set(patches.map(p=>p.patchIdentity)),seenRivers=new Set();
 const project=u=>{const q=[dot(u,basis.east),dot(u,basis.north)];all.push(q);return q};
 let polygonCount=0,coastCount=0,riverCount=0,commandCount=0,omittedPolygons=0,omittedCoasts=0,omittedRivers=0;
 let reliefMin=Infinity,reliefMax=-Infinity;
 for(const patch of patches){
  const res=patch.gridResolution,polygons=[];
  for(let y=0;y<res-1;y++)for(let x=0;x<res-1;x++){
   if(polygonCount>=bound.maxPolygons||commandCount>=bound.maxCommands){omittedPolygons++;continue}
   const ids=[patch.rows[y][x],patch.rows[y][x+1],patch.rows[y+1][x+1],patch.rows[y+1][x]],vs=ids.map(i=>patch.vertices[i]),points=vs.map(v=>project(v.unit));
   const average=vs.reduce((n,v)=>n+v.reliefCuePpm,0)/vs.length,spread=Math.max(...vs.map(v=>v.reliefCuePpm))-Math.min(...vs.map(v=>v.reliefCuePpm)),eastWest=(vs[1].reliefCuePpm+vs[2].reliefCuePpm-vs[0].reliefCuePpm-vs[3].reliefCuePpm)/2000000,northSouth=(vs[2].reliefCuePpm+vs[3].reliefCuePpm-vs[0].reliefCuePpm-vs[1].reliefCuePpm)/2000000,shadeCue=clamp(average/1000000*.12-eastWest*.18+northSouth*.10,-.26,.26),v0=vs[0];
   reliefMin=Math.min(reliefMin,...vs.map(v=>v.reliefCuePpm));reliefMax=Math.max(reliefMax,...vs.map(v=>v.reliefCuePpm));
   polygons.push({kind:'TERRAIN_CELL',points,fill:shadeHex(baseFill(v0),shadeCue),baseFill:baseFill(v0),reliefCue:average/1000000,reliefSpreadPpm:spread,shadeCue,materialFamily:v0.materialFamily,provinceClass:v0.provinceClass,surfaceClass:v0.surfaceClass});polygonCount++;commandCount++;
  }
  const coasts=[];for(const c of patch.coastSegments){if(coastCount>=bound.maxCoastlines||commandCount>=bound.maxCommands){omittedCoasts++;continue}coasts.push({kind:'COAST_PATH',points:c.points.map(p=>project(p.unit))});coastCount++;commandCount++}
  const rivers=[];
  for(const r of patch.drainage.rivers){
   if(seenRivers.has(r.riverIdentity))continue;seenRivers.add(r.riverIdentity);let segment=[];let segmentOrder=0;
   const flush=()=>{if(segment.length>=2){if(riverCount>=bound.maxRivers||commandCount>=bound.maxCommands)omittedRivers++;else{rivers.push({kind:'RIVER_PATH',riverIdentity:r.riverIdentity,riverOrder:segmentOrder,strokeWidthCue:1+Math.min(5,segmentOrder)*.22,points:segment});riverCount++;commandCount++}}segment=[];segmentOrder=0};
   for(const p of r.points){const a=A.locate(materialization.planetIdentity,p.latMicroDeg,p.lonMicroDeg,patch.level);if(activePatchIds.has(a.patchIdentity)){segment.push(project(a.unit));segmentOrder=Math.max(segmentOrder,Number(p.riverOrder)||0)}else flush()}flush();
  }
  rawPanels.push({patchIdentity:patch.patchIdentity,polygons,coasts,rivers,summary:patch.summary});
 }
 if(!all.length)throw new Error('surface frame has no projected geometry');
 let minX=Math.min(...all.map(p=>p[0])),maxX=Math.max(...all.map(p=>p[0])),minY=Math.min(...all.map(p=>p[1])),maxY=Math.max(...all.map(p=>p[1]));const spanX=Math.max(1e-9,maxX-minX),spanY=Math.max(1e-9,maxY-minY),padX=spanX*.035,padY=spanY*.035;minX-=padX;maxX+=padX;minY-=padY;maxY+=padY;const nx=p=>(p[0]-minX)/(maxX-minX),ny=p=>1-(p[1]-minY)/(maxY-minY),panels=[],commands=[];
 for(const panel of rawPanels){const polygons=panel.polygons.map(p=>freeze({...p,points:p.points.map(q=>freeze([nx(q),ny(q)]))})),coasts=panel.coasts.map(c=>freeze({kind:c.kind,points:c.points.map(q=>freeze([nx(q),ny(q)]))})),rivers=panel.rivers.map(r=>freeze({...r,points:r.points.map(q=>freeze([nx(q),ny(q)]))}));panels.push(freeze({patchIdentity:panel.patchIdentity,polygons,coasts,rivers,summary:panel.summary}));commands.push(...polygons,...coasts,...rivers)}
 const truncated={patches:Math.max(0,materialization.patches.length-patches.length),polygons:omittedPolygons,coastlines:omittedCoasts,rivers:omittedRivers},summary={patches:panels.length,polygons:polygonCount,coastlines:coastCount,rivers:riverCount,sourceVertices:materialization.resources.vertices,reliefMinPpm:Number.isFinite(reliefMin)?reliefMin:0,reliefMaxPpm:Number.isFinite(reliefMax)?reliefMax:0,reliefSpanPpm:Number.isFinite(reliefMin)&&Number.isFinite(reliefMax)?reliefMax-reliefMin:0,commands:commands.length};
 const frame={version:VERSION,authority:AUTHORITY,status:'READY',planetIdentity:materialization.planetIdentity,anchorLocationIdentity:materialization.anchorAddress.locationIdentity,projection:{kind:'LOCAL_TANGENT_SPHERICAL_PRESENTATION',bounds:[minX,maxX,minY,maxY]},patches:panels,commands,summary:freeze(summary),limits:bound,truncated:freeze(truncated),claims:{visualReliefMeasured:false,shorelineCanonical:false,riverPathPhysical:false,renderingMutatesWorld:false,patchLayoutIsMapProjection:true,reliefShadingPresentationOnly:true,presentationTruncationExplicit:true}};
 return freeze({...frame,frameDigest:stableDigest({planetIdentity:frame.planetIdentity,anchor:frame.anchorLocationIdentity,summary,truncated,commands:commands.map(c=>({kind:c.kind,fill:c.fill,riverIdentity:c.riverIdentity,riverOrder:c.riverOrder,points:c.points}))})});
}
function renderSvg(frame,width=960,height=640){
 const w=Math.max(64,Math.floor(width)),h=Math.max(64,Math.floor(height));
 if(frame.status==='NO_SOLID_SURFACE')return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#111827"/><text x="${w/2}" y="${h/2}" text-anchor="middle" fill="#d1d5db" font-family="sans-serif" font-size="22">NO SOLID SURFACE</text></svg>`;
 let out=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#071323"/>`;
 for(const panel of frame.patches){
  for(const p of panel.polygons){const points=p.points.map(q=>`${(q[0]*w).toFixed(2)},${(q[1]*h).toFixed(2)}`).join(' '),opacity=Math.max(.68,Math.min(1,.88+p.reliefCue*.16));out+=`<polygon points="${points}" fill="${p.fill}" stroke="${p.fill}" stroke-width="0.35" opacity="${opacity.toFixed(3)}"/>`}
  for(const c of panel.coasts){const pts=c.points.map(q=>`${(q[0]*w).toFixed(2)},${(q[1]*h).toFixed(2)}`).join(' ');out+=`<polyline points="${pts}" fill="none" stroke="#d0e4e8" stroke-width="1.2" stroke-linecap="round"/>`}
  for(const r of panel.rivers){const pts=r.points.map(q=>`${(q[0]*w).toFixed(2)},${(q[1]*h).toFixed(2)}`).join(' ');out+=`<polyline points="${pts}" fill="none" stroke="#7cc5df" stroke-width="${r.strokeWidthCue.toFixed(2)}" stroke-linecap="round" stroke-linejoin="round" opacity="0.92"/>`}
 }
 const trunc=frame.truncated.patches+frame.truncated.polygons+frame.truncated.coastlines+frame.truncated.rivers;
 out+=`<rect x="0" y="0" width="${w}" height="34" fill="#071323" opacity="0.78"/><text x="14" y="23" fill="#e5e7eb" font-family="sans-serif" font-size="14">${esc(frame.planetIdentity)} | patches ${frame.summary.patches} | coasts ${frame.summary.coastlines} | rivers ${frame.summary.rivers}${trunc?` | bounded omissions ${trunc}`:''}</text></svg>`;
 if(out.length>frame.limits.maxSvgBytes)throw new Error('surface SVG byte budget exceeded');return out;
}
function renderCanvas2D(ctx,frame,width,height){
 if(!ctx||typeof ctx.beginPath!=='function')throw new TypeError('CanvasRenderingContext2D-like context required');const w=Math.max(1,Number(width)||ctx.canvas?.width||1),h=Math.max(1,Number(height)||ctx.canvas?.height||1);ctx.fillStyle='#071323';ctx.fillRect(0,0,w,h);
 if(frame.status==='NO_SOLID_SURFACE')return freeze({version:'ofu-v2x-06-canvas-witness-2',authority:'MEASURED_RUNTIME_EVIDENCE',status:'NO_SOLID_SURFACE',width:w,height:h,drawCalls:1});
 let calls=1;
 for(const panel of frame.patches){
  for(const p of panel.polygons){ctx.beginPath();p.points.forEach((q,i)=>i?ctx.lineTo(q[0]*w,q[1]*h):ctx.moveTo(q[0]*w,q[1]*h));ctx.closePath();ctx.fillStyle=p.fill;ctx.fill();calls++}
  ctx.strokeStyle='#d0e4e8';ctx.lineWidth=1.2;for(const c of panel.coasts){ctx.beginPath();c.points.forEach((q,i)=>i?ctx.lineTo(q[0]*w,q[1]*h):ctx.moveTo(q[0]*w,q[1]*h));ctx.stroke();calls++}
  ctx.strokeStyle='#7cc5df';for(const r of panel.rivers){ctx.lineWidth=r.strokeWidthCue;ctx.beginPath();r.points.forEach((q,i)=>i?ctx.lineTo(q[0]*w,q[1]*h):ctx.moveTo(q[0]*w,q[1]*h));ctx.stroke();calls++}
 }
 return freeze({version:'ofu-v2x-06-canvas-witness-2',authority:'MEASURED_RUNTIME_EVIDENCE',status:'READY',width:w,height:h,drawCalls:calls,patches:frame.summary.patches,polygons:frame.summary.polygons,coastlines:frame.summary.coastlines,rivers:frame.summary.rivers,truncated:frame.truncated,frameDigest:frame.frameDigest,claims:{pixelOutputVisuallyInspected:false,gpuPathVerified:false}});
}
O.v2x06LivingSurfaceRenderer=Object.freeze({VERSION,AUTHORITY,DEFAULT_LIMITS,MATERIALS,PROVINCES,buildFrame,renderSvg,renderCanvas2D});
})(globalThis);
