import fs from 'node:fs';

function read(path){return fs.readFileSync(path,'utf8')}
function write(path,text){fs.writeFileSync(path,text)}
function exact(path,from,to){const text=read(path);const count=text.split(from).length-1;if(count!==1)throw new Error(`${path}: expected exactly one literal match, found ${count}: ${from.slice(0,100)}`);write(path,text.replace(from,to))}
function rx(path,re,to,label){const text=read(path);const matches=[...text.matchAll(new RegExp(re.source,re.flags.includes('g')?re.flags:re.flags+'g'))];if(matches.length!==1)throw new Error(`${path}: expected exactly one ${label||re} match, found ${matches.length}`);write(path,text.replace(re,to))}
function json(path,fn){const v=JSON.parse(read(path));fn(v);write(path,JSON.stringify(v,null,2)+'\n')}

// P22-002 + P22-009: Living surface composition preserves unknowns, consumes V2X-05,
// and exposes provenance/uncertainty rather than inventing scientific values.
{
 const p='src/rendering/v2x-convergence/living-domain-composition.js';
 exact(p,
  " LocalExperience=O.v2x07LocalExperienceProvider,\n Matter=O.v2x12MatterContinuity,Micro=O.v2x12MicroscopicPresentation,Camera=O.v2x02LivingCameraComposition;\nif(!baseFactory||!Orbit||!Stellar||!Illumination||!Address||!Geography||!Hydrology||!Terrain||!Surface||!LocalExperience||!Matter||!Micro||!Camera)throw new Error('Living domain convergence dependencies missing');",
  " LocalExperience=O.v2x07LocalExperienceProvider,DeepPlanet=O.v2x05DeepPlanetProvider,\n Matter=O.v2x12MatterContinuity,Micro=O.v2x12MicroscopicPresentation,Camera=O.v2x02LivingCameraComposition;\nif(!baseFactory||!Orbit||!Stellar||!Illumination||!Address||!Geography||!Hydrology||!Terrain||!Surface||!LocalExperience||!DeepPlanet||!Matter||!Micro||!Camera)throw new Error('Living domain convergence dependencies missing');");
 exact(p,"function authorityName(v){return String(v?.class||v?.authorityClass||v||'MODEL_DERIVED_SIMULATION')}","function authorityName(v){const a=v?.class||v?.authorityClass||v;return a?String(a):'UNKNOWN_UNVERIFIED'}\nfunction finiteOrNull(v){const n=Number(v);return Number.isFinite(n)?n:null}\nfunction firstFinite(...values){for(const v of values){const n=finiteOrNull(v);if(n!==null)return n}return null}");
 rx(p,/function surfaceModelInput\(s\)\{[\s\S]*?\n\}/,
`function surfaceModelInput(s){
 const p=s.world?.planetology;if(!p)throw new Error('Living V2X-06 composition requires current planetology');
 const geological=p.geology||{},surface=p.surfaceProcesses||{},hydro=p.hydrosphere||{},climate=p.climate||{};
 const deep=DeepPlanet.query(p,'SURFACE_PROMPT08_CONTEXT'),adapter=deep?.supported?deep.payload?.v2x06GeographyAdapter:null,safe=adapter?.safeInputs||{};
 const out={planetIdentity:String(p.planetIdentity||s.world?.planetIdentity||''),planetClass:String(p.bulkPriorClass||'TERRESTRIAL'),waterAreaPpm:finiteOrNull(hydro.waterAreaPpm),iceAreaPpm:firstFinite(hydro.iceFractionPpm,p.cryosphere?.iceCoverPpm),tectonicActivityPpm:firstFinite(surface.tectonicActivityPpm,safe.tectonicActivityPpm),volcanicActivityPpm:firstFinite(geological.volcanicActivityPpm,safe.volcanicActivityPpm),erosionActivityPpm:finiteOrNull(surface.erosionPotentialPpm),aridityPpm:finiteOrNull(climate.aridityPpm),sourceAuthority:authorityName(p.authority),sourceProvenance:Array.isArray(p.provenance)?p.provenance.slice(0,16):[],deepPlanetContext:Object.freeze({supported:Boolean(deep?.supported),status:String(deep?.status||'UNSUPPORTED'),modelDigest:deep?.modelDigest||null,authority:deep?.authority||null,provenance:deep?.provenance||null,uncertainty:deep?.fidelity?.uncertainty||null,withheld:Array.isArray(adapter?.withheld)?adapter.withheld:[]})};
 const impact=surface.impactActivityPpm??geological.impactProductionPpm;if(Number.isFinite(Number(impact)))out.impactActivityPpm=Number(impact);
 return out;
}`,'surfaceModelInput');
 exact(p,
  "  label(g,'V2X-06 · '+title(s.stage).toUpperCase(),22,31,{size:12,color:'#e6f1f5',bold:true});",
  "  label(g,'V2X-06 · '+title(s.stage).toUpperCase(),22,31,{size:12,color:'#e6f1f5',bold:true});\n  const deep=record.input.deepPlanetContext;if(deep?.supported)label(g,'V2X-05 deep-planet '+short(deep.modelDigest)+' · '+authorityName(deep.authority)+' · reduced-order uncertainty disclosed',22,69,{size:9,color:'#b9ccd4'});else label(g,'Deep-planet context unavailable · surface science remains explicitly incomplete',22,69,{size:9,color:'#c6b9aa'});");
 exact(p,
  "canonicalElevationClaim:false});",
  "canonicalElevationClaim:false,deepPlanetModelDigest:record.input.deepPlanetContext?.modelDigest||null,deepPlanetAuthority:record.input.deepPlanetContext?.authority||null,deepPlanetProvenance:record.input.deepPlanetContext?.provenance||null,deepPlanetUncertainty:record.input.deepPlanetContext?.uncertainty||null});");
}

