(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const HAS_DOCUMENT=typeof document!=='undefined';
const SECTION_IDS=Object.freeze(['canonical-evidence','temporal-laboratory','archive-replay','rendering-diagnostics','artifact-integrity']);
const SECTION_LABELS=Object.freeze({
  'canonical-evidence':'canonical evidence',
  'temporal-laboratory':'temporal laboratory',
  'archive-replay':'archive and replay',
  'rendering-diagnostics':'rendering diagnostics',
  'artifact-integrity':'artifact integrity'
});
const q=id=>HAS_DOCUMENT?document.getElementById(id):null;
const text=(id,value)=>{const node=q(id);if(node)node.textContent=String(value)};
const hex=value=>value&&O.p2?.hex?O.p2.hex(value):String(value??'');
const json=value=>JSON.stringify(value,(key,item)=>typeof item==='bigint'?item.toString():item instanceof Uint8Array?hex(item):item,2);
function current(){return O.inspectorTest?.state?.current||null}
function factDigest(selection){if(!selection)return null;return selection.digest||hex(O.p3Astronomy?.digestFact?.(selection.r))}
function canonicalEvidence(){
  const selection=current();
  if(!selection?.r||selection.r.status!=='PRESENT')return null;
  const A=O.p3Astronomy;
  const state=O.inspectorTest?.state;
  const digest=factDigest(selection);
  return Object.freeze({
    entityType:selection.type||selection.r.entityType,
    entityIdentity:selection.r.id,
    canonicalAddress:selection.r.address||null,
    canonicalKey:selection.key||selection.r.key||null,
    baselineFactDigest:digest,
    canonicalRecord:Object.freeze({
      status:selection.r.status,
      entityType:selection.r.entityType,
      id:selection.r.id,
      address:selection.r.address||null,
      key:selection.r.key||selection.key||null,
      facts:selection.r.facts,
      relations:selection.r.relations||null,
      canonicalEnvelope:A?.canonicalEnvelope?.(selection.r)||null
    }),
    provenance:Object.freeze({
      authority:'P3_CANONICAL',
      modelVersion:A?.VERSION||null,
      schemaVersion:A?.SCHEMA_VERSION??null,
      baselineEpoch:A?.BASELINE_EPOCH||null,
      semanticManifestHash:A?.semanticManifestHash?hex(A.semanticManifestHash()):null,
      universeIdentity:state?.universe?hex(state.universe):null,
      sourceCommit:O.BASELINE_BUILD?.sourceCommit||null,
      baselineFactDigest:digest
    })
  });
}
function syncCanonical(){
  const evidence=canonicalEvidence();
  if(!evidence){
    text('lab-entity-type','not resolved');
    text('lab-entity-id','not resolved');
    text('lab-entity-digest','not resolved');
    text('lab-canonical-address','Resolve a canonical entity first.');
    text('lab-canonical-record','Resolve a canonical entity first.');
    text('lab-canonical-provenance','Resolve a canonical entity first.');
    return null;
  }
  text('lab-entity-type',evidence.entityType);
  text('lab-entity-id',hex(evidence.entityIdentity));
  text('lab-entity-digest',evidence.baselineFactDigest);
  text('lab-canonical-address',json({entityType:evidence.entityType,key:evidence.canonicalKey,address:evidence.canonicalAddress}));
  text('lab-canonical-record',json(evidence.canonicalRecord));
  text('lab-canonical-provenance',json(evidence.provenance));
  return evidence;
}
function renderingSnapshot(){return root.__OFU_PLANET_PREVIEW__?.snapshot?.()||null}
function syncRendering(){
  const snapshot=renderingSnapshot();
  const selection=current();
  const selectedPlanetId=selection?.type==='Planet'&&selection.r?.id?hex(selection.r.id):null;
  const previewPlanetId=snapshot?.planetId||root.__OFU_PLANET_PREVIEW__?.provider?.planetId||root.__OFU_PLANET_PREVIEW__?.chosen?.planetId||null;
  let continuity='No canonical planet selected';
  if(selectedPlanetId)continuity=previewPlanetId===selectedPlanetId?'MATCH - renderer target follows canonical selection':'MISMATCH - diagnostic investigation required';
  text('lab-target-continuity',continuity);
  text('lab-renderer-snapshot',snapshot?json(snapshot):'Renderer snapshot not available yet.');
  return snapshot;
}
function sync(){return Object.freeze({canonical:syncCanonical(),rendering:syncRendering()})}
function open(section='canonical-evidence',{focus=true,announce=true}={}){
  const targetSection=SECTION_IDS.includes(section)?section:'canonical-evidence';
  O.productUI?.workspace?.('lab',{focus:false,announceChange:announce});
  sync();
  const node=HAS_DOCUMENT?document.querySelector('[data-lab-section-id="'+targetSection+'"]'):null;
  if(focus)node?.focus?.({preventScroll:false});
  if(announce)O.productUI?.announce?.('Opened Lab '+SECTION_LABELS[targetSection]);
  return node||null;
}
function openSparseQuery(){
  O.productUI?.workspace?.('inspect',{focus:true});
  q('entity-type')?.focus?.({preventScroll:false});
  O.productUI?.announce?.('Opened sparse canonical query');
  return true;
}
function verifyRequery(){
  try{
    if(!O.inspectorTest?.requery)throw new Error('canonical re-query service unavailable');
    O.inspectorTest.requery();
    text('lab-requery-status','PASS');
    syncCanonical();
    O.productUI?.announce?.('Deterministic re-query passed');
    return true;
  }catch(error){
    text('lab-requery-status','FAIL');
    O.productUI?.announce?.('Deterministic re-query failed');
    throw error;
  }
}
function refreshRendering(){
  const snapshot=syncRendering();
  O.productUI?.announce?.(snapshot?'Rendering diagnostics refreshed':'Renderer diagnostics unavailable');
  return snapshot;
}
function handleClick(event){
  const target=event.target?.closest?.('[data-lab-section],#lab-open-sparse-query,#lab-requery,#lab-refresh-rendering,#query,#requery,[data-workspace="lab"],[data-open-workspace="lab"]');
  if(!target)return;
  if(target.id==='lab-open-sparse-query'){event.preventDefault();openSparseQuery();return}
  if(target.id==='lab-requery'){event.preventDefault();verifyRequery();return}
  if(target.id==='lab-refresh-rendering'){event.preventDefault();refreshRendering();return}
  if(target.dataset?.labSection){open(target.dataset.labSection,{focus:true,announce:true});return}
  sync();
}
function init(){
  document.addEventListener('click',handleClick,false);
  sync();
}
const API=Object.freeze({seamVersion:2,sections:SECTION_IDS,canonicalEvidence,renderingSnapshot,sync,open,openSparseQuery,verifyRequery,refreshRendering});
O.v08LabTechnical=API;
if(HAS_DOCUMENT){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init()}
})(typeof globalThis!=='undefined'?globalThis:this);
