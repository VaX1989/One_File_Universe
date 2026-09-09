import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
for(const rel of ['src/rendering/stellar/multi-star-illumination.js','src/rendering/planet/approach/body-cues.js','src/rendering/planet/approach/approach-continuity.js','src/rendering/planet/approach/approach-lod.js'])vm.runInThisContext(fs.readFileSync(path.join(root,rel),'utf8'),{filename:rel});
const {v2x04MultiStarIllumination:I,v2x04BodyCues:B,v2x04ApproachContinuity:A,v2x04ApproachLod:L}=globalThis.OFU;

const stars=[
 {canonicalEntityId:'star-a',position3d:[-12,2,0],luminosity:{sourceValueMilliSolar:1700}},
 {canonicalEntityId:'star-b',position3d:[9,-4,3],luminosity:{sourceValueMilliSolar:null}},
 {canonicalEntityId:'star-c',position3d:[0,18,-5],facts:{luminosityMilliSolar:400}}
];
const illumination=I.buildIllumination(stars,{bodyPosition3d:[2,0,1]});
assert.equal(I.validateIllumination(illumination),true);
assert.equal(illumination.lights.length,3);
assert.equal(illumination.authority,'PRESENTATION_ONLY');
assert.equal(illumination.scientificEvidence,false);
assert(Math.abs(illumination.lights.reduce((n,x)=>n+x.normalizedWeight,0)-1)<1e-12);
assert(illumination.lights.some(x=>x.intensityInputAuthority==='UNKNOWN_PRESENTATION_FALLBACK'));
const d=I.dominantDirection(illumination);
assert(Math.abs(Math.hypot(...d)-1)<1e-12);
const hemi=I.hemisphereContributions(illumination,d);
assert.equal(hemi.contributions.length,3);
assert(hemi.totalPresentationLight>0);
assert.equal(hemi.scientificEvidence,false);
const forgedIllumination={...illumination,lights:illumination.lights.map((x,i)=>i?x:{...x,normalizedWeight:.9})};
assert.equal(I.validateIllumination(forgedIllumination),false);
assert.throws(()=>I.dominantDirection(forgedIllumination),/valid illumination packet/);
assert.throws(()=>I.buildIllumination([{id:'bad',position3d:[1,0,0],facts:{luminosityMilliSolar:0}}]),/positive/);
assert.throws(()=>I.buildIllumination([{id:'bad-facts',position3d:[1,0,0],facts:'bad'}]),/facts must be an object/);
assert.throws(()=>I.buildIllumination([{id:'dup',position3d:[1,0,0]},{id:'dup',position3d:[2,0,0]}]),/duplicate stellar identity/);
const unicodeIds=['z',String.fromCharCode(0x00e4),'a','A'];
const equalWeightLights=I.buildIllumination([
 {id:unicodeIds[0],position3d:[1,0,0]},
 {id:unicodeIds[1],position3d:[-1,0,0]},
 {id:unicodeIds[2],position3d:[0,1,0]},
 {id:unicodeIds[3],position3d:[0,-1,0]}
]);
assert.deepEqual(equalWeightLights.lights.map(x=>x.starCanonicalEntityId),['A','a','z',String.fromCharCode(0x00e4)],'equal-weight stellar illumination ordering must be locale-independent');

const byteId=Uint8Array.from([0,1,254,255]);
const byteLight=I.buildIllumination([{id:byteId,position3d:[1,1,1]}]);
assert.equal(byteLight.lights[0].starCanonicalEntityId,'0001feff');
const maxStars=I.buildIllumination(Array.from({length:I.LIMITS.maxStars},(_,i)=>({id:'max-star-'+i,position3d:[i+1,(i%3)+1,(i%5)+1],facts:i%2?{}:{luminosityMilliSolar:1000+i*100}})));
assert.equal(maxStars.lights.length,I.LIMITS.maxStars);
assert.equal(I.validateIllumination(maxStars),true);
assert.throws(()=>I.buildIllumination(Array.from({length:I.LIMITS.maxStars+1},(_,i)=>({id:'s'+i,position3d:[i+1,0,0]}))),/budget/);