// Adjacent P22-002 class: V2X-06 may use presentation-only procedural priors, but the
// scientific inputs remain null and the descriptor records every assumption explicitly.
{
 const p='src/domains/v1/surface/geography.js';
 exact(p,"const MAX_FEATURES=48;","const MAX_FEATURES=48;\nconst PRESENTATION_PRIORS=Object.freeze({authority:'PRESENTATION_ONLY',claim:'PROCEDURAL_GEOMETRY_ONLY_NOT_SCIENTIFIC_VALUE',waterAreaPpm:0,iceAreaPpm:0,tectonicActivityPpm:350000,volcanicActivityPpm:250000,impactActivityPpm:120000,erosionActivityPpm:300000,aridityPpm:300000});\nfunction knownPpm(v){if(v===null||v===undefined||v==='')return null;const n=Number(v);return Number.isFinite(n)?Math.round(Math.max(0,Math.min(PPM,n))):null}");
 exact(p,
  " const waterAreaPpm=clampPpm(input.waterAreaPpm),iceAreaPpm=clampPpm(input.iceAreaPpm),tectonicActivityPpm=clampPpm(input.tectonicActivityPpm??350000),volcanicActivityPpm=clampPpm(input.volcanicActivityPpm??250000),impactActivityPpm=clampPpm(input.impactActivityPpm??120000),erosionActivityPpm=clampPpm(input.erosionActivityPpm??300000),aridityPpm=clampPpm(input.aridityPpm??300000);",
  " const scientificInputs=freeze({waterAreaPpm:knownPpm(input.waterAreaPpm),iceAreaPpm:knownPpm(input.iceAreaPpm),tectonicActivityPpm:knownPpm(input.tectonicActivityPpm),volcanicActivityPpm:knownPpm(input.volcanicActivityPpm),impactActivityPpm:knownPpm(input.impactActivityPpm),erosionActivityPpm:knownPpm(input.erosionActivityPpm),aridityPpm:knownPpm(input.aridityPpm)}),assumptionsUsed=[];\n function presentationValue(key){if(scientificInputs[key]!==null)return scientificInputs[key];assumptionsUsed.push(key);return PRESENTATION_PRIORS[key]}\n const waterAreaPpm=presentationValue('waterAreaPpm'),iceAreaPpm=presentationValue('iceAreaPpm'),tectonicActivityPpm=presentationValue('tectonicActivityPpm'),volcanicActivityPpm=presentationValue('volcanicActivityPpm'),impactActivityPpm=presentationValue('impactActivityPpm'),erosionActivityPpm=presentationValue('erosionActivityPpm'),aridityPpm=presentationValue('aridityPpm');");
 exact(p,
  "inputs:{waterAreaPpm,iceAreaPpm,tectonicActivityPpm,volcanicActivityPpm,impactActivityPpm,erosionActivityPpm,aridityPpm},bounds:",
  "inputs:scientificInputs,presentationAssumptions:freeze({authority:PRESENTATION_PRIORS.authority,claim:PRESENTATION_PRIORS.claim,fields:assumptionsUsed.slice().sort()}),bounds:");
 exact(p,
  "return Object.freeze({VERSION,AUTHORITY,planetIdentity,planetClass,noSolidSurface,waterAreaPpm,iceAreaPpm,tectonicActivityPpm,volcanicActivityPpm,impactActivityPpm,erosionActivityPpm,aridityPpm,seaLevelCuePpm,features:",
  "return Object.freeze({VERSION,AUTHORITY,planetIdentity,planetClass,noSolidSurface,scientificInputs,presentationAssumptions:freeze({authority:PRESENTATION_PRIORS.authority,claim:PRESENTATION_PRIORS.claim,fields:assumptionsUsed.slice().sort()}),waterAreaPpm:scientificInputs.waterAreaPpm,iceAreaPpm:scientificInputs.iceAreaPpm,tectonicActivityPpm:scientificInputs.tectonicActivityPpm,volcanicActivityPpm:scientificInputs.volcanicActivityPpm,impactActivityPpm:scientificInputs.impactActivityPpm,erosionActivityPpm:scientificInputs.erosionActivityPpm,aridityPpm:scientificInputs.aridityPpm,seaLevelCuePpm,features:");
 exact(p,"O.v2x06Geography=Object.freeze({VERSION,AUTHORITY,PPM,MAX_FEATURES,createModel});","O.v2x06Geography=Object.freeze({VERSION,AUTHORITY,PPM,MAX_FEATURES,PRESENTATION_PRIORS,createModel});");
}

