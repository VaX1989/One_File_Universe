(function(root){
'use strict';
const O=root.OFU=root.OFU||{},Base=O.v1Session,P=O.p2,H=O.sha256,G=O.v2x11Gameplay;
if(!Base||!P||!H||!G)throw new Error('V2X-11 central session bridge dependencies missing');
const VERSION='ofu-v2x11-central-session-1',FORMAT='OFU-V2X11-SESSION-EXTENSION',SCHEMA=1n,BROWSER_KEY='ofu.v1.session',MAX_TARGETS=8,MAX_GAMEPLAY_BYTES=256*1024;
const sessions=new Map();
function fail(message){throw new Error('OFU V2X-11 central session bridge: '+message)}
function bytesEqual(a,b){return a instanceof Uint8Array&&b instanceof Uint8Array&&a.length===b.length&&a.every((v,i)=>v===b[i])}
function exact(value,keys,label){if(!value||typeof value!=='object'||Array.isArray(value))fail(label+' record');const actual=Object.keys(value).sort(),wanted=[...keys].sort();if(actual.length!==wanted.length||actual.some((k,i)=>k!==wanted[i]))fail(label+' schema')}
function clone(value){return P.decode(P.encode(value))}
function currentTargetId(){const captured=O.pxProduct?.captured?.();const id=captured?.selection?.target?.entityId;if(typeof id!=='string'||!/^[0-9a-f]{64}$/.test(id))fail('current canonical selection required');return id}
function currentUniverseIdentity(){const preview=root.__OFU_PLANET_PREVIEW__,ctx=preview?.ctx;if(!ctx?.masterSeed||!ctx?.semanticManifestHash)fail('canonical preview context unavailable');const identity=P.universeIdentity(ctx.masterSeed,ctx.semanticManifestHash)?.digest,hex=P.hex(identity);if(!/^[0-9a-f]{64}$/.test(hex))fail('universe identity unavailable');return hex}
function ensureSession(targetId=currentTargetId()){
 const universeIdentity=currentUniverseIdentity(),prior=sessions.get(targetId);if(prior){if(prior.universeIdentity!==universeIdentity)fail('gameplay universe identity drift');return prior}
 if(sessions.size>=MAX_TARGETS)fail('gameplay target session bound exceeded');const created=G.createSession({universeIdentity,targetId});sessions.set(targetId,created);return created;
}
function performV2X11Action(kind,parameters={},actorId='living-user'){
 const targetId=currentTargetId(),session=ensureSession(targetId),result=G.perform({session,actorId:String(actorId||'living-user'),kind,parameters});sessions.set(targetId,result.session);return Object.freeze({targetId,receipt:clone(result.receipt),revisit:clone(result.revisit),plan:clone(result.plan),execution:clone(result.execution),canonicalMutation:false});
}
function v2x11Revisit(targetId=null){targetId=targetId===null?currentTargetId():String(targetId);const session=sessions.get(targetId);return session?clone(G.revisit(session)):null}
function gameplayRows(){return [...sessions.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([targetId,session])=>Object.freeze({targetId,archive:G.exportSession(session)}))}
function gameplayBytes(rows=gameplayRows()){return P.encode(rows).length}
function validateGameplay(rows){if(!Array.isArray(rows)||rows.length>MAX_TARGETS)fail('gameplay archive bounds');if(P.encode(rows).length>MAX_GAMEPLAY_BYTES)fail('gameplay archive byte bound');const next=new Map();for(const row of rows){exact(row,['targetId','archive'],'gameplay row');if(typeof row.targetId!=='string'||!/^[0-9a-f]{64}$/.test(row.targetId)||next.has(row.targetId))fail('gameplay target identity/duplicate');const loaded=G.importSession(row.archive);if(loaded.session.targetId!==row.targetId)fail('gameplay archive target mismatch');next.set(row.targetId,loaded.session)}return next}
function extensionBody(){const rows=gameplayRows();if(P.encode(rows).length>MAX_GAMEPLAY_BYTES)fail('gameplay archive byte bound');return Object.freeze({format:FORMAT,schemaVersion:SCHEMA,base:Base.exportBytes(),gameplay:Object.freeze(rows),authority:'MODEL_DERIVED_SIMULATION',canonicalMutation:false})}
function digest(body){return H.digest(P.encode(body))}
function exportBytes(){const body=extensionBody(),bytes=P.encode({body,integrity:digest(body)});if(bytes.length>Base.MAX_BYTES)fail('extended central session exceeds byte limit');return bytes}
function decode(bytes){let container;try{container=P.decode(bytes)}catch{return{legacy:true,base:bytes,sessions:new Map()}}if(container?.body?.format!==FORMAT)return{legacy:true,base:bytes,sessions:new Map()};exact(container,['body','integrity'],'extension container');const body=container.body;exact(body,['format','schemaVersion','base','gameplay','authority','canonicalMutation'],'extension body');if(body.schemaVersion!==SCHEMA||body.authority!=='MODEL_DERIVED_SIMULATION'||body.canonicalMutation!==false)fail('extension metadata');if(!(container.integrity instanceof Uint8Array)||!bytesEqual(container.integrity,digest(body)))fail('extension integrity mismatch');Base.validateBytes(body.base);return{legacy:false,base:body.base,sessions:validateGameplay(body.gameplay)}}
function validateBytes(bytes){return decode(bytes)}
function importBytes(bytes){const value=decode(bytes),prior=new Map(sessions);try{const baseResult=Base.importBytes(value.base);sessions.clear();for(const [key,session] of value.sessions)sessions.set(key,session);const current=(()=>{try{return v2x11Revisit()}catch{return null}})();return Object.freeze({...baseResult,v2x11SessionBridge:VERSION,v2x11GameplayTargets:sessions.size,v2x11CurrentActions:current?.actions||'0',v2x11LegacyArchive:value.legacy})}catch(error){sessions.clear();for(const [key,session] of prior)sessions.set(key,session);throw error}}
function browserStorage(){let storage;try{storage=root.localStorage}catch(error){fail('browser storage unavailable: '+String(error?.message||error))}if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function'||typeof storage.removeItem!=='function')fail('browser storage unavailable');return storage}
function storeBrowser(){const storage=browserStorage(),previous=storage.getItem(BROWSER_KEY),text=Base.hex(exportBytes());try{storage.setItem(BROWSER_KEY,text);if(storage.getItem(BROWSER_KEY)!==text)throw new Error('write verification failed')}catch(error){try{if(previous===null)storage.removeItem(BROWSER_KEY);else storage.setItem(BROWSER_KEY,previous)}catch{}fail('browser save failed: '+String(error?.message||error))}return Object.freeze({textBytes:text.length,portableAuthoritative:true,verified:true,v2x11GameplayTargets:sessions.size})}
function loadBrowser(){const storage=browserStorage(),text=storage.getItem(BROWSER_KEY);if(!text)fail('no browser convenience save');return importBytes(Base.unhex(text))}
function snapshot(){let current=null;try{current=v2x11Revisit()}catch{}return Object.freeze({...Base.snapshot(),v2x11SessionBridge:VERSION,v2x11GameplayTargets:sessions.size,v2x11GameplayBytes:gameplayBytes(),v2x11CurrentActions:current?.actions||'0',v2x11CurrentConsequenceCount:current?.consequences?.length||0,v2x11CanonicalMutation:false})}
O.v1Session=Object.freeze({...Base,VERSION:Base.VERSION+'+'+VERSION,exportBytes,validateBytes,importBytes,storeBrowser,loadBrowser,performV2X11Action,v2x11Revisit,snapshot});
O.v2x11CentralSessionBridge=Object.freeze({VERSION,FORMAT,SCHEMA,BROWSER_KEY,MAX_TARGETS,MAX_GAMEPLAY_BYTES,performV2X11Action,v2x11Revisit,gameplayRows,validateGameplay});
})(typeof globalThis!=='undefined'?globalThis:this);
