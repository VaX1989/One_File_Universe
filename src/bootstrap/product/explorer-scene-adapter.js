(function(root){
'use strict';
const O=root.OFU=root.OFU||{},C=O.v09ExplorerCore,R=O.waveIVScaleRuntime,A=O.p3Astronomy;
const SYSTEM_FIELDS=Object.freeze(['galaxyX','galaxyY','galaxyZ','sectorX','sectorY','sectorZ','siteX','siteY','siteZ']);
const PLANET_FIELDS=Object.freeze([...SYSTEM_FIELDS,'orbitSlot']);
const state={seamVersion:3,contract:'ofu-wave-iv-explorer-scene-seam-1',consumer:null,lastSnapshot:null,lastError:null,publishes:0,eventDriven:true};
const freezeKey=(key,fields)=>Object.freeze(Object.fromEntries(fields.map(name=>[name,BigInt(key[name])])));
function selectedKey(){const fromRuntime=R?.snapshot?.().selectedCanonicalTarget?.canonicalKey;if(fromRuntime)return fromRuntime;const key=root.__OFU_PLANET_PREVIEW__?.chosen?.key;return key?freezeKey(key,PLANET_FIELDS):null}
function current(){
 const P=root.__OFU_PLANET_PREVIEW__,key=selectedKey(),scale=R?.snapshot?.();
 if(!C||!A||!P?.ctx||!key)return Object.freeze({version:3,ready:false,system:null,star:null,bodies:Object.freeze([]),selection:null,stage:scale?.semanticScale||'system',activeSceneProvider:scale?.activeSceneProvider||null});
 const canonicalSystemKey=freezeKey(key,SYSTEM_FIELDS),canonicalPlanetKey=freezeKey(key,PLANET_FIELDS),system=A.resolveSystem(P.ctx,canonicalSystemKey);
 if(system?.status!=='PRESENT')return Object.freeze({version:3,ready:false,system:null,star:null,bodies:Object.freeze([]),selection:null,stage:scale?.semanticScale||'system',activeSceneProvider:scale?.activeSceneProvider||null});
 const count=Number(system.facts.planetCount||0n),bodies=[];for(let orbitIndex=0;orbitIndex<count;orbitIndex++){const planetKey=Object.freeze({...canonicalSystemKey,orbitSlot:BigInt(orbitIndex)}),planet=A.resolvePlanet(P.ctx,planetKey);if(planet?.status!=='PRESENT')continue;bodies.push(Object.freeze({token:C.serializePlanetKey(planetKey),orbitIndex,label:'World '+String(orbitIndex+1),presentationStatus:C.samePlanetKey(planetKey,P.chosen?.key)?(P.targetStatus||'UNKNOWN'):'NOT_SELECTED'}))}
 const star=A.resolveStar(P.ctx,{...canonicalSystemKey,componentIndex:0n}),selectionIndex=Number(canonicalPlanetKey.orbitSlot);
 return Object.freeze({version:3,ready:true,system:Object.freeze({token:C.serializeSystemKey(canonicalSystemKey),canonicalKey:canonicalSystemKey,planetCount:bodies.length,stellarComponentCount:Number(system.facts.stellarComponentCount||0n)}),star:star?.status==='PRESENT'?Object.freeze({componentIndex:0,evolutionaryClass:String(star.facts?.baselineEvolutionaryClass||'UNKNOWN')}):null,bodies:Object.freeze(bodies),selection:Object.freeze({token:C.serializePlanetKey(canonicalPlanetKey),canonicalKey:canonicalPlanetKey,orbitIndex:selectionIndex}),stage:scale?.semanticScale||'system',activeSceneProvider:scale?.activeSceneProvider||null});
}
function register(consumer){if(consumer!==null&&typeof consumer?.update!=='function')throw new TypeError('scene consumer must expose update(snapshot)');state.consumer=consumer;state.lastError=null;return snapshot()}
function snapshot(){const next=current();state.lastSnapshot=next;return next}
function publish(){const next=snapshot();state.publishes++;if(!state.consumer)return next;try{state.consumer.update(next)}catch(error){state.lastError=String(error?.message||error)}return next}
function bind(){if(!R?.on)return;for(const event of ['selectionChanged','scaleChanged','sceneChanged','rendererReady'])R.on(event,publish)}
bind();
const api=Object.freeze({seamVersion:3,contract:state.contract,state,register,snapshot,publish});O.v09ExplorerScene=api;
})(typeof globalThis!=='undefined'?globalThis:this);
