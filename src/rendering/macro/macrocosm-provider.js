(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const F=O.v2x03GalaxyField,R=O.v2x03RegionRefinement,N=O.v2x03NeighborhoodDepth,S=O.v1x02SpatialUniverse;
if(!F||!R||!N||!S)throw new Error('V2X-03 macrocosm provider dependencies missing');
const VERSION='ofu-v2x-03-macrocosm-provider-3',CONTRACT='ofu-v2x-03-macrocosm-consumer-1',AUTHORITY='PRESENTATION_ONLY';
const QUALITY=Object.freeze({LOW:Object.freeze({entityLimit:20,field:'LOW'}),MOBILE:Object.freeze({entityLimit:28,field:'MOBILE'}),STANDARD:Object.freeze({entityLimit:48,field:'STANDARD'}),HIGH:Object.freeze({entityLimit:64,field:'HIGH'})});
const freeze=v=>{if(!v||typeof v!=='object'||Object.isFrozen(v))return v;for(const k of Object.keys(v))freeze(v[k]);return Object.freeze(v)};
function q(name){const key=String(name||'STANDARD').toUpperCase();if(!QUALITY[key])throw new RangeError('unsupported macrocosm quality '+key);return{key,...QUALITY[key]}}
function upstreamIdentity(e){for(const k of ['canonicalId','entityId','id'])if(typeof e?.[k]==='string'&&e[k])return e[k];if(e?.canonicalKey&&typeof e.canonicalKey==='object')return JSON.stringify(e.canonicalKey,Object.keys(e.canonicalKey).sort());throw new TypeError('stable upstream identity required')}
function normalizeEntities(entities){if(!Array.isArray(entities))throw new TypeError('entities array required');const seen=new Set(),out=[];for(const e of entities){const id=upstreamIdentity(e);if(seen.has(id))throw new Error('duplicate upstream identity '+id);seen.add(id);out.push(e)}return out}
function buildUniverse({scopeId,entities,cameraFrame,quality='STANDARD',presentationSeed='OFU-V2X03',morphology='UNKNOWN',densityHint=.5}={}){
 const cfg=q(quality),input=normalizeEntities(entities),rep=S.representation({context:'UNIVERSE',scopeId,entities:input,cameraFrame,presentationSeed,morphology,densityHint,limit:cfg.entityLimit});
 return freeze({version:VERSION,contract:CONTRACT,status:'READY',scale:'UNIVERSE',authority:AUTHORITY,objects:rep.objects,bounds:freeze({entities:rep.objects.length,maxEntities:cfg.entityLimit}),camera:freeze({consumedExternalFrame:true,ownsFrame:false}),claims:freeze({gridPrimary:false,physicalCoordinates:false,canonicalTruthChanged:false,stableIdentityRequired:true})});
}
function buildGalaxy({galaxy,entities=[],cameraFrame=null,quality='STANDARD',presentationSeed='OFU-V2X03',densityHint=.5}={}){
 if(!galaxy)throw new TypeError('galaxy required');const cfg=q(quality),galaxyId=upstreamIdentity(galaxy),morphology=galaxy?.metadata?.modelProfile?.morphology||galaxy?.facts?.morphology||galaxy?.morphology||'UNKNOWN',field=F.build({galaxyId,morphology,quality:cfg.field,presentationSeed});let rep=null;
 if(cameraFrame&&entities.length)rep=S.representation({context:'GALAXY',scopeId:galaxyId,entities:normalizeEntities(entities),cameraFrame,presentationSeed,morphology,densityHint,limit:cfg.entityLimit});
 return freeze({version:VERSION,contract:CONTRACT,status:'READY',scale:'GALAXY',authority:AUTHORITY,galaxyId,morphology,field,objects:rep?rep.objects:Object.freeze([]),camera:freeze({consumedExternalFrame:!!cameraFrame,ownsFrame:false}),bounds:freeze({entities:rep?.objects.length||0,maxEntities:cfg.entityLimit,decorative:field.bounds.total}),claims:freeze({fieldIsCalibratedObservation:false,decorativeSelectable:false,canonicalGalaxyIdentityPreserved:true,stableIdentityRequired:true})});
}
function buildRegion({parentId,children,quality='STANDARD',focus=0,parentExtent=1}={}){const cfg=q(quality),scene=R.refine({parentId,children:normalizeEntities(children),quality:cfg.key,focus,parentExtent});return freeze({version:VERSION,contract:CONTRACT,status:'READY',scale:'REGION',authority:AUTHORITY,...scene,claims:freeze({hardReplacementRequired:false,regionBoundaryCanonical:false,stableIdentityRequired:true})})}
function buildNeighborhood({objects,cameraFrame,quality='STANDARD',scaleUnits=36}={}){const cfg=q(quality),scene=N.project({objects:normalizeEntities(objects),cameraFrame,quality:cfg.key,scaleUnits});return freeze({version:VERSION,contract:CONTRACT,status:'READY',scale:'NEIGHBORHOOD',authority:AUTHORITY,...scene})}
function pick(scene,x,y){if(scene?.scale!=='NEIGHBORHOOD')throw new Error('direct pick currently supported for NEIGHBORHOOD scenes only');return N.pick(scene,x,y)}
function continuityWitness({galaxy,region,neighborhood}={}){return freeze({version:VERSION,contract:CONTRACT,galaxyId:galaxy?.galaxyId||null,regionParent:region?.parentId||null,neighborhoodObjectIds:Object.freeze((neighborhood?.objects||[]).map(o=>o.sourceId)),cameraOwnedHere:false,selectionOwnedHere:false,scaleOwnedHere:false,authority:AUTHORITY})}
O.v2x03MacrocosmProvider=Object.freeze({VERSION,CONTRACT,AUTHORITY,QUALITY,buildUniverse,buildGalaxy,buildRegion,buildNeighborhood,pick,continuityWitness});
})(typeof globalThis!=='undefined'?globalThis:this);
