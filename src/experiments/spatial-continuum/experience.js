import { MAX_SCALE_COORDINATE, stageForCoordinate } from './constants.js';
import { deterministicModelCoordinates } from './geodesy.js';
import { createContinuumKernel } from './kernel.js';
import { createOpenUniverseAuthority } from './open-universe.js';
import { advanceSurfaceDirection, modelCoordinatesFromDirection } from './planetary-topology.js';
import { createContinuumRenderer } from './renderer.js';
import { captureGenuineOFUWorld } from './world-adapter.js';

const DESCRIPTIONS=Object.freeze({
  UNIVERSE:'A bounded discovery window into the canonical OFU universe. Choose a visible galaxy; none is preselected for you.',
  GALAXY:'The selected canonical galaxy remains the parent context. Choose a discovered region or retreat.',
  REGION:'A canonical region is focused without destroying its galaxy context.',
  NEIGHBORHOOD:'A model-derived neighborhood exposes genuine OFU systems. Choose where the journey continues.',
  SYSTEM:'A genuine selected system exposes its stars and worlds through the same renderer-owned interaction path.',
  ORBIT:'The chosen canonical body is the camera anchor; its system remains behind it.',
  APPROACH:'The same body grows through target-derived camera motion. Curvature, light and atmosphere become dominant.',
  GLOBAL_SURFACE:'Planet-wide context remains visible while one model-derived surface target is retained.',
  REGIONAL_SURFACE:'Presentation-only terrain refines the retained location without becoming a disconnected map.',
  LOCAL_SURFACE:'The same terrain field resolves more visible detail around the same target.',
  HUMAN:'Embodied local frame. Use W A S D and drag to move and look; then explicitly choose an inspectable sample.',
  MATERIAL:'The selected source sample is retained. Composition is model-derived; geometry is presentation-only.',
  MICROSTRUCTURE:'A source-anchored representative volume, explicitly not a literal or measured micrograph.',
  MOLECULAR:'Contextual molecular grammar. Unknown chemistry remains unknown; no exact arrangement is asserted.',
  ATOMIC:'A nonclassical presentation of bounded atomic context; no electron orbit or exact position is claimed.'
});

const sleep=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));
const percentile=(values,p)=>{if(!values.length)return null;const sorted=[...values].sort((a,b)=>a-b);return sorted[Math.min(sorted.length-1,Math.floor((sorted.length-1)*p))]};
const idOf=node=>String(node?.canonicalId||node?.entityId||node?.id||'');

async function waitForReleasedRuntime(timeoutMs=12000){
  const started=performance.now();
  while(performance.now()-started<timeoutMs){
    if(globalThis.OFU?.v1LivingProduct?.runtime&&globalThis.__OFU_PLANET_PREVIEW__?.chosen?.key)return;
    await sleep(30);
  }
  throw new Error('Released OFU runtime did not become ready');
}

function markup(){
    return `<a class="continuum-skip" href="#continuum-canvas">Skip to spatial universe</a>
    <header class="continuum-topbar"><div class="continuum-brand"><strong>ONE FILE UNIVERSE</strong><span>SPATIAL CONTINUUM R5 · GENERATIVE UNIVERSE</span></div><div class="continuum-live">ONE SCENE · VERSIONED REALITY · OFFLINE</div></header>
    <section class="continuum-stage" aria-label="Spatial continuum experience">
      <canvas id="continuum-canvas" tabindex="0" aria-label="Interactive open universe. Select visible destinations, drag to orbit, wheel or pinch to travel, and use W A S D at human scale."></canvas><div class="continuum-vignette"></div>
      <section class="continuum-identity"><div class="continuum-kicker"><span id="continuum-stage-name">UNIVERSE</span><span class="continuum-authority" id="continuum-authority">CANONICAL</span></div><h1 id="continuum-title">Opening the canonical universe…</h1><p id="continuum-description"></p><span class="continuum-id" id="continuum-id"></span></section>
      <aside class="continuum-context" aria-label="Current scientific context"><h2>Context retained</h2><label class="continuum-world-picker"><span id="continuum-picker-label">Visible destinations</span><select id="continuum-body-select"><option value="">Choose a destination…</option></select></label><dl class="continuum-facts"><div><dt>Focus</dt><dd id="continuum-focus">—</dd></div><div><dt>Reference frame</dt><dd id="continuum-frame">—</dd></div><div><dt>Scale coordinate</dt><dd id="continuum-coordinate">0.000</dd></div><div><dt>Address</dt><dd id="continuum-handoff">—</dd></div><div><dt>Source sample</dt><dd id="continuum-sample">not selected</dd></div></dl><p class="continuum-honesty" id="continuum-honesty">Canonical identity and presentation placement are explicitly separate.</p></aside>
      <div class="continuum-hover" id="continuum-hover"></div>
      <section class="continuum-bottom"><nav class="continuum-rail" id="continuum-rail" aria-label="Scale landmarks"></nav><div class="continuum-controls"><button type="button" data-action="back">Back</button><span class="continuum-field-nav" id="continuum-field-nav"><button type="button" data-action="galaxy-previous" aria-label="Discover the previous galaxy field">← Field</button><button type="button" data-action="galaxy-next" aria-label="Discover the next galaxy field">Field →</button></span><button type="button" data-action="shallower">− Shallower</button><div><div class="continuum-scale-track"><div class="continuum-scale-progress" id="continuum-progress"></div></div><div class="continuum-readout"><span id="continuum-readout">UNIVERSE · 0.000</span><span class="continuum-movement" id="continuum-movement">Select a visible galaxy</span></div></div><button type="button" data-action="deeper">Deeper +</button><button type="button" data-action="focus">Focus selected</button></div></section>
      <p class="continuum-status" id="continuum-status" role="status" aria-live="polite" aria-atomic="true"></p><div class="continuum-loading" id="continuum-loading"><div><strong>OPENING ONE UNIVERSE</strong><span>Binding canonical discovery authority to one spatial continuum…</span></div></div>
    </section>`;
}

