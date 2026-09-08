import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium,firefox,webkit} from 'playwright';

const engine=process.env.BROWSER||'chromium';
const launcher={chromium,firefox,webkit}[engine];
assert(launcher,`unsupported BROWSER ${engine}`);
const evidenceRoot=path.resolve(process.env.EVIDENCE_DIR||'dist/evidence/founder-visual-quality');
const subjects=[
  {id:'v1',sha:process.env.V1_SHA,artifact:path.resolve(process.env.V1_ARTIFACT||'audit-input/v1.html')},
  {id:'v2',sha:process.env.V2_SHA,artifact:path.resolve(process.env.V2_ARTIFACT||'audit-input/v2.html')}
];
for(const s of subjects){assert.match(s.sha||'',/^[0-9a-f]{40}$/,`${s.id} SHA required`);assert(fs.existsSync(s.artifact),`${s.id} artifact missing`)}
fs.mkdirSync(evidenceRoot,{recursive:true});
const sha256=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const DOMAINS=['Universe','Galaxy','Region','Neighborhood','System','Planet','Surface','Human','Life','Civilization','Matter','Molecular','Atomic'];
const SCALE_STAGE={Universe:'UNIVERSE',Galaxy:'GALAXY',Region:'REGION',Neighborhood:'NEIGHBORHOOD',System:'SYSTEM',Planet:'ORBIT',Surface:'GLOBAL_SURFACE',Human:'HUMAN'};
const safeName=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-');

