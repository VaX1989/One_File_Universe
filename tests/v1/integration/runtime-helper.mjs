import fs from 'node:fs';
import vm from 'node:vm';
import {loadComponents} from '../../../tools/extensions/components.mjs';
import {loadP5Runtime,canonicalContext} from '../../p5/p5-test-helpers.mjs';
export const DEFAULT_KEY=Object.freeze({galaxyX:48n,galaxyY:-50n,galaxyZ:-1n,sectorX:0n,sectorY:0n,sectorZ:0n,siteX:61n,siteY:0n,siteZ:0n,orbitSlot:0n});
export function load(){
 globalThis.OFU={};const O=loadP5Runtime(),ctx=canonicalContext(O.p3Astronomy);
 const read=f=>vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
 for(const f of ['src/rendering/planet-core.js','src/rendering/planet-webgl2.js','src/rendering/planet-surface.js','src/rendering/planet-surface-terrain.js','src/rendering/planet-surface-webgl2.js'])read(f);
 globalThis.__OFU_PLANET_PREVIEW__={ctx,chosen:{key:DEFAULT_KEY},snapshot:()=>({})};
 const plan=loadComponents(),byId=new Map(plan.map(c=>[c.id,c])),ids=new Set();
 function include(id){if(ids.has(id))return;const c=byId.get(id);if(!c)throw new Error('Unregistered test dependency '+id);ids.add(id);c.dependencies.forEach(include);}
 include('v1.exploration.living-runtime');include('v1.rendering.world-presentation');include('v1.rendering.lod-budget');
 globalThis.__OFU_PX_TEST_CATALOGS__=plan.filter(c=>c.id.startsWith('px.providers.')).map(c=>JSON.parse(c.content));
 globalThis.__OFU_PX_TEST_REGIMES__=plan.filter(c=>c.id.startsWith('px.regimes.')).map(c=>JSON.parse(c.content));
 for(const c of plan)if(ids.has(c.id)&&c.kind==='code')read(c.source);
 // Headless scene activation adapters: raster/GPU correctness is tested in real browsers.
 for(const [id,scales] of [['wave-iv-macro',['galaxy','galactic_region','stellar_neighborhood','system']],['planet-webgl',['orbit','approach','global_surface']],['surface-webgl',['regional_surface','local_surface','human']]])O.waveIVScaleRuntime.registerSceneProvider({id,scales,setActive(){}});
 O.pxProduct.seal();delete globalThis.__OFU_PX_TEST_CATALOGS__;delete globalThis.__OFU_PX_TEST_REGIMES__;
 const runtime=O.v1LivingRuntime.create({ctx,key:DEFAULT_KEY});
 return {O,ctx,plan,runtime};
}
