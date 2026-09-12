(function(root){
'use strict';
const O=root.OFU=root.OFU||{};if(typeof document==='undefined')return;
const VERSION='ofu-v2x11-living-governed-actions-1',AUTHORITY='PRESENTATION_ONLY';
let runtime=null,lastError=null,lastReceipt=null,attempts=0;
const text=value=>String(value??''),short=value=>text(value).slice(0,10),human=value=>text(value).toLowerCase().replaceAll('_',' ');
function el(tag,content=null,attrs={}){const node=document.createElement(tag);if(content!==null)node.textContent=text(content);for(const [key,value] of Object.entries(attrs))node.setAttribute(key,text(value));return node}
function targetFrom(snapshot){const id=snapshot?.world?.planetIdentity||snapshot?.body?.canonicalId||null;return typeof id==='string'&&/^[0-9a-f]{64}$/.test(id)?id:null}
function model(snapshot){
 const Session=O.v1Session,targetId=targetFrom(snapshot);if(!targetId||typeof Session?.performV2X11Action!=='function'||typeof Session?.v2x11Revisit!=='function')return Object.freeze({supported:false,targetId,reason:targetId?'CENTRAL_GAMEPLAY_SESSION_UNAVAILABLE':'NO_CANONICAL_WORLD_TARGET'});
 let revisit=null;try{revisit=Session.v2x11Revisit(targetId)}catch(error){lastError=String(error?.message||error)}
 const consequences=(revisit?.consequences||[]).slice(-8).map(row=>Object.freeze({domain:text(row.domain),kind:text(row.kind),authority:text(row.authority)}));
 return Object.freeze({supported:true,targetId,actions:Number(revisit?.actions||0),consequenceCount:revisit?.consequences?.length||0,consequences:Object.freeze(consequences),lastStatus:text(lastReceipt?.status||revisit?.lastReceiptCore?.status||'NONE'),lastEventId:lastReceipt?.eventId||null,authority:'MODEL_DERIVED_SIMULATION',canonicalMutation:false});
}
function performSurvey(){
 const Session=O.v1Session;if(typeof Session?.performV2X11Action!=='function')throw new Error('central governed gameplay session unavailable');
 const result=Session.performV2X11Action('SURVEY',{mode:'living-visible-context'},'living-user');lastReceipt=result.receipt;lastError=null;O.productUI?.announce?.(result.receipt.status==='ADMITTED'?'Governed survey recorded':'Governed survey was not admitted');render(runtime?.snapshot?.());return result;
}
function render(snapshot){
 const panel=document.getElementById('living-panel');if(!panel||!snapshot)return;document.getElementById('living-v2x11-actions')?.remove();const data=model(snapshot),section=el('section',null,{id:'living-v2x11-actions','aria-label':'Governed causal actions','data-ofu-authority':AUTHORITY});
 section.append(el('div','GOVERNED CAUSAL ACTIONS · MODEL-DERIVED OVERLAY',{class:'living-eyebrow'}));
 if(!data.supported){section.append(el('p','Governed actions become available after entering a canonical modeled world.',{class:'living-note'}));panel.append(section);return}
 section.append(el('p','Actions use the current central selection, traverse the V2X-11 causal engine and P4 overlay, and never mutate canonical scientific truth.',{class:'living-note'}));
 const button=el('button','Record governed survey',{type:'button',class:'living-button','data-living-action':'v2x11-survey','aria-label':'Record a governed survey of the current modeled world'});button.addEventListener('click',()=>{try{performSurvey()}catch(error){lastError=String(error?.message||error);render(runtime?.snapshot?.())}});section.append(button);
 const details=el('details',null,{class:'living-details'});details.open=true;details.append(el('summary','Causal history / '+data.actions+' actions'));
 const dl=el('dl'),fields={'Target':short(data.targetId),'Last receipt':human(data.lastStatus),'Persistent consequences':data.consequenceCount,'Recent consequence domains':data.consequences.map(x=>x.domain+':'+x.kind).join(', ')||'none','Authority':data.authority,'Canonical mutation':'NO'};for(const [key,value] of Object.entries(fields))dl.append(el('dt',key),el('dd',value));details.append(dl);section.append(details);if(lastError)section.append(el('p',lastError,{class:'living-error',role:'alert'}));panel.append(section);
}
function snapshot(){const data=model(runtime?.snapshot?.());return Object.freeze({version:VERSION,authority:AUTHORITY,ready:!!runtime,lastError,lastReceipt:lastReceipt?{status:lastReceipt.status,eventId:lastReceipt.eventId}:null,...data})}
function attach(){attempts++;runtime=O.v1LivingProduct?.runtime;if(!runtime||typeof O.v1Session?.performV2X11Action!=='function'){if(attempts<160)root.setTimeout(attach,50);return}runtime.onChange?.(render);render(runtime.snapshot());root.__OFU_V2X11_LIVING_ACTIONS__=api}
const api=Object.freeze({VERSION,AUTHORITY,model,performSurvey,render,snapshot});O.v2x11LivingGovernedActions=api;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>root.setTimeout(attach,0),{once:true});else root.setTimeout(attach,0);
})(typeof globalThis!=='undefined'?globalThis:this);