async function runSubject(subject){
  const outDir=path.join(evidenceRoot,subject.id,engine);fs.mkdirSync(outDir,{recursive:true});
  const browser=await launcher.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:960},deviceScaleFactor:1});
  const page=await context.newPage();
  const errors=[],requests=[];
  page.on('pageerror',e=>errors.push(String(e.message||e)));
  page.on('request',r=>{const u=r.url();if(!u.startsWith('file:')&&!u.startsWith('blob:')&&!u.startsWith('data:'))requests.push(u)});
  await page.goto(pathToFileURL(subject.artifact).href,{waitUntil:'load'});
  await page.waitForFunction(()=>globalThis.OFU?.v1LivingProduct?.snapshot?.().initialized&&globalThis.OFU?.productUI,{timeout:45000});
  const records=[];
  const openExplore=async()=>{await page.evaluate(()=>OFU.productUI.workspace('explore',{focus:false,announceChange:false}));await page.waitForFunction(()=>!document.querySelector('[data-workspace-panel="explore"]').hidden)};
  const state=async()=>page.evaluate(()=>{const living=OFU.v1LivingProduct.runtime.snapshot(),product=OFU.v1LivingProduct.snapshot(),scale=OFU.waveIVScaleRuntime.snapshot(),stage=document.getElementById('living-stage'),view=document.getElementById('living-view'),rect=view?.getBoundingClientRect();return{stage:living.stage,semanticScale:living.semanticScale,scale:scale.semanticScale,selectedCanonicalTarget:scale.selectedCanonicalTarget?.planetId||null,sceneProvider:scale.activeSceneProvider||null,navigationCoherent:living.navigationCoherent,revision:living.revision,render:product.render?{sceneScale:product.render.sceneScale,readyRevision:product.render.readyRevision,frames:product.render.metrics?.frames||0,drawnObjects:product.render.metrics?.drawnObjects||0,pickCount:product.render.pickCount||0}:null,rows:(living.rows||[]).map(x=>({kind:x.kind,entityId:x.entityId})),micro:living.micro?{regime:living.micro.regime,sourceEntityId:living.micro.sourceEntityId,lastWitness:living.micro.lastWitness}:null,visibleActions:[...document.querySelectorAll('#living-panel [data-living-action]:not([hidden])')].filter(x=>getComputedStyle(x).display!=='none').map(x=>x.dataset.livingAction),visibleScales:[...document.querySelectorAll('[data-living-scale]')].filter(x=>{const r=x.getBoundingClientRect();return r.width>0&&r.height>0&&!x.hidden}).map(x=>x.dataset.livingScale),viewport:rect?{x:rect.x,y:rect.y,width:rect.width,height:rect.height}:null,stageDataset:stage?.dataset?.stage||null,textChars:(document.body.innerText||'').length}});
  const capture=async(domain,direction,note=null)=>{await page.waitForTimeout(120);const s=await state();const name=`${String(records.length+1).padStart(2,'0')}-${direction}-${safeName(domain)}.png`;await page.screenshot({path:path.join(outDir,name),fullPage:true});records.push({domain,direction,note,screenshot:name,...s});return s};
  const clickScale=async stage=>{await openExplore();const x=page.locator(`[data-living-scale="${stage}"]:visible`).first();if(await x.count()){await x.click();await page.waitForFunction(t=>OFU.v1LivingProduct.runtime.snapshot().stage===t,stage,{timeout:30000});return true}return false};
  const clickAction=async id=>{await openExplore();const x=page.locator(`#living-panel [data-living-action="${id}"]:visible`).first();if(await x.count()){await x.click();return true}return false};
  const firstEntity=async predicate=>{const id=await page.evaluate(code=>{const rows=OFU.v1LivingProduct.runtime.snapshot().rows||[];const fn=code==='settlement'?x=>['SETTLEMENT','RUIN'].includes(x.kind):x=>!['SETTLEMENT','RUIN'].includes(x.kind);return rows.find(fn)?.entityId||null},predicate);if(!id)return null;const x=page.locator(`#living-panel [data-living-entity="${id}"]:visible`).first();if(!(await x.count()))return null;await x.click();return id};
  const ensureScale=async(domain)=>{const target=SCALE_STAGE[domain];if(await clickScale(target))return {reached:true,method:'scale-click'};if(domain==='Neighborhood'){
      if((await state()).stage!=='REGION')await clickScale('REGION');const view=page.locator('#living-view:visible');if(await view.count()){await view.hover();await page.mouse.wheel(0,-120);try{await page.waitForFunction(()=>OFU.v1LivingProduct.runtime.snapshot().stage==='NEIGHBORHOOD',null,{timeout:10000});return {reached:true,method:'wheel'}}catch{}}
    }
    return {reached:false,method:'unavailable'};
  };
  const markUnreached=async(domain,direction,reason)=>{records.push({domain,direction,status:'NOT_REACHED',reason,screenshot:null,...await state()})};

  await openExplore();
  const initial=await state();if(initial.stage!=='UNIVERSE')await clickScale('UNIVERSE');await capture('Universe','forward','initial Living viewport');
  for(const domain of ['Galaxy','Region','Neighborhood','System','Planet','Surface','Human']){const r=await ensureScale(domain);if(r.reached)await capture(domain,'forward',r.method);else await markUnreached(domain,'forward','no visible user-control route found')}

  // Life: use the founder-facing bounded BIOSPHERE survey and click a visible result.
  try{
    await ensureScale('System');await openExplore();const select=page.locator('#living-panel #living-search-goal:visible');const survey=page.locator('#living-panel [data-living-action="survey"]:visible').first();if(await select.count()&&await survey.count()){
      await select.selectOption('BIOSPHERE');await survey.click();await page.waitForFunction(()=>{const s=OFU.v1LivingProduct.snapshot().search;return !s.running&&s.results>0},null,{timeout:60000});const result=page.locator('#living-panel #living-search-results .living-choice:visible').first();if(await result.count()){await result.click();await page.waitForTimeout(150);await capture('Life','forward','BIOSPHERE survey result selected')}else await markUnreached('Life','forward','biosphere survey returned no visible choice');
    }else await markUnreached('Life','forward','BIOSPHERE survey control unavailable');
  }catch(e){await markUnreached('Life','forward',`survey failed: ${e.message}`)}

  // Civilization: return to Human and click a real settlement/ruin row when present.
  try{await ensureScale('Human');await openExplore();const id=await firstEntity('settlement');if(id){await page.waitForTimeout(120);await capture('Civilization','forward',`selected settlement/ruin ${id}`)}else await markUnreached('Civilization','forward','no visible SETTLEMENT/RUIN consumer in Human rows')}catch(e){await markUnreached('Civilization','forward',`civilization interaction failed: ${e.message}`)}

  // Matter + dynamic micro-depth discovery. Do not invent molecular/atomic reachability.
  let materialReached=false;
  try{await ensureScale('Human');await openExplore();const id=await firstEntity('material');if(id&&await clickAction('inspect-material')){await page.waitForFunction(()=>OFU.v1LivingProduct.runtime.snapshot().stage==='MATERIAL',null,{timeout:30000});materialReached=true;await capture('Matter','forward',`inspect-material ${id}`)}else await markUnreached('Matter','forward','no visible material inspection route')}catch(e){await markUnreached('Matter','forward',`material interaction failed: ${e.message}`)}
  let molecular=false,atomic=false;
  if(materialReached){for(let i=0;i<8;i++){const before=(await state()).stage;if(!(await clickAction('deeper')))break;try{await page.waitForFunction(s=>OFU.v1LivingProduct.runtime.snapshot().stage!==s,before,{timeout:10000})}catch{break}const after=(await state()).stage;if(/MOLEC/i.test(after)&&!molecular){molecular=true;await capture('Molecular','forward',`deeper reached ${after}`)}if(/ATOM/i.test(after)&&!atomic){atomic=true;await capture('Atomic','forward',`deeper reached ${after}`)}if(after===before)break}}
  if(!molecular)await markUnreached('Molecular','forward','no user-driven molecular stage reached from Matter');
  if(!atomic)await markUnreached('Atomic','forward','no user-driven atomic stage reached from Matter');

  // Reverse traversal: use visible scale controls from deepest state back through Human -> Universe.
  const reverse=['Atomic','Molecular','Matter','Civilization','Life','Human','Surface','Planet','System','Neighborhood','Region','Galaxy','Universe'];
  for(const domain of reverse){
    if(['Atomic','Molecular','Matter','Civilization','Life'].includes(domain)){
      await markUnreached(domain,'reverse','no domain-specific visible reverse control proven by this harness; refusing to substitute internal state mutation');
      continue;
    }
    const r=await ensureScale(domain);if(r.reached)await capture(domain,'reverse',r.method);else await markUnreached(domain,'reverse','no visible reverse user-control route found');
  }

  assert.equal(requests.length,0,`unexpected network requests: ${requests.join(', ')}`);
  const result={schema:'ofu-founder-visual-differential-subject-1',subject:subject.id,sourceSha:subject.sha,artifactSha256:sha256(subject.artifact),artifactBytes:fs.statSync(subject.artifact).size,browser:engine,domains:DOMAINS,records,pageErrors:errors,unexpectedNetworkRequests:requests,status:errors.length?'PAGE_ERRORS':'CAPTURED'};
  fs.writeFileSync(path.join(outDir,'subject.json'),JSON.stringify(result,null,2)+'\n');
  await browser.close();return result;
}

