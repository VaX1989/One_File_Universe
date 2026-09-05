(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
if(typeof document==='undefined')return;
const FIELDS=Object.freeze(['galaxyX','galaxyY','galaxyZ','sectorX','sectorY','sectorZ','siteX','siteY','siteZ','orbitSlot']);
const q=id=>document.getElementById(id);
const copyKey=key=>Object.freeze(Object.fromEntries(FIELDS.map(name=>[name,BigInt(key[name])])));
const sameKey=(a,b)=>!!a&&!!b&&FIELDS.every(name=>BigInt(a[name])===BigInt(b[name]));
function establishInspectorPlanet(key){
 const P=root.__OFU_PLANET_PREVIEW__,I=O.inspectorTest,A=O.p3Astronomy,k=copyKey(key);
 if(!P?.ctx||!I?.query||!I?.state||!A)throw new Error('product selection bridge unavailable');
 if(!I.state.ctx)throw new Error('Inspector canonical service not ready');
 const canonical=A.resolvePlanet(P.ctx,k);if(canonical?.status!=='PRESENT')throw new Error('product selection requires a PRESENT canonical planet');
 const type=q('entity-type');if(!type)throw new Error('Inspector entity selector unavailable');type.value='Planet';type.dispatchEvent(new Event('change',{bubbles:true}));
 for(const name of FIELDS){const input=q('f-'+name);if(!input)throw new Error('Inspector canonical field unavailable: '+name);input.value=String(k[name])}
 const selected=I.query();if(selected?.status!=='PRESENT'||I.state.current?.type!=='Planet'||!sameKey(I.state.current.key,k))throw new Error('Inspector canonical selection did not commit requested planet');
 return Object.freeze({key:k,record:selected,digest:I.state.current.digest});
}
function selectPlanet(key,{announce=true}={}){
 const P=root.__OFU_PLANET_PREVIEW__;if(!P?.retarget)throw new Error('renderer retarget interface unavailable');
 const selected=establishInspectorPlanet(key),alreadyTargeted=sameKey(P.chosen?.key,selected.key)&&P.targetTestOnly!==true,rendered=alreadyTargeted?P.targetStatus==='SUPPORTED':P.retarget(selected.key);if(!sameKey(P.chosen?.key,selected.key))throw new Error('renderer target did not establish requested canonical planet');
 O.productUI?.sync?.();O.v08InspectorProduct?.render?.();O.v08LabTechnical?.sync?.();
 const result=Object.freeze({canonicalStatus:'PRESENT',canonicalDigest:selected.digest,planetId:O.p2?.hex?O.p2.hex(selected.record.id):null,presentationStatus:P.targetStatus,presentationReason:P.targetReason||null,rendered:rendered!==false,presentationRetargeted:!alreadyTargeted});
 O.waveIVScaleRuntime?.setSelection?.(selected.key,{planetId:result.planetId,presentationStatus:result.presentationStatus,source:'canonical-selection'});
 if(announce)O.productUI?.announce?.(P.targetStatus==='SUPPORTED'?'Selected world ready to explore':'Selected canonical world; visualization unavailable');return result;
}
const API=Object.freeze({seamVersion:3,contract:'ofu-wave-iv-selection-1',legacyContract:'ofu-product-canonical-planet-selection-1',authority:'SELECTION_ONLY',selectPlanet,sameKey});O.v08SelectionBridge=API;
})(typeof globalThis!=='undefined'?globalThis:this);
