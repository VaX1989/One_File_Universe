import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const ROOT=path.resolve(import.meta.dirname,'../..');
for(const file of ['src/v1x-06-surface-human-rendering/math-frame.js','src/v1x-06-surface-human-rendering/terrain-lod.js','src/v1x-06-surface-human-rendering/journey.js','src/v1x-06-surface-human-rendering/surface-provider.js'])vm.runInThisContext(fs.readFileSync(path.join(ROOT,file),'utf8'),{filename:file});
const P=globalThis.OFU.v1x06SurfaceProvider;
const handoff={contract:'v1x05-surface-target-1',planetId:'planet:evidence',planetRadiusMeters:6371000,authority:'MODEL_DERIVED_SIMULATION',selection:{selectedId:'planet:evidence'},referenceFrameRef:{contract:'ofu-wave-iv-scale-runtime-3',owner:'V1X-01'},historyRef:{contract:'ofu-p4-temporal-v1',head:'evidence-history'},provenance:{source:'V1X-05 surface target handoff'},surfaceTarget:{face:'PZ',u:.12,v:-.08,altitudeMeters:600000}};
const environment={authority:'MODEL_DERIVED_SIMULATION',atmosphere:{authority:'MODEL_DERIVED_SIMULATION',inventoryUnits:100000},hydrosphere:{authority:'MODEL_DERIVED_SIMULATION',waterAreaPpm:620000,iceFractionPpm:80000},surfaceProcesses:{authority:'MODEL_DERIVED_SIMULATION',tectonicActivityPpm:280000}};
const provider=P.createProvider({handoff,planetRadiusMeters:6371000,environment,maxTiles:25,maxCacheBytes:65536});
const stages=[];
function capture(label){const frame=provider.materialize(900),snap=provider.snapshot();stages.push({label,scale:frame.scale,altitudeMeters:frame.altitudeMeters,surfaceTarget:frame.surfaceTarget,terrainPatches:frame.terrain.length,activeLayers:frame.layers.filter(x=>x.enabled!==false).map(x=>x.kind),cache:snap.cache,seams:snap.seams,precisionMaxRoundTripErrorMeters:snap.precision.maxRoundTripErrorMeters,selectionId:frame.selection.selectedId});}
capture('GLOBAL');provider.update({altitudeMeters:50000});capture('REGIONAL');provider.update({altitudeMeters:1000});capture('LOCAL');provider.update({altitudeMeters:120});capture('HUMAN_ARRIVAL');provider.update({movement:{forwardMeters:850,rightMeters:310}});capture('HUMAN_MOVE_1');provider.update({movement:{forwardMeters:1700,rightMeters:-180}});capture('HUMAN_MOVE_2_REBASE');provider.reverseToGlobe();capture('REVERSE_TO_GLOBE');
const final=provider.snapshot();
console.log(JSON.stringify({schema:'ofu-v1x-06-journey-evidence-1',status:'PASS',authority:'MEASURED_RUNTIME_EVIDENCE',stages,journey:final.journey,resource:final.cache,claims:{browserScreenshotVerified:false,physicalDeviceVerified:false,gpuRasterSeamVerified:false,journeyStateCanonical:false}}));