// P22-003: all Life defaults are explicit scenario assumptions, never hidden biological facts.
{
 const p='src/v2x-08-life-ecology-evolution-embodiment/model.js';
 exact(p,"export const LIFE_V2_LIMITS = Object.freeze({","export const LIFE_V2_SCENARIO_ASSUMPTIONS = Object.freeze({\n  authority: 'MODEL_ASSUMPTION_NOT_OBSERVATION',\n  provenance: 'V2X08_BOUNDED_SCENARIO_PROFILE',\n  limitations: 'Used only when a caller omits an explicit scenario parameter; values are not empirical species priors.',\n  birthPpm: 30_000n, mortalityPpm: 20_000n, disturbanceMortalityPpm: 250_000n,\n  fecundityPpm: 500_000n, resiliencePpm: 500_000n, resourcePerBirth: 1n, nutrientPerBirth: 1n, maintenancePerIndividual: 1n, juvenileMaturationPpm: 0n, matureSenescencePpm: 0n,\n});\n\nexport const LIFE_V2_LIMITS = Object.freeze({");
 exact(p,"function traitValue(lineage, key, fallback = 500_000n) {","function traitValue(lineage, key, fallback) {\n  assert(fallback !== undefined, `trait ${key} requires explicit value or governed scenario assumption`);");
 const reps=[
  [/profile\.birthPpm \?\? 30_000/g,"profile.birthPpm ?? LIFE_V2_SCENARIO_ASSUMPTIONS.birthPpm"],
  [/profile\.mortalityPpm \?\? 20_000/g,"profile.mortalityPpm ?? LIFE_V2_SCENARIO_ASSUMPTIONS.mortalityPpm"],
  [/profile\.disturbanceMortalityPpm \?\? 250_000/g,"profile.disturbanceMortalityPpm ?? LIFE_V2_SCENARIO_ASSUMPTIONS.disturbanceMortalityPpm"],
  [/traitValue\(lineage, 'fecundity', 500_000n\)/g,"traitValue(lineage, 'fecundity', LIFE_V2_SCENARIO_ASSUMPTIONS.fecundityPpm)"],
  [/traitValue\(lineage, 'resilience', 500_000n\)/g,"traitValue(lineage, 'resilience', LIFE_V2_SCENARIO_ASSUMPTIONS.resiliencePpm)"],
  [/profile\.resourcePerBirth \?\? 1/g,"profile.resourcePerBirth ?? LIFE_V2_SCENARIO_ASSUMPTIONS.resourcePerBirth"],
  [/profile\.nutrientPerBirth \?\? 1/g,"profile.nutrientPerBirth ?? LIFE_V2_SCENARIO_ASSUMPTIONS.nutrientPerBirth"],
  [/profile\.maintenancePerIndividual \?\? 1/g,"profile.maintenancePerIndividual ?? LIFE_V2_SCENARIO_ASSUMPTIONS.maintenancePerIndividual"],
  [/profile\.juvenileMaturationPpm \?\? 0/g,"profile.juvenileMaturationPpm ?? LIFE_V2_SCENARIO_ASSUMPTIONS.juvenileMaturationPpm"],
  [/profile\.matureSenescencePpm \?\? 0/g,"profile.matureSenescencePpm ?? LIFE_V2_SCENARIO_ASSUMPTIONS.matureSenescencePpm"],
 ];
 let t=read(p);for(const [re,to] of reps)t=t.replace(re,to);write(p,t);
}

