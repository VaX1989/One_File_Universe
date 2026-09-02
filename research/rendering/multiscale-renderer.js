(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const A=O.p3Astronomy;
if(!A)throw new Error('render research requires canonical P3');
const SCENARIOS=Object.freeze({
 ASTRONOMICAL_OVERVIEW:{maxQueries:125,maxObjects:125},GALAXY_REGION:{maxQueries:64,maxObjects:64},SYSTEM_VIEW:{maxQueries:16,maxObjects:16},PLANET_ORBIT:{maxQueries:10,maxObjects:10},PLANET_APPROACH:{maxQueries:4,maxObjects:4},SURFACE_LOCAL:{maxQueries:2,maxObjects:64}
});
function hex(b){return O.p2.hex(b)}
function split64(x){const hi=Math.fround(Number(x));return [hi,Number(x)-hi]}
function cameraRelative(world,camera){return [Number(world[0]-camera[0]),Number(world[1]-camera[1]),Number(world[2]-camera[2])]}
class LRU{
 constructor(maxEntries=256){if(!Number.isInteger(maxEntries)||maxEntries<1)throw new Error('invalid cache bound');this.maxEntries=maxEntries;this.map=new Map();this.evictions=0}
 get(k){if(!this.map.has(k))return null;const v=this.map.get(k);this.map.delete(k);this.map.set(k,v);return v}
 set(k,v){if(this.map.has(k))this.map.delete(k);this.map.set(k,v);while(this.map.size>this.maxEntries){this.map.delete(this.map.keys().next().value);this.evictions++}return v}
 clear(){this.map.clear()}
 stats(){return{entries:this.map.size,maxEntries:this.maxEntries,evictions:this.evictions}}
}
function createSession(ctx,{maxCacheEntries=256}={}){return{ctx,cache:new LRU(maxCacheEntries),queries:0,materialized:0}}
function keyString(kind,key){return kind+':'+JSON.stringify(key,(k,v)=>typeof v==='bigint'?v.toString():v instanceof Uint8Array?hex(v):v)}
function resolve(session,kind,key){const k=keyString(kind,key),cached=session.cache.get(k);if(cached)return cached;const q=A.resolveWithMetrics(kind,session.ctx,key);session.queries++;const v=Object.freeze({kind,key,result:q.result,metrics:q.metrics});session.cache.set(k,v);return v}
function presentationObject(entity,position=[0n,0n,0n],scale=1){return Object.freeze({authority:'PRESENTATION_ONLY',entityId:entity?.id||null,entityType:entity?.entityType||'PRESENTATION',position,scale})}
function analyticSpherePatch(level=3){const n=Math.max(2,Math.min(32,1<<Math.min(level,5))),verts=[];for(let y=0;y<=n;y++)for(let x=0;x<=n;x++){const u=x/n,v=y/n,lon=(u-.5)*Math.PI/2,lat=(v-.5)*Math.PI/2;verts.push([Math.cos(lat)*Math.cos(lon),Math.sin(lat),Math.cos(lat)*Math.sin(lon)])}return Object.freeze({authority:'PRESENTATION_ONLY',provider:'analytic-sphere-v1',vertices:Object.freeze(verts),vertexCount:verts.length})}
function plan(session,scenario,key){if(!SCENARIOS[scenario])throw new Error('unknown scenario');const out=[];
 if(scenario==='ASTRONOMICAL_OVERVIEW'){for(let z=-2n;z<=2n;z++)for(let y=-2n;y<=2n;y++)for(let x=-2n;x<=2n;x++){const r=resolve(session,'galaxy',{x:key.x+x,y:key.y+y,z:key.z+z});if(r.result.status==='PRESENT')out.push(presentationObject(r.result,[x,y,z],1))}}
 else if(scenario==='GALAXY_REGION'){const g=resolve(session,'galaxy',key);if(g.result.status==='PRESENT')for(let z=0n;z<4n;z++)for(let y=0n;y<4n;y++)for(let x=0n;x<4n;x++){const s=resolve(session,'sector',{galaxyId:g.result.id,x,y,z});if(s.result.status==='PRESENT')out.push(presentationObject(s.result,[x,y,z],1))}}
 else {const systemKey=key.systemKey||key;const sys=resolve(session,'system',systemKey);if(sys.result.status!=='PRESENT')return report(session,scenario,out);
   if(scenario==='SYSTEM_VIEW'){out.push(presentationObject(sys.result));for(let i=0n;i<BigInt(sys.result.facts.stellarComponentCount);i++){const s=resolve(session,'star',{...systemKey,componentIndex:i});if(s.result.status==='PRESENT')out.push(presentationObject(s.result,[i*2n,0n,0n],1))}for(let i=0n;i<BigInt(sys.result.facts.planetCount);i++){const p=resolve(session,'planet',{...systemKey,orbitSlot:i});if(p.result.status==='PRESENT')out.push(presentationObject(p.result,[BigInt(Number(i)+3),0n,0n],1))}}
   else {const p=resolve(session,'planet',{...systemKey,orbitSlot:key.orbitSlot??0n});if(p.result.status==='PRESENT'){out.push(presentationObject(p.result));if(scenario==='PLANET_ORBIT')for(let i=0n;i<BigInt(p.result.facts.moonCount);i++){const m=resolve(session,'moon',{...systemKey,orbitSlot:key.orbitSlot??0n,satelliteSlot:i});if(m.result.status==='PRESENT')out.push(presentationObject(m.result,[i+2n,0n,0n],.2))}if(scenario==='SURFACE_LOCAL')out.push(analyticSpherePatch(key.surfaceLevel??3));}}
 }
 return report(session,scenario,out)}
function report(session,scenario,objects){session.materialized=objects.length;const budget=SCENARIOS[scenario];if(session.queries>budget.maxQueries)throw new Error('query budget exceeded');if(objects.length>budget.maxObjects)throw new Error('materialization budget exceeded');return Object.freeze({scenario,objects:Object.freeze(objects),queryCount:session.queries,materializedObjects:objects.length,cache:session.cache.stats(),budget})}
function shader(gl,type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s)||'shader compile failed');return s}
function renderWebGL2(canvas,scene,{camera=[0n,0n,0n]}={}){if(!canvas||typeof canvas.getContext!=='function')return{backend:'unavailable'};let gl;try{gl=canvas.getContext('webgl2',{antialias:true,alpha:false})}catch{}if(!gl)return{backend:'unavailable'};const vs=shader(gl,gl.VERTEX_SHADER,'#version 300 es\nin vec3 p;void main(){gl_Position=vec4(p,1.0);gl_PointSize=7.0;}'),fs=shader(gl,gl.FRAGMENT_SHADER,'#version 300 es\nprecision mediump float;out vec4 c;void main(){c=vec4(0.72,0.86,1.0,1.0);}'),prog=gl.createProgram();gl.attachShader(prog,vs);gl.attachShader(prog,fs);gl.bindAttribLocation(prog,0,'p');gl.linkProgram(prog);if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(prog)||'program link failed');const coords=[];for(const o of scene.objects){if(!o.position)continue;const r=cameraRelative(o.position,camera),m=Math.max(1,Math.abs(r[0]),Math.abs(r[1]),Math.abs(r[2]));coords.push(r[0]/m*.7,r[1]/m*.7,r[2]/m*.7)}const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(coords),gl.STREAM_DRAW);gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(.01,.015,.03,1);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(prog);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);gl.drawArrays(gl.POINTS,0,coords.length/3);gl.deleteBuffer(buf);gl.deleteProgram(prog);gl.deleteShader(vs);gl.deleteShader(fs);return{backend:'webgl2',drawCalls:1,renderedPoints:coords.length/3}}
function probe(){const nav=typeof navigator!=='undefined'?navigator:null;let webgl2=false;if(typeof document!=='undefined'){try{webgl2=!!document.createElement('canvas').getContext('webgl2')}catch{}}return{webgl2,webgpu:!!(nav&&nav.gpu)}}
function canonicalWitness(ctx,key){const p=A.resolvePlanet(ctx,key);return p.status==='PRESENT'?hex(A.digestFact(p)):p.status}
function createSurfaceProviderAdapter(provider){if(!provider||typeof provider.getPatch!=='function')throw new Error('invalid surface provider');return Object.freeze({version:'render-surface-provider-adapter-v1',authority:'CONSUMER_ONLY',getPatch:(req)=>provider.getPatch(req)})}
O.renderResearch=Object.freeze({SCENARIOS,LRU,createSession,resolve,plan,split64,cameraRelative,analyticSpherePatch,renderWebGL2,probe,canonicalWitness,createSurfaceProviderAdapter});
})(typeof globalThis!=='undefined'?globalThis:this);