function installRoot(){
  document.body.classList.add('ofu-continuum-active');
  let root=document.getElementById('ofu-continuum-root');
  if(!root){root=document.createElement('main');root.id='ofu-continuum-root';root.innerHTML=markup();document.body.append(root)}
  return root;
}

export async function bootSpatialContinuum(){
  const root=installRoot(),loading=root.querySelector('#continuum-loading');
  try{
    await waitForReleasedRuntime();
    const parameters=new URLSearchParams(location.search),preview=globalThis.__OFU_PLANET_PREVIEW__;
    const openUniverse=createOpenUniverseAuthority(globalThis,{ctx:preview.ctx,seedKey:preview.chosen.key,cacheEntries:Number(parameters.get('cacheEntries')||12)});
    const seedWorld=captureGenuineOFUWorld(globalThis,{runtime:openUniverse.runtime,profile:'origin',latMicroDeg:parameters.get('latMicroDeg'),lonMicroDeg:parameters.get('lonMicroDeg')});
    seedWorld.releaseLegacy();
    let world=Object.freeze({...seedWorld,openUniverse}),sampleExplicitlySelected=false;
    const reduced=matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true,canvas=root.querySelector('#continuum-canvas');
    const kernel=createContinuumKernel({graph:openUniverse.graph,frames:world.frames,targets:openUniverse.cameraTargets(world),initialStage:'UNIVERSE',reducedMotion:reduced});
    const renderer=createContinuumRenderer(canvas,world,{onContextChange:value=>announce('WebGL context '+value)});
    const elements=Object.fromEntries(['stage-name','authority','title','description','id','focus','frame','coordinate','handoff','sample','honesty','progress','readout','movement','hover','rail','status','body-select','picker-label','field-nav'].map(key=>[key,root.querySelector('#continuum-'+key)]));
    for(const stop of kernel.stages){
      const button=document.createElement('button');button.type='button';button.textContent=stop.label;button.dataset.stage=stop.stage;button.dataset.coordinate=String(stop.coordinate);button.addEventListener('click',()=>travelTo(stop.stage));elements.rail.append(button);
    }

    const frameIntervals=[],responseTimes=[],transitionLog=[],interactionLog=[],branchHistory=[],pointers=new Map(),keys=new Set();
    let lastFrame=performance.now(),lastUi=0,lastRevision=-1,lastInputAt=null,lastStage='UNIVERSE',lastAnnouncement='',lastCatalogueSignature='',drag=null,pinch=null,disposed=false,visualReady=false,humanBranchCaptured=false,surfaceRebases=0,evidenceClock=null;
    const currentTime=()=>performance.now();
    const recordInteraction=entry=>{interactionLog.push(Object.freeze({...entry,at:currentTime()}));if(interactionLog.length>64)interactionLog.shift()};
    const openCheckpointKey=checkpoint=>`${checkpoint?.address||''}@${checkpoint?.galaxyWindow?.x||'0'},${checkpoint?.galaxyWindow?.y||'0'},${checkpoint?.galaxyWindow?.z||'0'}`;
    const pushBranchCheckpoint=({resetLocalPosition=false}={})=>{const now=currentTime(),captured=kernel.checkpoint(now),camera=resetLocalPosition?Object.freeze({...captured.camera,localPosition:Object.freeze([0,0,0])}):captured.camera,kernelCheckpoint=resetLocalPosition?Object.freeze({...captured,camera}):captured,entry=Object.freeze({open:openUniverse.checkpoint(),kernel:kernelCheckpoint,sampleExplicitlySelected}),previous=branchHistory.at(-1);if(openCheckpointKey(previous?.open)!==openCheckpointKey(entry.open)||previous?.kernel.stage!==entry.kernel.stage)branchHistory.push(entry);if(branchHistory.length>64)branchHistory.shift();return entry};
    function announce(message){const next=String(message);elements.movement.textContent=next;if(next!==lastAnnouncement)elements.status.textContent=next;lastAnnouncement=next}
    function rebind(nextWorld=world,now=currentTime()){
      world=nextWorld.openUniverse?nextWorld:Object.freeze({...nextWorld,openUniverse});
      kernel.rebind({graph:openUniverse.graph,frames:world.frames,targets:openUniverse.cameraTargets(world)},now);
      renderer.rebind(world);lastInputAt=now;
    }
    function semanticCapabilities(){
      const path=openUniverse.path;
      const maxCoordinate=!path.galaxy?0:!path.region?1:!path.system?3:!path.body||!openUniverse.world?4:!sampleExplicitlySelected?10:MAX_SCALE_COORDINATE;
      return Object.freeze({contract:'ofu-continuum-semantic-capabilities-1',maxCoordinate,canInspectMaterial:sampleExplicitlySelected,sourceSampleId:sampleExplicitlySelected?world.sampleId:null,requiresExplicitSample:true});
    }
    function availableMaximum(){return semanticCapabilities().maxCoordinate}
    function requiredSelectionFor(coordinate){
      if(coordinate>=11&&!semanticCapabilities().canInspectMaterial)return'Choose a local sample at HUMAN before material and microscopic travel.';
      if(coordinate>=5&&openUniverse.path.body&&!openUniverse.world)return openUniverse.snapshot().materialization.blocker?.reason||'This body has no materialized orbital/surface representation.';
      if(coordinate>=5&&!openUniverse.path.body)return'Choose a visible planet before orbital travel.';
      if(coordinate>=4&&!openUniverse.path.system)return'Choose a visible system before system travel.';
      if(coordinate>=3&&!openUniverse.path.region)return'Choose a visible region before neighborhood travel.';
      if(coordinate>=1&&!openUniverse.path.galaxy)return'Choose a visible galaxy before galactic travel.';
      return null;
    }
    function focusForCoordinate(coordinate){
      if(coordinate>=11&&sampleExplicitlySelected)return world.sampleId;
      if(coordinate>=7&&openUniverse.path.surface)return world.surfaceId;
      if(coordinate>=5&&openUniverse.path.body)return world.bodyId;
      return openUniverse.graph.focusId;
    }
    function travelTo(stage,{push=true}={}){
      const stop=kernel.stages.find(candidate=>candidate.stage===String(stage).toUpperCase());if(!stop)throw new RangeError('Unknown continuum stage: '+stage);
      const blocker=requiredSelectionFor(stop.coordinate);if(blocker){announce(blocker);transitionLog.push({type:'BLOCKED',stage:stop.stage,reason:blocker,at:currentTime()});return kernel.snapshot(currentTime())}
      const now=currentTime(),before=kernel.snapshot(now),focusId=focusForCoordinate(stop.coordinate);if(focusId&&openUniverse.graph.focusId!==focusId)kernel.select(focusId,now,{push:false});
      const next=kernel.travelTo(stop.stage,now,{push});elements.hover.dataset.visible='false';lastInputAt=now;transitionLog.push({type:'TARGET',from:before.scale.coordinate,to:next.targetCoordinate,stage:stop.stage,at:now,reducedMotion:reduced});announce('Traveling toward '+stop.label.toLowerCase());return next;
    }
    function travelBy(delta){
      const now=currentTime(),before=kernel.snapshot(now),target=Math.max(0,Math.min(availableMaximum(),before.scale.coordinate+Number(delta))),focusId=focusForCoordinate(target);if(focusId&&openUniverse.graph.focusId!==focusId)kernel.select(focusId,now,{push:false});const next=kernel.travelBy(target-before.scale.coordinate,now,{push:false});lastInputAt=now;transitionLog.push({type:'CONTINUOUS_INPUT',from:before.scale.coordinate,to:next.targetCoordinate,at:now});return next;
    }
    function pointerDirectedZoom(clientX,clientY,delta){
      const amount=Math.max(-.42,Math.min(.42,Number(delta)||0)),before=kernel.snapshot(currentTime());if(!amount)return Object.freeze({hitId:null,retargeted:false,state:before});let hit=null,retargeted=false;
      if(amount>0){const stage=before.scale.semanticStage;if(['APPROACH','GLOBAL_SURFACE'].includes(stage)&&openUniverse.world){const surfaceHit=renderer.pickSurface(clientX,clientY);if(surfaceHit){chooseSurfaceTarget(clientX,clientY,{travel:false});hit={id:surfaceHit.bodyId,kind:'SURFACE_LOCATION'};retargeted=true}}else{hit=renderer.pick(clientX,clientY);if(hit&&hit.id!==openUniverse.graph.focusId){if(stage==='HUMAN')chooseSample(hit.id);else chooseDestination(hit.id);retargeted=true}}}
      const state=travelBy(amount);renderer.update(kernel.snapshot(currentTime()));recordInteraction({type:'POINTER_DIRECTED_ZOOM',x:Number(clientX),y:Number(clientY),delta:amount,hitId:hit?.id||null,retargeted,fromFocusId:before.graph.focusId,toFocusId:openUniverse.graph.focusId});return Object.freeze({hitId:hit?.id||null,retargeted,state});
    }
    function adjacent(direction){const state=kernel.snapshot(currentTime()),index=Math.round(state.scale.targetCoordinate),next=Math.max(0,Math.min(MAX_SCALE_COORDINATE,index+direction));return travelTo(kernel.stages[next].stage)}
    function chooseDestination(destinationId){
      pushBranchCheckpoint();const now=currentTime(),before=openUniverse.snapshot(),selected=openUniverse.select(destinationId),kind=selected.focusKind;
      if(['PLANET','MOON'].includes(kind)){
        const coordinates=deterministicModelCoordinates(selected.focusId);sampleExplicitlySelected=false;let materialized=false;try{const nextWorld=openUniverse.materializeWorld(coordinates);rebind(nextWorld,now);materialized=true}catch(error){kernel.rebind({graph:openUniverse.graph,frames:world.frames,targets:openUniverse.cameraTargets(world)},now);transitionLog.push({type:'CAPABILITY_BLOCKER',id:selected.focusId,reason:String(error?.message||error),at:now})}travelTo(materialized?'ORBIT':'SYSTEM',{push:false});if(openUniverse.snapshot().materialization.blocker)announce(openUniverse.snapshot().materialization.blocker.reason);
      }else{
        kernel.rebind({graph:openUniverse.graph,frames:world.frames,targets:openUniverse.cameraTargets(world)},now);lastInputAt=now;
        const stage=kind==='GALAXY'?'GALAXY':kind==='GALACTIC_REGION'?'REGION':kind==='SYSTEM'?'SYSTEM':'SYSTEM';travelTo(stage,{push:false});
        if(kind==='STAR')announce('Canonical star selected. This body has no terrestrial descent capability.');
      }
      transitionLog.push({type:'BRANCH_SELECTION',from:before.currentAddress.serialized,to:openUniverse.snapshot().currentAddress.serialized,id:String(destinationId),kind,at:now});
      return openUniverse.snapshot();
    }
    function exploreGalaxyField(direction){
      pushBranchCheckpoint();const now=currentTime(),before=openUniverse.snapshot().galaxyStreaming.activeWindowKey,next=openUniverse.exploreGalaxyWindow(direction);sampleExplicitlySelected=false;kernel.rebind({graph:openUniverse.graph,frames:world.frames,targets:openUniverse.cameraTargets(world)},now);kernel.travelTo('UNIVERSE',now,{push:false});kernel.settle(now);lastCatalogueSignature='';lastInputAt=now;transitionLog.push({type:'GALAXY_WINDOW_STREAM',from:before,to:next.galaxyStreaming.activeWindowKey,direction:String(direction),at:now});announce(`Discovered galaxy field ${next.galaxyStreaming.activeWindowKey}`);return next;
    }
    function chooseSample(sampleId){
      pushBranchCheckpoint();const now=currentTime(),materialized=openUniverse.selectSample(sampleId);sampleExplicitlySelected=true;rebind(materialized,now);kernel.select(materialized.sampleId,now,{push:false});announce('Source sample selected; contextual microscopic travel is available');transitionLog.push({type:'SAMPLE_SELECTION',id:materialized.sampleId,kind:materialized.sample.kind,at:now});return materialized;
    }
    function chooseSurfaceTarget(clientX,clientY,{travel=true}={}){
      const hit=renderer.pickSurface(clientX,clientY);if(!hit)return null;pushBranchCheckpoint();const now=currentTime(),priorSurface=world.surfaceId,materialized=openUniverse.retargetSurface(hit.bodyFixedUnit);sampleExplicitlySelected=false;rebind(materialized,now);if(travel)travelTo('GLOBAL_SURFACE',{push:false});transitionLog.push({type:'SURFACE_RETARGET',bodyId:hit.bodyId,fromSurfaceId:priorSurface,toSurfaceId:materialized.surfaceId,bodyFixedUnit:hit.bodyFixedUnit,continuesActiveTravel:!travel,at:now});announce('Surface target retained from the point selected on the same world');return Object.freeze({hit,world:materialized})
    }
    function rebaseHumanTravel(state,now){
      if(state.scale.semanticStage!=='HUMAN'||!openUniverse.world)return state;
      const local=state.camera.localPosition||[0,0,0],distance=Math.hypot(local[0],local[2]);if(distance<256)return state;
      if(!humanBranchCaptured){pushBranchCheckpoint({resetLocalPosition:true});humanBranchCaptured=true}
      const priorSurfaceId=world.surfaceId,direction=advanceSurfaceDirection(world.surfaceTarget.bodyFixedUnit,world.surfaceTarget.tangent.east,world.surfaceTarget.tangent.north,{eastM:local[0],northM:local[2],radiusM:world.physicalRadiusM}),coordinates=modelCoordinatesFromDirection(direction),materialized=openUniverse.materializeWorld(coordinates);sampleExplicitlySelected=false;rebind(materialized,now);kernel.select(materialized.surfaceId,now,{push:false});surfaceRebases++;transitionLog.push({type:'HUMAN_SURFACE_REBASE',bodyId:materialized.bodyId,fromSurfaceId:priorSurfaceId,toSurfaceId:materialized.surfaceId,eastM:local[0],northM:local[2],at:now});announce('Local travel continued across the same body-fixed surface');return kernel.snapshot(now)
    }
    function goBack(){
      const now=currentTime(),state=kernel.snapshot(now),candidate=branchHistory.at(-1),addressChanged=!!candidate&&openCheckpointKey(candidate.open)!==openCheckpointKey(openUniverse.checkpoint());if(!addressChanged&&state.historyDepth>0){lastInputAt=now;announce('Reversing along retained camera context');return kernel.back(now)}const checkpoint=branchHistory.pop();if(!checkpoint){announce('This is the root of the current exploration history');return state}openUniverse.restore(checkpoint.open);sampleExplicitlySelected=checkpoint.sampleExplicitlySelected;const restoredWorld=openUniverse.world;if(restoredWorld)rebind(restoredWorld,now);else kernel.rebind({graph:openUniverse.graph,frames:world.frames,targets:openUniverse.cameraTargets(world)},now);kernel.restore(checkpoint.kernel,now);lastInputAt=now;lastCatalogueSignature='';transitionLog.push({type:'BRANCH_BACK',address:checkpoint.open.address,galaxyWindow:checkpoint.open.galaxyWindow,stage:checkpoint.kernel.stage,at:now});announce('Restored the exact prior exploration branch');return kernel.snapshot(now)
    }
    function createBookmark(){
      const now=currentTime(),open=openUniverse.checkpoint(),kernelCheckpoint=kernel.checkpoint(now),generative=openUniverse.world?.generative;
      return Object.freeze({contract:'ofu-spatial-continuum-bookmark-1',open,kernel:kernelCheckpoint,sampleExplicitlySelected,integrity:Object.freeze({generatorVersion:generative?.versions?.generator||null,scientificModelVersion:generative?.versions?.scientificModel||null,representationVersion:generative?.versions?.representation||null,scientificStateHash:generative?.scientificHashes?.context||null,representationHash:generative?.representationHash||null})});
    }
    function restoreBookmark(bookmark){
      if(bookmark?.contract!=='ofu-spatial-continuum-bookmark-1'||!bookmark.open||!bookmark.kernel)throw new TypeError('A valid Spatial Continuum bookmark is required');
      const now=currentTime();openUniverse.restore(bookmark.open);sampleExplicitlySelected=bookmark.sampleExplicitlySelected===true;const restoredWorld=openUniverse.world;
      if(restoredWorld)rebind(restoredWorld,now);else kernel.rebind({graph:openUniverse.graph,frames:world.frames,targets:openUniverse.cameraTargets(world)},now);
      kernel.restore(bookmark.kernel,now);lastCatalogueSignature='';lastInputAt=now;const integrity=bookmark.integrity||{},actual=restoredWorld?.generative;
      for(const [label,expected,received] of [['generator version',integrity.generatorVersion,actual?.versions?.generator],['scientific model version',integrity.scientificModelVersion,actual?.versions?.scientificModel],['representation version',integrity.representationVersion,actual?.versions?.representation],['scientific state hash',integrity.scientificStateHash,actual?.scientificHashes?.context],['representation hash',integrity.representationHash,actual?.representationHash]])if(expected!=null&&expected!==received)throw new Error(`Bookmark ${label} mismatch: expected ${expected}, received ${received}`);
      transitionLog.push({type:'BOOKMARK_RESTORE',address:bookmark.open.address,stage:bookmark.kernel.stage,at:now});announce('Restored the exact deterministic universe address');return openUniverse.snapshot();
    }
    function destroyActiveContext(){
      const priorWorld=world,release=openUniverse.releaseActiveWorld({reason:'DETERMINISTIC_REVISIT_PROOF'});sampleExplicitlySelected=false;lastCatalogueSignature='';return Object.freeze({release,disposed:priorWorld.lifecycle?.snapshot?.().disposed===true});
    }
    function catalogueForUi(stage){
      if(stage==='HUMAN'&&openUniverse.world)return Object.freeze(openUniverse.localDestinations().nodes.map(object=>Object.freeze({...object,selected:sampleExplicitlySelected&&object.id===world.sampleId})));
      return openUniverse.catalogueFor(stage);
    }
    function updatePicker(stage){
      const catalogue=catalogueForUi(stage),signature=stage+':'+catalogue.map(item=>item.id+':'+item.selected).join('|');if(signature===lastCatalogueSignature)return;lastCatalogueSignature=signature;elements['body-select'].replaceChildren();const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent=catalogue.length?'Choose a visible destination…':'No valid destination at this scale';elements['body-select'].append(placeholder);
      for(const item of catalogue){const option=document.createElement('option');option.value=item.id;option.textContent=`${String(item.kind).replaceAll('_',' ').toLowerCase()} · ${item.label||item.id.slice(0,10)}`;option.selected=!!item.selected;elements['body-select'].append(option)}
      elements['body-select'].disabled=!catalogue.length;elements['picker-label'].textContent=stage==='HUMAN'?'Inspectable local objects':'Visible destinations';
    }
    function updateUi(state){
      const stage=state.scale.semanticStage,focus=state.graph.focusId,handoff=state.representationHandoff,open=openUniverse.snapshot(),node=state.graph.focus;if(lastStage==='HUMAN'&&stage!=='HUMAN')humanBranchCaptured=false;
      updatePicker(stage);elements['field-nav'].hidden=stage!=='UNIVERSE';elements['stage-name'].textContent=stage.replaceAll('_',' ');elements.authority.textContent=node?.authority||'UNKNOWN';elements.title.textContent=stage==='UNIVERSE'?`Galaxy field ${open.galaxyStreaming.activeWindowKey}`:node?.metadata?.label||`${String(node?.kind||'focus').replaceAll('_',' ').toLowerCase()} ${focus.slice(0,10)}…`;elements.description.textContent=DESCRIPTIONS[stage];elements.id.textContent='focus '+focus;elements.focus.textContent=focus.slice(0,14)+'…';elements.frame.textContent=state.camera.frameId;elements.coordinate.textContent=state.scale.coordinate.toFixed(3);elements.handoff.textContent=open.currentAddress.segments.map(segment=>segment.kind.toLowerCase().replaceAll('_',' ')).join(' › ');elements.handoff.title=open.currentAddress.serialized;elements.sample.textContent=sampleExplicitlySelected?world.sampleId.slice(0,13)+'…':'not selected';elements.honesty.textContent=stage==='MOLECULAR'||stage==='ATOMIC'?'Contextual presentation only: no exact chemistry or particle position is asserted.':stage==='UNIVERSE'||stage==='GALAXY'?'Entity identity is canonical; spatial layout is deterministic presentation only.':'Presentation geometry is deterministic but does not add scientific facts.';elements.progress.style.width=(state.scale.coordinate/MAX_SCALE_COORDINATE*100)+'%';elements.readout.textContent=`${stage} · ${state.scale.coordinate.toFixed(3)}`;
      const maximum=availableMaximum();for(const button of elements.rail.children){const coordinate=Number(button.dataset.coordinate);button.setAttribute('aria-current',String(button.dataset.stage===stage));button.dataset.active=String(Object.hasOwn(handoff.weights,button.dataset.stage));button.disabled=coordinate>maximum}
      root.querySelector('[data-action="deeper"]').disabled=Math.round(state.scale.targetCoordinate)>=maximum;if(lastStage!==stage){transitionLog.push({type:'SEMANTIC_LANDMARK',stage,coordinate:state.scale.coordinate,at:currentTime(),focusId:focus});lastStage=stage}
    }

    root.querySelector('[data-action="deeper"]').addEventListener('click',()=>adjacent(1));
    root.querySelector('[data-action="shallower"]').addEventListener('click',()=>adjacent(-1));
    root.querySelector('[data-action="back"]').addEventListener('click',goBack);
    root.querySelector('[data-action="galaxy-previous"]').addEventListener('click',()=>exploreGalaxyField('negativeX'));
    root.querySelector('[data-action="galaxy-next"]').addEventListener('click',()=>exploreGalaxyField('positiveX'));
    root.querySelector('[data-action="focus"]').addEventListener('click',()=>{const selected=elements['body-select'].value;if(!selected)return announce('Choose a visible destination first');kernel.snapshot(currentTime()).scale.semanticStage==='HUMAN'?chooseSample(selected):chooseDestination(selected)});
    elements['body-select'].addEventListener('change',()=>{const selected=elements['body-select'].value;if(selected)(kernel.snapshot(currentTime()).scale.semanticStage==='HUMAN'?chooseSample(selected):chooseDestination(selected))});
    canvas.addEventListener('wheel',event=>{event.preventDefault();const delta=Math.max(-.42,Math.min(.42,event.deltaY*-.0024));if(delta)pointerDirectedZoom(event.clientX,event.clientY,delta)},{passive:false});
    const pointerPosition=event=>({x:event.clientX,y:event.clientY});
    canvas.addEventListener('pointerdown',event=>{event.preventDefault();canvas.focus({preventScroll:true});const point=pointerPosition(event);pointers.set(event.pointerId,point);recordInteraction({type:'POINTER_DOWN',pointerId:event.pointerId,x:point.x,y:point.y});try{canvas.setPointerCapture(event.pointerId)}catch{}if(pointers.size===1)drag={id:event.pointerId,start:point,last:point,moved:false};if(pointers.size===2){const values=[...pointers.values()];pinch={span:Math.hypot(values[0].x-values[1].x,values[0].y-values[1].y),coordinate:kernel.snapshot(currentTime()).scale.coordinate};drag=null}});
    canvas.addEventListener('pointermove',event=>{const point=pointerPosition(event);if(!pointers.has(event.pointerId)){const hit=renderer.hover(point.x,point.y);elements.hover.dataset.visible=String(!!hit);if(hit){elements.hover.textContent=`Select ${hit.label||hit.kind||'destination'}`;const rect=canvas.getBoundingClientRect();elements.hover.style.left=(point.x-rect.left)+'px';elements.hover.style.top=(point.y-rect.top)+'px'}return}pointers.set(event.pointerId,point);if(pinch&&pointers.size>=2){const values=[...pointers.values()],span=Math.max(1,Math.hypot(values[0].x-values[1].x,values[0].y-values[1].y)),target=pinch.coordinate+Math.log2(span/pinch.span);travelBy(target-kernel.snapshot(currentTime()).scale.coordinate);return}if(!drag||drag.id!==event.pointerId)return;const dx=point.x-drag.last.x,dy=point.y-drag.last.y;if(Math.hypot(point.x-drag.start.x,point.y-drag.start.y)>4)drag.moved=true;if(drag.moved)kernel.orbit(-dx*.006,-dy*.004);drag.last=point});
    const finishPointer=event=>{const point=pointerPosition(event),wasDrag=drag&&drag.id===event.pointerId,moved=wasDrag&&drag.moved;pointers.delete(event.pointerId);if(canvas.hasPointerCapture?.(event.pointerId))try{canvas.releasePointerCapture(event.pointerId)}catch{}let hit=null;if(wasDrag&&!moved){hit=renderer.pick(point.x,point.y);if(hit){const stage=kernel.snapshot(currentTime()).scale.semanticStage;if(['APPROACH','GLOBAL_SURFACE'].includes(stage)&&hit.id===world.bodyId)chooseSurfaceTarget(point.x,point.y);else if(stage==='HUMAN')chooseSample(hit.id);else chooseDestination(hit.id)}}recordInteraction({type:'POINTER_FINISH',pointerId:event.pointerId,x:point.x,y:point.y,moved:!!moved,hitId:hit?.id||null,focusId:openUniverse.graph.focusId});if(pointers.size<2)pinch=null;if(wasDrag)drag=null};
    canvas.addEventListener('pointerup',finishPointer);canvas.addEventListener('pointercancel',finishPointer);canvas.addEventListener('lostpointercapture',event=>{pointers.delete(event.pointerId);drag=null;if(pointers.size<2)pinch=null});
    canvas.addEventListener('keydown',event=>{if(['w','a','s','d','W','A','S','D'].includes(event.key)){keys.add(event.key.toLowerCase());event.preventDefault()}else if(event.key==='['&&kernel.snapshot(currentTime()).scale.semanticStage==='UNIVERSE'){exploreGalaxyField('negativeX');event.preventDefault()}else if(event.key===']'&&kernel.snapshot(currentTime()).scale.semanticStage==='UNIVERSE'){exploreGalaxyField('positiveX');event.preventDefault()}else if(event.key==='ArrowLeft'){kernel.orbit(-.09,0);event.preventDefault()}else if(event.key==='ArrowRight'){kernel.orbit(.09,0);event.preventDefault()}else if(event.key==='ArrowUp'){kernel.orbit(0,-.07);event.preventDefault()}else if(event.key==='ArrowDown'){kernel.orbit(0,.07);event.preventDefault()}else if(event.key==='+'||event.key==='='){travelBy(.42);event.preventDefault()}else if(event.key==='-'||event.key==='_'){travelBy(-.42);event.preventDefault()}else if(event.key==='Escape'||event.key==='Backspace'){goBack();event.preventDefault()}});canvas.addEventListener('keyup',event=>keys.delete(event.key.toLowerCase()));canvas.addEventListener('blur',()=>keys.clear());
    function frame(now){if(disposed)return;const interval=now-lastFrame,sampleNow=evidenceClock??now;lastFrame=now;if(interval<1000){frameIntervals.push(interval);if(frameIntervals.length>2400)frameIntervals.shift()}let state=kernel.snapshot(sampleNow);if(state.scale.semanticStage==='HUMAN'&&keys.size&&evidenceClock==null){kernel.moveLocal((keys.has('w')?1:0)-(keys.has('s')?1:0),(keys.has('d')?1:0)-(keys.has('a')?1:0),Math.min(.05,interval/1000));state=kernel.snapshot(sampleNow);elements.movement.textContent='WASD movement · '+state.camera.localPosition.map(value=>value.toFixed(1)).join(', ')}state=rebaseHumanTravel(state,sampleNow);renderer.update(state);if(lastInputAt!=null&&state.revision!==lastRevision){responseTimes.push(Math.max(0,currentTime()-lastInputAt));lastInputAt=null}lastRevision=state.revision;if(now-lastUi>80){lastUi=now;updateUi(state)}requestAnimationFrame(frame)}
    const api=Object.freeze({
      contract:'ofu-spatial-continuum-generative-universe-5',openUniverse,get world(){return world},kernel,renderer,reducedMotion:reduced,travelTo,travelBy,pointerDirectedZoom,chooseDestination,chooseSurfaceTarget,chooseSample,exploreGalaxyField,createBookmark,restoreBookmark,destroyActiveContext,back:goBack,moveLocal:(forward,right,dt=.1)=>{kernel.moveLocal(forward,right,dt);return kernel.snapshot(currentTime())},settle:()=>{const state=kernel.settle(currentTime());renderer.update(state);return state},setEvidenceClock(time){evidenceClock=Number(time);if(!Number.isFinite(evidenceClock))throw new TypeError('Evidence clock must be finite');const state=kernel.snapshot(evidenceClock);renderer.update(state);updateUi(state);return state},clearEvidenceClock(){evidenceClock=null;return true},
      resetMetrics(){frameIntervals.length=0;responseTimes.length=0;transitionLog.length=0;lastFrame=currentTime();return true},
      snapshot(){const state=kernel.snapshot(evidenceClock??currentTime()),render=renderer.snapshot(),open=openUniverse.snapshot(),latestBranch=branchHistory.at(-1),generative=open.worldIdentity?Object.freeze({versions:world.generative.versions,seeds:world.generative.seeds,scientificHashes:world.generative.scientificHashes,planetRepresentationHash:world.generative.planetRepresentationHash,representationHash:world.generative.representationHash,presentation:world.generative.presentation,causalTrace:world.generative.causalTrace,orderIndependent:world.generative.orderIndependent}):null;return Object.freeze({contract:'ofu-spatial-continuum-open-snapshot-5',status:visualReady?'READY':'RENDERING',worldIdentity:open.worldIdentity,sourceSampleIdentity:sampleExplicitlySelected?world.sampleId:null,state,capabilities:semanticCapabilities(),generative,openUniverse:open,render,explorationFreedom:'BRANCHING_BUT_CONSTRAINED',surfaceRebases,branchHistory:Object.freeze({depth:branchHistory.length,capacity:64,bounded:branchHistory.length<=64,latestAddress:latestBranch?.open.address||null,latestGalaxyWindow:latestBranch?.open.galaxyWindow||null}),performance:Object.freeze({samples:frameIntervals.length,median:percentile(frameIntervals,.5),p95:percentile(frameIntervals,.95),p99:percentile(frameIntervals,.99),longFrames34:frameIntervals.filter(value=>value>34).length,longFrames50:frameIntervals.filter(value=>value>50).length,inputResponseMedian:percentile(responseTimes,.5)}),transitionLog:Object.freeze([...transitionLog]),interactionLog:Object.freeze([...interactionLog]),runtimeNetworkResources:performance.getEntriesByType('resource').filter(entry=>/^https?:/i.test(entry.name)).length,canonicalIdentityPreserved:open.currentAddress.includes(open.focusId),singleCameraAuthority:render.cameraCount===1})},
      async waitForSettled(timeoutMs=5000){const started=currentTime();while(currentTime()-started<timeoutMs){const state=kernel.snapshot(currentTime());if(!state.scale.moving)return state;await sleep(16)}throw new Error('Continuum travel did not settle')},
      dispose(){if(disposed)return false;disposed=true;renderer.dispose();openUniverse.dispose();return true}
    });
    globalThis.__OFU_SPATIAL_CONTINUUM__=api;requestAnimationFrame(frame);await renderer.ready;visualReady=true;loading.hidden=true;announce(reduced?'Reduced-motion continuity active':'Select any visible galaxy to begin');return api;
  }catch(error){loading.hidden=true;const node=document.createElement('pre');node.className='continuum-error';node.textContent='Spatial Continuum failed closed:\n'+String(error?.stack||error);root.append(node);globalThis.__OFU_SPATIAL_CONTINUUM__={status:'FAIL',error:String(error?.message||error)};throw error}
}

document.body.classList.add('ofu-continuum-active');
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>bootSpatialContinuum(),{once:true});else bootSpatialContinuum();