// P22-004: no modeled infrastructure means unknown condition and no route capacity.
{
 const p='src/v2x-09-civilization-economy-city/production-network.js';
 exact(p,"if(!matches.length)return freeze({conditionPpm:450000,degradationPpm:550000,evidenceClass:'TRADE_EDGE_WITHOUT_MODELED_INFRASTRUCTURE_ASSET',sourceInfrastructureIds:[]});","if(!matches.length)return freeze({conditionPpm:null,degradationPpm:null,evidenceClass:'TRADE_EDGE_WITHOUT_MODELED_INFRASTRUCTURE_ASSET_CONDITION_UNKNOWN',sourceInfrastructureIds:[]});");
 rx(p,/let total=0;const ids=\[\];for\(const x of matches\)\{ids\.push\(text\(x\.infrastructureId\|\|deriveId\('infra',edge\.edgeId,ids\.length\)\)\);const status=text\(x\.status\|\|'ACTIVE'\)\.toUpperCase\(\);let c=clamp\(x\.conditionPpm\?\?\(status==='ACTIVE'\?850000:status==='DAMAGED'\?450000:status==='RUINED'\?100000:300000\)\);const idle=Math\.max\(0,int\(state\?\.epoch\|\|0\)-int\(x\.lastActiveEpoch\?\?state\?\.epoch\?\?0\)\);c=clamp\(c-idle\*15000\);total\+=c\}const condition=clamp\(Math\.floor\(total\/Math\.max\(1,matches\.length\)\)\);return freeze\(\{conditionPpm:condition,degradationPpm:1000000-condition,evidenceClass:'MODELED_INFRASTRUCTURE_CONDITION',sourceInfrastructureIds:ids\.sort\(\)\}\)/,
 "let total=0,known=0;const ids=[];for(const x of matches){ids.push(text(x.infrastructureId||deriveId('infra',edge.edgeId,ids.length)));const raw=Number(x.conditionPpm);if(!Number.isFinite(raw))continue;let c=clamp(raw);const idle=Math.max(0,int(state?.epoch||0)-int(x.lastActiveEpoch??state?.epoch??0));c=clamp(c-idle*15000);total+=c;known++}if(!known)return freeze({conditionPpm:null,degradationPpm:null,evidenceClass:'MODELED_INFRASTRUCTURE_CONDITION_UNKNOWN',sourceInfrastructureIds:ids.sort()});const condition=clamp(Math.floor(total/known));return freeze({conditionPpm:condition,degradationPpm:1000000-condition,evidenceClass:'MODELED_INFRASTRUCTURE_CONDITION',sourceInfrastructureIds:ids.sort()})",'modeled route condition');
 exact(p,"disableReason=routeDisableReason(edge,a,b,enabled),operational=disableReason===null,capacity=operational?","baseDisableReason=routeDisableReason(edge,a,b,enabled),conditionKnown=Number.isFinite(condition.conditionPpm),disableReason=baseDisableReason??(conditionKnown?null:'INFRASTRUCTURE_CONDITION_UNKNOWN'),operational=disableReason===null,capacity=operational?");
}

