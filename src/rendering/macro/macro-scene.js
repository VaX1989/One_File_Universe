(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const VERSION='ofu-wave-iv-macro-scene-1';
const CONTRACT='ofu-macro-scene-provider-1';
const AUTHORITY=Object.freeze({
  CANONICAL_GEOMETRY:'CANONICAL_GEOMETRY',
  CANONICAL_ORDER_PRESENTATION_GEOMETRY:'CANONICAL_ORDER_PRESENTATION_GEOMETRY',
  PRESENTATION_ONLY:'PRESENTATION_ONLY',
  DECORATIVE_ONLY:'DECORATIVE_ONLY'
});
const SCALE=Object.freeze({GALAXY:'GALAXY',NEIGHBORHOOD:'NEIGHBORHOOD',SYSTEM:'SYSTEM',ORBIT:'ORBIT'});
const CAPS=Object.freeze({
  galaxyQueries:64,
  visibleGalaxies:24,
  neighborhoodQueries:192,
  visibleSystems:24,
  visibleStars:4,
  visiblePlanets:10,
  labelsDesktop:16,
  labelsMobile:8,
  hitObjects:24,
  decorativeDepth:72,
  decorativeDepthHard:96,
  cachedScenes:8,
  totalSceneObjects:128
});
const SYSTEM_FIELDS=Object.freeze(['galaxyX','galaxyY','galaxyZ','sectorX','sectorY','sectorZ','siteX','siteY','siteZ']);
const PLANET_FIELDS=Object.freeze([...SYSTEM_FIELDS,'orbitSlot']);
const SITE_AXIS=512n, SECTOR_MILLI_PC=256000n, GALAXY_CELL_PC=500000n;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)));
const finite=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
const titleCase=value=>String(value||'').toLowerCase().replace(/(^|_)([a-z])/g,(_,space,c)=>(space?' ':'')+c.toUpperCase());
function deepFreeze(value){
  if(!value||typeof value!=='object'||Object.isFrozen(value))return value;
  if(ArrayBuffer.isView(value))return value;
  for(const key of Object.keys(value))deepFreeze(value[key]);
  return Object.freeze(value);
}
function bi(value,label='value'){try{return BigInt(value)}catch{throw new TypeError(label+' must be an integer')}}
function floorDiv(a,b){a=bi(a);b=bi(b);let q=a/b,r=a%b;if(r<0n){q-=1n;r+=b}return q}
function floorMod(a,b){const r=bi(a)%bi(b);return r<0n?r+bi(b):r}
function freezeKey(key,fields=SYSTEM_FIELDS){if(!key)throw new TypeError('canonical key required');return Object.freeze(Object.fromEntries(fields.map(name=>[name,bi(key[name],name)])))}
function systemKey(key){return freezeKey(key,SYSTEM_FIELDS)}
function planetKey(key,orbitSlot=key?.orbitSlot??0n){return Object.freeze({...freezeKey(key,SYSTEM_FIELDS),orbitSlot:bi(orbitSlot,'orbitSlot')})}
function keyToken(key,fields=SYSTEM_FIELDS){return fields.map(name=>name+'='+bi(key[name],name).toString()).join(';')}
function canonicalId(entity,fallback){
  if(entity?.id&&O.p2?.hex)try{return O.p2.hex(entity.id)}catch{}
  if(typeof entity?.id==='string'&&entity.id)return entity.id;
  return String(fallback||'canonical-object');
}
function stableHash(text){let h=2166136261>>>0;for(const c of String(text)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rand01(seed,index){let x=(seed+Math.imul(index+1,0x9e3779b1))>>>0;x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;x=Math.imul(x,0x846ca68b);x^=x>>>16;return(x>>>0)/4294967296}
function decorativeDepth(seedText,count=CAPS.decorativeDepth){
  const seed=stableHash(seedText),n=clamp(Math.floor(finite(count,CAPS.decorativeDepth)),0,CAPS.decorativeDepthHard),points=[];
  for(let i=0;i<n;i++)points.push(deepFreeze({
    objectId:'decorative-depth-'+i,
    role:'DECORATIVE_DEPTH',authority:AUTHORITY.DECORATIVE_ONLY,canonical:false,selectable:false,navigable:false,
    presentationGeometry:{x:rand01(seed,i*5),y:rand01(seed,i*5+1),depth:rand01(seed,i*5+2),sizePx:0.55+rand01(seed,i*5+3)*1.35,opacity:0.14+rand01(seed,i*5+4)*0.44},
    claims:{canonicalPopulation:false,physicalDistance:false,physicalBrightness:false}
  }));
  return Object.freeze(points);
}
function offsets3(radius,limit){
  const out=[];
  for(let z=-radius;z<=radius;z++)for(let y=-radius;y<=radius;y++)for(let x=-radius;x<=radius;x++)out.push({x,y,z,d2:x*x+y*y+z*z});
  out.sort((a,b)=>a.d2-b.d2||Math.abs(a.z)-Math.abs(b.z)||Math.abs(a.y)-Math.abs(b.y)||Math.abs(a.x)-Math.abs(b.x)||a.z-b.z||a.y-b.y||a.x-b.x);
  return out.slice(0,limit);
}
function projectRelative(vector,span){
  const x=finite(vector?.x),y=finite(vector?.y),z=finite(vector?.z),s=Math.max(1,finite(span,1));
  return Object.freeze({
    x:clamp(.5+((x+z*.28)/(s*2))*.82,.06,.94),
    y:clamp(.5+((y-z*.18)/(s*2))*.82,.08,.92),
    depth:clamp(.5+z/(s*2),0,1),
    authority:AUTHORITY.PRESENTATION_ONLY,
    physicalProjectionClaim:false
  });
}
function galaxyKeyFromProduct(key,dx=0,dy=0,dz=0){return Object.freeze({siteCellX:bi(key.galaxyX)+BigInt(dx),siteCellY:bi(key.galaxyY)+BigInt(dy),siteCellZ:bi(key.galaxyZ)+BigInt(dz)})}
function shiftSystemKey(input,dx,dy,dz){
  const k=systemKey(input),axis=(sector,site,delta)=>{const absolute=bi(sector)*SITE_AXIS+bi(site)+BigInt(delta);return{sector:floorDiv(absolute,SITE_AXIS),site:floorMod(absolute,SITE_AXIS)}};
  const x=axis(k.sectorX,k.siteX,dx),y=axis(k.sectorY,k.siteY,dy),z=axis(k.sectorZ,k.siteZ,dz);
  return Object.freeze({galaxyX:k.galaxyX,galaxyY:k.galaxyY,galaxyZ:k.galaxyZ,sectorX:x.sector,sectorY:y.sector,sectorZ:z.sector,siteX:x.site,siteY:y.site,siteZ:z.site});
}
function systemPositionMilliPc(key,system){
  const k=systemKey(key),f=system?.facts||{},off=f.baselineLocalOffsetMilliPc||{};
  const axis=(sector,site,value)=>bi(sector)*SECTOR_MILLI_PC+(value===undefined?bi(site)*500n:bi(value));
  return Object.freeze({x:axis(k.sectorX,k.siteX,off.x),y:axis(k.sectorY,k.siteY,off.y),z:axis(k.sectorZ,k.siteZ,off.z)});
}
function relativeVector(a,b){return Object.freeze({x:bi(a.x)-bi(b.x),y:bi(a.y)-bi(b.y),z:bi(a.z)-bi(b.z)})}
function numberVector(v){return{x:Number(v.x),y:Number(v.y),z:Number(v.z)}}
function maxAbsVector(vectors,fallback=1){let m=finite(fallback,1);for(const v of vectors)m=Math.max(m,Math.abs(finite(v.x)),Math.abs(finite(v.y)),Math.abs(finite(v.z)));return m}
function evidenceFor(A,name){return A?.EVIDENCE?.[name]?deepFreeze({...A.EVIDENCE[name]}):null}
function unsupported(scale,reason,meta={}){return deepFreeze({version:VERSION,contract:CONTRACT,scale,status:'UNSUPPORTED',reason,objects:[],guides:[],decorative:[],...meta})}
function baseClaims(){return Object.freeze({
  presentationIsCanonicalTime:false,
  transitionIsOrbitalMotion:false,
  apparentBrightnessPhysical:false,
  canonicalColor:false,
  physicalAngularSize:false,
  presentDayOrbitalPhase:false,
  decorativeObjectsCanonical:false
})}
function sceneEnvelope(scale,objects,guides,decorative,extra={}){
  if(objects.length+guides.length+decorative.length>CAPS.totalSceneObjects)throw new Error('macro scene object cap exceeded');
  return deepFreeze({version:VERSION,contract:CONTRACT,scale,status:'READY',authorityModel:AUTHORITY,objects,guides,decorative,claims:baseClaims(),bounds:{...CAPS},...extra});
}
function galaxyScene(ctx,selectedInput,opts={}){
  const A=O.p3Astronomy;if(!A||!ctx||!selectedInput)throw new Error('P3 context and selected canonical key required');
  const selected=systemKey(selectedInput),selectedGalaxyKey=galaxyKeyFromProduct(selected),selectedGalaxy=A.resolveGalaxy(ctx,selectedGalaxyKey);
  if(selectedGalaxy?.status!=='PRESENT')return unsupported(SCALE.GALAXY,'SELECTED_GALAXY_ABSENT');
  const regionCoords=A.containingRegionCoords?.(selected.galaxyX,selected.galaxyY,selected.galaxyZ)||{x:floorDiv(selected.galaxyX,32n),y:floorDiv(selected.galaxyY,32n),z:floorDiv(selected.galaxyZ,32n)};
  const region=A.resolveRegion(ctx,regionCoords),selectedOffset=selectedGalaxy.facts?.cellOffsetPc||{x:0n,y:0n,z:0n};
  const candidates=[],queryOffsets=offsets3(3,Math.min(CAPS.galaxyQueries,Math.max(1,Number(opts.queryCap||CAPS.galaxyQueries))));let queries=0;
  for(const off of queryOffsets){
    const gk=galaxyKeyFromProduct(selected,off.x,off.y,off.z),galaxy=A.resolveGalaxy(ctx,gk);queries++;
    if(galaxy?.status!=='PRESENT')continue;
    const go=galaxy.facts.cellOffsetPc||{x:0n,y:0n,z:0n};
    const rel={x:(gk.siteCellX-selected.galaxyX)*GALAXY_CELL_PC+bi(go.x)-bi(selectedOffset.x),y:(gk.siteCellY-selected.galaxyY)*GALAXY_CELL_PC+bi(go.y)-bi(selectedOffset.y),z:(gk.siteCellZ-selected.galaxyZ)*GALAXY_CELL_PC+bi(go.z)-bi(selectedOffset.z)};
    candidates.push({key:gk,galaxy,rel});if(candidates.length>=CAPS.visibleGalaxies)break;
  }
  if(!candidates.some(c=>c.key.siteCellX===selected.galaxyX&&c.key.siteCellY===selected.galaxyY&&c.key.siteCellZ===selected.galaxyZ))candidates.unshift({key:selectedGalaxyKey,galaxy:selectedGalaxy,rel:{x:0n,y:0n,z:0n}});
  const span=maxAbsVector(candidates.map(c=>numberVector(c.rel)),GALAXY_CELL_PC),objects=[];
  for(let i=0;i<candidates.slice(0,CAPS.visibleGalaxies).length;i++){
    const c=candidates[i],f=c.galaxy.facts||{},isSelected=c.key.siteCellX===selected.galaxyX&&c.key.siteCellY===selected.galaxyY&&c.key.siteCellZ===selected.galaxyZ,id=canonicalId(c.galaxy,'galaxy-'+[c.key.siteCellX,c.key.siteCellY,c.key.siteCellZ].map(String).join('/'));
    const pg=projectRelative(numberVector(c.rel),span),radius=finite(f.characteristicRadiusPc,200);
    objects.push(deepFreeze({
      objectId:'galaxy:'+id,kind:'GALAXY',role:'CANONICAL_NAVIGABLE',canonical:true,canonicalId:id,selectedPath:isSelected,
      authority:AUTHORITY.CANONICAL_GEOMETRY,geometryAuthority:AUTHORITY.CANONICAL_GEOMETRY,
      canonicalKey:{galaxyX:c.key.siteCellX,galaxyY:c.key.siteCellY,galaxyZ:c.key.siteCellZ},
      canonicalGeometry:{relativeCenterPc:{...c.rel},characteristicRadiusPc:bi(f.characteristicRadiusPc||0n),orientation:f.orientation||null,morphology:String(f.morphology||'UNKNOWN')},
      presentationGeometry:{...pg,glyphRadiusPx:clamp(5+Math.log10(Math.max(200,radius))*2.1,7,22),morphologyGlyph:String(f.morphology||'UNKNOWN'),physicalImageClaim:false},
      canonicalFacts:{morphology:String(f.morphology||'UNKNOWN'),populationAgeMyr:f.populationAgeMyr??null,metallicityMilliDex:f.metallicityMilliDex??null,starFormationActivityQ16:f.starFormationActivityQ16??null},
      evidence:{galaxyPopulation:evidenceFor(A,'galaxyPopulation')},
      interaction:{hitTargetEligible:true,activation:'FOCUS_GALAXY',selectionAuthority:'NAVIGATION_ONLY',selectable:false,navigable:true},
      label:isSelected?'Selected galaxy':titleCase(f.morphology||'Galaxy')+' galaxy',
      claims:{morphologyGlyphIsLiteralImage:false,screenPositionIsPhysicalAngularPosition:false}
    }));
  }
  const guides=[];
  if(region?.status==='PRESENT')guides.push(deepFreeze({
    objectId:'region-context',kind:'REGION_CONTEXT',role:'CANONICAL_CONTEXT',canonical:true,selectable:false,navigable:false,
    authority:AUTHORITY.CANONICAL_GEOMETRY,canonicalId:canonicalId(region,'region-context'),
    canonicalGeometry:{regionCoords:{x:bi(regionCoords.x),y:bi(regionCoords.y),z:bi(regionCoords.z)},galaxyCellSpan:bi(region.facts.galaxyCellSpan),galaxyCellSizeKpc:bi(region.facts.galaxyCellSizeKpc)},
    canonicalFacts:{environmentClass:String(region.facts.environmentClass),densityQ16:bi(region.facts.densityQ16)},
    evidence:{regionDensity:evidenceFor(A,'regionDensity')},
    presentationGeometry:{role:'VIEWPORT_FRAME',authority:AUTHORITY.PRESENTATION_ONLY},
    claims:{densityIsObservedPhysicalMap:false}
  }));
  return sceneEnvelope(SCALE.GALAXY,objects,guides,decorativeDepth('galaxy:'+canonicalId(selectedGalaxy)),{
    selectedPath:{galaxyId:canonicalId(selectedGalaxy),systemKey:selected},
    discovery:{queryCount:queries,queryCap:CAPS.galaxyQueries,visibleCount:objects.length,visibleCap:CAPS.visibleGalaxies,enumeratesUniverse:false},
    semantics:{layout:'CANONICAL_RELATIVE_CENTERS_WITH_PRESENTATION_PROJECTION',galaxyMorphology:'CANONICAL_MODEL_FACT',regionDensity:'CANONICAL_MODEL_FACT_HYPOTHETICAL_STYLIZED'}
  });
}
function neighborhoodScene(ctx,selectedInput,opts={}){
  const A=O.p3Astronomy;if(!A||!ctx||!selectedInput)throw new Error('P3 context and selected canonical key required');
  const selected=systemKey(selectedInput),origin=A.resolveSystem(ctx,selected);if(origin?.status!=='PRESENT')return unsupported(SCALE.NEIGHBORHOOD,'SELECTED_SYSTEM_ABSENT');
  const originPos=systemPositionMilliPc(selected,origin),queryCap=Math.min(CAPS.neighborhoodQueries,Math.max(1,Number(opts.queryCap||CAPS.neighborhoodQueries))),offsets=offsets3(8,queryCap),found=[],seen=new Set();let queries=0;
  for(const off of offsets){
    const key=shiftSystemKey(selected,off.x,off.y,off.z),token=keyToken(key);if(seen.has(token))continue;seen.add(token);const system=A.resolveSystem(ctx,key);queries++;
    if(system?.status!=='PRESENT')continue;
    const pos=systemPositionMilliPc(key,system),rel=relativeVector(pos,originPos);found.push({key,system,pos,rel});if(found.length>=CAPS.visibleSystems)break;
  }
  if(!found.some(c=>keyToken(c.key)===keyToken(selected)))found.unshift({key:selected,system:origin,pos:originPos,rel:{x:0n,y:0n,z:0n}});
  const span=maxAbsVector(found.map(c=>numberVector(c.rel)),500),objects=[];
  for(let i=0;i<found.slice(0,CAPS.visibleSystems).length;i++){
    const c=found[i],f=c.system.facts||{},isSelected=keyToken(c.key)===keyToken(selected),id=canonicalId(c.system,'system-'+i),pg=projectRelative(numberVector(c.rel),span),dMilliPc=Math.hypot(Number(c.rel.x),Number(c.rel.y),Number(c.rel.z));
    objects.push(deepFreeze({
      objectId:'system:'+id,kind:'SYSTEM',role:'CANONICAL_NAVIGABLE',canonical:true,canonicalId:id,selectedPath:isSelected,
      authority:AUTHORITY.CANONICAL_GEOMETRY,geometryAuthority:AUTHORITY.CANONICAL_GEOMETRY,canonicalKey:c.key,
      canonicalGeometry:{absolutePositionMilliPc:c.pos,relativePositionMilliPc:c.rel,baselineEpoch:A.BASELINE_EPOCH||'P4_T0'},
      presentationGeometry:{...pg,glyphRadiusPx:clamp(5+Number(f.stellarComponentCount||1n)*1.15,6,11),distancePcApprox:dMilliPc/1000,distanceLabelAuthority:AUTHORITY.PRESENTATION_ONLY},
      canonicalFacts:{stellarComponentCount:bi(f.stellarComponentCount||0n),planetCount:bi(f.planetCount||0n),planetArchitecture:String(f.planetArchitecture||'UNKNOWN'),baselinePrimaryMassMilliSolar:f.baselinePrimaryMassMilliSolar??null},
      interaction:{hitTargetEligible:true,activation:'FOCUS_SYSTEM',selectionAuthority:'NAVIGATION_ONLY',selectable:false,navigable:true},
      label:isSelected?'Current system':'Nearby canonical system',
      claims:{screenProjectionPhysical:false,currentEpochPosition:false}
    }));
  }
  return sceneEnvelope(SCALE.NEIGHBORHOOD,objects,[],decorativeDepth('neighborhood:'+canonicalId(origin)),{
    selectedPath:{systemId:canonicalId(origin),systemKey:selected},
    discovery:{queryCount:queries,queryCap:CAPS.neighborhoodQueries,visibleCount:objects.length,visibleCap:CAPS.visibleSystems,enumeratesUniverse:false,searchSemantics:'BOUNDED_LOCAL_SYSTEM_SITE_PROBE'},
    semantics:{systemPositions:'P3_P4_T0_CANONICAL_BASELINE',layout:'CANONICAL_RELATIVE_POSITION_WITH_PRESENTATION_PROJECTION'}
  });
}
function presentationDescriptorForStar(star){
  const U=O.v09UniversePresentation;if(U?.presentationDescriptorForStar)return U.presentationDescriptorForStar(star);
  const f=star?.facts||{};return deepFreeze({authority:AUTHORITY.PRESENTATION_ONLY,displayRgb:[.78,.82,.86],displayRadiusPx:9,displayIntensity:.7,evolutionaryClass:String(f.baselineEvolutionaryClass||'UNKNOWN'),claims:{canonicalColor:false,physicalApparentBrightness:false,physicalAngularSize:false}});
}
function presentationDescriptorForBody(body){
  const U=O.v09UniversePresentation;if(U?.presentationDescriptorForBody)return U.presentationDescriptorForBody(body);
  return deepFreeze({authority:AUTHORITY.PRESENTATION_ONLY,bulkPriorClass:String(body?.facts?.bulkPriorClass||'UNKNOWN'),palette:{marker:'#9aa3aa'},claims:{canonicalColor:false,canonicalAlbedo:false}});
}
function systemScene(ctx,selectedInput,opts={}){
  const A=O.p3Astronomy;if(!A||!ctx||!selectedInput)throw new Error('P3 context and selected canonical key required');
  const selectedSystem=systemKey(selectedInput),selectedSlot=Number(bi(opts.selectedOrbitSlot??selectedInput.orbitSlot??0n)),system=A.resolveSystem(ctx,selectedSystem);if(system?.status!=='PRESENT')return unsupported(SCALE.SYSTEM,'SELECTED_SYSTEM_ABSENT');
  const objects=[],guides=[],starCount=Math.min(CAPS.visibleStars,Number(system.facts.stellarComponentCount||0n)),planetCount=Math.min(CAPS.visiblePlanets,Number(system.facts.planetCount||0n));
  for(let i=0;i<starCount;i++){
    const star=A.resolveStar(ctx,{...selectedSystem,componentIndex:BigInt(i)});if(star?.status!=='PRESENT')continue;const descriptor=presentationDescriptorForStar(star),spread=i===0?0:(i%2?1:-1)*Math.ceil(i/2)*.065;
    objects.push(deepFreeze({
      objectId:'star:'+canonicalId(star,'star-'+i),kind:'STAR',role:'CANONICAL_CONTEXT',canonical:true,canonicalId:canonicalId(star,'star-'+i),componentIndex:i,selectedPath:false,
      authority:AUTHORITY.CANONICAL_ORDER_PRESENTATION_GEOMETRY,geometryAuthority:AUTHORITY.PRESENTATION_ONLY,
      canonicalKey:{...selectedSystem,componentIndex:BigInt(i)},canonicalFacts:{...star.facts},presentationDescriptor:descriptor,
      presentationGeometry:{x:.5+spread,y:.5+(i===0?0:.018*Math.ceil(i/2)),glyphRadiusPx:descriptor.displayRadiusPx||9,authority:AUTHORITY.PRESENTATION_ONLY},
      interaction:{hitTargetEligible:false,activation:null,selectionAuthority:'UNSUPPORTED_FOR_STAR',selectable:false,navigable:false},
      label:i===0?'Primary star':'Stellar component '+String(i+1),claims:{componentPositionPhysical:false,canonicalColor:false,physicalApparentBrightness:false,physicalAngularSize:false}
    }));
  }
  const planets=[];let maxSemi=1n;
  for(let i=0;i<planetCount;i++){const key=planetKey(selectedSystem,BigInt(i)),planet=A.resolvePlanet(ctx,key);if(planet?.status!=='PRESENT')continue;const semi=bi(planet.facts.baselineSemiMajorAxisMicroAu||1n);if(semi>maxSemi)maxSemi=semi;planets.push({key,planet,slot:i,semi})}
  for(let index=0;index<planets.length;index++){
    const item=planets[index],p=item.planet,f=p.facts||{},selected=item.slot===selectedSlot,descriptor=presentationDescriptorForBody(p),order=(index+1)/(planets.length+1),semiRatio=Number(item.semi)/Math.max(1,Number(maxSemi)),radiusNorm=.16+.34*(.58*order+.42*Math.sqrt(clamp(semiRatio,0,1))),angle=-.7+item.slot*2.399963229728653,px=.5+Math.cos(angle)*radiusNorm,py=.5+Math.sin(angle)*radiusNorm*.58,id=canonicalId(p,'planet-'+item.slot);
    objects.push(deepFreeze({
      objectId:'planet:'+id,kind:'PLANET',role:'CANONICAL_SELECTABLE',canonical:true,canonicalId:id,selectedPath:selected,orbitSlot:item.slot,
      authority:AUTHORITY.CANONICAL_ORDER_PRESENTATION_GEOMETRY,geometryAuthority:AUTHORITY.CANONICAL_ORDER_PRESENTATION_GEOMETRY,canonicalKey:item.key,
      canonicalFacts:{baselineSemiMajorAxisMicroAu:item.semi,baselineEccentricityPpm:f.baselineEccentricityPpm??null,baselineInclinationMilliDeg:f.baselineInclinationMilliDeg??null,baselineMassMilliEarth:f.baselineMassMilliEarth??null,bulkPriorClass:String(f.bulkPriorClass||'UNKNOWN'),baselineInsolationPpm:f.baselineInsolationPpm??null,moonCount:f.moonCount??null,orbitCenter:String(f.orbitCenter||'UNKNOWN')},
      presentationDescriptor:descriptor,presentationGeometry:{x:px,y:py,guideRadiusNormalized:radiusNorm,glyphRadiusPx:selected?7:5,presentationAngleRad:angle,authority:AUTHORITY.PRESENTATION_ONLY},
      interaction:{hitTargetEligible:true,activation:'SELECT_CANONICAL_PLANET',selectionAuthority:'ofu-product-canonical-planet-selection-1',selectable:true,navigable:false,minTargetCssPx:44},
      label:'World '+String(item.slot+1),claims:{normalizedSpacingPhysical:false,presentationAngleIsOrbitalPhase:false,physicalAngularSize:false,canonicalColor:false}
    }));
    guides.push(deepFreeze({
      objectId:'orbit-order-guide:'+item.slot,kind:'ORBIT_ORDER_GUIDE',role:'PRESENTATION_GUIDE',canonical:false,selectable:false,navigable:false,authority:AUTHORITY.CANONICAL_ORDER_PRESENTATION_GEOMETRY,
      sourceCanonicalPlanetId:id,canonicalOrder:item.slot,canonicalBaseline:{semiMajorAxisMicroAu:item.semi,eccentricityPpm:f.baselineEccentricityPpm??null,inclinationMilliDeg:f.baselineInclinationMilliDeg??null,orbitCenter:String(f.orbitCenter||'UNKNOWN')},
      presentationGeometry:{cx:.5,cy:.5,radiusNormalized:radiusNorm,ellipseYScale:.58,authority:AUTHORITY.PRESENTATION_ONLY},
      claims:{physicalOrbitGeometry:false,physicalOrbitScale:false,orbitalPhase:false}
    }));
  }
  return sceneEnvelope(SCALE.SYSTEM,objects,guides,decorativeDepth('system:'+canonicalId(system)),{
    selectedPath:{systemId:canonicalId(system),systemKey:selectedSystem,planetOrbitSlot:selectedSlot},
    canonicalSystemFacts:{stellarComponentCount:bi(system.facts.stellarComponentCount||0n),planetCount:bi(system.facts.planetCount||0n),planetArchitecture:String(system.facts.planetArchitecture||'UNKNOWN'),baselineBarycentricScaleMilliAu:system.facts.baselineBarycentricScaleMilliAu??null},
    semantics:{starComponentLayout:'PRESENTATION_ONLY',planetMembership:'CANONICAL',planetOrder:'CANONICAL',planetMarkerPlacement:'DETERMINISTIC_PRESENTATION_ONLY',orbitGuides:'CANONICAL_ORDER_PRESENTATION_GEOMETRY'},
    selection:{authority:'EXTERNAL',selectedPlanetObjectId:objects.find(o=>o.kind==='PLANET'&&o.selectedPath)?.objectId||null,shadowSelection:false}
  });
}
function orbitScene(ctx,selectedInput,opts={}){
  const A=O.p3Astronomy;if(!A||!ctx||!selectedInput)throw new Error('P3 context and selected canonical key required');
  const selectedSystem=systemKey(selectedInput),selectedPlanetKey=planetKey(selectedInput,opts.selectedOrbitSlot??selectedInput.orbitSlot??0n),system=A.resolveSystem(ctx,selectedSystem),planet=A.resolvePlanet(ctx,selectedPlanetKey);
  if(system?.status!=='PRESENT')return unsupported(SCALE.ORBIT,'SELECTED_SYSTEM_ABSENT');if(planet?.status!=='PRESENT')return unsupported(SCALE.ORBIT,'SELECTED_PLANET_ABSENT');
  const objects=[],guides=[],starCount=Math.min(CAPS.visibleStars,Number(system.facts.stellarComponentCount||0n));
  for(let i=0;i<starCount;i++){
    const star=A.resolveStar(ctx,{...selectedSystem,componentIndex:BigInt(i)});if(star?.status!=='PRESENT')continue;const d=presentationDescriptorForStar(star);
    objects.push(deepFreeze({objectId:'orbit-star:'+canonicalId(star,'star-'+i),kind:'STAR',role:'CANONICAL_CONTEXT',canonical:true,canonicalId:canonicalId(star,'star-'+i),componentIndex:i,authority:AUTHORITY.CANONICAL_ORDER_PRESENTATION_GEOMETRY,geometryAuthority:AUTHORITY.PRESENTATION_ONLY,canonicalKey:{...selectedSystem,componentIndex:BigInt(i)},canonicalFacts:{...star.facts},presentationDescriptor:d,presentationGeometry:{x:.12+i*.055,y:.14+(i%2)*.035,glyphRadiusPx:Math.max(4,(d.displayRadiusPx||8)*.58),authority:AUTHORITY.PRESENTATION_ONLY},interaction:{hitTargetEligible:false,activation:null,selectable:false,navigable:false},label:i===0?'Host star':'Stellar component '+String(i+1),claims:{positionPhysical:false,canonicalColor:false,physicalApparentBrightness:false}}));
  }
  const planetId=canonicalId(planet,'selected-planet'),f=planet.facts||{};
  objects.push(deepFreeze({
    objectId:'selected-world-handoff:'+planetId,kind:'PLANET_HANDOFF_ANCHOR',role:'CANONICAL_CONTEXT',canonical:true,canonicalId:planetId,selectedPath:true,authority:AUTHORITY.CANONICAL_ORDER_PRESENTATION_GEOMETRY,geometryAuthority:AUTHORITY.PRESENTATION_ONLY,canonicalKey:selectedPlanetKey,
    canonicalFacts:{orbitCenter:String(f.orbitCenter||'UNKNOWN'),baselineSemiMajorAxisMicroAu:f.baselineSemiMajorAxisMicroAu??null,baselineEccentricityPpm:f.baselineEccentricityPpm??null,baselineInclinationMilliDeg:f.baselineInclinationMilliDeg??null},
    presentationGeometry:{x:.5,y:.5,renderPrimitive:'NONE',centerExclusionNormalized:.31,authority:AUTHORITY.PRESENTATION_ONLY},
    interaction:{hitTargetEligible:false,activation:null,selectionAuthority:'EXTERNAL_ALREADY_SELECTED',selectable:false,navigable:false},
    label:'Selected world',claims:{macroRendersPrimaryWorld:false,opaquePlanetPrimitive:false,physicalOrbitalPhase:false}
  }));
  guides.push(deepFreeze({
    objectId:'selected-orbit-context',kind:'ORBIT_CONTEXT_GUIDE',role:'PRESENTATION_GUIDE',canonical:false,authority:AUTHORITY.CANONICAL_ORDER_PRESENTATION_GEOMETRY,selectable:false,navigable:false,
    sourceCanonicalPlanetId:planetId,canonicalBaseline:{orbitCenter:String(f.orbitCenter||'UNKNOWN'),semiMajorAxisMicroAu:f.baselineSemiMajorAxisMicroAu??null,eccentricityPpm:f.baselineEccentricityPpm??null,inclinationMilliDeg:f.baselineInclinationMilliDeg??null},
    presentationGeometry:{role:'EDGE_ARC_AND_HOST_DIRECTION',authority:AUTHORITY.PRESENTATION_ONLY,centerExclusionNormalized:.31},claims:{physicalOrbitGeometry:false,physicalOrbitScale:false,orbitalPhase:false}
  }));
  return sceneEnvelope(SCALE.ORBIT,objects,guides,decorativeDepth('orbit:'+canonicalId(system)),{
    selectedPath:{systemId:canonicalId(system),planetId,systemKey:selectedSystem,planetKey:selectedPlanetKey},
    handoff:{contract:'ofu-macro-orbit-context-handoff-1',selectedPlanetId:planetId,selectedPlanetKey,macroOwnsPrimarySelectedWorld:false,primarySelectedWorldRenderer:'EXTERNAL_PLANET_PROVIDER',macroUnderlayOnly:true,centerExclusionNormalized:.31,duplicatePrimaryRendererAllowed:false},
    semantics:{background:'MACRO_CONTEXT_UNDERLAY',selectedWorldPrimitive:'NONE',hostRelationship:'CANONICAL_FACT_PRESENTATION_GEOMETRY'}
  });
}
function transitionDescriptor(from,to,{reducedMotion=false}={}){
  from=String(from||'').toUpperCase();to=String(to||'').toUpperCase();const allowed=new Set(['GALAXY>NEIGHBORHOOD','NEIGHBORHOOD>SYSTEM','SYSTEM>ORBIT','ORBIT>SYSTEM','SYSTEM>NEIGHBORHOOD','NEIGHBORHOOD>GALAXY']);if(!allowed.has(from+'>'+to))throw new Error('unsupported macro scale transition '+from+' -> '+to);
  const inward=['GALAXY>NEIGHBORHOOD','NEIGHBORHOOD>SYSTEM','SYSTEM>ORBIT'].includes(from+'>'+to),focus=from==='GALAXY'?'CANONICAL_GALAXY':from==='NEIGHBORHOOD'?'CANONICAL_SYSTEM':from==='SYSTEM'?'SELECTED_CANONICAL_PLANET':'CANONICAL_SYSTEM';
  return deepFreeze({version:VERSION,contract:'ofu-macro-scale-transition-1',from,to,durationMs:reducedMotion?0:inward?680:560,reducedMotion:!!reducedMotion,authority:AUTHORITY.PRESENTATION_ONLY,focus,visualModel:inward?'FOCUS_AND_SCALE_IN':'SCALE_OUT_AND_REVEAL',canonicalTime:false,orbitalMotion:false,physicalTravelTimeClaim:false,physicalVelocityClaim:false});
}
function buildScene(scale,ctx,selectedKey,opts={}){
  const s=String(scale||'').toUpperCase();if(s===SCALE.GALAXY)return galaxyScene(ctx,selectedKey,opts);if(s===SCALE.NEIGHBORHOOD)return neighborhoodScene(ctx,selectedKey,opts);if(s===SCALE.SYSTEM)return systemScene(ctx,selectedKey,opts);if(s===SCALE.ORBIT)return orbitScene(ctx,selectedKey,opts);throw new Error('unknown macro scale '+scale);
}
function validateScene(scene){
  if(!scene||scene.contract!==CONTRACT)throw new Error('invalid macro scene contract');if(scene.status!=='READY')return true;
  const all=[...(scene.objects||[]),...(scene.guides||[]),...(scene.decorative||[])];if(all.length>CAPS.totalSceneObjects)throw new Error('macro scene exceeds total object cap');
  const ids=new Set();for(const item of all){if(!item.objectId)throw new Error('macro scene object missing objectId');if(ids.has(item.objectId))throw new Error('duplicate macro scene objectId '+item.objectId);ids.add(item.objectId);if(item.authority===AUTHORITY.DECORATIVE_ONLY&&(item.selectable||item.navigable||item.interaction?.hitTargetEligible))throw new Error('decorative object cannot be interactive');if(item.role==='CANONICAL_SELECTABLE'&&item.interaction?.selectionAuthority!=='ofu-product-canonical-planet-selection-1')throw new Error('canonical selectable object bypasses normalized selection authority')}
  if(scene.scale===SCALE.ORBIT){const anchors=scene.objects.filter(o=>o.kind==='PLANET_HANDOFF_ANCHOR');if(anchors.length!==1)throw new Error('orbit context requires exactly one selected-world handoff anchor');if(scene.handoff?.macroOwnsPrimarySelectedWorld!==false||scene.handoff?.duplicatePrimaryRendererAllowed!==false)throw new Error('orbit context violates primary renderer ownership')}
  return true;
}
O.waveIVMacroScene=Object.freeze({VERSION,CONTRACT,AUTHORITY,SCALE,CAPS,SYSTEM_FIELDS,PLANET_FIELDS,systemKey,planetKey,shiftSystemKey,systemPositionMilliPc,galaxyScene,neighborhoodScene,systemScene,orbitScene,transitionDescriptor,buildScene,validateScene});
})(typeof globalThis!=='undefined'?globalThis:this);
