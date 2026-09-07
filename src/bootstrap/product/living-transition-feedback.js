(function(root){
'use strict';
const O=root.OFU=root.OFU||{};if(typeof document==='undefined')return;
const VERSION='ofu-v11-living-transition-feedback-2',MAX_ATTACH_ATTEMPTS=120;
const state={version:VERSION,ready:false,attachStatus:'waiting',attachAttempts:0,updates:0,stageAnnouncements:0,contextAnnouncements:0,selectionAnnouncements:0,selectionClearAnnouncements:0,suppressed:0,lastSignature:null,lastMessage:''};
let runtime=null,stage=null,status=null,scheduled=false,pendingSnapshot=null,baseline=null;
const clean=value=>String(value||'').replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim();
const short=value=>String(value||'').slice(0,8);
function identity(s){return s?.body?.canonicalId||s?.world?.planetIdentity||s?.system?.canonicalId||s?.region?.entityId||s?.galaxy?.canonicalId||null}
function signature(s){return [String(s?.stage||''),String(identity(s)||''),String(s?.point?.locationIdentity||''),String(s?.selectedObjectId||'')].join('|')}
function selectedLabel(s){if(!s?.selectedObjectId)return null;const row=(s.rows||[]).find(x=>x.entityId===s.selectedObjectId),local=(s.local?.objects||[]).find(x=>x.entityId===s.selectedObjectId),item=row||local;if(!item)return 'Selected object';return clean(item.label||item.kind||item.population?.role||'Selected object')}
function contextName(s){
 if(s?.world)return (s.world.bodyContext?.kind==='MOON'?'Moon ':'World ')+short(s.world.planetIdentity);
 if(s?.body?.kind==='star')return 'Star '+short(s.body.canonicalId);
 if(s?.system)return 'System '+short(s.system.canonicalId);
 if(s?.region)return 'Region '+short(s.region.entityId);
 if(s?.galaxy)return 'Galaxy '+short(s.galaxy.canonicalId);
 return 'Universe';
}
function messageFor(previous,next){
 if(!previous||!next)return null;
 const stageChanged=previous.stage!==next.stage,identityChanged=identity(previous)!==identity(next),pointChanged=String(previous.point?.locationIdentity||'')!==String(next.point?.locationIdentity||''),selectionChanged=String(previous.selectedObjectId||'')!==String(next.selectedObjectId||'');
 if(stageChanged){state.stageAnnouncements++;return 'Now exploring '+contextName(next)+' at '+clean(next.stage).toLowerCase()+' scale.'}
 if(identityChanged){state.contextAnnouncements++;return 'Exploration context changed to '+contextName(next)+'.'}
 if(pointChanged&&next.point){state.contextAnnouncements++;return 'Exploration location updated on '+contextName(next)+' at '+clean(next.stage).toLowerCase()+' scale.'}
 if(selectionChanged&&next.selectedObjectId){state.selectionAnnouncements++;return selectedLabel(next)+' selected.'}
 if(selectionChanged&&previous.selectedObjectId&&!next.selectedObjectId){state.selectionClearAnnouncements++;return 'Selection cleared.'}
 state.suppressed++;return null;
}
function ensureStatus(){if(status?.isConnected)return status;stage=document.getElementById('living-stage');if(!stage)return null;status=document.getElementById('living-transition-status');if(!status){status=document.createElement('p');status.id='living-transition-status';status.className='visually-hidden';status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');status.dataset.livingProductState='PRESENTATION_ONLY';stage.append(status)}return status}
function flush(){scheduled=false;const next=pendingSnapshot;pendingSnapshot=null;if(!next||!ensureStatus())return;const previous=baseline;baseline=next;state.lastSignature=signature(next);if(!previous)return;const message=messageFor(previous,next);if(!message||message===state.lastMessage)return;state.lastMessage=message;state.updates++;status.textContent=message}
function onChange(snapshot){pendingSnapshot=snapshot||runtime?.snapshot?.();if(!pendingSnapshot)return;if(scheduled)return;scheduled=true;(root.requestAnimationFrame||((fn)=>root.setTimeout(fn,0)))(flush)}
function attach(){state.attachAttempts++;const product=O.v1LivingProduct,nextStage=document.getElementById('living-stage');if(!product?.runtime||!nextStage){if(state.attachAttempts>=MAX_ATTACH_ATTEMPTS){state.attachStatus='timeout';return}root.setTimeout(attach,50);return}runtime=product.runtime;stage=nextStage;ensureStatus();baseline=runtime.snapshot();state.lastSignature=signature(baseline);runtime.onChange?.(onChange);state.attachStatus='attached';state.ready=true}
const api=Object.freeze({VERSION,MAX_ATTACH_ATTEMPTS,state,identity,signature,messageFor,onChange,snapshot:()=>Object.freeze({...state,statusText:status?.textContent||'',statusConnected:!!status?.isConnected})});O.v11LivingTransitionFeedback=api;root.__OFU_LIVING_TRANSITION_FEEDBACK__=api;attach();
})(typeof globalThis!=='undefined'?globalThis:this);
