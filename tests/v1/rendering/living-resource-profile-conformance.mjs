import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const sandbox={
  console,
  devicePixelRatio:2,
  innerWidth:1280,
  innerHeight:800,
  matchMedia:()=>({matches:false}),
  OFU:{v1PresentationCore:{},v1WorldContext:{},v1WorldPresentation:{}}
};
sandbox.globalThis=sandbox;
for(const file of ['src/rendering/v1/lod-budget.js','src/rendering/v1/living-renderer.js']){
  vm.runInNewContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
}

const B=sandbox.OFU.v1RenderBudget;
const R=sandbox.OFU.v1LivingRenderer;

const portrait=R.resourceProfile({dpr:3,viewportWidth:390,viewportHeight:844,coarse:true});
assert.deepEqual(JSON.parse(JSON.stringify(portrait)),{
  mobile:true,dpr:2,memoryClass:'NORMAL',authority:'RUNTIME_ACCOUNTING',driverMemoryMeasured:false
});
const compactLandscape=R.resourceProfile({dpr:1.5,viewportWidth:844,viewportHeight:390,coarse:true});
assert.equal(compactLandscape.mobile,true,'coarse short landscape remains in mobile resource class');
assert.equal(compactLandscape.dpr,1.5);
const desktop=R.resourceProfile({dpr:3,viewportWidth:1280,viewportHeight:800,coarse:false});
assert.equal(desktop.mobile,false);
assert.equal(desktop.dpr,2);
assert.equal(desktop.driverMemoryMeasured,false);

const desktopTerrain=B.config(desktop).TERRAIN;
const mobileTerrain=B.config(portrait).TERRAIN;
const full=R.terrainGridShape(desktopTerrain.objects,16,12);
assert.deepEqual(JSON.parse(JSON.stringify(full)),{cols:16,rows:12,cells:192,sourceCells:192,lodReduced:false});
const compact=R.terrainGridShape(mobileTerrain.objects,16,12);
assert.equal(compact.sourceCells,192);
assert.equal(compact.lodReduced,true);
assert.ok(compact.cells<=mobileTerrain.objects,'mobile Living terrain draw grid must fit the active admission ceiling');
assert.ok(compact.cols<=16&&compact.rows<=12&&compact.cols>0&&compact.rows>0);
assert.ok(compact.cells>=100,'mobile LOD must retain a useful spatial field rather than collapse the surface');
assert.deepEqual(JSON.parse(JSON.stringify(R.terrainGridShape(mobileTerrain.objects,16,12))),JSON.parse(JSON.stringify(compact)),'terrain LOD must be deterministic');

const source=fs.readFileSync('src/rendering/v1/living-renderer.js','utf8');
assert.doesNotMatch(source,/create\(\{mobile:false,dpr:1\}\)/,'shipping Living renderer must not freeze the resource class to desktop');
assert.match(source,/budget\.request\('TERRAIN','visible',cost,4\)/,'terrain admission must execute before presentation draw');
assert.doesNotMatch(source,/metrics\.drawnObjects=.*budget\.request\('TERRAIN'/,'post-draw terrain admission regression returned');
assert.match(source,/presentationLod:Object\.freeze\(\{authority:'PRESENTATION_ONLY'/,'terrain LOD must remain presentation-only');

console.log(JSON.stringify({
  status:'PASS',
  suite:'v1-living-resource-profile',
  portrait,
  compactLandscape,
  desktop,
  desktopTerrainObjects:desktopTerrain.objects,
  mobileTerrainObjects:mobileTerrain.objects,
  mobileGrid:compact,
  authority:'PRESENTATION_ONLY',
  driverMemoryMeasured:false
}));
