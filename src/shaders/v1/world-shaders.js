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
in vec2 v_uv;
out vec4 outColor;
uniform vec3 u_primary;uniform vec3 u_secondary;uniform vec3 u_ocean;uniform vec3 u_ice;uniform float u_water;uniform float u_iceArea;uniform float u_atmosphere;uniform float u_relief;uniform float u_seed;
float h(vec2 p){p=fract(p*vec2(123.34,456.21)+u_seed*.000001);p+=dot(p,p+45.32);return fract(p.x*p.y);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}void main(){float r2=dot(v_uv,v_uv);if(r2>1.08)discard;float haze=smoothstep(1.08,.92,r2)*u_atmosphere;if(r2>1.){outColor=vec4(vec3(.34,.55,.88),haze*.34);return;}float z=sqrt(max(0.,1.-r2));vec3 normal=normalize(vec3(v_uv,z)),lightDir=normalize(vec3(-.55,.35,.76));float light=.12+.88*max(0.,dot(normal,lightDir)),bands=n(v_uv*4.2)+.45*n(v_uv*10.7),wet=step(1.-u_water,bands*.68),icy=step(1.-u_iceArea,n(v_uv*6.4+8.));vec3 land=mix(u_primary,u_secondary,smoothstep(.45,.95,bands+u_relief*.15)),base=mix(land,u_ocean,wet);base=mix(base,u_ice,icy*.78);float rim=pow(1.-z,2.2)*u_atmosphere;outColor=vec4(base*light+vec3(.18,.32,.62)*rim,1.);}`;
O.v1WorldShaders=Object.freeze({VERSION,pointsVertex,pointsFragment,globeVertex,globeFragment,authority:'PRESENTATION_ONLY',claims:Object.freeze({proceduralSurfaceIsCanonical:false,atomGlyphsArePhotography:false})});
})(globalThis);
