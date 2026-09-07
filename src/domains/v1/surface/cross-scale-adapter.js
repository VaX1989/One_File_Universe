(function(root){
'use strict';
const O=root.OFU=root.OFU||{},A=O.v2x06SurfaceAddress,X=O.pxCrossScale;
if(!A||!X)throw new Error('V2X-06 surface address and PX cross-scale required');
const VERSION='ofu-v2x-06-surface-cross-scale-adapter-1';
const AUTHORITY='DERIVED';
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;for(const k of Object.keys(v))freeze(v[k]);return Object.freeze(v)}
function regime(level){const l=Math.max(0,Math.min(A.MAX_LEVEL,Math.floor(Number(level)||0)));return 'surface-lod-'+l}
function makeRule({fromLevel,toLevel,authority,id='v2x-06.surface-context'}={}){if(!authority)throw new TypeError('PX authority required');const from=regime(fromLevel),to=regime(toLevel);return X.rule({id,version:'1.0.0',from,to,authority,fidelity:{regime:to,validity:'Deterministic surface-location presentation context refinement within an already authoritative selected planet context',resolution:`Surface address LOD ${toLevel}`,uncertainty:'Location/patch addressing is derived; generated terrain/geography remains separately authority-labeled and is not promoted by this adapter'},observableKeys:['surfaceLocationIdentity','surfacePlanetIdentity']})}
function representation(address){if(!address?.locationIdentity)throw new TypeError('surface address required');return freeze({version:VERSION,authority:AUTHORITY,planetIdentity:address.planetIdentity,locationIdentity:address.locationIdentity,patchIdentity:address.patchIdentity,latMicroDeg:address.latMicroDeg,lonMicroDeg:address.lonMicroDeg,level:address.level,claims:{selectionAuthorityChanged:false,timeHistoryChanged:false,physicalTerrainCommitment:false}})}
function result(parent,rule,address){return X.contextDetail(parent,rule,representation(address))}
function refineContext({parent,address,toLevel,authority,budget}={}){const rule=makeRule({fromLevel:address.level,toLevel,authority}),target=A.atLevel(address,toLevel),detail=result(parent,rule,target),out=X.refine(parent,rule,budget,()=>detail);return freeze({version:VERSION,operation:'REFINE',address:target,rule,witness:out.witness,result:out.result})}
function projectContext({parent,address,toLevel,authority,budget}={}){const rule=makeRule({fromLevel:address.level,toLevel,authority,id:'v2x-06.surface-context-project'}),target=A.atLevel(address,toLevel),detail=result(parent,rule,target),projection=X.project(parent,rule,detail,budget),witness=X.reconcile(parent,rule,detail,budget);return freeze({version:VERSION,operation:'PROJECT',address:target,rule,projection,witness})}
function reconcileContext({parent,address,toLevel,authority,budget}={}){const rule=makeRule({fromLevel:address.level,toLevel,authority,id:'v2x-06.surface-context-reconcile'}),target=A.atLevel(address,toLevel),detail=result(parent,rule,target),witness=X.reconcile(parent,rule,detail,budget);return freeze({version:VERSION,operation:'RECONCILE',address:target,rule,witness})}
O.v2x06SurfaceCrossScale=Object.freeze({VERSION,AUTHORITY,regime,makeRule,representation,refineContext,projectContext,reconcileContext});
})(globalThis);
