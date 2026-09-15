import fs from 'node:fs';
import path from 'node:path';
import { transformPhase2Renderer } from './phase2-renderer-transform.mjs';
import { transformPhase2Experience } from './phase2-experience-transform.mjs';

const root=process.cwd();
const p=relative=>path.join(root,relative);
const read=relative=>fs.readFileSync(p(relative),'utf8');
const write=(relative,content)=>fs.writeFileSync(p(relative),content,'utf8');
const replaceOnce=(source,oldValue,newValue,label)=>{
  const count=source.split(oldValue).length-1;
  if(count!==1)throw new Error(`${label}: expected one anchor, found ${count}`);
  return source.replace(oldValue,newValue);
};

let renderer=transformPhase2Renderer(read('src/experiments/spatial-continuum/renderer.js'));
renderer=replaceOnce(renderer,"export function createContinuumRenderer(canvas,world,{onContextChange=()=>{}}={}){","export function createContinuumRenderer(canvas,world,{onContextChange=()=>{},macroRenderingOwnedExternally=false,lowerScaleRenderingOwnedExternally=false}={}){",'renderer ownership signature');
renderer=replaceOnce(renderer,"const macro=createMacroLayer(scene,world.openUniverse),materializationTimings=[];","const macro=macroRenderingOwnedExternally?null:createMacroLayer(scene,world.openUniverse),materializationTimings=[];",'macro construction ownership');
renderer=replaceOnce(renderer,"if(name==='molecular'&&!molecular){molecular=materialize('molecular',()=>createMolecularLayer(scene,activeWorld));lazyMaterializations.molecular++}","if(name==='molecular'&&!lowerScaleRenderingOwnedExternally&&!molecular){molecular=materialize('molecular',()=>createMolecularLayer(scene,activeWorld));lazyMaterializations.molecular++}",'molecular construction ownership');
renderer=replaceOnce(renderer,"if(name==='atomic'&&!atomic){atomic=materialize('atomic',()=>createAtomicLayer(scene,activeWorld));lazyMaterializations.atomic++}","if(name==='atomic'&&!lowerScaleRenderingOwnedExternally&&!atomic){atomic=materialize('atomic',()=>createAtomicLayer(scene,activeWorld));lazyMaterializations.atomic++}",'atomic construction ownership');
renderer=replaceOnce(renderer,"const macroStarted=performance.now();macro.rebuild(snapshot.scale.semanticStage);setLayer(macro,universeWeight+galaxyWeight+regionWeight+neighborhoodWeight+systemStageWeight);const macroMs=performance.now()-macroStarted;","let macroMs=0;if(macro){const macroStarted=performance.now();macro.rebuild(snapshot.scale.semanticStage);setLayer(macro,universeWeight+galaxyWeight+regionWeight+neighborhoodWeight+systemStageWeight);macroMs=performance.now()-macroStarted}",'macro update ownership');
renderer=replaceOnce(renderer,"macro:Object.freeze({signature:macro.signature,selectable:macro.selectableMeshes.length})","macro:Object.freeze({signature:macro?.signature||null,selectable:macro?.selectableMeshes.length||0,owner:macroRenderingOwnedExternally?'EXTERNAL':'BASE'})",'macro snapshot ownership');
renderer=replaceOnce(renderer,"macro:Object.freeze(Object.fromEntries(macro.selectableMeshes.map(mesh=>[mesh.metadata.canonicalId,targetMetrics(mesh)])))","macro:Object.freeze(Object.fromEntries((macro?.selectableMeshes||[]).map(mesh=>[mesh.metadata.canonicalId,targetMetrics(mesh)])))",'macro pick ownership');
renderer=replaceOnce(renderer,"rendererOwnedPicking:true,sceneTransformsFromReferenceFrames:true","rendererOwnership:Object.freeze({macro:macroRenderingOwnedExternally?'EXTERNAL':'BASE',lowerScale:lowerScaleRenderingOwnedExternally?'EXTERNAL':'BASE'}),rendererOwnedPicking:true,sceneTransformsFromReferenceFrames:true",'renderer ownership evidence');
renderer=replaceOnce(renderer,"macro.root.dispose(false,true);for(const materialItem of macro.materials)materialItem.dispose(true,true);","if(macro){macro.root.dispose(false,true);for(const materialItem of macro.materials)materialItem.dispose(true,true);}",'macro disposal ownership');
write('src/experiments/spatial-continuum/renderer.js',renderer);

let experience=transformPhase2Experience(read('src/experiments/spatial-continuum/experience.js'));
experience=replaceOnce(experience,"import { createContinuumRenderer } from './renderer.js';","import { createContinuumRenderer } from './renderer-phase2.js';",'direct phase2 renderer import');
write('src/experiments/spatial-continuum/experience.js',experience);

