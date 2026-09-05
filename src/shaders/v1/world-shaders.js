(function(root){
'use strict';const O=root.OFU=root.OFU||{};const VERSION='ofu-v1-world-shaders-1';
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
void main(){vec2 p=gl_PointCoord*2.0-1.0;float r=dot(p,p);if(r>1.0)discard;float a=1.0-smoothstep(.48,1.0,r);outColor=vec4(v_color.rgb,v_color.a*a);}`;
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
void main(){
 vec2 q=v_uv*vec2(max(1.,u_aspect),max(1.,1./u_aspect))/u_scale;
 float r2=dot(q,q);if(r2>1.10)discard;
 if(r2>1.){float halo=(1.-smoothstep(1.,1.10,r2))*u_atmosphere;outColor=vec4(.25,.48,.69,halo*.28);return;}
 float z=sqrt(max(0.,1.-r2));vec3 n=vec3(q,z);float cy=cos(u_yaw),sy=sin(u_yaw),cp=cos(u_pitch),sp=sin(u_pitch);
 vec3 w=vec3(n.x*cy+(n.z*cp-n.y*sp)*sy,n.y*cp+n.z*sp,-n.x*sy+(n.z*cp-n.y*sp)*cy);
 vec2 uv=vec2(atan(w.x,w.z)/6.28318530718+.5,.5-asin(clamp(w.y,-1.,1.))/3.14159265359);
 vec3 base=u_hasSurfaceMap>.5?texture(u_surfaceMap,uv).rgb:mix(u_primary,u_secondary,(sin(uv.y*55.)+1.)*.5);
 float light=.22+.78*max(0.,dot(n,normalize(vec3(-.5,.36,.8))));float rim=pow(1.-z,2.6)*u_atmosphere;
 outColor=vec4(base*light+vec3(.13,.28,.48)*rim,1.);
}`;
O.v1WorldShaders=Object.freeze({VERSION,pointsVertex,pointsFragment,globeVertex,globeFragment,authority:'PRESENTATION_ONLY',claims:Object.freeze({proceduralSurfaceIsCanonical:false,atomGlyphsArePhotography:false})});
})(globalThis);
