(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const VERSION='ofu-v2x14-product-experience-1',AUTHORITY='PRESENTATION_ONLY';
const LABEL={UNIVERSE:'Universe',GALAXY:'Galaxy',REGION:'Region',NEIGHBORHOOD:'Stellar neighborhood',SYSTEM:'System',ORBIT:'Orbit',APPROACH:'Approach',GLOBAL_SURFACE:'Global surface',REGIONAL_SURFACE:'Regional surface',LOCAL_SURFACE:'Local surface',HUMAN:'Human scale',TISSUE:'Tissue',CELL:'Cell',MOLECULAR:'Molecular',ATOMIC:'Atomic'};
const short=v=>String(v||'').slice(0,10);
function derive(s={}){
 const stage=String(s.stage||'UNKNOWN'),crumbs=[];
 crumbs.push({stage:'UNIVERSE',label:'Universe',current:stage==='UNIVERSE'});
 if(s.galaxy)crumbs.push({stage:'GALAXY',label:'Galaxy '+short(s.galaxy.canonicalId||s.galaxy.entityId),current:stage==='GALAXY'});
 if(s.region)crumbs.push({stage:'REGION',label:'Region '+short(s.region.canonicalId||s.region.entityId),current:stage==='REGION'});
 if(s.system)crumbs.push({stage:'SYSTEM',label:'System '+short(s.system.canonicalId||s.system.entityId),current:['NEIGHBORHOOD','SYSTEM'].includes(stage)});
 if(s.world||s.body)crumbs.push({stage:'ORBIT',label:'World '+short(s.world?.planetIdentity||s.body?.canonicalId||s.body?.entityId),current:['ORBIT','APPROACH'].includes(stage)});
 if(s.point)crumbs.push({stage,label:(LABEL[stage]||stage)+' '+short(s.point.locationIdentity),current:true});
 else if(!crumbs.some(x=>x.current)&&crumbs.length)crumbs[crumbs.length-1].current=true;
 const selected=s.selectedObjectId?('Selected '+short(s.selectedObjectId)):'No local object selected';
 return Object.freeze({schema:'ofu-v2x14-product-snapshot-1',version:VERSION,authority:AUTHORITY,stage,currentLocation:crumbs.findLast?.(x=>x.current)?.label||crumbs[crumbs.length-1]?.label||'Unknown location',selection:selected,breadcrumbs:Object.freeze(crumbs.map(Object.freeze)),routesNativeInput:false,mutatesCanonicalState:false});
}
function mount(options={}){
 const doc=options.document||root.document,product=options.product||O.v1LivingProduct;
 if(!doc||!product||typeof product.snapshot!=='function')return null;
 const viewport=doc.getElementById('living-view');if(!viewport)return null;
 viewport.tabIndex=viewport.tabIndex<0?0:viewport.tabIndex;viewport.setAttribute('role','region');viewport.setAttribute('aria-label','Living universe viewport');
 let status=doc.getElementById('v2x14-live-location');
 if(!status){status=doc.createElement('p');status.id='v2x14-live-location';status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');status.style.position='absolute';status.style.width='1px';status.style.height='1px';status.style.overflow='hidden';status.style.clip='rect(0 0 0 0)';doc.body.appendChild(status);}
 viewport.setAttribute('aria-describedby',status.id);
 let last='',disposed=false,timer=null;
 const sync=()=>{if(disposed)return;try{const p=derive(product.runtime?.snapshot?.()||product.snapshot?.()||{}),text=p.currentLocation+'; '+p.selection;if(text!==last){status.textContent=text;viewport.dataset.v2x14Stage=p.stage;viewport.dataset.v2x14Authority=AUTHORITY;last=text;}}catch{}};
 sync();timer=root.setInterval?root.setInterval(sync,250):null;
 return Object.freeze({sync,snapshot:()=>derive(product.runtime?.snapshot?.()||product.snapshot?.()||{}),dispose(){disposed=true;if(timer!==null&&root.clearInterval)root.clearInterval(timer);}});
}
O.v2x14ProductExperience=Object.freeze({VERSION,AUTHORITY,derive,mount});
})(globalThis);
