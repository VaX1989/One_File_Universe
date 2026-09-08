(function(root){
'use strict';const O=root.OFU=root.OFU||{};const VERSION='ofu-v1-world-shaders-2';
const pointsVertex=`#version 300 es
precision highp float;
in vec3 a_position;
in vec4 a_color;
in float a_size;
out vec4 v_color;
void main(){gl_Position=vec4(a_position.xy*2.0-1.0,a_position.z,1.0);gl_PointSize=max(1.0,a_size);v_color=a_color;}`;
const pointsFragment=`#version 300 es
precision highp float;
in vec4 v_color;
out vec4 outColor;
void main(){
 vec2 p=gl_PointCoord*2.0-1.0;float r=dot(p,p);if(r>1.0)discard;
 float core=1.0-smoothstep(.0,.18,r);float body=1.0-smoothstep(.18,.60,r);float halo=1.0-smoothstep(.42,1.0,r);
 vec3 color=v_color.rgb*(.72+core*.78)+vec3(.92,.95,1.0)*core*.24;
 float alpha=v_color.a*clamp(body*.78+halo*.34+core*.24,0.0,1.0);
 outColor=vec4(color,alpha);
}`;
const globeVertex=`#version 300 es
precision highp float;
const vec2 POS[6]=vec2[6](vec2(-1.,-1.),vec2(1.,-1.),vec2(-1.,1.),vec2(-1.,1.),vec2(1.,-1.),vec2(1.,1.));
out vec2 v_uv;
void main(){vec2 p=POS[gl_VertexID];v_uv=p;gl_Position=vec4(p,0.,1.);}`;
const globeFragment=`#version 300 es
precision highp float;
in vec2 v_uv;out vec4 outColor;
uniform vec3 u_primary;uniform vec3 u_secondary;uniform vec3 u_ocean;uniform vec3 u_ice;
uniform float u_water;uniform float u_iceArea;uniform float u_atmosphere;uniform float u_relief;uniform float u_seed;
uniform sampler2D u_surfaceMap;uniform float u_hasSurfaceMap;uniform float u_aspect;uniform float u_yaw;uniform float u_pitch;uniform float u_scale;
float hash12(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
void main(){
 vec2 q=v_uv*vec2(max(1.,u_aspect),max(1.,1./u_aspect))/u_scale;
 float r2=dot(q,q);vec3 lightDir=normalize(vec3(-.55,.30,.78));
 if(r2>1.14)discard;
 if(r2>1.){
  float ring=1.-smoothstep(1.,1.14,r2);float edge=sqrt(r2);vec2 tangent=normalize(q+vec2(.00001));
  float forward=.55+.45*max(0.,dot(tangent,normalize(lightDir.xy)));
  float halo=ring*u_atmosphere*(.48+.52*forward);
  vec3 haloColor=mix(vec3(.18,.42,.72),vec3(.55,.67,.76),forward*.35);
  outColor=vec4(haloColor,halo*.34);return;
 }
 float z=sqrt(max(0.,1.-r2));vec3 n=normalize(vec3(q,z));float cy=cos(u_yaw),sy=sin(u_yaw),cp=cos(u_pitch),sp=sin(u_pitch);
 vec3 w=vec3(n.x*cy+(n.z*cp-n.y*sp)*sy,n.y*cp+n.z*sp,-n.x*sy+(n.z*cp-n.y*sp)*cy);
 vec2 uv=vec2(atan(w.x,w.z)/6.28318530718+.5,.5-asin(clamp(w.y,-1.,1.))/3.14159265359);
 vec3 base=u_hasSurfaceMap>.5?texture(u_surfaceMap,uv).rgb:mix(u_primary,u_secondary,(sin(uv.y*55.)+1.)*.5);
 float ndl=dot(n,lightDir);float daylight=smoothstep(-.16,.58,ndl);float diffuse=.105+.895*daylight;
 float fresnel=pow(clamp(1.-z,0.,1.),2.45);float reliefNoise=(hash12(uv*vec2(193.,97.)+u_seed)-.5)*u_relief*.075;
 base*=1.+reliefNoise;
 float oceanLike=(u_hasSurfaceMap>.5?1.-smoothstep(.085,.31,distance(base,u_ocean)):u_water)*clamp(u_water*1.7,0.,1.);
 vec3 halfDir=normalize(lightDir+vec3(0.,0.,1.));float spec=pow(max(0.,dot(n,halfDir)),72.)*max(0.,ndl)*oceanLike*.78;
 float iceLike=(u_hasSurfaceMap>.5?1.-smoothstep(.09,.30,distance(base,u_ice)):u_iceArea)*clamp(u_iceArea*2.,0.,1.);
 float iceSheen=pow(max(0.,dot(n,halfDir)),24.)*max(0.,ndl)*iceLike*.16;
 vec3 atmosphereColor=mix(vec3(.12,.32,.62),vec3(.33,.56,.78),daylight);
 vec3 rayleigh=atmosphereColor*fresnel*u_atmosphere*(.22+.64*daylight);
 float mie=pow(max(0.,ndl),9.)*fresnel*u_atmosphere*.11;
 vec3 color=base*diffuse+rayleigh+vec3(1.,.72,.42)*mie+vec3(.82,.92,1.)*(spec+iceSheen);
 color*=1.-fresnel*.055;
 float dither=(hash12(gl_FragCoord.xy)-.5)/255.;color+=dither;
 outColor=vec4(max(color,vec3(0.)),1.);
}`;
O.v1WorldShaders=Object.freeze({VERSION,pointsVertex,pointsFragment,globeVertex,globeFragment,authority:'PRESENTATION_ONLY',claims:Object.freeze({proceduralSurfaceIsCanonical:false,atomGlyphsArePhotography:false,atmosphereIsMeasuredOpticalDepth:false,specularCueIsMeasuredBRDF:false})});
})(globalThis);
