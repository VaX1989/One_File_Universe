(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const AUTHORITY='PRESENTATION_ONLY',VERSION='ofu-visual-universe-presentation-1';
const BODY_CLASSES=Object.freeze(['TERRESTRIAL','VOLATILE_RICH','ICE_GIANT','GAS_GIANT']);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const finite=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
const freezeRgb=v=>Object.freeze(v.map(x=>clamp(finite(x),0,1)));
const PALETTES=Object.freeze({
 TERRESTRIAL:Object.freeze({family:'TERRESTRIAL_MINERAL',primary:freezeRgb([0.52,0.46,0.38]),secondary:freezeRgb([0.27,0.26,0.24]),accent:freezeRgb([0.68,0.59,0.47]),marker:'#a99579'}),
 VOLATILE_RICH:Object.freeze({family:'VOLATILE_RICH_NEUTRAL',primary:freezeRgb([0.46,0.50,0.53]),secondary:freezeRgb([0.28,0.31,0.34]),accent:freezeRgb([0.61,0.64,0.66]),marker:'#8d9aa4'}),
 ICE_GIANT:Object.freeze({family:'ICE_GIANT_RESTRAINED',primary:freezeRgb([0.42,0.51,0.57]),secondary:freezeRgb([0.26,0.31,0.35]),accent:freezeRgb([0.56,0.64,0.69]),marker:'#8199a7'}),
 GAS_GIANT:Object.freeze({family:'GAS_GIANT_RESTRAINED',primary:freezeRgb([0.57,0.49,0.41]),secondary:freezeRgb([0.34,0.30,0.28]),accent:freezeRgb([0.68,0.59,0.49]),marker:'#aa957d'}),
 UNKNOWN:Object.freeze({family:'UNCLASSIFIED_NEUTRAL',primary:freezeRgb([0.47,0.47,0.45]),secondary:freezeRgb([0.28,0.29,0.30]),accent:freezeRgb([0.59,0.59,0.57]),marker:'#929493'})
});
function bodyClassOf(input){const f=input?.facts||input?.upstreamBaseline?.formation||input?.formation||{};const raw=String(f.bulkPriorClass??f.compositionClass??input?.bulkPriorClass??'UNKNOWN').toUpperCase();return BODY_CLASSES.includes(raw)?raw:'UNKNOWN'}
function presentationDescriptorForBody(input){
 const bulkPriorClass=bodyClassOf(input),palette=PALETTES[bulkPriorClass]||PALETTES.UNKNOWN;
 return Object.freeze({version:VERSION,authority:AUTHORITY,kind:'BODY',bulkPriorClass,presentationFamily:palette.family,palette,sourceBasis:bulkPriorClass==='UNKNOWN'?Object.freeze([]):Object.freeze(['P3_BULK_PRIOR_CLASS']),surfaceDetailEligible:bulkPriorClass==='TERRESTRIAL'&&input?.status==='SUPPORTED',lighting:Object.freeze({authority:AUTHORITY,directionModel:'FIXED_PRESENTATION_DERIVED',direction:Object.freeze([0.42,0.24,0.875]),physicalPhaseClaim:false}),claims:Object.freeze({canonicalColor:false,canonicalAlbedo:false,atmosphere:false,clouds:false,oceans:false,iceCoverage:false,vegetation:false,weather:false,geology:false,biosphere:false,physicalTerrainElevation:false})});
}
function stellarFacts(star){const f=star?.facts||star?.host||star||{};return{temperatureK:finite(f.baselineTemperatureK??f.temperatureK,0),radiusMilliSolar:finite(f.baselineRadiusMilliSolar??f.radiusMilliSolar,0),luminosityMilliSolar:finite(f.baselineLuminosityMilliSolar??f.luminosityMilliSolar,0),evolutionaryClass:String(f.baselineEvolutionaryClass??f.evolutionaryClass??'UNKNOWN').toUpperCase()}}
function stellarDisplayRgb(temperatureK,luminosityMilliSolar){
 if(!(luminosityMilliSolar>0)||!(temperatureK>0))return freezeRgb([0.40,0.44,0.49]);
 const t=clamp((temperatureK-2500)/9500,0,1);
 if(t<0.38){const q=t/0.38;return freezeRgb([0.94,0.58+0.22*q,0.38+0.28*q])}
 const q=(t-0.38)/0.62;return freezeRgb([0.94-0.23*q,0.80+0.08*q,0.66+0.31*q]);
}
function presentationDescriptorForStar(star){
 const f=stellarFacts(star),zeroLuminosity=!(f.luminosityMilliSolar>0),remnant=f.evolutionaryClass==='REMNANT',rgb=stellarDisplayRgb(f.temperatureK,f.luminosityMilliSolar),radiusScale=clamp(Math.log2(Math.max(1,f.radiusMilliSolar)/1000+1),0.15,2.4),lumScale=zeroLuminosity?0.16:clamp(Math.log10(f.luminosityMilliSolar+10)/3.6,0.32,1);
 return Object.freeze({version:VERSION,authority:AUTHORITY,kind:'STAR',evolutionaryClass:f.evolutionaryClass,displayRgb:rgb,displayRadiusPx:clamp(7+radiusScale*5+(f.evolutionaryClass==='EVOLVED'?4:0),6,28),displayIntensity:lumScale,displayMode:zeroLuminosity?'NON_EMISSIVE_REMNANT_MARKER':remnant?'RESTRAINED_REMNANT':'STELLAR_GLOW',sourceBasis:Object.freeze(['P3_STELLAR_TEMPERATURE','P3_STELLAR_RADIUS_PROXY','P3_STELLAR_LUMINOSITY','P3_EVOLUTIONARY_CLASS']),claims:Object.freeze({canonicalColor:false,physicalApparentBrightness:false,physicalAngularSize:false,physicalPhase:false})});
}
function hash32(text){let h=2166136261>>>0;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function rand01(seed,index){let x=(seed+Math.imul(index+1,0x9e3779b1))>>>0;x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;x=Math.imul(x,0x846ca68b);x^=x>>>16;return(x>>>0)/4294967296}
function idHex(entity){if(entity?.id&&O.p2?.hex)try{return O.p2.hex(entity.id)}catch{}return String(entity?.id||'')}
function systemSceneDescriptor(ctx,key,{selectedOrbitSlot=0,decorativeStarCount=64}={}){
 const A=O.p3Astronomy;if(!A||!ctx||!key)throw new Error('canonical P3 context and system key required');const system=A.resolveSystem(ctx,key);if(system?.status!=='PRESENT')return Object.freeze({version:VERSION,authority:AUTHORITY,status:'UNSUPPORTED',reason:'SYSTEM_ABSENT'});
 const componentCount=Number(system.facts.stellarComponentCount),planetCount=Number(system.facts.planetCount),stars=[],bodies=[];
 for(let i=0;i<componentCount;i++){const star=A.resolveStar(ctx,{...key,componentIndex:BigInt(i)});if(star?.status==='PRESENT')stars.push(Object.freeze({componentIndex:i,canonicalId:idHex(star),descriptor:presentationDescriptorForStar(star),selectable:false,canonicalBody:true}))}
 for(let i=0;i<planetCount;i++){const planet=A.resolvePlanet(ctx,{...key,orbitSlot:BigInt(i)});if(planet?.status!=='PRESENT')continue;const desc=presentationDescriptorForBody(planet);bodies.push(Object.freeze({orbitSlot:i,canonicalId:idHex(planet),descriptor:desc,selected:i===Number(selectedOrbitSlot),selectable:true,canonicalBody:true,normalizedOrbit:(i+1)/(planetCount+1),phaseAngleRad:-0.68+i*2.399963229728653}))}
 const seed=hash32(idHex(system)||JSON.stringify(Object.fromEntries(Object.entries(key).map(([k,v])=>[k,String(v)])))),count=clamp(Math.floor(finite(decorativeStarCount,64)),0,96),decorative=[];for(let i=0;i<count;i++)decorative.push(Object.freeze({x:rand01(seed,i*4),y:rand01(seed,i*4+1),sizePx:0.55+rand01(seed,i*4+2)*1.25,opacity:0.16+rand01(seed,i*4+3)*0.42,selectable:false,canonicalBody:false,authority:AUTHORITY}));
 return Object.freeze({version:VERSION,authority:AUTHORITY,status:'READY',canonicalSystemId:idHex(system),spacingModel:'NORMALIZED_ORDER_GUIDE',physicalOrbitScaleClaim:false,physicalOrbitalPhaseClaim:false,stars:Object.freeze(stars),bodies:Object.freeze(bodies),decorativeStarField:Object.freeze({authority:AUTHORITY,role:'DECORATIVE_DEPTH_ONLY',selectable:false,canonicalPopulationClaim:false,points:Object.freeze(decorative)}),claims:Object.freeze({normalizedSpacingIsPhysicalGeometry:false,decorativeStarsAreCanonical:false})});
}
O.v09UniversePresentation=Object.freeze({VERSION,AUTHORITY,BODY_CLASSES,PALETTES,presentationDescriptorForBody,presentationDescriptorForStar,systemSceneDescriptor});
})(typeof globalThis!=='undefined'?globalThis:this);
