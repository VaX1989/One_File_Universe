const toRadians=degrees=>degrees*Math.PI/180;
const normalize=vector=>{const length=Math.hypot(...vector);if(!(length>0))throw new TypeError('Cannot normalize a zero vector');return vector.map(value=>value/length)};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];

function quaternionFromAxes(xAxis,yAxis,zAxis){
  const m00=xAxis[0],m01=yAxis[0],m02=zAxis[0],m10=xAxis[1],m11=yAxis[1],m12=zAxis[1],m20=xAxis[2],m21=yAxis[2],m22=zAxis[2],trace=m00+m11+m22;
  let x,y,z,w;
  if(trace>0){const s=Math.sqrt(trace+1)*2;w=.25*s;x=(m21-m12)/s;y=(m02-m20)/s;z=(m10-m01)/s;}
  else if(m00>m11&&m00>m22){const s=Math.sqrt(1+m00-m11-m22)*2;w=(m21-m12)/s;x=.25*s;y=(m01+m10)/s;z=(m02+m20)/s;}
  else if(m11>m22){const s=Math.sqrt(1+m11-m00-m22)*2;w=(m02-m20)/s;x=(m01+m10)/s;y=.25*s;z=(m12+m21)/s;}
  else{const s=Math.sqrt(1+m22-m00-m11)*2;w=(m10-m01)/s;x=(m02+m20)/s;y=(m12+m21)/s;z=.25*s;}
  return Object.freeze(normalize([x,y,z,w]));
}

export function surfaceTargetFromModel({bodyId,locationIdentity,latMicroDeg,lonMicroDeg,radiusM,authority='MODEL_DERIVED'}={}){
  const latitude=Number(latMicroDeg)/1e6, longitude=Number(lonMicroDeg)/1e6, radius=Number(radiusM);
  if(!bodyId||!locationIdentity)throw new TypeError('Surface target identity is required');
  if(!Number.isFinite(latitude)||latitude< -90||latitude>90||!Number.isFinite(longitude))throw new RangeError('Invalid model geodesy');
  if(!(radius>0)||!Number.isFinite(radius))throw new TypeError('Body radius must be positive');
  const lat=toRadians(latitude),lon=toRadians(((longitude+180)%360+360)%360-180),normal=normalize([Math.cos(lat)*Math.cos(lon),Math.sin(lat),Math.cos(lat)*Math.sin(lon)]),east=normalize([-Math.sin(lon),0,Math.cos(lon)]),north=normalize(cross(east,normal));
  return Object.freeze({
    contract:'ofu-spatial-continuum-surface-target-2',bodyId:String(bodyId),locationIdentity:String(locationIdentity),
    latitudeDeg:latitude,longitudeDeg:longitude,radiusM:radius,authority:String(authority),canonicalGeodesyClaim:false,
    bodyFixedUnit:Object.freeze(normal),bodyFixedMeters:Object.freeze(normal.map(value=>value*radius)),
    tangent:Object.freeze({east:Object.freeze(east),up:Object.freeze(normal),north:Object.freeze(north),orientation:Object.freeze(quaternionFromAxes(east,normal,north))})
  });
}

export function deterministicModelCoordinates(identity){
  let value=2166136261;
  for(const char of String(identity)){value^=char.charCodeAt(0);value=Math.imul(value,16777619)}
  const latitudeMicroDeg=((value&0xffff)/0xffff*120-60)*1e6;
  value=(Math.imul(value^0x9e3779b9,2246822519))>>>0;
  const longitudeMicroDeg=((value&0xffffff)/0xffffff*360-180)*1e6;
  return Object.freeze({latMicroDeg:Math.round(latitudeMicroDeg),lonMicroDeg:Math.round(longitudeMicroDeg),authority:'MODEL_DERIVED',canonicalGeodesyClaim:false});
}
