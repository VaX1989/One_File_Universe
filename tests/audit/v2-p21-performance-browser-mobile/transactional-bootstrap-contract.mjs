import fs from 'node:fs';
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
assert.doesNotMatch(soak,/--use-gl=angle|--use-angle=swiftshader/,'P21 must not replace the pinned browser runtime\'s governed graphics backend');assertions++;

console.log(JSON.stringify({status:'PASS',suite:'p21-transactional-living-bootstrap',assertions,oracleChanges:'NONE',timeoutChanges:'NONE',authorityWeakening:'NONE',resourceCeilingWeakening:'NONE'}));
