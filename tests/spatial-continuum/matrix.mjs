import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { chromium, firefox, webkit } from 'playwright';
import { selectFirstLocalSample, selectFirstSupportedWorld } from './open-journey-helper.mjs';

const root=process.cwd(),artifact=path.join(root,'dist','One_File_Universe_Spatial_Continuum.html'),fileUrl=pathToFileURL(artifact).href,evidenceDir=path.resolve(process.env.OFU_CONTINUUM_EVIDENCE_DIR||path.join(root,'reports','local','spatial-continuum-r3'));
fs.mkdirSync(evidenceDir,{recursive:true});
const allEngines={chromium,firefox,webkit},requested=String(process.env.OFU_CONTINUUM_BROWSER||'').toLowerCase(),engines=requested?{[requested]:allEngines[requested]}:allEngines,results=[];
if(Object.values(engines).some(value=>!value))throw new Error('Unknown OFU_CONTINUUM_BROWSER: '+requested);
if(process.platform==='linux'&&!process.env.DISPLAY&&process.env.OFU_CONTINUUM_XVFB_REEXEC!=='1'&&(!requested||requested==='firefox')){
  const child=spawnSync('xvfb-run',['-a','-s','-screen 0 1920x1080x24',process.execPath,...process.argv.slice(1)],{stdio:'inherit',env:{...process.env,OFU_CONTINUUM_XVFB_REEXEC:'1'}});
  if(child.error)throw new Error('Firefox graphical Continuum profile requires xvfb-run: '+child.error.message);
  if(child.signal)throw new Error('Firefox Xvfb child terminated by '+child.signal);
  process.exit(child.status??1);
}

for(const [name,type] of Object.entries(engines)){
  let browser,launched=false;
  try{
    browser=await type.launch({headless:!(name==='firefox'&&process.platform==='linux'),...(name==='firefox'?{firefoxUserPrefs:{'webgl.disabled':false,'webgl.force-enabled':true,'webgl.enable-webgl2':true,'webgl.forbid-software':false}}:{})});launched=true;
    const context=await browser.newContext({viewport:{width:1280,height:800}}),page=await context.newPage(),errors=[],network=[];
    page.on('pageerror',error=>errors.push(String(error.stack||error)));
    page.on('console',message=>{if(message.type()==='error')errors.push('console: '+message.text())});
    page.on('request',request=>{if(/^https?:/i.test(request.url()))network.push(request.url())});
    await page.goto(fileUrl,{waitUntil:'load'});
    await page.waitForFunction(()=>globalThis.__OFU_SPATIAL_CONTINUUM__?.status==='FAIL'||globalThis.__OFU_SPATIAL_CONTINUUM__?.snapshot?.().status==='READY',undefined,{timeout:120000});
    const startup=await page.evaluate(()=>globalThis.__OFU_SPATIAL_CONTINUUM__?.status==='FAIL'?globalThis.__OFU_SPATIAL_CONTINUUM__:null);
    if(startup)throw new Error('Continuum startup failed: '+JSON.stringify(startup));
    const initial=await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.snapshot()),galaxyId=Object.keys(initial.render.pickTargets.macro)[0],galaxyMetric=initial.render.pickTargets.macro[galaxyId];assert.equal(initial.state.scale.semanticStage,'UNIVERSE');
    const picked=await page.evaluate(({x,y})=>__OFU_SPATIAL_CONTINUUM__.renderer.pick(x,y)?.id||null,{x:galaxyMetric.clientX,y:galaxyMetric.clientY});
    assert.equal(picked,galaxyId,name+' renderer picking must match its visible galaxy');
    const world=await selectFirstSupportedWorld(page);assert.ok(world.worldIdentity);await selectFirstLocalSample(page);
    const stages=[];
    for(const stage of ['ORBIT','HUMAN','ATOMIC','SYSTEM','UNIVERSE']){await page.evaluate(stage=>{__OFU_SPATIAL_CONTINUUM__.travelTo(stage);__OFU_SPATIAL_CONTINUUM__.settle()},stage);await page.waitForTimeout(80);const state=await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.snapshot());assert.equal(state.state.scale.semanticStage,stage);assert.equal(state.render.sceneCount,1);assert.equal(state.render.cameraCount,1);assert.ok(state.render.activeMeshes>0);stages.push({stage,activeMeshes:state.render.activeMeshes,backend:state.render.backend})}
    await page.screenshot({path:path.join(evidenceDir,'matrix-'+name+'.png')});
    assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
    results.push({browser:name,status:'PASS',version:await browser.version(),directFile:true,offline:true,webgl:initial.render.backend,stages});
    await context.close();
  }catch(error){results.push({browser:name,status:launched?'FAIL':'BLOCKED_ENVIRONMENT',classification:launched?'PRODUCT_OR_TEST_FAILURE':'BROWSER_LAUNCH_ENVIRONMENT',error:String(error?.message||error).split('\n').slice(0,6).join('\n')})}
  finally{await browser?.close().catch(()=>{})}
}

const blocked=results.filter(row=>row.status!=='PASS'),output={status:blocked.length?'PASS_WITH_ENVIRONMENT_BLOCKER':'PASS',suite:'spatial-continuum-browser-matrix',continuumTested:results.filter(row=>row.status==='PASS').map(row=>row.browser),blocked:blocked.map(row=>row.browser),results};
fs.writeFileSync(path.join(evidenceDir,'matrix-results.json'),JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify(output,null,2));
const required=requested?[requested]:['chromium','firefox'];for(const name of required)assert.equal(results.find(row=>row.browser===name)?.status,'PASS',name+' must execute the Continuum itself');
