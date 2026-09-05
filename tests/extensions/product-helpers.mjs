import fs from 'node:fs';
import vm from 'node:vm';
import {loadP5Runtime,canonicalContext} from '../p5/p5-test-helpers.mjs';
export function loadProduct(){
 globalThis.OFU={};const O=loadP5Runtime();
 for(const f of ['src/rendering/planet-core.js','src/rendering/planet-webgl2.js','src/rendering/planet-surface.js','src/rendering/planet-surface-terrain.js','src/rendering/planet-surface-webgl2.js','src/extensions/contracts.js','src/extensions/registry.js','src/extensions/cross-scale.js','src/extensions/render-backend.js'])vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
 const key={galaxyX:48n,galaxyY:-50n,galaxyZ:-1n,sectorX:0n,sectorY:0n,sectorZ:0n,siteX:61n,siteY:0n,siteZ:0n,orbitSlot:0n};
 globalThis.__OFU_PLANET_PREVIEW__={ctx:canonicalContext(O.p3Astronomy),chosen:{key},snapshot:()=>({})};
 globalThis.__OFU_PX_TEST_REGIMES__=[JSON.parse(fs.readFileSync('config/extensions/regimes.json','utf8'))];
 globalThis.__OFU_PX_TEST_CATALOGS__=[JSON.parse(fs.readFileSync('config/extensions/core.json','utf8'))];
 for(const f of ['src/extensions/product-bindings.js','src/bootstrap/product/scale-runtime.js'])vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
 delete globalThis.__OFU_PX_TEST_CATALOGS__;delete globalThis.__OFU_PX_TEST_REGIMES__;
 return {O,key};
}
