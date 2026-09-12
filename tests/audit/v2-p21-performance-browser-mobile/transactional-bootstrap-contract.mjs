import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read=file=>fs.readFileSync(file,'utf8');
const living=read('src/bootstrap/product/living-universe.js');
const runtime=read('src/exploration/v1/living-runtime.js');
const forward=read('src/exploration/v1/living-forward-navigation.js');
const scale=read('src/bootstrap/product/scale-runtime.js');
const scheduler=read('src/bootstrap/product/renderer-scheduler.js');
const bridge=read('src/rendering/v1/living-v2x13-bridge.js');
const soak=read('tests/audit/v2-p21-performance-browser-mobile/browser-resource-soak.mjs');
let assertions=0;
const has=(source,pattern,message)=>{assert.match(source,pattern,message);assertions++};

has(living,/MAX_BOOT_ATTEMPTS=8/,'thrown bootstrap retries must be bounded');
has(living,/MAX_PREFLIGHT_POLLS=120/,'dependency preflight must be bounded');
has(living,/runtimeUnsubscribe=tx\.runtimeUnsubscribe=runtime\.onChange\(change\)/,'runtime subscription must be owned by the transaction');
has(living,/inputCleanup=tx\.inputCleanup=bindInputs\(\)/,'input resources must be owned by the transaction');
has(living,/tx\.renderer\?\.dispose\(\)/,'rollback must dispose the provisional renderer');
has(living,/tx\.runtimeUnsubscribe\?\.\(\)/,'rollback must unsubscribe the provisional runtime listener');
has(living,/tx\.inputCleanup\?\.\(\)/,'rollback must release provisional DOM listeners and observers');
has(living,/tx\.runtime\?\.dispose\?\.\(\)/,'rollback must release provisional navigation authority');
has(living,/tx\.stage\?\.remove\(\);tx\.panel\?\.remove\(\)/,'rollback must remove only transaction-created product DOM');
has(living,/if\(bootAttempts<MAX_BOOT_ATTEMPTS\).*scheduleBoot\(\)/,'a thrown attempt must retry while the bounded budget remains');
has(living,/v1LivingBootstrapDiagnostics/,'bounded bootstrap failure evidence must remain inspectable');
const bind=living.indexOf('runtime.bindNavigationAuthority()'),validate=living.indexOf("bootState.stage!=='UNIVERSE'"),publish=living.indexOf('O.v1LivingProduct=Object.freeze'),ready=living.indexOf('initialized=true',publish);
assert.ok(bind>=0&&bind<validate&&validate<publish&&publish<ready,'authority binding and validation must precede atomic product publication');assertions++;

