(function(root){
'use strict';
const O=root.OFU=root.OFU||{},M=O.v1x04SystemMath;
if(!M)throw new Error('V1X-04 orbit presentation requires system math');
const TAU=Math.PI*2;
const AUTHORITY='PRESENTATION_ONLY';
const PHASE='UNKNOWN_NOT_CANONICAL';
function stableHash(text){let h=2166136261>>>0;for(const c of String(text)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function unitHash(text,salt){let x=(stableHash(text)^Math.imul(salt+1,0x9e3779b1))>>>0;x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;x=Math.imul(x,0x846ca68b);x^=x>>>16;return(x>>>0)/4294967296}
function presentationAngles(entityId){
  return Object.freeze({longitudeAscendingNodeRad:unitHash(entityId,0)*TAU,argumentPeriapsisRad:unitHash(entityId,1)*TAU,anchorAnomalyRad:unitHash(entityId,2)*TAU,authority:AUTHORITY,currentOrbitalPhaseAuthority:PHASE});
}
function displaySemiMajorAxis(microAu){const au=Math.max(0,Number(microAu)/1e6);if(!Number.isFinite(au)||!(au>0))throw new RangeError('positive baselineSemiMajorAxisMicroAu required');return 14+22*Math.log1p(au)}
function rotateOrbitalPlane(x,y,inclination,node,periapsis){
  const cw=Math.cos(periapsis),sw=Math.sin(periapsis),ci=Math.cos(inclination),si=Math.sin(inclination),cn=Math.cos(node),sn=Math.sin(node);
  const xp=x*cw-y*sw,yp=x*sw+y*cw,yi=yp*ci,zi=yp*si;
  return Object.freeze([xp*cn-yi*sn,xp*sn+yi*cn,zi]);
}
function orbitPoint(facts,angles,eccentricAnomaly){
  const a=displaySemiMajorAxis(facts.baselineSemiMajorAxisMicroAu),e=Math.max(0,Math.min(.95,Number(facts.baselineEccentricityPpm||0)/1e6));
  const b=a*Math.sqrt(1-e*e),E=Number(eccentricAnomaly),x=a*(Math.cos(E)-e),y=b*Math.sin(E),inc=Number(facts.baselineInclinationMilliDeg||0)*Math.PI/180000;
  return rotateOrbitalPlane(x,y,inc,angles.longitudeAscendingNodeRad,angles.argumentPeriapsisRad);
}
function buildOrbit(entity,{segments=96}={}){
  if(!entity||!entity.id||!entity.facts)throw new TypeError('canonical planet envelope required');
  const n=Math.trunc(Number(segments));if(!(n>=24&&n<=256))throw new RangeError('orbit segment budget 24..256');
  const angles=presentationAngles(entity.id),vertices=[];for(let i=0;i<=n;i++)vertices.push(orbitPoint(entity.facts,angles,TAU*i/n));
  return Object.freeze({canonicalEntityId:String(entity.id),vertices:Object.freeze(vertices),presentationAnchor3d:orbitPoint(entity.facts,angles,angles.anchorAnomalyRad),geometryAuthority:AUTHORITY,inputFactsAuthority:'CANONICAL_PROVEN',scaleSemantics:'SCHEMATIC_LOG_AU',currentOrbitalPhaseAuthority:PHASE,limitations:Object.freeze(['P3 provides semi-major axis, eccentricity and inclination, but no canonical current orbital phase.','Longitude of ascending node and argument of periapsis are deterministic presentation angles, not physical facts.','Displayed radii are logarithmically compressed and are not metric scene distances.']),presentationAngles:angles});
}
O.v1x04OrbitPresentation=Object.freeze({VERSION:'ofu-v1x-04-orbit-presentation-1',AUTHORITY,PHASE,presentationAngles,displaySemiMajorAxis,orbitPoint,buildOrbit});
})(typeof globalThis!=='undefined'?globalThis:this);
