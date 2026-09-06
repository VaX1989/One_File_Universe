(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const VERSION='ofu-v1x-03-macro-shaders-1';
const AUTHORITY='PRESENTATION_ONLY';
const vertex=`#version 300 es
precision highp float;
in vec3 a_position;
in float a_radius;
in float a_alpha;
in float a_morphology;
in float a_selected;
uniform vec3 u_cameraPosition;
uniform vec3 u_cameraRight;
uniform vec3 u_cameraUp;
uniform vec3 u_cameraForward;
uniform float u_tanHalfFov;
uniform float u_aspect;
uniform float u_near;
uniform float u_far;
uniform float u_viewportHeight;
uniform float u_minPointPx;
uniform float u_maxPointPx;
out float v_alpha;
out float v_morphology;
out float v_selected;
out float v_viewDepth;
void main(){
  vec3 rel=a_position-u_cameraPosition;
  float vx=dot(rel,u_cameraRight);
  float vy=dot(rel,u_cameraUp);
  float vz=dot(rel,u_cameraForward);
  float safeZ=max(vz,0.000001);
  vec2 ndc=vec2(vx/(safeZ*u_tanHalfFov*u_aspect),vy/(safeZ*u_tanHalfFov));
  float depth=clamp((safeZ-u_near)/(u_far-u_near),0.0,1.0);
  gl_Position=vec4(ndc,depth*2.0-1.0,1.0);
  float focalPx=u_viewportHeight/(2.0*u_tanHalfFov);
  gl_PointSize=clamp((2.0*a_radius/safeZ)*focalPx,u_minPointPx,u_maxPointPx);
  v_alpha=a_alpha;
  v_morphology=a_morphology;
  v_selected=a_selected;
  v_viewDepth=safeZ;
}`;
const fragment=`#version 300 es
precision highp float;
in float v_alpha;
in float v_morphology;
in float v_selected;
in float v_viewDepth;
out vec4 outColor;
void main(){
  vec2 p=gl_PointCoord*2.0-1.0;
  if(v_morphology>0.5&&v_morphology<1.5)p.x*=1.28;
  float r=length(p);
  if(v_morphology>1.5&&v_morphology<2.5){
    float angle=atan(p.y,p.x);
    r+=0.06*sin(angle*2.0+r*10.0);
  }else if(v_morphology>2.5&&v_morphology<3.5){
    r+=0.07*sin(p.x*11.0)*sin(p.y*13.0);
  }
  float body=1.0-smoothstep(0.68,1.0,r);
  float ring=v_selected*(smoothstep(0.62,0.72,r)-smoothstep(0.82,0.96,r));
  float depthCue=clamp(1.05-0.035*log2(max(v_viewDepth,1.0)),0.42,1.0);
  float alpha=clamp((body+ring)*v_alpha,0.0,1.0);
  if(alpha<0.01)discard;
  vec3 neutral=vec3(0.90,0.94,1.0)*depthCue+vec3(0.04);
  outColor=vec4(neutral,alpha);
}`;
O.v1x03MacroShaders=Object.freeze({VERSION,AUTHORITY,vertex,fragment,claims:Object.freeze({morphologyCueIsLiteralImage:false,colorIsCanonical:false,brightnessIsPhysical:false,depthCueIsScientificEvidence:false})});
})(typeof globalThis!=='undefined'?globalThis:this);
