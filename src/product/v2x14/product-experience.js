(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const VERSION='ofu-v2x14-product-experience-2',AUTHORITY='PRESENTATION_ONLY';
const LABEL={UNIVERSE:'Universe',GALAXY:'Galaxy',REGION:'Region',NEIGHBORHOOD:'Stellar neighborhood',SYSTEM:'System',ORBIT:'Orbit',APPROACH:'Approach',GLOBAL_SURFACE:'Global surface',REGIONAL_SURFACE:'Regional surface',LOCAL_SURFACE:'Local surface',HUMAN:'Human scale',MATERIAL:'Material',MICROSTRUCTURE:'Microstructure',TISSUE:'Tissue',CELL:'Cell',MOLECULAR:'Molecular',ATOMIC:'Atomic'};
const MICRO=new Set(['MATERIAL','MICROSTRUCTURE','TISSUE','CELL','MOLECULAR','ATOMIC']);
const short=v=>String(v||'').slice(0,10);
const title=s=>LABEL[String(s||'')]||String(s||'Unknown').toLowerCase().replaceAll('_',' ');
function selectedLabel(s){
 if(!s.selectedObjectId)return 'No local object selected';
 const row=Array.isArray(s.local?.objects)?s.local.objects.find(x=>x?.entityId===s.selectedObjectId):null;
 const kind=row?.kind?title(row.kind):'Object';
 return kind+' '+short(row?.label||s.selectedObjectId);
}
function pointLabel(s){
 if(!s.point)return null;
 const lat=Number(s.point.latMicroDeg),lon=Number(s.point.lonMicroDeg);
 if(Number.isFinite(lat)&&Number.isFinite(lon))return title(s.stage)+' '+(lat/1e6).toFixed(4)+' deg, '+(lon/1e6).toFixed(4)+' deg';
 return title(s.stage)+' '+short(s.point.locationIdentity);
}
function derive(s={}){
 const stage=String(s.stage||'UNKNOWN'),crumbs=[{stage:'UNIVERSE',label:'Universe'}];
 if(s.galaxy)crumbs.push({stage:'GALAXY',label:'Galaxy '+short(s.galaxy.canonicalId||s.galaxy.entityId)});
 if(s.region)crumbs.push({stage:'REGION',label:'Region '+short(s.region.canonicalId||s.region.entityId)});
 if(stage==='NEIGHBORHOOD')crumbs.push({stage:'NEIGHBORHOOD',label:'Stellar neighborhood '+short(s.node?.canonicalId||s.node?.entityId)});
 if(s.system)crumbs.push({stage:'SYSTEM',label:'System '+short(s.system.canonicalId||s.system.entityId)});
 if(s.world||s.body)crumbs.push({stage:'ORBIT',label:'World '+short(s.world?.planetIdentity||s.body?.canonicalId||s.body?.entityId)});
 const point=pointLabel(s);if(point)crumbs.push({stage,label:point});
 let exact=-1;for(let i=0;i<crumbs.length;i++)if(crumbs[i].stage===stage)exact=i;
 if(exact<0&&stage==='APPROACH')crumbs.push({stage,label:'Approach '+short(s.world?.planetIdentity||s.body?.canonicalId||s.body?.entityId)});
 if(exact<0&&MICRO.has(stage)&&!point)crumbs.push({stage,label:title(stage)});
 for(let i=0;i<crumbs.length;i++)crumbs[i].current=i===crumbs.length-1||crumbs[i].stage===stage;
 const current=crumbs.find(x=>x.stage===stage&&x.current)||crumbs[crumbs.length-1];
 return Object.freeze({schema:'ofu-v2x14-product-snapshot-2',version:VERSION,authority:AUTHORITY,stage,currentLocation:current?.label||title(stage),selection:selectedLabel(s),selectionId:s.selectedObjectId||null,breadcrumbs:Object.freeze(crumbs.map(x=>Object.freeze({...x,current:x===current}))),routesNativeInput:false,mutatesCanonicalState:false,canonicalSelectionAuthority:false,scaleAuthority:false,cameraAuthority:false});
}
function addToken(node,name,value){const tokens=new Set(String(node.getAttribute(name)||'').split(/\s+/).filter(Boolean));tokens.add(value);node.setAttribute(name,[...tokens].join(' '));}
function focusKey(node){
 if(!node||node.nodeType!==1)return null;
 if(node.dataset?.livingAction)return ['action',node.dataset.livingAction];
 if(node.dataset?.livingEntity)return ['entity',node.dataset.livingEntity];
 if(node.dataset?.livingScale)return ['scale',node.dataset.livingScale];
 if(node.id)return ['id',node.id];return null;
}
function findFocus(doc,key){if(!key)return null;const [kind,value]=key;if(kind==='id')return doc.getElementById(value);const attr=kind==='action'?'data-living-action':kind==='entity'?'data-living-entity':'data-living-scale';return [...doc.querySelectorAll('['+attr+']')].find(x=>x.getAttribute(attr)===value&&!x.disabled)||null;}
function mount(options={}){
 const doc=options.document||root.document,product=options.product||O.v1LivingProduct;
 if(!doc||!product||typeof product.snapshot!=='function'||!product.runtime?.snapshot)return null;
 const viewport=doc.getElementById('living-view'),stageNode=doc.getElementById('living-stage');if(!viewport||!stageNode)return null;
 viewport.tabIndex=viewport.tabIndex<0?0:viewport.tabIndex;viewport.setAttribute('role','region');viewport.setAttribute('aria-label','Living universe viewport');
 let skip=doc.getElementById('v2x14-skip-link');if(!skip){skip=doc.createElement('a');skip.id='v2x14-skip-link';skip.className='v2x14-skip';skip.href='#living-view';skip.textContent='Skip to living universe viewport';doc.body.insertBefore(skip,doc.body.firstChild);}
 let status=doc.getElementById('v2x14-live-location');if(!status){status=doc.createElement('p');status.id='v2x14-live-location';status.className='v2x14-visually-hidden';status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');doc.body.appendChild(status);}addToken(viewport,'aria-describedby',status.id);
 let context=doc.getElementById('v2x14-context');if(!context){context=doc.createElement('details');context.id='v2x14-context';context.className='v2x14-secondary';const summary=doc.createElement('summary');summary.textContent='Current context';const dl=doc.createElement('dl');for(const [key,label] of [['location','Current location'],['selection','Selection'],['authority','Authority']]){const dt=doc.createElement('dt'),dd=doc.createElement('dd');dt.textContent=label;dd.dataset.v2x14Field=key;dl.append(dt,dd);}context.append(summary,dl);stageNode.appendChild(context);}
 const rail=doc.getElementById('living-rail'),breadcrumbs=doc.getElementById('living-breadcrumbs'),panel=doc.getElementById('living-panel');
 let last='',disposed=false,focusMemory=null,scheduled=false;
 const syncRail=p=>{if(!rail)return;const active=MICRO.has(p.stage)?'MICRO':p.stage;for(const b of rail.querySelectorAll('[data-living-scale]')){b.removeAttribute('aria-pressed');if(b.dataset.livingScale===active)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');}};
 const syncBreadcrumbs=p=>{if(!breadcrumbs)return;for(const n of breadcrumbs.querySelectorAll('[aria-current]'))n.removeAttribute('aria-current');const prefix={UNIVERSE:'Universe',GALAXY:'Galaxy',REGION:'Region',SYSTEM:'System',ORBIT:'World'}[p.stage];let current=null;if(prefix)current=[...breadcrumbs.querySelectorAll('button')].find(b=>b.textContent.trim().startsWith(prefix))||null;let synthetic=doc.getElementById('v2x14-breadcrumb-current');if(current){current.setAttribute('aria-current','location');if(synthetic)synthetic.remove();return;}if(!synthetic){synthetic=doc.createElement('span');synthetic.id='v2x14-breadcrumb-current';breadcrumbs.append(doc.createTextNode(breadcrumbs.childNodes.length?' / ':''),synthetic);}if(synthetic.textContent!==p.currentLocation)synthetic.textContent=p.currentLocation;synthetic.setAttribute('aria-current','location');};
 const sync=()=>{if(disposed)return null;let p;try{p=derive(product.runtime.snapshot());}catch{return null;}const text=p.currentLocation+'; '+p.selection;if(text!==last){status.textContent=text;last=text;}viewport.dataset.v2x14Stage=p.stage;viewport.dataset.v2x14Authority=AUTHORITY;syncRail(p);syncBreadcrumbs(p);for(const dd of context.querySelectorAll('[data-v2x14-field]')){const key=dd.dataset.v2x14Field;const value=key==='location'?p.currentLocation:key==='selection'?p.selection:'PRESENTATION_ONLY projection; canonical navigation and science remain external.';if(dd.textContent!==value)dd.textContent=value;}return p;};
 const restore=()=>{scheduled=false;if(disposed||!focusMemory)return;const active=doc.activeElement;if(active&&active!==doc.body&&active.isConnected)return;const target=findFocus(doc,focusMemory)||viewport;try{target.focus({preventScroll:true});}catch{try{target.focus();}catch{}}};
 const changed=()=>{sync();if(!scheduled){scheduled=true;(root.requestAnimationFrame||root.setTimeout||((fn)=>fn()))(restore,0);}};
 const remember=e=>{const target=e.target;if(!target||!(stageNode.contains(target)||panel?.contains(target)))return;const key=focusKey(target);if(key)focusMemory=key;};doc.addEventListener('focusin',remember,true);
 const observers=[];if(typeof root.MutationObserver==='function')for(const node of [rail,breadcrumbs,panel].filter(Boolean)){const observer=new root.MutationObserver(changed);observer.observe(node,{childList:true,subtree:true});observers.push(observer);}
 sync();
 return Object.freeze({sync,snapshot:()=>derive(product.runtime.snapshot()),dispose(){disposed=true;doc.removeEventListener('focusin',remember,true);for(const o of observers)o.disconnect();if(skip?.parentNode)skip.parentNode.removeChild(skip);if(context?.parentNode)context.parentNode.removeChild(context);}});
}
let autoInstance=null,attempts=0;
function autoMount(){if(autoInstance||typeof root.document==='undefined')return autoInstance;autoInstance=mount();if(autoInstance){root.__OFU_V2X14_PRODUCT_EXPERIENCE__=autoInstance;return autoInstance;}if(++attempts<120&&root.setTimeout)root.setTimeout(autoMount,50);return null;}
O.v2x14ProductExperience=Object.freeze({VERSION,AUTHORITY,derive,mount,autoMount,instance:()=>autoInstance});
if(typeof root.document!=='undefined'){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',autoMount,{once:true});else if(root.setTimeout)root.setTimeout(autoMount,0);}
})(globalThis);
