(function(root){
'use strict';
const O=root.OFU=root.OFU||{},VERSION='ofu-render-fxaa-2',AUTHORITY='PRESENTATION_ONLY';
function fail(c,m){const e=new Error(m);e.code=c;throw e}function clamp(x,a,b){x=Number(x);if(!Number.isFinite(x))fail('NUMBER','non-finite');return Math.max(a,Math.min(b,x))}function vec2(v,label,{positive=false}={}){if(!Array.isArray(v)||v.length!==2)fail('INPUT',label);const n=v.map(Number);if(n.some(x=>!Number.isFinite(x))||positive&&n.some(x=>!(x>0)))fail('INPUT',label);return n}
const VERTEX_GLSL=`#version 300 es
precision highp float;
out vec2 vUv;
void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);vUv=p*.5;gl_Position=vec4(p*2.0-1.0,0.0,1.0);}`;
const FRAGMENT_GLSL=`#version 300 es
precision highp float;
uniform sampler2D uColor;
uniform vec2 uInvResolution;
uniform float uEdgeThreshold;
uniform float uSubpixel;
in vec2 vUv;out vec4 outColor;
float luma(vec3 c){return dot(c,vec3(0.299,0.587,0.114));}
void main(){vec3 m=texture(uColor,vUv).rgb;vec3 n=texture(uColor,vUv+vec2(0.,-uInvResolution.y)).rgb;vec3 s=texture(uColor,vUv+vec2(0.,uInvResolution.y)).rgb;vec3 e=texture(uColor,vUv+vec2(uInvResolution.x,0.)).rgb;vec3 w=texture(uColor,vUv+vec2(-uInvResolution.x,0.)).rgb;float lm=luma(m),mn=min(lm,min(min(luma(n),luma(s)),min(luma(e),luma(w)))),mx=max(lm,max(max(luma(n),luma(s)),max(luma(e),luma(w))));float range=mx-mn;if(range<max(uEdgeThreshold,mx*0.0833)){outColor=vec4(m,1.);return;}vec2 dir=vec2(luma(w)-luma(e),luma(n)-luma(s));float d=max(abs(dir.x),abs(dir.y));dir=d>1e-5?dir/d:vec2(0.);vec3 a=.5*(texture(uColor,vUv+dir*uInvResolution*.333).rgb+texture(uColor,vUv-dir*uInvResolution*.333).rgb);outColor=vec4(mix(m,a,uSubpixel),1.);}`;
function config({edgeThreshold=.0312,subpixel=.75}={}){return Object.freeze({version:VERSION,authority:AUTHORITY,edgeThreshold:clamp(edgeThreshold,.005,.25),subpixel:clamp(subpixel,0,1),scientificTruthChanged:false})}
function referencePixel(sample,uv,invResolution,cfg=config()){if(typeof sample!=='function')fail('INPUT','sample');uv=vec2(uv,'uv');invResolution=vec2(invResolution,'invResolution',{positive:true});const L=c=>c[0]*.299+c[1]*.587+c[2]*.114,S=(dx,dy)=>{const raw=sample(uv[0]+dx*invResolution[0],uv[1]+dy*invResolution[1]);if(!Array.isArray(raw)||raw.length<3)fail('INPUT','sample rgb');return raw.slice(0,3).map(x=>clamp(x,0,1))};const m=S(0,0),n=S(0,-1),s=S(0,1),e=S(1,0),w=S(-1,0),lm=L(m),vals=[lm,L(n),L(s),L(e),L(w)],mn=Math.min(...vals),mx=Math.max(...vals),range=mx-mn;if(range<Math.max(cfg.edgeThreshold,mx*.0833))return Object.freeze(m);let dx=L(w)-L(e),dy=L(n)-L(s),d=Math.max(Math.abs(dx),Math.abs(dy));if(d<=1e-9)return Object.freeze(m);dx/=d;dy/=d;const a=S(dx*.333,dy*.333),b=S(-dx*.333,-dy*.333);return Object.freeze(m.map((x,i)=>x*(1-cfg.subpixel)+(a[i]+b[i])*.5*cfg.subpixel))}
O.renderFXAA=Object.freeze({VERSION,AUTHORITY,VERTEX_GLSL,FRAGMENT_GLSL,config,referencePixel});
})(typeof globalThis!=='undefined'?globalThis:this);
