import assert from 'node:assert/strict';
import { CONTINUUM_STOPS, stageForCoordinate } from '../../src/experiments/spatial-continuum/constants.js';
import {
  ORIENTATION_SCALE_UX_CSS,createOrientationScaleUX,formatDistance,formatTravelTime,
  projectOrientationScaleContext,renderOrientationScaleMarkup,scaleReferenceForStage,scaleRegimeForCoordinate
} from '../../src/experiments/spatial-continuum/orientation-scale-ux.js';

function handoff(coordinate){
  const lower=Math.floor(coordinate),upper=Math.ceil(coordinate),from=CONTINUUM_STOPS[lower],to=CONTINUUM_STOPS[upper];
  return {from,to,progress:lower===upper?1:coordinate-lower,weights:{[from.stage]:lower===upper?1:upper-coordinate,[to.stage]:lower===upper?1:coordinate-lower}};
}
function snapshot(coordinate,{historyDepth=0,focusId='focus',path=[],branchHistory=[]}={}){
  return {
    state:{
      scale:{coordinate,targetCoordinate:coordinate,semanticStage:stageForCoordinate(coordinate).stage,targetStage:stageForCoordinate(coordinate).stage,moving:coordinate%1!==0,handoff:handoff(coordinate)},
      graph:{focusId},camera:{focusId},historyDepth
    },
    openUniverse:{currentAddress:{segments:path}},branchHistory
  };
}

const canonicalPath=[
  {id:'u',kind:'UNIVERSE',label:'Universe',authority:'CANONICAL'},
  {id:'g-17',kind:'GALAXY',label:'Galaxy 17',authority:'CANONICAL_PROVEN'},
  {id:'system-a',kind:'SYSTEM',label:'System A',authority:'CANONICAL'},
  {id:'body-b',kind:'PLANET',label:'Body B',authority:'CANONICAL'},
  {id:'surface-c',kind:'LOCATION',label:'Surface C',authority:'MODEL_DERIVED'}
];
const branchHistory=[
  {kernel:{stage:'ORBIT',focusId:'body-b'}},
  {kernel:{stage:'GLOBAL_SURFACE',focusId:'body-b'}},
  {kernel:{stage:'HUMAN',focusId:'surface-c'}}
];

assert.equal(scaleRegimeForCoordinate(0).id,'COSMIC');
assert.equal(scaleRegimeForCoordinate(4).id,'COSMIC');
assert.equal(scaleRegimeForCoordinate(5).id,'PLANETARY');
assert.equal(scaleRegimeForCoordinate(9.4).id,'PLANETARY');
assert.equal(scaleRegimeForCoordinate(9.9).id,'HUMAN');
assert.equal(scaleRegimeForCoordinate(10).id,'HUMAN');
assert.equal(scaleRegimeForCoordinate(10.6).id,'MICRO');
assert.equal(scaleRegimeForCoordinate(14).id,'MICRO');
assert.match(scaleReferenceForStage('MOLECULAR').label,/nanometres/i);
assert.match(scaleReferenceForStage('ATOMIC').cue,/not a literal orbit/i);

const forward=[0,1,4,5,7,9,10,11,12,13,14],reverse=[...forward].reverse();
for(const [direction,journey] of [['forward',forward],['reverse',reverse]]){
  let previous=null;
  for(const [index,coordinate] of journey.entries()){
    const projected=projectOrientationScaleContext({
      snapshot:snapshot(coordinate,{historyDepth:index,focusId:coordinate>=11?'sample-1':'body-b',path:canonicalPath,branchHistory}),
      selection:coordinate>=11?{id:'sample-1',label:'Rock sample',kind:'ROCK',authority:'MODEL_DERIVED',explicitlySelected:true}:{id:'body-b',label:'Body B',kind:'PLANET',authority:'CANONICAL'},
      viewportWidth:1440,
      explorationActive:false
    });
    assert.equal(projected.stage.id,stageForCoordinate(coordinate).stage,`${direction} semantic stage must follow canonical scale`);
    assert.equal(projected.location.current.id,'surface-c',`${direction} must retain supplied canonical location path`);
    assert.equal(projected.selection.id,coordinate>=11?'sample-1':'body-b',`${direction} must project, not replace, canonical focus`);
    assert.equal(projected.viewport.density,'FULL');
    assert.match(projected.assistiveStatus,/regime/i);
    if(previous){
      const delta=projected.coordinate-previous.coordinate;
      assert.ok(direction==='forward'?delta>=0:delta<=0,`${direction} journey ordering must remain reversible`);
    }
    previous=projected;
  }
}

const transition=projectOrientationScaleContext({
  snapshot:snapshot(9.55,{historyDepth:2,focusId:'surface-c',path:canonicalPath,branchHistory}),
  selection:{id:'surface-c',label:'Surface C',kind:'LOCATION',authority:'MODEL_DERIVED'},
  viewportWidth:720,reducedMotion:true
});
assert.equal(transition.semanticTransition.mode,'HANDOFF');
assert.equal(transition.semanticTransition.fromStage,'LOCAL_SURFACE');
assert.equal(transition.semanticTransition.toStage,'HUMAN');
assert.equal(transition.semanticTransition.motion,'REDUCED');
assert.match(transition.semanticTransition.text,/Representation changes/i);
assert.equal(transition.viewport.density,'CONDENSED');
assert.equal(transition.reducedMotion,true);
assert.equal(transition.history.canGoBack,true);
assert.equal(transition.history.priorStage,'GLOBAL_SURFACE');

