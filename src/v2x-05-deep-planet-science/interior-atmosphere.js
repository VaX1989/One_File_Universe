(function(root){
'use strict';
const O=root.OFU=root.OFU||{},C=O.v2x05RegimeCore;
if(!C)throw new Error('V2X-05 regime core required');
const VERSION='ofu-v2x-05-interior-atmosphere-2',AUTHORITY=C.AUTHORITY,PPM=C.PPM;
const FAMILY=Object.freeze({
  H2_HE_DOMINATED:Object.freeze([Object.freeze(['H2',735000]),Object.freeze(['HE',245000]),Object.freeze(['H2O',8000]),Object.freeze(['CH4',7000]),Object.freeze(['OTHER',5000])]),
  STEAM_CO2_VOLATILE:Object.freeze([Object.freeze(['H2O',590000]),Object.freeze(['CO2',310000]),Object.freeze(['N2',80000]),Object.freeze(['OTHER',20000])]),
  N2_CO2_H2O_OUTGASSED:Object.freeze([Object.freeze(['N2',690000]),Object.freeze(['CO2',190000]),Object.freeze(['H2O',100000]),Object.freeze(['OTHER',20000])]),
  CONDENSABLE_VOLATILE_ATMOSPHERE:Object.freeze([Object.freeze(['N2',390000]),Object.freeze(['H2O',300000]),Object.freeze(['CO2',150000]),Object.freeze(['CH4',90000]),Object.freeze(['OTHER',70000])]),
  MIXED_SECONDARY_ATMOSPHERE:Object.freeze([Object.freeze(['N2',545000]),Object.freeze(['CO2',185000]),Object.freeze(['H2O',145000]),Object.freeze(['H2',35000]),Object.freeze(['CH4',20000]),Object.freeze(['OTHER',70000])])
});
function heatShares(interior){
  const h=interior?.heat||{},raw=[Number(h.primordialPpm),Number(h.radiogenicPpm),Number(h.tidalPpm)];
  if(!raw.every(v=>C.safe(v,0,PPM)))throw new RangeError('invalid bounded interior heat attribution inputs');
  const shares=C.normalizePpm(raw),names=['PRIMORDIAL_PROXY','RADIOGENIC_PROXY','TIDAL_PROXY'];
  return C.freeze(names.map((name,i)=>({driver:name,sharePpm:shares[i]})));
}
function interiorState(planet,regime){
  const x=C.extract(planet);if(!x.supported)return x;
  const h=x.interior?.heat||{},age=Number(x.inputs.ageMyr),heat=Number(h.heatIndexPpm),conv=Number(x.interior.convectiveVigorPpm),volc=Number(x.interior.volcanismPpm),dynamo=Number(x.interior.dynamoPpm);
  if(!C.safe(age,0,20000)||![heat,conv,volc,dynamo].every(v=>C.safe(v,0,PPM)))return C.unsupported(x.worldIdentity,'INVALID_INTERIOR_PROXY_STATE');
  const layers=[Number(x.interior.coreFractionPpm),Number(x.interior.mantleFractionPpm),Number(x.interior.crustFractionPpm)],differentiation=Number(x.interior.differentiationPpm);
  if(!C.validatePpmClosure(layers))return C.unsupported(x.worldIdentity,'INTERIOR_LAYER_PPM_NOT_CLOSED');
  if(!C.safe(differentiation,0,PPM))return C.unsupported(x.worldIdentity,'INVALID_DIFFERENTIATION_PROXY_STATE');
  let shares;try{shares=heatShares(x.interior);}catch{return C.unsupported(x.worldIdentity,'INVALID_INTERIOR_HEAT_ATTRIBUTION_STATE');}
  const coolingProgressPpm=C.clamp(Math.round(age*PPM/14000),0,PPM),retainedThermalPotentialPpm=C.clamp(Math.round(heat*(PPM-coolingProgressPpm)/PPM)+Math.round(heat*350000/PPM),0,PPM);
  const giant=!regime.solidSurfaceModel;
  const volatileMobilityPpm=C.clamp(Number(x.composition.icePpm)+Number(x.composition.lightVolatilePpm),0,PPM);
  const tectonicPotentialPpm=giant?null:C.clamp(Math.round(conv*680000/PPM)+Math.round(volatileMobilityPpm*170000/PPM)-Math.round(Number(x.interior.crustFractionPpm)*80000/PPM),0,PPM);
  const geodynamics=giant?C.freeze({supported:false,status:'UNSUPPORTED',reason:'NO_RESOLVED_SOLID_SURFACE',plateTectonicsResolved:false}):C.freeze({supported:true,status:'PRESENT',tectonicPotentialPpm,volcanicPotentialPpm:volc,convectiveVigorPpm:conv,sourceTectonicRegime:String(x.interior.tectonicRegime||'UNKNOWN'),plateTectonicsResolved:false,tectonicHistoryClaim:false,calibratedConvectionClaim:false});
  return C.freeze({version:VERSION,worldIdentity:x.worldIdentity,supported:true,status:'PRESENT',differentiation:C.freeze({state:String(x.interior.differentiationState||'UNKNOWN'),potentialPpm:differentiation,coreFractionPpm:layers[0],mantleFractionPpm:layers[1],crustFractionPpm:layers[2],resolvedLayerBoundaryClaim:false}),
    heat:C.freeze({heatIndexPpm:heat,normalizedDriverShares:shares,normalizedAttributionOnly:true,conservedEnergyClaim:false,heatFlowUnitClaim:false}),cooling:C.freeze({coolingProgressPpm,retainedThermalPotentialPpm,thermalEvolutionCalibrationClaim:false}),geodynamics,dynamoPotentialPpm:dynamo,eosClaim:false,authority:AUTHORITY,canonicalPromotion:false});
}
function constituentState(x){
  const family=String(x.atmosphere.compositionFamily||'UNKNOWN'),pressure=Number(x.atmosphere.pressureProxyPpm);
  if(!C.safe(pressure,0,12000000))return C.freeze({supported:false,status:'UNSUPPORTED',reason:'INVALID_ATMOSPHERIC_COLUMN_PROXY',family,pressureProxyPpm:null,constituents:Object.freeze([]),retrievalClaim:false});
  if(pressure<12000||family==='AIRLESS_OR_TRACE_EXOSPHERE')return C.freeze({supported:false,status:'UNSUPPORTED',reason:'NO_MODELED_COLLISIONAL_ATMOSPHERE',family,pressureProxyPpm:pressure,constituents:Object.freeze([]),retrievalClaim:false});
  const prior=FAMILY[family];
  if(!prior)return C.freeze({supported:false,status:'UNSUPPORTED',reason:'UNSUPPORTED_COMPOSITION_FAMILY',family,pressureProxyPpm:pressure,constituents:Object.freeze([]),retrievalClaim:false});
  const shares=C.normalizePpm(prior.map(x=>x[1])),constituents=C.freeze(prior.map((row,i)=>({family:row[0],sharePpm:shares[i],basis:'BOUNDED_FAMILY_PRIOR_NOT_RETRIEVAL'})));
  return C.freeze({supported:true,status:'PRESENT',family,pressureProxyPpm:pressure,meanMolecularMassMilliAmu:Number(x.atmosphere.meanMolecularMassMilliAmu||0),constituents,constituentCount:constituents.length,shareClosurePpm:constituents.reduce((n,v)=>n+v.sharePpm,0),retrievalClaim:false,spectroscopicAbundanceClaim:false});
}
function historyContext(x,history){
  const rawBase=Number(x.atmosphere.escape?.escapePpm),currentXuv=Number(x.atmosphere.escape?.xuvMilliWm2);
  if(!C.safe(rawBase,0,970000)||!C.safe(currentXuv,0,50000000))return C.freeze({status:'UNSUPPORTED',reason:'INVALID_ESCAPE_CONTEXT',historyUsed:false,samples:0,baseEscapePpm:null,currentXuvMilliWm2:null,escapeRateClaim:false});
  const baseEscape=rawBase;
  if(history===undefined||history===null)return C.freeze({status:'CURRENT_CONTEXT_ONLY',historyUsed:false,samples:0,currentXuvMilliWm2:currentXuv,baseEscapePpm:baseEscape,historyAdjustedEscapeContextPpm:baseEscape,retainedContextPpm:PPM-baseEscape,escapeRateClaim:false});
  if(!Array.isArray(history)||history.length===0||history.length>C.LIMITS.historySamples)return C.freeze({status:'UNSUPPORTED',reason:'XUV_HISTORY_BOUND',historyUsed:false,samples:Array.isArray(history)?history.length:null,baseEscapePpm:baseEscape,currentXuvMilliWm2:currentXuv,historyAdjustedEscapeContextPpm:baseEscape,retainedContextPpm:PPM-baseEscape,escapeRateClaim:false});
  let lastAge=-1,total=0,peak=0;
  for(const row of history){const age=Number(row?.ageMyr),xuv=Number(row?.xuvMilliWm2);if(!C.safe(age,0,20000)||!C.safe(xuv,0,50000000)||age<lastAge)return C.freeze({status:'UNSUPPORTED',reason:'INVALID_OR_UNORDERED_XUV_HISTORY',historyUsed:false,samples:history.length,baseEscapePpm:baseEscape,currentXuvMilliWm2:currentXuv,historyAdjustedEscapeContextPpm:baseEscape,retainedContextPpm:PPM-baseEscape,escapeRateClaim:false});lastAge=age;total+=xuv;peak=Math.max(peak,xuv);}
  const mean=Math.round(total/history.length),ratioPpm=currentXuv>0?C.clamp(C.ratioPpm(mean,currentXuv,4000000),0,4000000):(mean>0?4000000:PPM),adjustment=Math.round((ratioPpm-PPM)*120000/PPM),adjusted=C.clamp(baseEscape+adjustment,0,970000);
  return C.freeze({status:'PRESENT',historyUsed:true,samples:history.length,currentXuvMilliWm2:currentXuv,meanXuvMilliWm2:mean,peakXuvMilliWm2:peak,meanToCurrentRatioPpm:ratioPpm,baseEscapePpm:baseEscape,historyAdjustedEscapeContextPpm:adjusted,retainedContextPpm:PPM-adjusted,contextOnly:true,integratedMassLossClaim:false,escapeRateClaim:false});
}
function atmosphereState(planet,regime,options={}){
  const x=C.extract(planet);if(!x.supported)return x;
  const constituents=constituentState(x),escape=historyContext(x,options.xuvHistory),pressure=Number(x.atmosphere.pressureProxyPpm),family=String(x.atmosphere.compositionFamily||'UNKNOWN');
  const collapse=Number(x.atmosphere.collapsePotentialPpm),cloud=Number(x.atmosphere.cloudCondensatePotentialPpm),outgassing=Number(x.atmosphere.outgassingPpm),molecularMass=Number(x.atmosphere.meanMolecularMassMilliAmu);
  if(!C.safe(collapse,0,PPM)||!C.safe(cloud,0,PPM)||!C.safe(outgassing,0,PPM)||!C.safe(molecularMass,0))return C.freeze({version:VERSION,worldIdentity:x.worldIdentity,supported:false,status:'UNSUPPORTED',reason:'INVALID_ATMOSPHERIC_PROXY_STATE',regime:regime.regime,pressureProxyPpm:pressure,composition:constituents,retentionEscape:escape,authority:AUTHORITY,canonicalPromotion:false});
  if(escape.status==='UNSUPPORTED')return C.freeze({version:VERSION,worldIdentity:x.worldIdentity,supported:false,status:'UNSUPPORTED',reason:escape.reason,regime:regime.regime,pressureProxyPpm:pressure,composition:constituents,retentionEscape:escape,authority:AUTHORITY,canonicalPromotion:false});
  if(pressure>=12000&&family!=='AIRLESS_OR_TRACE_EXOSPHERE'&&!constituents.supported)return C.freeze({version:VERSION,worldIdentity:x.worldIdentity,supported:false,status:'UNSUPPORTED',reason:constituents.reason||'UNSUPPORTED_COLLISIONAL_ATMOSPHERE_FAMILY',regime:regime.regime,pressureProxyPpm:pressure,composition:constituents,retentionEscape:escape,authority:AUTHORITY,canonicalPromotion:false});
  return C.freeze({version:VERSION,worldIdentity:x.worldIdentity,supported:true,status:'PRESENT',regime:regime.regime,pressureProxyPpm:pressure,composition:constituents,
    retentionEscape:escape,collapsePotentialPpm:collapse,cloudCondensatePotentialPpm:cloud,outgassingPotentialPpm:outgassing,
    pressureUnitClaim:false,observedAtmosphereClaim:false,photochemistryClaim:false,canonicalAtmosphereClaim:false,authority:AUTHORITY,canonicalPromotion:false});
}
function radiativeState(planet,regime,atmosphere){
  const x=C.extract(planet);if(!x.supported)return x;
  const eq=Number(x.formation.equilibriumTemperatureMilliK),greenhouse=Number(x.atmosphere.greenhouseDeltaMilliK);
  if(!C.safe(eq,20000,3000000)||!C.safe(greenhouse,0,900000))return C.unsupported(x.worldIdentity,'INVALID_RADIATIVE_PROXY_STATE');
  const surfaceEligible=regime.solidSurfaceModel&&atmosphere.composition.supported;
  const surface=surfaceEligible?C.clamp(eq+greenhouse,20000,3000000):null;
  const thermalReference=!regime.solidSurfaceModel?eq:surface;
  return C.freeze({version:VERSION,worldIdentity:x.worldIdentity,supported:true,status:'PRESENT',irradiationEquilibriumTemperature:C.freeze({status:'PRESENT',temperatureMilliK:eq,meaning:'EXISTING_V1_FORMATION_IRRADIATION_PROXY'}),
    effectiveEmissionTemperature:C.freeze({status:'UNSUPPORTED',temperatureMilliK:null,reason:'NO_INDEPENDENT_ALBEDO_OR_OUTGOING_LONGWAVE_MODEL'}),
    modeledSurfaceTemperature:C.freeze({status:surface===null?'UNSUPPORTED':'PRESENT',temperatureMilliK:surface,reason:surface===null?(regime.solidSurfaceModel?'NO_COLLISIONAL_ATMOSPHERE_SURFACE_COUPLING':'NO_RESOLVED_SOLID_SURFACE'):null,meaning:surface===null?null:'EQUILIBRIUM_PROXY_PLUS_EXISTING_V1_GREENHOUSE_DELTA'}),
    atmosphericThermalReferenceMilliK:thermalReference,greenhouseDeltaMilliK:greenhouse,greenhouseBasis:'EXISTING_V1_REDUCED_ORDER_PROXY',radiativeTransferCalibrationClaim:false,greyAtmospherePromotionClaim:false,gcmClaim:false,authority:AUTHORITY,canonicalPromotion:false});
}
O.v2x05InteriorAtmosphere=Object.freeze({VERSION,AUTHORITY,FAMILY,heatShares,interiorState,constituentState,historyContext,atmosphereState,radiativeState});
})(typeof globalThis!=='undefined'?globalThis:this);
