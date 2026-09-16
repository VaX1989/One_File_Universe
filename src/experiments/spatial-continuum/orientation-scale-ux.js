import { AUTHORITY, CONTINUUM_STOPS, MAX_SCALE_COORDINATE, stageForCoordinate } from './constants.js';

const REGIMES=Object.freeze([
  Object.freeze({id:'COSMIC',label:'Cosmic',min:0,max:4}),
  Object.freeze({id:'PLANETARY',label:'Planetary',min:5,max:9}),
  Object.freeze({id:'HUMAN',label:'Human',min:10,max:10}),
  Object.freeze({id:'MICRO',label:'Micro',min:11,max:MAX_SCALE_COORDINATE})
]);

const REFERENCES=Object.freeze({
  UNIVERSE:Object.freeze({label:'Cosmic neighborhood',cue:'Intergalactic context; identity hierarchy matters more than apparent size.'}),
  GALAXY:Object.freeze({label:'Galactic scale',cue:'A galaxy becomes the retained parent context rather than merely a larger image.'}),
  REGION:Object.freeze({label:'Galactic region',cue:'Regional structure is resolved inside the selected galaxy.'}),
  NEIGHBORHOOD:Object.freeze({label:'Stellar neighborhood',cue:'Nearby systems become individually meaningful destinations.'}),
  SYSTEM:Object.freeze({label:'Astronomical-system scale',cue:'Bodies and orbital relationships become the useful frame of reference.'}),
  ORBIT:Object.freeze({label:'Planetary / orbital scale',cue:'The selected body becomes the camera anchor while system context remains retained.'}),
  APPROACH:Object.freeze({label:'Whole-body approach',cue:'Curvature and body-scale features replace orbital separation as the dominant context.'}),
  GLOBAL_SURFACE:Object.freeze({label:'Planet-wide surface',cue:'One retained surface target is read in whole-planet context.'}),
  REGIONAL_SURFACE:Object.freeze({label:'Regional surface',cue:'Terrain representation refines while the same body-fixed location is retained.'}),
  LOCAL_SURFACE:Object.freeze({label:'Local surface',cue:'Meters-to-kilometres become useful references without changing the retained place.'}),
  HUMAN:Object.freeze({label:'Human scale · metres',cue:'Movement is embodied in a local frame; inspectable objects become meaningful targets.'}),
  MATERIAL:Object.freeze({label:'Material scale · millimetres to micrometres',cue:'The selected source sample is retained while presentation changes to material context.'}),
  MICROSTRUCTURE:Object.freeze({label:'Microstructure · micrometres',cue:'Representative microstructure is contextual, not a literal measured micrograph.'}),
  MOLECULAR:Object.freeze({label:'Molecular · nanometres',cue:'Molecular grammar communicates scale without asserting unsupported exact arrangements.'}),
  ATOMIC:Object.freeze({label:'Atomic · sub-nanometre',cue:'Atomic context is nonclassical presentation, not a literal orbit or exact-position claim.'})
});

const AUTHORITY_STATUS=Object.freeze({
  [AUTHORITY.CANONICAL]:Object.freeze({id:AUTHORITY.CANONICAL,glyph:'◆',label:'Canonical'}),
  [AUTHORITY.MODEL_DERIVED]:Object.freeze({id:AUTHORITY.MODEL_DERIVED,glyph:'◇',label:'Model-derived'}),
  [AUTHORITY.PRESENTATION_ONLY]:Object.freeze({id:AUTHORITY.PRESENTATION_ONLY,glyph:'△',label:'Presentation cue'}),
  [AUTHORITY.UNKNOWN]:Object.freeze({id:AUTHORITY.UNKNOWN,glyph:'?',label:'Authority unknown'})
});