const unsupported=B.bodyCues({id:'planet-x',facts:{}},{environment:{atmosphere:{status:'UNKNOWN'}},visual:{rings:{status:'UNKNOWN',present:true}},illumination});
assert.equal(unsupported.atmosphere.enabled,false);
assert.equal(unsupported.rings.enabled,false);
assert.equal(unsupported.silhouette.radiusKnown,false);
assert.throws(()=>B.bodyCues({id:'forged-light',facts:{}},{illumination:forgedIllumination}),/valid illumination packet/);
assert.throws(()=>B.bodyCues({id:'bad-facts',facts:'bad'},{}),/facts must be an object/);
const savedIlluminationApi=globalThis.OFU.v2x04MultiStarIllumination;delete globalThis.OFU.v2x04MultiStarIllumination;
assert.throws(()=>B.bodyCues({id:'validator-missing',facts:{}},{illumination}),/illumination validator required/,'body cues must fail closed when illumination validator is unavailable');
globalThis.OFU.v2x04MultiStarIllumination=savedIlluminationApi;
const canonicalEnvironment={atmosphere:{epistemicStatus:'KNOWN',atmosphericRetainedMassTg:5100}};
const supported=B.bodyCues({id:'planet-x',facts:{meanRadiusM:6371000}},{environment:canonicalEnvironment,visual:{rings:{status:'KNOWN',present:true}},illumination});
assert.equal(supported.atmosphere.enabled,true);
assert.equal(supported.atmosphere.sourceMass.field,'atmosphericRetainedMassTg');
assert.equal(supported.atmosphere.parameterAuthority,'GENERIC_PRESENTATION_FALLBACK');
assert.equal(supported.atmosphere.rimStrength,.5);
assert.equal(supported.rings.enabled,true);
assert.equal(supported.rings.fallbackDeterministic,true);
assert.equal(supported.rings.parameterAuthority,'PARTIAL_PRESENTATION_FALLBACK');
assert.equal(supported.silhouette.sourceRadiusKm,6371);
const explicitRings=B.bodyCues({id:'planet-z',facts:{meanRadiusKm:25000}},{visual:{rings:{status:'KNOWN',present:true,innerRadiusRatio:1.6,outerRadiusRatio:2.8,tiltDeg:17}}});
assert.equal(explicitRings.rings.fallbackDeterministic,false);
assert.equal(explicitRings.rings.parameterAuthority,'SUPPORTED_INPUT_PRESENTATION_MAPPING');
assert(Math.abs(explicitRings.rings.tiltRad-17*Math.PI/180)<1e-12);
const nullRings=B.ringsPresentation({id:'null-rings'},{status:'KNOWN',present:true,innerRadiusRatio:null,outerRadiusRatio:'',tiltDeg:null});
assert.equal(nullRings.fallbackDeterministic,true);
assert.equal(nullRings.parameterAuthority,'PARTIAL_PRESENTATION_FALLBACK');
const astralRingA=B.ringsPresentation({id:String.fromCodePoint(0x1f600)},{status:'KNOWN',present:true});
const astralRingB=B.ringsPresentation({id:String.fromCodePoint(0x1f601)},{status:'KNOWN',present:true});
assert.notEqual(astralRingA.tiltRad,astralRingB.tiltRad,'ring fallback hash must distinguish astral identifiers');
assert.throws(()=>B.ringsPresentation({id:'bad-ring'},{status:'KNOWN',present:true,innerRadiusRatio:.5,outerRadiusRatio:2}),/innerRadiusRatio/);
assert.throws(()=>B.bodyCues({id:'bad-atm',facts:{}},{environment:{atmosphere:{epistemicStatus:'KNOWN',atmosphericRetainedMassTg:-1}}}),/non-negative/);
assert.equal(B.bodyCues({id:byteId,facts:{}},{}).canonicalEntityId,'0001feff');

const eclipse=B.presentationOcclusion({lightDirection3d:[1,0,0],occluderDirection3d:[1,.001,0],occluderAngularRadiusRad:.01,targetAngularRadiusRad:.002});
assert.equal(eclipse.overlap,true);
assert(eclipse.overlapFraction>0);
assert.equal(eclipse.scientificEvidence,false);
assert.throws(()=>B.presentationOcclusion({lightDirection3d:[1,0,0],occluderDirection3d:[1,0,0],occluderAngularRadiusRad:-.1,targetAngularRadiusRad:.01}),/non-negative/);
const dominant=illumination.lights[0],occluders=[{canonicalEntityId:'moon-x',direction3d:dominant.direction3d,angularRadiusRad:.02}];
const composite=B.compositeEclipse(illumination,{occluders,starAngularRadiusRad:.00465});
assert(composite.weightedOcclusion>0&&composite.weightedOcclusion<=1);
assert.notEqual(composite.classification,'NO_PRESENTATION_ECLIPSE');
assert.equal(composite.scientificEvidence,false);
assert.throws(()=>B.compositeEclipse(forgedIllumination,{occluders}),/weights must sum to 1/);
const maxOccluders=B.compositeEclipse(maxStars,{occluders:Array.from({length:B.LIMITS.maxOccluders},(_,i)=>({id:'occ-'+i,direction3d:[1,i/1000,0],angularRadiusRad:.005}))});
assert.equal(maxOccluders.resourceUsage.occluders,B.LIMITS.maxOccluders);
assert.throws(()=>B.compositeEclipse(illumination,{occluders:Array.from({length:B.LIMITS.maxOccluders+1},()=>({direction3d:[1,0,0],angularRadiusRad:.01}))}),/budget/);

