(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const VERSION='ofu-v2x14-product-experience-8',AUTHORITY='PRESENTATION_ONLY';
const LABEL={UNIVERSE:'Universe',GALAXY:'Galaxy',REGION:'Region',NEIGHBORHOOD:'Stellar neighborhood',SYSTEM:'System',ORBIT:'Orbit',APPROACH:'Approach',GLOBAL_SURFACE:'Global surface',REGIONAL_SURFACE:'Regional surface',LOCAL_SURFACE:'Local surface',HUMAN:'Human scale',MATERIAL:'Material',MICROSTRUCTURE:'Microstructure',TISSUE:'Tissue',CELL:'Cell',MOLECULAR:'Molecular',ATOMIC:'Atomic'};
const MICRO=new Set(['MATERIAL','MICROSTRUCTURE','TISSUE','CELL','MOLECULAR','ATOMIC']);
const SHORTCUTS=['Home','Escape','Backspace','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'];
const INPUT_EVENTS=Object.freeze(['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture','wheel','keydown']);
const KNOWN_GESTURES=new Set(['pointer-down','pointer-up','pointer-cancel','drag','pinch-start','pinch','wheel','keyboard-scale']);
const MAX_OBSERVED_POINTERS=8;
const short=v=>String(v||'').slice(0,10),title=s=>LABEL[String(s||'')]||String(s||'Unknown').toLowerCase().replaceAll('_',' ');
function selectedLabel(s){if(!s.selectedObjectId)return 'No local object selected';const row=Array.isArray(s.local?.objects)?s.local.objects.find(x=>x?.entityId===s.selectedObjectId):null;const kind=row?.kind?title(row.kind):'Object';return kind+' '+short(row?.label||s.selectedObjectId);}
function pointLabel(s){if(!s.point)return null;const lat=Number(s.point.latMicroDeg),lon=Number(s.point.lonMicroDeg);if(Number.isFinite(lat)&&Number.isFinite(lon))return title(s.stage)+' '+(lat/1e6).toFixed(4)+' deg, '+(lon/1e6).toFixed(4)+' deg';return title(s.stage)+' '+short(s.point.locationIdentity);}
function derive(s={}){
 const stage=typeof s.stage==='string'&&s.stage.length?s.stage:'UNKNOWN',crumbs=stage==='UNKNOWN'?[]:[{stage:'UNIVERSE',label:'Universe'}];
 if(s.galaxy)crumbs.push({stage:'GALAXY',label:'Galaxy '+short(s.galaxy.canonicalId||s.galaxy.entityId)});
 if(s.region)crumbs.push({stage:'REGION',label:'Region '+short(s.region.canonicalId||s.region.entityId)});
 if(stage==='NEIGHBORHOOD')crumbs.push({stage:'NEIGHBORHOOD',label:'Stellar neighborhood '+short(s.node?.canonicalId||s.node?.entityId)});
 if(s.system)crumbs.push({stage:'SYSTEM',label:'System '+short(s.system.canonicalId||s.system.entityId)});
 if(s.world||s.body)crumbs.push({stage:'ORBIT',label:'World '+short(s.world?.planetIdentity||s.body?.canonicalId||s.body?.entityId)});
 const point=pointLabel(s);if(point)crumbs.push({stage,label:point});
 if(!crumbs.some(x=>x.stage===stage)&&stage==='APPROACH')crumbs.push({stage,label:'Approach '+short(s.world?.planetIdentity||s.body?.canonicalId||s.body?.entityId)});
 if(!crumbs.some(x=>x.stage===stage)&&MICRO.has(stage)&&!point)crumbs.push({stage,label:title(stage)});
 const unknown=Object.freeze({stage:'UNKNOWN',label:'unknown'}),current=crumbs.slice().reverse().find(x=>x.stage===stage),resolved=stage==='UNKNOWN'?unknown:(current||crumbs[crumbs.length-1]||unknown);
 return Object.freeze({schema:'ofu-v2x14-product-snapshot-8',version:VERSION,authority:AUTHORITY,stage,currentLocation:resolved.label,selection:selectedLabel(s),selectionId:s.selectedObjectId||null,locationIdentity:s.point?.locationIdentity||s.world?.planetIdentity||s.body?.canonicalId||s.system?.canonicalId||s.region?.canonicalId||s.region?.entityId||s.galaxy?.canonicalId||null,breadcrumbs:Object.freeze(crumbs.map(x=>Object.freeze({...x,current:x===resolved}))),routesNativeInput:false,mutatesCanonicalState:false,canonicalSelectionAuthority:false,scaleAuthority:false,cameraAuthority:false,preservesCanonicalAriaPressed:true,createsDuplicateProductChrome:false,unknownStageStaysUnknown:stage==='UNKNOWN'});
}
function safeSnapshot(api){try{return api?.snapshot?.()||null}catch{return null}}
function boundedPointerCount(value){const n=Number(value);return Number.isFinite(n)?Math.max(0,Math.min(MAX_OBSERVED_POINTERS,Math.trunc(n))):0;}
function directManipulation(product=O.v1LivingProduct){
 const productState=safeSnapshot(product)||{},input=productState.input&&typeof productState.input==='object'?productState.input:{},rawGesture=typeof input.lastGesture==='string'?input.lastGesture:null,lastGesture=KNOWN_GESTURES.has(rawGesture)?rawGesture:null,activePointers=boundedPointerCount(input.activePointers);
 return Object.freeze({
  schema:'ofu-v2x14-direct-manipulation-observer-1',authority:AUTHORITY,inputRouterOwner:'CONVERGENCE_OWNER',centralLivingOwner:'v1LivingProduct',centralInputStateObserved:productState.input!=null,centralCameraBindingObserved:!!O.v2x02LivingCameraComposition,
  activePointers,pinchActive:input.pinchActive===true,lastGesture,cancellations:Math.max(0,Math.trunc(Number(input.cancellations)||0)),
  pointerEventsAvailable:typeof root.PointerEvent==='function',touchPoints:Math.max(0,Math.min(32,Math.trunc(Number(root.navigator?.maxTouchPoints)||0))),
  touchViaCentralPointerEvents:true,wheelDelegated:true,dragDelegated:true,pinchDelegated:true,keyboardDelegated:true,clickSelectionDelegated:true,
  observesOnly:true,routesNativeInput:false,callsTravelApi:false,callsRendererInput:false,preventsDefault:false,stopsPropagation:false,
  resourceBounds:Object.freeze({maxObservedPointers:MAX_OBSERVED_POINTERS,eventObserverCount:INPUT_EVENTS.length,continuousPolling:false})
 });
}
function centralIntegration(){const skip=safeSnapshot(O.v11LivingSkipRouting),focus=safeSnapshot(O.v11LivingFocusContinuity),feedback=safeSnapshot(O.v11LivingTransitionFeedback),survey=safeSnapshot(O.v11LivingSurveyUX),dock=safeSnapshot(O.v11LivingContextDock),input=directManipulation();return Object.freeze({schema:'ofu-v2x14-central-integration-2',skipRouting:skip?.ready===true&&skip?.href==='#living-view',focusContinuity:focus?.ready===true,transitionFeedback:feedback?.ready===true,boundedSurveyUx:survey?.ready===true,contextDock:dock?.ready===true,directManipulationObserved:input.centralInputStateObserved,directManipulationOwner:input.inputRouterOwner,delegatesSkipRouting:true,delegatesFocusContinuity:true,delegatesAnnouncements:true,delegatesSurveyUi:true,delegatesContextDock:true,delegatesPointer:true,delegatesWheel:true,delegatesKeyboard:true,delegatesPinch:true});}
function mergeTokens(value,tokens){const out=new Set(String(value||'').split(/\s+/).filter(Boolean));for(const token of tokens)out.add(token);return [...out].join(' ');}
function mount(options={}){
 const doc=options.document||root.document,product=options.product||O.v1LivingProduct;if(!doc||!product||typeof product.snapshot!=='function'||!product.runtime?.snapshot)return null;
 const viewport=doc.getElementById('living-view'),rail=doc.getElementById('living-rail'),breadcrumbs=doc.getElementById('living-breadcrumbs');if(!viewport||!rail||!breadcrumbs)return null;
 const discovery=O.v2x14Discovery?.create?O.v2x14Discovery.create({product}):null,managedAttrs=new Map(),managedCurrent=new Map();let disposed=false,scheduled=false,instance=null;
 function attrRecord(node,name){let attrs=managedAttrs.get(node);if(!attrs){attrs=new Map();managedAttrs.set(node,attrs);}let record=attrs.get(name);if(!record){record={baseline:node.getAttribute(name),applied:null};attrs.set(name,record);}return record;}
 function setAttr(node,name,value){const record=attrRecord(node,name),applied=value==null?null:String(value);if(applied==null)node.removeAttribute(name);else node.setAttribute(name,applied);record.applied=applied;}
 function restoreAttr(node,name){const attrs=managedAttrs.get(node),record=attrs?.get(name);if(!record)return;const current=node.getAttribute(name);if(current===record.applied){if(record.baseline==null)node.removeAttribute(name);else node.setAttribute(name,record.baseline);}attrs.delete(name);if(attrs.size===0)managedAttrs.delete(node);}
 function applyCurrent(node,value){
  let record=managedCurrent.get(node);if(!record){const baseline=node.getAttribute('aria-current');record={baseline,applied:null,externalOwner:baseline!=null};managedCurrent.set(node,record);}
  if(record.externalOwner)return;
  const live=node.getAttribute('aria-current');if(record.applied===null&&live!==record.baseline){record.externalOwner=true;return;}if(record.applied!==null&&live!==record.applied){record.applied=null;record.externalOwner=true;return;}
  if(value){node.setAttribute('aria-current',value);record.applied=value;return;}
  if(record.applied!==null&&live===record.applied){if(record.baseline==null)node.removeAttribute('aria-current');else node.setAttribute('aria-current',record.baseline);}record.applied=null;
 }
 function pruneManaged(){for(const [node] of managedCurrent)if(!node.isConnected)managedCurrent.delete(node);for(const [node] of managedAttrs)if(!node.isConnected)managedAttrs.delete(node);}
 function syncRail(p){const active=MICRO.has(p.stage)?'MICRO':p.stage;for(const button of rail.querySelectorAll('[data-living-scale]'))applyCurrent(button,button.dataset.livingScale===active?'step':null);pruneManaged();}
 function breadcrumbMatch(button,stage){const text=String(button.textContent||'').trim();if(stage==='UNIVERSE')return text==='Universe';if(stage==='GALAXY')return text.startsWith('Galaxy ');if(stage==='REGION')return text==='Region'||text.startsWith('Region ');if(stage==='SYSTEM')return text.startsWith('System ');if(stage==='ORBIT')return text.startsWith('World ');return false;}
 function syncBreadcrumbs(p){for(const button of breadcrumbs.querySelectorAll('button'))applyCurrent(button,breadcrumbMatch(button,p.stage)?'location':null);pruneManaged();}
 function syncInput(){const input=directManipulation(product);setAttr(viewport,'data-v2x14-input-owner','convergence');setAttr(viewport,'data-v2x14-gesture',input.lastGesture||'idle');setAttr(viewport,'data-v2x14-active-pointers',input.activePointers);setAttr(viewport,'data-v2x14-pinch',input.pinchActive?'true':'false');return input;}
 if(!viewport.hasAttribute('role'))setAttr(viewport,'role','region');setAttr(viewport,'aria-keyshortcuts',mergeTokens(viewport.getAttribute('aria-keyshortcuts'),SHORTCUTS));attrRecord(viewport,'data-v2x14-stage');attrRecord(viewport,'data-v2x14-authority');attrRecord(viewport,'data-v2x14-input-owner');attrRecord(viewport,'data-v2x14-gesture');attrRecord(viewport,'data-v2x14-active-pointers');attrRecord(viewport,'data-v2x14-pinch');
 function sync(){if(disposed)return null;let p;try{p=derive(product.runtime.snapshot());}catch{return null;}setAttr(viewport,'data-v2x14-stage',p.stage);setAttr(viewport,'data-v2x14-authority',AUTHORITY);syncRail(p);syncBreadcrumbs(p);syncInput();return p;}
 function changed(){if(disposed||scheduled)return;scheduled=true;(root.requestAnimationFrame||root.setTimeout||((fn)=>fn()))(()=>{scheduled=false;sync();},0);}
 const observers=[];if(typeof root.MutationObserver==='function')for(const node of [rail,breadcrumbs]){const observer=new root.MutationObserver(changed);observer.observe(node,{childList:true,subtree:true});observers.push(observer);}
 const inputListener=()=>changed();for(const eventName of INPUT_EVENTS)viewport.addEventListener?.(eventName,inputListener,{capture:true,passive:true});sync();
 instance=Object.freeze({sync,snapshot:()=>Object.freeze({...derive(product.runtime.snapshot()),discovery:discovery?.snapshot()||null,directManipulation:directManipulation(product),centralIntegration:centralIntegration()}),dispose(){if(disposed)return;disposed=true;for(const observer of observers)observer.disconnect();for(const eventName of INPUT_EVENTS)viewport.removeEventListener?.(eventName,inputListener,{capture:true});for(const [node,record] of managedCurrent){if(!record.externalOwner&&record.applied!==null&&node.isConnected&&node.getAttribute('aria-current')===record.applied){if(record.baseline==null)node.removeAttribute('aria-current');else node.setAttribute('aria-current',record.baseline);}}managedCurrent.clear();for(const [node,attrs] of [...managedAttrs])for(const name of [...attrs.keys()])restoreAttr(node,name);if(autoInstance===instance)autoInstance=null;if(root.__OFU_V2X14_PRODUCT_EXPERIENCE__===instance)delete root.__OFU_V2X14_PRODUCT_EXPERIENCE__;}});return instance;
}
let autoInstance=null,attempts=0;function autoMount(){if(autoInstance||typeof root.document==='undefined')return autoInstance;autoInstance=mount();if(autoInstance){root.__OFU_V2X14_PRODUCT_EXPERIENCE__=autoInstance;return autoInstance;}if(++attempts<120&&root.setTimeout)root.setTimeout(autoMount,50);return null;}
O.v2x14ProductExperience=Object.freeze({VERSION,AUTHORITY,derive,directManipulation,centralIntegration,mount,autoMount,instance:()=>autoInstance});if(typeof root.document!=='undefined'){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',autoMount,{once:true});else if(root.setTimeout)root.setTimeout(autoMount,0);}
})(globalThis);