const finite=value=>Number.isFinite(Number(value));
const clamp01=value=>Math.max(0,Math.min(1,Number(value)||0));
const titleCase=value=>String(value||'').toLowerCase().replace(/(^|[_\s-])([a-z])/g,(_,space,letter)=>(space?' ':'')+letter.toUpperCase());
const escapeHtml=value=>String(value??'').replace(/[&<>'"]/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character]));
const freeze=value=>Object.freeze(value);

function normalizeAuthority(value){
  const raw=String(value||'').toUpperCase();
  if(raw.includes('CANONICAL'))return AUTHORITY.CANONICAL;
  if(raw.includes('MODEL'))return AUTHORITY.MODEL_DERIVED;
  if(raw.includes('PRESENTATION'))return AUTHORITY.PRESENTATION_ONLY;
  return AUTHORITY.UNKNOWN;
}

function authorityStatus(value){return AUTHORITY_STATUS[normalizeAuthority(value)]}

function unwrapKernelSnapshot(snapshot){
  if(snapshot?.state?.scale)return snapshot.state;
  if(snapshot?.scale)return snapshot;
  throw new TypeError('R6-I orientation projection requires a continuum snapshot with scale state');
}

function normalizeCrumb(segment,index){
  const id=String(segment?.id||segment?.entityId||segment?.canonicalId||`level-${index}`);
  return freeze({
    id,
    label:String(segment?.label||segment?.name||segment?.kind||id),
    kind:String(segment?.kind||'CONTEXT'),
    authority:authorityStatus(segment?.authority||segment?.sourceAuthority)
  });
}

function stageLabel(stage){return CONTINUUM_STOPS.find(stop=>stop.stage===stage)?.label||titleCase(stage)}

export function scaleRegimeForCoordinate(coordinate){
  const semanticCoordinate=stageForCoordinate(Math.max(0,Math.min(MAX_SCALE_COORDINATE,Number(coordinate)||0))).coordinate;
  return REGIMES.find(regime=>semanticCoordinate>=regime.min&&semanticCoordinate<=regime.max)||REGIMES.at(-1);
}

export function scaleReferenceForStage(stage){
  const normalized=String(stage||'').toUpperCase();
  return REFERENCES[normalized]||freeze({label:titleCase(normalized||'Unknown scale'),cue:'Scale context is unavailable for this stage.'});
}

function number(value,digits=2){
  return new Intl.NumberFormat('en-US',{maximumFractionDigits:digits,minimumFractionDigits:0}).format(value);
}

export function formatDistance(distanceM){
  const meters=Number(distanceM);
  if(!Number.isFinite(meters)||meters<0)return null;
  const value=Math.abs(meters);
  if(value===0)return'0 m';
  if(value<1e-9)return`${number(value*1e12)} pm`;
  if(value<1e-6)return`${number(value*1e9)} nm`;
  if(value<1e-3)return`${number(value*1e6)} µm`;
  if(value<1)return`${number(value*1e3)} mm`;
  if(value<1e3)return`${number(value)} m`;
  if(value<1e9)return`${number(value/1e3)} km`;
  const AU=149597870700,LY=9460730472580800;
  if(value<LY*.1)return`${number(value/AU,3)} AU`;
  return`${number(value/LY,3)} ly`;
}

export function formatTravelTime(distanceM,speedMps){
  const distance=Number(distanceM),speed=Number(speedMps);
  if(!Number.isFinite(distance)||distance<0||!Number.isFinite(speed)||speed<=0)return null;
  const seconds=distance/speed;
  if(seconds<60)return`${number(seconds)} s`;
  if(seconds<3600)return`${number(seconds/60)} min`;
  if(seconds<86400)return`${number(seconds/3600)} h`;
  if(seconds<31557600)return`${number(seconds/86400)} d`;
  return`${number(seconds/31557600)} y`;
}

function semanticTransition(scale,reducedMotion){
  const coordinate=Number(scale.coordinate),handoff=scale.handoff||scale.representationHandoff;
  const fromStage=String(handoff?.from?.stage||stageForCoordinate(Math.floor(coordinate)).stage).toUpperCase();
  const toStage=String(handoff?.to?.stage||stageForCoordinate(Math.ceil(coordinate)).stage).toUpperCase();
  const moving=Boolean(scale.moving)||fromStage!==toStage;
  const progress=fromStage===toStage?1:clamp01(handoff?.progress??(coordinate-Math.floor(coordinate)));
  if(!moving)return freeze({mode:'STABLE',fromStage,toStage,progress:1,motion:reducedMotion?'REDUCED':'STANDARD',text:`${stageLabel(toStage)} representation is stable.`});
  return freeze({
    mode:'HANDOFF',fromStage,toStage,progress,motion:reducedMotion?'REDUCED':'STANDARD',
    text:`Semantic handoff: ${stageLabel(fromStage)} → ${stageLabel(toStage)}. Representation changes while retained identity stays authoritative.`
  });
}

function locationPathFrom(snapshot,explicitPath){
  const candidate=explicitPath??snapshot?.openUniverse?.currentAddress?.segments??snapshot?.currentAddress?.segments??[];
  return freeze(Array.from(candidate||[],normalizeCrumb));
}

function historyFrom(snapshot,explicitHistory){
  const candidate=explicitHistory??snapshot?.branchHistory??[];
  return Array.isArray(candidate)?candidate:[];
}

function historyCue(history,kernel,canGoBackOverride){
  const tail=history.at(-1)||null,currentStage=String(kernel.scale?.semanticStage||'').toUpperCase(),currentFocus=String(kernel.graph?.focusId||kernel.camera?.focusId||'');
  const tailStage=String(tail?.kernel?.stage||tail?.stage||'').toUpperCase(),tailFocus=String(tail?.kernel?.focusId||tail?.focusId||'');
  const tailIsCurrent=Boolean(tail)&&tailStage===currentStage&&(!tailFocus||!currentFocus||tailFocus===currentFocus);
  const prior=tailIsCurrent?(history.at(-2)||null):tail;
  const stackDepth=Math.max(0,history.length-(tailIsCurrent?1:0)),depth=Math.max(Number(kernel.historyDepth)||0,stackDepth);
  const priorStage=String(prior?.kernel?.stage||prior?.stage||'').toUpperCase()||null;
  const priorFocus=String(prior?.kernel?.focusId||prior?.focusId||'')||null;
  const canGoBack=typeof canGoBackOverride==='boolean'?canGoBackOverride:depth>0;
  return freeze({depth,canGoBack,priorStage,priorStageLabel:priorStage?stageLabel(priorStage):null,priorFocus});
}

function selectionProjection(kernel,selection){
  const focusId=String(selection?.id||selection?.entityId||kernel.graph?.focusId||kernel.camera?.focusId||'');
  const label=String(selection?.label||selection?.name||selection?.kind||focusId||'No selected object');
  return freeze({
    id:focusId||null,
    label,
    kind:String(selection?.kind||'FOCUS'),
    authority:authorityStatus(selection?.authority||selection?.sourceAuthority||selection?.presentationAuthority),
    explicitlySelected:Boolean(selection?.explicitlySelected)
  });
}

function targetProjection(target){
  const distanceM=finite(target?.distanceM)&&Number(target.distanceM)>=0?Number(target.distanceM):null;
  const speedMps=finite(target?.travelSpeedMps)&&Number(target.travelSpeedMps)>0?Number(target.travelSpeedMps):null;
  if(distanceM===null)return null;
  return freeze({
    label:String(target?.label||target?.name||'Target'),
    distanceM,
    distance:formatDistance(distanceM),
    travelTime:speedMps===null?null:formatTravelTime(distanceM,speedMps),
    travelSpeedMps:speedMps,
    authority:authorityStatus(target?.authority)
  });
}

function viewportProjection(width,explorationActive){
  const value=finite(width)?Math.max(0,Number(width)):Infinity;
  const density=value<560?'COMPACT':value<920?'CONDENSED':'FULL';
  return freeze({width:Number.isFinite(value)?value:null,density,presentationMode:explorationActive?'RECEDED':'CONTEXTUAL'});
}

function assistiveStatus({stage,regime,selection,history,target,semanticTransition}){
  const parts=[`${stage.label} stage`,`${regime.label} regime`,`Focus ${selection.label}`];
  if(semanticTransition.mode==='HANDOFF')parts.push(semanticTransition.text);
  if(target?.distance)parts.push(`${target.label} ${target.distance}${target.travelTime?`, travel context ${target.travelTime}`:''}`);
  parts.push(history.canGoBack?`Back available, ${history.depth} retained step${history.depth===1?'':'s'}`:'No retained back step');
  return parts.join('. ')+'.';
}

export function projectOrientationScaleContext({
  snapshot,path,history,selection,target,viewportWidth,explorationActive=false,reducedMotion=false,canGoBack
}={}){
  const kernel=unwrapKernelSnapshot(snapshot);
  const coordinate=Math.max(0,Math.min(MAX_SCALE_COORDINATE,Number(kernel.scale.coordinate)||0));
  const semanticStage=String(kernel.scale.semanticStage||stageForCoordinate(coordinate).stage).toUpperCase();
  const stageStop=CONTINUUM_STOPS.find(stop=>stop.stage===semanticStage)||stageForCoordinate(coordinate);
  const regime=scaleRegimeForCoordinate(coordinate),reference=scaleReferenceForStage(semanticStage),transition=semanticTransition(kernel.scale,reducedMotion);
  const projectedPath=locationPathFrom(snapshot,path),projectedHistory=historyCue(historyFrom(snapshot,history),kernel,canGoBack),projectedSelection=selectionProjection(kernel,selection),projectedTarget=targetProjection(target),viewport=viewportProjection(viewportWidth,explorationActive);
  const projection={
    contract:'ofu-r6-i-orientation-scale-ux-1',
    coordinate,
    coordinateNormalized:coordinate/MAX_SCALE_COORDINATE,
    stage:freeze({id:semanticStage,label:stageStop.label,frameId:stageStop.frameId,mode:stageStop.mode}),
    regime:freeze({id:regime.id,label:regime.label}),
    scaleReference:freeze({...reference,authority:AUTHORITY_STATUS[AUTHORITY.PRESENTATION_ONLY]}),
    semanticTransition:transition,
    location:freeze({breadcrumbs:projectedPath,current:projectedPath.at(-1)||null}),
    selection:projectedSelection,
    history:projectedHistory,
    target:projectedTarget,
    viewport,
    reducedMotion:Boolean(reducedMotion),
    assistiveStatus:''
  };
  projection.assistiveStatus=assistiveStatus(projection);
  return freeze(projection);
}

function authorityMarkup(status){return`<span class="ofu-orientation__authority" data-authority="${escapeHtml(status.id)}"><span aria-hidden="true">${escapeHtml(status.glyph)}</span> ${escapeHtml(status.label)}</span>`}
function breadcrumbsMarkup(items){
  if(!items.length)return'<span class="ofu-orientation__empty">Location path unavailable</span>';
  return`<ol>${items.map((item,index)=>`<li${index===items.length-1?' aria-current="location"':''}><span>${escapeHtml(item.label)}</span> ${authorityMarkup(item.authority)}</li>`).join('')}</ol>`;
}

export function renderOrientationScaleMarkup(projection,{expanded=false}={}){
  if(!projection?.contract?.startsWith('ofu-r6-i-orientation-scale-ux-'))throw new TypeError('A projected R6-I orientation context is required');
  const target=projection.target?`<p class="ofu-orientation__target"><strong>${escapeHtml(projection.target.label)}</strong> · ${escapeHtml(projection.target.distance)}${projection.target.travelTime?` · ${escapeHtml(projection.target.travelTime)}`:''} ${authorityMarkup(projection.target.authority)}</p>`:'';
  const prior=projection.history.priorStageLabel?` · from ${escapeHtml(projection.history.priorStageLabel)}`:'';
  return`<section class="ofu-orientation" data-density="${projection.viewport.density}" data-presentation="${projection.viewport.presentationMode}" data-motion="${projection.reducedMotion?'reduced':'standard'}" aria-label="Location and scale context">
  <button type="button" class="ofu-orientation__summary" data-orientation-action="toggle" aria-expanded="${expanded?'true':'false'}"><span>${escapeHtml(projection.stage.label)}</span><span aria-hidden="true"> · </span><span>${escapeHtml(projection.regime.label)}</span><span aria-hidden="true"> · </span><span>${escapeHtml(projection.scaleReference.label)}</span></button>
  <div class="ofu-orientation__panel"${expanded?'':' hidden'}>
    <nav class="ofu-orientation__breadcrumbs" aria-label="Retained location path">${breadcrumbsMarkup(projection.location.breadcrumbs)}</nav>
    <p class="ofu-orientation__focus"><strong>Selected:</strong> ${escapeHtml(projection.selection.label)} ${authorityMarkup(projection.selection.authority)}</p>
    <p class="ofu-orientation__scale"><strong>${escapeHtml(projection.scaleReference.label)}</strong> · ${escapeHtml(projection.scaleReference.cue)}</p>
    <p class="ofu-orientation__handoff">${escapeHtml(projection.semanticTransition.text)}</p>
    ${target}
    <div class="ofu-orientation__actions"><button type="button" data-orientation-action="back" aria-label="Return to previous retained context${prior}"${projection.history.canGoBack?'':' disabled'}>← Back${projection.history.depth?` · ${projection.history.depth}`:''}</button></div>
    <p class="ofu-orientation__sr" role="status" aria-live="polite" aria-atomic="true">${escapeHtml(projection.assistiveStatus)}</p>
  </div>
</section>`;
}

export const ORIENTATION_SCALE_UX_CSS=`
.ofu-orientation{font:inherit;max-inline-size:min(30rem,calc(100vw - 1rem));color:inherit;contain:layout style}.ofu-orientation__summary,.ofu-orientation__actions button{min-block-size:44px;min-inline-size:44px;font:inherit;color:inherit;background:rgba(5,8,14,.72);border:1px solid currentColor;border-radius:.45rem;padding:.55rem .75rem;cursor:pointer}.ofu-orientation__summary{display:flex;gap:.25rem;align-items:center;max-inline-size:100%;text-align:left}.ofu-orientation__panel{margin-block-start:.35rem;padding:.7rem .8rem;background:rgba(5,8,14,.82);border:1px solid currentColor;border-radius:.55rem;backdrop-filter:blur(10px)}.ofu-orientation__panel[hidden]{display:none}.ofu-orientation__breadcrumbs ol{display:flex;flex-wrap:wrap;gap:.25rem .5rem;list-style:none;margin:0;padding:0}.ofu-orientation__breadcrumbs li:not(:last-child)::after{content:'›';margin-inline-start:.5rem}.ofu-orientation__authority{white-space:nowrap;font-size:.82em}.ofu-orientation__focus,.ofu-orientation__scale,.ofu-orientation__handoff,.ofu-orientation__target{margin:.55rem 0}.ofu-orientation__sr{position:absolute!important;inline-size:1px!important;block-size:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}.ofu-orientation[data-presentation="RECEDED"]{opacity:.62;transition:opacity 160ms ease}.ofu-orientation[data-presentation="RECEDED"]:focus-within,.ofu-orientation[data-presentation="RECEDED"]:hover{opacity:1}.ofu-orientation button:focus-visible{outline:3px solid currentColor;outline-offset:3px}@media(max-width:559px){.ofu-orientation{max-inline-size:calc(100vw - .5rem)}.ofu-orientation__summary{font-size:.9em}.ofu-orientation__panel{max-block-size:min(55vh,24rem);overflow:auto}}@media(prefers-reduced-motion:reduce){.ofu-orientation,.ofu-orientation *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}@media(forced-colors:active){.ofu-orientation__summary,.ofu-orientation__panel,.ofu-orientation__actions button{background:Canvas;color:CanvasText;border-color:CanvasText;forced-color-adjust:auto}}`;

function ensureStyle(document){
  if(document.querySelector?.('style[data-ofu-r6-i-orientation]'))return;
  const style=document.createElement('style');style.dataset.ofuR6IOrientation='';style.textContent=ORIENTATION_SCALE_UX_CSS;(document.head||document.documentElement).append(style);
}

export function createOrientationScaleUX({container,onIntent=()=>{},initialExpanded=false,reducedMotion=false}={}){
  if(!container?.ownerDocument||typeof container.append!=='function')throw new TypeError('R6-I orientation UX requires a DOM container');
  const document=container.ownerDocument;ensureStyle(document);const host=document.createElement('div');host.dataset.ofuR6I='orientation-scale';container.append(host);
  let projection=null,expanded=Boolean(initialExpanded),destroyed=false;
  function paint(){
    if(destroyed||!projection)return;host.innerHTML=renderOrientationScaleMarkup(projection,{expanded});
    host.querySelector('[data-orientation-action="toggle"]')?.addEventListener('click',()=>{expanded=!expanded;paint();onIntent(freeze({type:'ORIENTATION_PANEL',expanded,source:'R6_I'}))});
    host.querySelector('[data-orientation-action="back"]')?.addEventListener('click',()=>{if(projection.history.canGoBack)onIntent(freeze({type:'BACK',source:'R6_I'}))});
  }
  return freeze({
    update(input){if(destroyed)throw new Error('R6-I orientation UX is destroyed');projection=projectOrientationScaleContext({...input,reducedMotion:input?.reducedMotion??reducedMotion});if(projection.viewport.presentationMode==='RECEDED'&&!host.matches?.(':focus-within'))expanded=false;paint();return projection},
    setExpanded(value){expanded=Boolean(value);paint();return expanded},
    snapshot(){return projection},
    destroy(){if(!destroyed){destroyed=true;host.remove()}},
    host
  });
}