// P22-005: preserve unknown service/infrastructure/legitimacy/cohesion and do not manufacture risk.
{
 const p='src/v2x-09-civilization-economy-city/society-dynamics.js';
 exact(p,"for(const s of arr(network?.settlements))out.set(text(s.settlementId),s.serviceSatisfaction||{overallPpm:0,services:[]});","for(const s of arr(network?.settlements))out.set(text(s.settlementId),s.serviceSatisfaction||null);");
 rx(p,/function routeStressFor\(network,settlementId\)\{[\s\S]*?\n\}/,
`function routeStressFor(network,settlementId){
 const incident=arr(network?.routes).filter(r=>r.from===settlementId||r.to===settlementId);
 if(!incident.length)return null;
 const usable=incident.filter(r=>r.routingEligible!==false);
 if(!usable.length)return null;
 const values=usable.map(r=>[r.degradationPpm,r.utilizationPpm].filter(v=>Number.isFinite(Number(v))).map(Number)).filter(v=>v.length);
 if(!values.length)return null;
 return clamp(Math.floor(values.reduce((n,v)=>n+Math.max(...v),0)/values.length));
}`,'routeStressFor');
 exact(p,"const service=clamp(satisfaction.get(settlementId)?.overallPpm||0);","const rawService=satisfaction.get(settlementId)?.overallPpm,service=Number.isFinite(Number(rawService))?clamp(rawService):null;");
 exact(p,"const infrastructure=clamp(settlement.infrastructurePpm||0);","const infrastructure=Number.isFinite(Number(settlement.infrastructurePpm))?clamp(settlement.infrastructurePpm):null;\n  if(service===null||routeStress===null||infrastructure===null){rows.push(incompletePressure(settlement,'SCIENTIFIC_SOCIAL_INPUT_UNKNOWN'));continue;}");
 exact(p,"const legitimacy=clamp(polity.legitimacyPpm||0);\n  const cohesion=clamp(polity.cohesionPpm||0);","const legitimacy=Number.isFinite(Number(polity.legitimacyPpm))?clamp(polity.legitimacyPpm):null;\n  const cohesion=Number.isFinite(Number(polity.cohesionPpm))?clamp(polity.cohesionPpm):null;");
 exact(p,"if(legitimacy<300000||cohesion<300000)mechanisms.push('LEGITIMACY_AND_COHESION_RISK');","if(legitimacy!==null&&cohesion!==null&&(legitimacy<300000||cohesion<300000))mechanisms.push('LEGITIMACY_AND_COHESION_RISK');\n  if(legitimacy===null||cohesion===null)mechanisms.push('LEGITIMACY_OR_COHESION_UNKNOWN');");
 exact(p,"transitionRisk:legitimacy<180000||cohesion<180000?'FRAGMENTATION_RISK':scarcity>700000&&service<350000?'ALLOCATIVE_CRISIS':'BOUNDED_RESPONSE'","transitionRisk:legitimacy===null||cohesion===null?'UNKNOWN_INCOMPLETE_EVIDENCE':legitimacy<180000||cohesion<180000?'FRAGMENTATION_RISK':scarcity>700000&&service<350000?'ALLOCATIVE_CRISIS':'BOUNDED_RESPONSE'");
}

// P22-006: no invented household size or role. Identity remains addressable; grouping/role are null until evidenced or retained.
{
 const p='src/domains/v1/individuals/runtime.js';
 exact(p,"  const householdSize = Number.isSafeInteger(aggregate.householdSizeEstimate) && aggregate.householdSizeEstimate > 0\n    ? Math.min(32, aggregate.householdSizeEstimate)\n    : 4;\n  const householdOrdinal = durable?.householdOrdinal ?? Math.floor(birthOrdinal / householdSize);\n  const rolePool = Array.isArray(aggregate.roles) && aggregate.roles.length ? aggregate.roles.slice(0, 128).map((role) => text(role, 'aggregate role', 256)) : ['resident'];\n  const role = durable?.role || rolePool[deterministicInt(identity.id, rolePool.length)];",
 "  const householdSize = Number.isSafeInteger(aggregate.householdSizeEstimate) && aggregate.householdSizeEstimate > 0 ? Math.min(32, aggregate.householdSizeEstimate) : null;\n  const householdOrdinal = durable?.householdOrdinal ?? (householdSize===null?null:Math.floor(birthOrdinal / householdSize));\n  const rolePool = Array.isArray(aggregate.roles) && aggregate.roles.length ? aggregate.roles.slice(0, 128).map((role) => text(role, 'aggregate role', 256)) : Object.freeze([]);\n  const role = durable?.role ?? (rolePool.length?rolePool[deterministicInt(identity.id, rolePool.length)]:null);");
 exact(p,"    householdId: householdId({ worldId, settlementId, householdOrdinal }),\n    householdAuthority: 'MODEL_DERIVED_GROUPING_NOT_KINSHIP',","    householdId: householdOrdinal===null?null:householdId({ worldId, settlementId, householdOrdinal }),\n    householdAuthority: householdOrdinal===null?'UNKNOWN_WITHHELD_NO_GROUPING_EVIDENCE':'MODEL_DERIVED_GROUPING_NOT_KINSHIP',\n    roleAuthority: role===null?'UNKNOWN_WITHHELD_NO_ROLE_EVIDENCE':'MODEL_DERIVED_FROM_AGGREGATE_OR_RETAINED',");
 exact(p,"    role: text(person.role ?? 'resident', 'person.role', 256),","    role: person.role == null ? null : text(person.role, 'person.role', 256),");
}