let facade=read('src/experiments/spatial-continuum/renderer-phase2.js');
facade=replaceOnce(facade,"export const createMacroSuppressedOpenUniverse=openUniverse=>{if(!openUniverse||typeof openUniverse!=='object')throw new TypeError('An open-universe authority is required');const descriptors=Object.getOwnPropertyDescriptors(openUniverse);descriptors.catalogueFor={value:()=>Object.freeze([]),enumerable:true,writable:false,configurable:false};return Object.freeze(Object.defineProperties({},descriptors))};\nconst suppressWorld=world=>({...world,openUniverse:createMacroSuppressedOpenUniverse(world.openUniverse)});\n\n",'', 'remove macro suppression proxy');
facade=replaceOnce(facade,"const base=createBaseContinuumRenderer(canvas,suppressWorld(world),options),macro=createProgressiveMacroRenderer","const base=createBaseContinuumRenderer(canvas,world,{...options,macroRenderingOwnedExternally:true,lowerScaleRenderingOwnedExternally:true}),macro=createProgressiveMacroRenderer",'explicit base ownership');
facade=replaceOnce(facade,"baseMacroSuppressed:true,continuationFrames:macroFrameSamples","baseMacroSuppressed:false,baseMacroOwner:'EXTERNAL',baseLowerScaleOwner:'EXTERNAL',continuationFrames:macroFrameSamples",'ownership snapshot');
facade=replaceOnce(facade,"const result=base.rebind(suppressWorld(nextWorld));","const result=base.rebind(nextWorld);",'direct rebind');
write('src/experiments/spatial-continuum/renderer-phase2.js',facade);

let build=read('tools/build-spatial-continuum.mjs');
build=replaceOnce(build,"import { transformPhase2Renderer } from './spatial-continuum/phase2-renderer-transform.mjs';\nimport { transformPhase2Experience } from './spatial-continuum/phase2-experience-transform.mjs';\n",'', 'remove build transform imports');
build=replaceOnce(build,"const continuumDir=path.join(root,'src','experiments','spatial-continuum');\nconst phase2ProductIntegration={name:'r6-w0-phase2-product-integration',setup(context){context.onResolve({filter:/^\\.\\/renderer\\.js$/},args=>path.basename(args.importer)==='experience.js'?{path:path.join(continuumDir,'renderer-phase2.js')}:null);context.onLoad({filter:/renderer\\.js$/},args=>path.resolve(args.path)===path.join(continuumDir,'renderer.js')?{contents:transformPhase2Renderer(fs.readFileSync(args.path,'utf8')),loader:'js'}:null);context.onLoad({filter:/experience\\.js$/},args=>path.resolve(args.path)===path.join(continuumDir,'experience.js')?{contents:transformPhase2Experience(fs.readFileSync(args.path,'utf8')),loader:'js'}:null)}};","const continuumDir=path.join(root,'src','experiments','spatial-continuum');",'remove semantic esbuild plugin');
build=replaceOnce(build,"charset:'utf8',plugins:[phase2ProductIntegration]","charset:'utf8'",'direct bundle');
build=replaceOnce(build,"phase2NavigationAuthorityAdded:false}","phase2NavigationAuthorityAdded:false,semanticBuildTransforms:false,sourceTruth:'DIRECT_CHECKED_IN',macroRendererOwner:'PHASE2_PROGRESSIVE',lowerScaleRendererOwner:'PHASE2_EPISTEMIC'}",'build architecture evidence');
write('tools/build-spatial-continuum.mjs',build);

let workflow=read('.github/workflows/spatial-continuum-experiment.yml');
workflow=workflow.replace('permissions: {contents: write}','permissions: {contents: read}').replaceAll('persist-credentials: true','persist-credentials: false');
const materializeBlock="      - name: Materialize certified Phase-2 runtime source for one-time hardening migration\n        run: node tools/spatial-continuum/materialize-phase2-source.mjs\n      - name: Upload materialized Phase-2 source\n        uses: actions/upload-artifact@b7c566a772e6b6bfb58ed0dc250532a479d7789f\n        with: {name: 'spatial-continuum-phase2-source-${{ env.OFU_SOURCE_SHA }}', path: reports/ci/phase2-materialized-source, if-no-files-found: error}\n";
workflow=replaceOnce(workflow,materializeBlock,'','remove materializer workflow');
const begin='      # BEGIN R6_W0_ONE_SHOT_SOURCE_PROMOTION\n',end='      # END R6_W0_ONE_SHOT_SOURCE_PROMOTION\n';
const start=workflow.indexOf(begin),finish=workflow.indexOf(end);
if(start<0||finish<start)throw new Error('one-shot workflow markers missing');
workflow=workflow.slice(0,start)+workflow.slice(finish+end.length);
write('.github/workflows/spatial-continuum-experiment.yml',workflow);

for(const relative of ['tools/spatial-continuum/materialize-phase2-source.mjs','tools/spatial-continuum/promote-phase2-source.mjs'])if(fs.existsSync(p(relative)))fs.rmSync(p(relative));

const assertions=[
  [experience.includes("from './renderer-phase2.js'"),'experience direct renderer'],
  [experience.includes('createOrientationScaleUX'),'orientation source integration'],
  [renderer.includes('cameraForwardBodyFixedUnit'),'surface camera forward source'],
  [renderer.includes('previousPatchIds:lastPlanetaryLod'),'surface hysteresis source'],
  [renderer.includes('semanticSurfaceKey:activeWorld.surfaceId'),'semantic surface source'],
  [facade.includes('macroRenderingOwnedExternally:true'),'macro ownership source'],
  [facade.includes('lowerScaleRenderingOwnedExternally:true'),'lower-scale ownership source'],
  [!facade.includes('createMacroSuppressedOpenUniverse'),'suppression proxy removed'],
  [!build.includes('transformPhase2'),'build transforms removed'],
  [!build.includes('phase2ProductIntegration'),'semantic build plugin removed']
];
for(const [ok,label] of assertions)if(!ok)throw new Error(`promotion invariant failed: ${label}`);
console.log(JSON.stringify({status:'PASS',sourceTruth:'DIRECT_CHECKED_IN',macroOwner:'PHASE2_PROGRESSIVE',lowerScaleOwner:'PHASE2_EPISTEMIC',semanticBuildTransforms:false},null,2));