const results=[];for(const s of subjects)results.push(await runSubject(s));
const [v1,v2]=results;const matrix=DOMAINS.map(domain=>{const a=v1.records.find(x=>x.domain===domain&&x.direction==='forward'&&x.screenshot),b=v2.records.find(x=>x.domain===domain&&x.direction==='forward'&&x.screenshot);return{domain,v1Reached:!!a,v2Reached:!!b,v1Screenshot:a?.screenshot||null,v2Screenshot:b?.screenshot||null,classification:'NOT_VERIFIED',classificationAuthority:'HUMAN_FOUNDER_REVIEW_REQUIRED'}});
const summary={schema:'ofu-founder-visual-differential-1',status:'CAPTURE_COMPLETE_CLASSIFICATION_PENDING',browser:engine,v1:{sha:v1.sourceSha,artifactSha256:v1.artifactSha256,artifactBytes:v1.artifactBytes},v2:{sha:v2.sourceSha,artifactSha256:v2.artifactSha256,artifactBytes:v2.artifactBytes},byteIdentical:v1.artifactSha256===v2.artifactSha256,matrix,acceptanceLaw:'Every founder-visible targeted domain below MATERIAL_IMPROVEMENT remains an open defect. Automated pixel difference is not promoted to qualitative improvement.',createdAt:new Date().toISOString()};
fs.writeFileSync(path.join(evidenceRoot,`differential-${engine}.json`),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary));