const approach=A.makePacket({systemId:'sys',bodyId:'planet-x',startDistanceRatio:5000,endDistanceRatio:1.02,samples:129,approachVector3d:[1,2,3],surfaceTarget:{latDeg:4,lonDeg:9}});
const lod=L.decorate(approach,{bodyCues:supported,referenceRadiusPx:220,eclipseCue:composite});
assert.equal(L.validate(lod),true);
assert.equal(lod.frames[0].lod.level,'MARKER');
assert.equal(lod.frames.at(-1).lod.level,'DESCENT_SURFACE');
assert(lod.frames.some(f=>f.lod.showAtmosphere));
assert(lod.frames.some(f=>f.lod.showRings));
assert(lod.frames.some(f=>f.lod.showEclipseCue));
assert(lod.frames.some(f=>f.lod.blendToAdjacent>0&&f.lod.blendToAdjacent<1));
for(const frame of lod.frames){const expected=L.levelForRatio(frame.distanceRatio);assert.equal(frame.lod.levelIndex,expected);assert.equal(frame.lod.level,L.LEVELS[expected]);assert(frame.lod.geometryBudget.maxVertices<=L.LIMITS.maxVertices);assert(frame.lod.geometryBudget.maxDrawPackets<=L.LIMITS.maxDrawPackets);}
const tamperedLod={...lod,frames:lod.frames.map((f,i)=>i===20?{...f,lod:{...f.lod,adjacentLevel:'BOGUS',blendToAdjacent:.123,geometryBudget:{maxVertices:1,maxDrawPackets:1}}}:f)};
assert.equal(L.validate(tamperedLod),false);
assert.equal(L.validate({...lod,lod:{...lod.lod,levels:['BOGUS',...lod.lod.levels.slice(1)]}}),false);
assert.equal(L.validate({...lod,lod:{...lod.lod,cueSupport:{...lod.lod.cueSupport,rings:'yes'}}}),false);
assert.equal(L.validate({...lod,lod:{...lod.lod,bodyCueScientificEvidence:true}}),false,'LOD validation must reject scientific-evidence provenance escalation');
assert.throws(()=>L.decorate(approach,{bodyCues:{authority:'PRESENTATION_ONLY',scientificEvidence:true}}),/non-scientific body cues/);
assert.throws(()=>L.decorate(approach,{eclipseCue:{authority:'PRESENTATION_ONLY',scientificEvidence:false,classification:'NO_PRESENTATION_ECLIPSE',weightedOcclusion:.5}}),/requires zero occlusion/);
const tamperedBase={...approach,frames:approach.frames.map((f,i)=>i===80?{...f,stage:'BOGUS'}:f)};
assert.throws(()=>L.decorate(tamperedBase,{}),/valid approach continuity packet/);
const savedApproachApi=globalThis.OFU.v2x04ApproachContinuity;delete globalThis.OFU.v2x04ApproachContinuity;
assert.throws(()=>L.decorate(approach,{}),/approach continuity validator required/,'LOD decorate must fail closed without continuity validator');
assert.equal(L.validate(lod),false,'LOD validation must fail closed without continuity validator');
globalThis.OFU.v2x04ApproachContinuity=savedApproachApi;
assert.equal(L.validate(lod),true);
assert.throws(()=>L.transitionBlend(10,2,'UNKNOWN'),/valid approach direction/);
assert.throws(()=>L.geometryBudgetBetween(0,1,1.2),/blend/);
const reverseLod=L.decorate(A.reverse(approach),{bodyCues:supported,referenceRadiusPx:220,eclipseCue:composite});
assert.equal(L.validate(reverseLod),true);
assert.equal(reverseLod.frames[0].lod.level,'DESCENT_SURFACE');
assert.equal(reverseLod.frames.at(-1).lod.level,'MARKER');
assert(reverseLod.frames.some(f=>f.lod.transitionDirection==='COARSEN'&&f.lod.blendToAdjacent>0&&f.lod.blendToAdjacent<1));
const pairedReverse=reverseLod.frames.slice().reverse();
assert.equal(pairedReverse.length,lod.frames.length);
for(let i=0;i<lod.frames.length;i++){
 const forward=lod.frames[i].lod,backward=pairedReverse[i].lod;
 assert.equal(forward.levelIndex,backward.levelIndex,'reverse must retrace identical LOD level at equal distance');
 assert.equal(forward.adjacentLevel,backward.adjacentLevel,'reverse must retrace identical adjacent representation');
 assert(Math.abs(forward.blendToAdjacent-backward.blendToAdjacent)<1e-12,'reverse must retrace identical transition blend');
 assert.equal(forward.apparentRadiusPx,backward.apparentRadiusPx,'reverse must retrace identical apparent size');
 assert.deepEqual(forward.geometryBudget,backward.geometryBudget,'reverse must retrace identical geometry budget');
 assert.equal(forward.showAtmosphere,backward.showAtmosphere);
 assert.equal(forward.showRings,backward.showRings);
 assert.equal(forward.showTerminator,backward.showTerminator);
 assert.equal(forward.showEclipseCue,backward.showEclipseCue);
 assert.equal(forward.showSurfaceDetail,backward.showSurfaceDetail);
}
const maxApproach=A.makePacket({systemId:'s',bodyId:'p',startDistanceRatio:A.LIMITS.maxDistanceRatio,endDistanceRatio:A.LIMITS.minDistanceRatio,samples:A.LIMITS.maxSamples});
const maxLod=L.decorate(maxApproach,{referenceRadiusPx:L.LIMITS.maxApparentRadiusPx});
assert.equal(maxLod.frames.length,L.LIMITS.maxFrames);
assert.equal(L.validate(maxLod),true);
assert(Math.max(...maxLod.frames.map(f=>f.lod.geometryBudget.maxVertices))<=L.LIMITS.maxVertices);

