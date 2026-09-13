const hash=value=>{let out=2166136261;for(const char of String(value)){out^=char.charCodeAt(0);out=Math.imul(out,16777619)}return out>>>0};

export function deterministicTerrainHeight(x,z,seed){
  const phase=(hash(seed)%1000)/1000*Math.PI*2;
  const ridges=Math.sin(x*.43+phase)*Math.cos(z*.31-phase)*.65+Math.sin((x+z)*.16)*.72;
  const peak=4.2*Math.exp(-((x+4.3)**2+(z+3.2)**2)/13);
  const caldera=-1.7*Math.exp(-((x-3.8)**2+(z+2.4)**2)/5.5);
  const canyon=-1.15*Math.exp(-((x+z*.35-1.5)**2)/1.2);
  return ridges+peak+caldera+canyon;
}