const compact=projectOrientationScaleContext({
  snapshot:snapshot(10,{historyDepth:1,focusId:'surface-c',path:canonicalPath,branchHistory}),
  selection:{id:'surface-c',label:'Surface C',authority:'MODEL_DERIVED'},viewportWidth:390,explorationActive:true
});
assert.equal(compact.viewport.density,'COMPACT');
assert.equal(compact.viewport.presentationMode,'RECEDED','pure exploration must allow orientation UI to recede');
const compactMarkup=renderOrientationScaleMarkup(compact);
assert.match(compactMarkup,/aria-label="Location and scale context"/);
assert.match(compactMarkup,/aria-expanded="false"/);
assert.match(compactMarkup,/hidden/,'panel must not become a permanent cockpit by default');
assert.match(compactMarkup,/data-orientation-action="back"/,'touch/keyboard reachable native back control is required');
assert.match(compactMarkup,/aria-live="polite"/,'selected/status projection must be exposed to assistive technology');
assert.match(compactMarkup,/data-authority="MODEL_DERIVED"/,'scientific authority needs a non-color semantic hook');
assert.match(compactMarkup,/◇<\/span> Model-derived/,'authority status must remain understandable without color');
assert.match(ORIENTATION_SCALE_UX_CSS,/min-block-size:44px/,'touch targets must have a 44px minimum block size');
assert.match(ORIENTATION_SCALE_UX_CSS,/prefers-reduced-motion:reduce/);
assert.match(ORIENTATION_SCALE_UX_CSS,/forced-colors:active/);
assert.match(ORIENTATION_SCALE_UX_CSS,/max-width|inline-size|max-inline-size/);

const distanceProjection=projectOrientationScaleContext({
  snapshot:snapshot(7,{historyDepth:1,focusId:'body-b',path:canonicalPath}),
  selection:{id:'body-b',label:'Body B',authority:'CANONICAL'},
  target:{label:'Surface target',distanceM:12500,travelSpeedMps:5,authority:'MODEL_DERIVED'},viewportWidth:1024
});
assert.equal(distanceProjection.target.distance,'12.5 km');
assert.equal(distanceProjection.target.travelTime,'41.67 min');
assert.match(distanceProjection.assistiveStatus,/12.5 km/);
assert.equal(formatDistance(2e-7),'200 nm');
assert.equal(formatDistance(1.495978707e11),'1 AU');
assert.equal(formatTravelTime(100,2),'50 s');
assert.equal(formatTravelTime(100,0),null,'travel time must fail closed when speed context is unsupported');
const unknownDistance=projectOrientationScaleContext({snapshot:snapshot(0),target:{label:'Unknown target'}});
assert.equal(unknownDistance.target,null,'distance context must be omitted rather than guessed');

const authorityProjection=projectOrientationScaleContext({snapshot:snapshot(12,{focusId:'sample'}),selection:{id:'sample',label:'Sample',authority:'PRESENTATION_ONLY'}});
const authorityMarkup=renderOrientationScaleMarkup(authorityProjection,{expanded:true});
assert.match(authorityMarkup,/△<\/span> Presentation cue/);
assert.match(authorityMarkup,/aria-current="location"|Location path unavailable/);
const hostile=projectOrientationScaleContext({snapshot:snapshot(10),selection:{id:'x',label:'<script>alert(1)<\/script>',authority:'UNKNOWN'}});
assert.doesNotMatch(renderOrientationScaleMarkup(hostile,{expanded:true}),/<script>/,'orientation markup must escape projected labels');

const a=projectOrientationScaleContext({snapshot:snapshot(13.25,{historyDepth:3,path:canonicalPath,branchHistory}),selection:{id:'sample',label:'Sample',authority:'MODEL_DERIVED'},viewportWidth:844,reducedMotion:true});
const b=projectOrientationScaleContext({snapshot:snapshot(13.25,{historyDepth:3,path:canonicalPath,branchHistory}),selection:{id:'sample',label:'Sample',authority:'MODEL_DERIVED'},viewportWidth:844,reducedMotion:true});
assert.deepEqual(a,b,'orientation projection must be deterministic for identical canonical inputs');
assert.throws(()=>projectOrientationScaleContext({snapshot:{}}),/requires a continuum snapshot/i);
assert.throws(()=>createOrientationScaleUX({container:{}}),/DOM container/i);

console.log(JSON.stringify({
  status:'PASS',suite:'R6/W0 R6-I orientation and scale-aware UX',
  journeys:{forward:forward.map(value=>stageForCoordinate(value).stage),reverse:reverse.map(value=>stageForCoordinate(value).stage)},
  accessibility:{nativeButtons:true,ariaLive:true,nonColorAuthority:true,touchTargetPx:44,reducedMotion:true,forcedColors:true,narrowViewport:true},
  semantics:{singleNavigationTruth:true,semanticZoom:true,optionalDistanceFailClosed:true,deterministic:true}
},null,2));