let fuzzSeed=0x5eed1234>>>0;const fuzzRand=()=>{fuzzSeed=(Math.imul(fuzzSeed,1664525)+1013904223)>>>0;return fuzzSeed/4294967296};
for(let c=0;c<64;c++){
 const count=1+Math.floor(fuzzRand()*I.LIMITS.maxStars),randomStars=Array.from({length:count},(_,i)=>({id:`fuzz-star-${c}-${i}`,position3d:[.2+fuzzRand()*20,.2+fuzzRand()*20,.2+fuzzRand()*20],facts:fuzzRand()<.5?{}:{luminosityMilliSolar:50+fuzzRand()*5000}}));
 const packet=I.buildIllumination(randomStars,{bodyPosition3d:[0,0,0]});assert.equal(I.validateIllumination(packet),true);
 const occCount=Math.floor(fuzzRand()*8),randomOcc=Array.from({length:occCount},(_,i)=>({id:`fuzz-occ-${c}-${i}`,direction3d:[.1+fuzzRand(),fuzzRand()-.5,fuzzRand()-.5],angularRadiusRad:fuzzRand()*.03}));
 const eclipsePacket=B.compositeEclipse(packet,{occluders:randomOcc,starAngularRadiusRad:.002+fuzzRand()*.01});assert(eclipsePacket.weightedOcclusion>=0&&eclipsePacket.weightedOcclusion<=1);
 const start=1001+fuzzRand()*90000,end=1.01+fuzzRand()*.3,samples=9+Math.floor(fuzzRand()*80),base=A.makePacket({systemId:`fuzz-system-${c}`,bodyId:`fuzz-body-${c}`,startDistanceRatio:start,endDistanceRatio:end,samples,approachVector3d:[.1+fuzzRand(),fuzzRand()-.5,fuzzRand()-.5]});
 const forward=L.decorate(base,{referenceRadiusPx:50+fuzzRand()*500,eclipseCue:eclipsePacket}),back=L.decorate(A.reverse(base),{referenceRadiusPx:forward.lod.referenceRadiusPx,eclipseCue:eclipsePacket});assert.equal(L.validate(forward),true);assert.equal(L.validate(back),true);
 const reverseFrames=back.frames.slice().reverse();for(let i=0;i<forward.frames.length;i++){assert.equal(forward.frames[i].lod.levelIndex,reverseFrames[i].lod.levelIndex);assert(Math.abs(forward.frames[i].lod.blendToAdjacent-reverseFrames[i].lod.blendToAdjacent)<1e-12);assert.deepEqual(forward.frames[i].lod.geometryBudget,reverseFrames[i].lod.geometryBudget);}
}

console.log(JSON.stringify({status:'PASS',suite:'v2x04-illumination-body-lod-v4',illuminationValidation:true,validatorFailClosed:true,localeIndependentOrdering:true,astralIdentityHashDistinct:true,canonicalEnvironmentRecognized:true,nullRingParametersStayFallback:true,byteIdentityPreserved:true,compositeEclipse:composite.classification,weightedOcclusion:composite.weightedOcclusion,strongLodTamperRejection:true,provenanceEscalationRejected:true,reverseLodValidated:true,directionInvariantVisualState:true,metamorphicCases:64,maxStars:maxStars.lights.length,maxOccluders:maxOccluders.resourceUsage.occluders,maxFrames:maxLod.frames.length,scientificEvidence:false}));