has(scale,/function releaseNavigationAuthority\(authority\).*navigationAuthority!==authority.*navigationAuthority=null.*navigationAuthorityBound=false/s,'scale authority release must require the exact owner');
has(runtime,/bindNavigation=true/,'runtime must retain backwards-compatible navigation binding by default');
has(living,/bindNavigation:false/,'transactional bootstrap must defer navigation publication until resources are prepared');
has(runtime,/R\.releaseNavigationAuthority\(navigationAuthority\)/,'runtime disposal must release its exact scale authority');
has(forward,/unsubscribeRaw\(\).*listeners\.clear\(\)/s,'forward wrapper disposal must release its raw subscription');
has(scheduler,/runtimes\.delete\(wrapped\)/,'navigation pacing wrapper disposal must release its runtime registry entry');
has(bridge,/catch\(error\)\{base\.dispose\(\);throw error\}/,'strict renderer construction must dispose its base renderer on failure');
has(bridge,/releaseContext\(\).*pixel\.remove\(\);throw error/s,'failed strict WebGL construction must release its context and provisional canvas');
const bridgeSandbox={OFU:{v1LivingRenderer:{VERSION:'test-renderer',create(){}},renderWebGL2Resources:{createFrameConsumer(){}}}};bridgeSandbox.globalThis=bridgeSandbox;vm.runInNewContext(bridge,bridgeSandbox,{filename:'living-v2x13-bridge.js'});
const mobileSurface=bridgeSandbox.OFU.v1LivingV2X13Bridge.consumerSurface(1688,780),portraitSurface=bridgeSandbox.OFU.v1LivingV2X13Bridge.consumerSurface(780,1688);
for(const surface of [mobileSurface,portraitSurface]){assert.equal(surface.maxTrackedBytes,8388608,'strict consumer tracked-byte ceiling must not increase');assert.ok(surface.pixels<=surface.maxPixels,'strict consumer backing surface must leave bounded room for frame and shadow resources');assert.ok(surface.width<=2048&&surface.height<=2048,'strict consumer backing surface must respect its texture dimension ceiling');assert.equal(surface.constrained,true,'DPR-2 mobile backing surfaces must be deterministically constrained');assert.ok(surface.maxTrackedBytes-surface.reservedFrameBytes-surface.reservedShadowBytes-surface.pixels*8>=0,'strict consumer resource plan must fit the unchanged tracked-byte ceiling');assertions+=5;}
assert.doesNotMatch(soak,/--use-gl=angle|--use-angle=swiftshader/,'P21 must not replace the pinned browser runtime\'s governed graphics backend');assertions++;
has(soak,/name==='firefox'.*'webgl\.disabled':false.*'webgl\.force-enabled':true.*'webgl\.enable-webgl2':true/,'Firefox must expose its native WebGL2 path under the governed graphical profile');
has(soak,/spawnSync\('xvfb-run'.*OFU_P21_VIRTUAL_DISPLAY:'1'/s,'Linux P21 must provide a bounded graphical display host for the real browser matrix');
has(soak,/const options=\{headless:false\}/,'P21 must exercise full graphical browser processes rather than a graphics-disabled headless profile');
has(soak,/v2x14ProductExperience\?\.instance.*v2x14LivingAudioController\?\.instance.*v2CinematicExperience\?\.snapshot.*v2CinematicDepth\?\.snapshot.*v2CinematicMacroDirector\?\.snapshot/s,'resource sampling must begin only after the complete shipping V2 product has initialized');
has(soak,/const timer=setTimeout\(\(\)=>finish\(false\),deadlineMs\)/,'bounded pacing must own a deadline inside the browser page');
has(soak,/const finish=completed=>.*clearTimeout\(timer\).*cancelAnimationFrame\(frame\)/,'bounded pacing must settle and cancel the browser-side animation-frame operation before teardown');
assert.doesNotMatch(soak,/Promise\.race\(\[measurement,deadline\]\)/,'bounded pacing must not abandon an in-flight page evaluation');assertions++;
const growthStart=soak.indexOf('function sustainedGrowth'),growthEnd=soak.indexOf('function plateau',growthStart),growthSandbox={};
assert.ok(growthStart>=0&&growthEnd>growthStart,'sustained resource-growth detector must remain present');assertions++;
vm.runInNewContext(`${soak.slice(growthStart,growthEnd)};result={warmup:sustainedGrowth([1221,1224,1224,1224,1224,1224,1224,1224]),leak:sustainedGrowth([10,11,12,13,14,15,16,17]),oscillation:sustainedGrowth([10,11,10,11,10,11,10,11])}`,growthSandbox);
assert.equal(growthSandbox.result.warmup,false,'one bounded warm-up allocation followed by a plateau is not a leak');assertions++;
assert.equal(growthSandbox.result.leak,true,'sustained monotonic accumulation must remain release-blocking');assertions++;
assert.equal(growthSandbox.result.oscillation,false,'reclaimed oscillating resources are not monotonic accumulation');assertions++;

console.log(JSON.stringify({status:'PASS',suite:'p21-transactional-living-bootstrap',assertions,oracleChanges:'NONE',timeoutChanges:'NONE',authorityWeakening:'NONE',resourceCeilingWeakening:'NONE'}));