// P22-007: missing Civilization provenance fails closed.
{
 const p='src/v2x-09-civilization-economy-city/core.js';
 exact(p,"function sourceAuthority(v){const a=v?.authority;const candidate=typeof a==='string'?a:(a?.authorityClass??a?.class??a?.authority??v?.authorityClass);return text(candidate||'MODEL_DERIVED_SIMULATION').toUpperCase()}","function sourceAuthority(v){const a=v?.authority;const candidate=typeof a==='string'?a:(a?.authorityClass??a?.class??a?.authority??v?.authorityClass);return candidate==null||text(candidate).trim()===''?null:text(candidate).toUpperCase()}");
}

// P22-008: display coordinates have presentation authority; underlying model/source coordinate authority stays separate.
{
 const p='src/rendering/microscopic/matter-continuity-provider.js';
 exact(p,"positionAuthority:a.coordinateAuthority==='SOURCE_BACKED_ATOMIC_COORDINATE'?'SOURCE_BACKED_ATOMIC_COORDINATE':'MODEL_DERIVED_OR_PRESENTATION_COORDINATE',coordinateAuthority:a.coordinateAuthority,scientificGeometryClaim:a.coordinateAuthority==='SOURCE_BACKED_ATOMIC_COORDINATE',sourceBackedGeometryClaim:a.coordinateAuthority==='SOURCE_BACKED_ATOMIC_COORDINATE',computedGeometryClaim:a.coordinateAuthority==='MODEL_DERIVED_COMPUTED_COORDINATE'",
 "positionAuthority:'PRESENTATION_ONLY',displayCoordinateAuthority:'PRESENTATION_ONLY',modelCoordinateAuthority:a.coordinateAuthority,coordinateAuthority:a.coordinateAuthority,scientificGeometryClaim:a.coordinateAuthority==='SOURCE_BACKED_ATOMIC_COORDINATE',displayPositionScientificClaim:false,sourceBackedGeometryClaim:a.coordinateAuthority==='SOURCE_BACKED_ATOMIC_COORDINATE',computedGeometryClaim:a.coordinateAuthority==='MODEL_DERIVED_COMPUTED_COORDINATE'");
}

// Wire V2X-05 into the real Living component graph.
json('config/components/v2x-living-product-composition.json',doc=>{
 const c=doc.components.find(x=>x.id==='v2x.living.domain-composition');if(!c)throw new Error('living domain component missing');
 c.dependencies=[...new Set([...(c.dependencies||[]),'v2x05.deep-planet.provider'])];
});

// Strengthen the science oracle: manifest reachability alone is insufficient for P22-009.
{
 const p='tests/audit/v2-science-authority-oracle.mjs';
 exact(p,"  const used=(living.dependencies||[]).includes('v2x05.deep-planet.provider');\n  if(!used)finding('P22-009','P1','V2X-05 is shipped but the Living product has no declared dependency on it.',livingManifestPath,'v2x.living.domain-composition.dependencies','Add the deep-planet provider as a real Living consumer and expose provenance/uncertainty in a founder-visible product consequence.');",
 "  const used=(living.dependencies||[]).includes('v2x05.deep-planet.provider');\n  const livingSource=read('src/rendering/v2x-convergence/living-domain-composition.js');\n  const runtimeConsumer=/DeepPlanet\\.query\\(p,'SURFACE_PROMPT08_CONTEXT'\\)/.test(livingSource)&&/deepPlanetModelDigest/.test(livingSource)&&/deepPlanetUncertainty/.test(livingSource);\n  if(!used||!runtimeConsumer)finding('P22-009','P1','V2X-05 is shipped but the Living product lacks a real provenance-bearing runtime consumer.',livingManifestPath,'v2x.living.domain-composition.dependencies + Living runtime consumer','Add the deep-planet provider as a real Living consumer and expose provenance/uncertainty in a founder-visible product consequence.');");
}

console.log('Applied systemic Prompt-22 production repairs P22-002..009 and strengthened P22-009 reachability oracle.');
