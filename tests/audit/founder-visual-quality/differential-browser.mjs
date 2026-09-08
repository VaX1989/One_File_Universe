import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {chromium,firefox,webkit} from 'playwright';

const engine=process.env.BROWSER||'chromium';
const launcher={chromium,firefox,webkit}[engine];
assert(launcher,`unsupported BROWSER ${engine}`);
const evidenceRoot=path.resolve(process.env.EVIDENCE_DIR||'dist/evidence/founder-visual-quality');
const allSubjects=[
  {id:'v1',sha:process.env.V1_SHA,artifact:path.resolve(process.env.V1_ARTIFACT||'audit-input/v1.html')},
  {id:'v2',sha:process.env.V2_SHA,artifact:path.resolve(process.env.V2_ARTIFACT||'audit-input/v2.html')}
];
const subjectFilter=process.env.AUDIT_SUBJECT;
assert(['v1','v2'].includes(subjectFilter),`AUDIT_SUBJECT is required and must be v1 or v2; got ${subjectFilter||'unset'}`);
const subjects=allSubjects.filter(s=>s.id===subjectFilter);
const FAMILY_DOMAINS={macro:['Universe','Galaxy','Region','Neighborhood','System','Planet','Surface','Human'],life:['Life'],civilization:['Civilization'],matter:['Matter','Molecular','Atomic']};
const familyFilter=process.env.AUDIT_FAMILY;
assert(FAMILY_DOMAINS[familyFilter],`AUDIT_FAMILY is required and must be one of ${Object.keys(FAMILY_DOMAINS).join(', ')}`);
const familyEnabled=name=>familyFilter===name;
for(const s of allSubjects){assert.match(s.sha||'',/^[0-9a-f]{40}$/,`${s.id} SHA required`);assert(fs.existsSync(s.artifact),`${s.id} artifact missing`)}
fs.mkdirSync(evidenceRoot,{recursive:true});
const sha256=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const DOMAINS=['Universe','Galaxy','Region','Neighborhood','System','Planet','Surface','Human','Life','Civilization','Matter','Molecular','Atomic'];
const SCALE_STAGE={Universe:'UNIVERSE',Galaxy:'GALAXY',Region:'REGION',Neighborhood:'NEIGHBORHOOD',System:'SYSTEM',Planet:'ORBIT',Surface:'GLOBAL_SURFACE',Human:'HUMAN'};
const safeName=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-');
const launchOptions={headless:true};
if(engine==='chromium')launchOptions.args=['--no-sandbox','--disable-gpu','--use-gl=swiftshader'];
if(process.env.BROWSER_EXECUTABLE_PATH)launchOptions.executablePath=process.env.BROWSER_EXECUTABLE_PATH;

async function runSubject(subject){
  const outDir=path.join(evidenceRoot,subject.id,engine);fs.mkdirSync(outDir,{recursive:true});
  const browser=await launcher.launch(launchOptions);
  const artifactHtml=fs.readFileSync(subject.artifact,'utf8');
  const records=[];const pageErrors=[];const unexpectedNetworkRequests=[];

  const withPage=async(label,fn)=>{
    const context=await browser.newContext({viewport:{width:1440,height:960},deviceScaleFactor:1});
    const page=await context.newPage();page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(15000);
    const localErrors=[],localRequests=[];
    page.on('pageerror',e=>{const v=`${label}: ${String(e.message||e)}`;localErrors.push(v);pageErrors.push(v)});
    page.on('request',r=>{const u=r.url();if(!u.startsWith('about:')&&!u.startsWith('blob:')&&!u.startsWith('data:')){const v=`${label}: ${u}`;localRequests.push(v);unexpectedNetworkRequests.push(v)}});
    await page.setContent(artifactHtml,{waitUntil:'load'});
    await page.waitForFunction(()=>globalThis.OFU?.v1LivingProduct?.snapshot?.().initialized&&globalThis.OFU?.productUI,null,{timeout:45000});
    await page.evaluate(()=>OFU.productUI.workspace('explore',{focus:false,announceChange:false}));
    await page.waitForFunction(()=>!document.querySelector('[data-workspace-panel="explore"]')?.hidden,null,{timeout:15000});

    const state=async()=>page.evaluate(()=>{const living=OFU.v1LivingProduct.runtime.snapshot(),product=OFU.v1LivingProduct.snapshot(),scale=OFU.waveIVScaleRuntime.snapshot(),stage=document.getElementById('living-stage'),rect=stage?.getBoundingClientRect();return{stage:living.stage,semanticScale:living.semanticScale,scale:scale.semanticScale,selectedCanonicalTarget:scale.selectedCanonicalTarget?.planetId||null,sceneProvider:scale.activeSceneProvider||null,navigationCoherent:living.navigationCoherent,revision:living.revision,render:product.render?{sceneScale:product.render.sceneScale,readyRevision:product.render.readyRevision,frames:product.render.metrics?.frames||0,drawnObjects:product.render.metrics?.drawnObjects||0,pickCount:product.render.pickCount||0}:null,rows:(living.rows||[]).map(x=>({kind:x.kind,entityId:x.entityId})),micro:living.micro?{regime:living.micro.regime,sourceEntityId:living.micro.sourceEntityId,lastWitness:living.micro.lastWitness}:null,visibleActions:[...document.querySelectorAll('#living-panel [data-living-action]:not([hidden])')].filter(x=>{const r=x.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(x).display!=='none'}).map(x=>x.dataset.livingAction),visibleScales:[...document.querySelectorAll('[data-living-scale]')].filter(x=>{const r=x.getBoundingClientRect();return r.width>0&&r.height>0&&!x.hidden}).map(x=>x.dataset.livingScale),viewport:rect?{x:rect.x,y:rect.y,width:rect.width,height:rect.height}:null}});
    const settle=async()=>{await page.waitForFunction(()=>{const living=OFU.v1LivingProduct.runtime.snapshot(),render=OFU.v1LivingProduct.snapshot().render;return !!render&&render.readyRevision===living.revision&&(render.metrics?.frames||0)>0},null,{timeout:45000});const s=await state();assert.equal(s.render.readyRevision,s.revision,`${label}: renderer/runtime revision mismatch`);return s};
    const visible=async locator=>{if(!(await locator.count()))return false;return locator.first().isVisible()};
    const dispatchVisibleClick=async locator=>{const x=locator.first();assert(await visible(x),`${label}: required visible control missing`);await x.click({force:true,noWaitAfter:true,timeout:5000})};
    const clickScale=async stage=>{const x=page.locator(`[data-living-scale="${stage}"]:visible`).first();if(!(await visible(x)))return false;await x.click({force:true,noWaitAfter:true,timeout:5000});await page.waitForFunction(t=>OFU.v1LivingProduct.runtime.snapshot().stage===t,stage,{timeout:30000});await settle();return true};
    const clickAction=async id=>{const x=page.locator(`#living-panel [data-living-action="${id}"]:visible`).first();if(!(await visible(x)))return false;await dispatchVisibleClick(x);return true};
    const capture=async(domain,direction,note)=>{const s=await settle();const name=`${String(records.length+1).padStart(2,'0')}-${direction}-${safeName(domain)}.png`;const stage=page.locator('#living-stage:visible').first();assert(await visible(stage),`${label}: living stage not visible`);await stage.screenshot({path:path.join(outDir,name),animations:'disabled'});records.push({family:label,domain,direction,note,status:'PROVEN',screenshot:name,loadMode:'EXACT_BYTES_SET_CONTENT',...s});return s};
    const prove=async(domain,direction,note)=>{const s=await settle();records.push({family:label,domain,direction,note,status:'PROVEN',screenshot:null,loadMode:'EXACT_BYTES_SET_CONTENT',...s});return s};
    const mark=async(domain,direction,status,reason)=>records.push({family:label,domain,direction,status,reason,screenshot:null,...await state()});
    const survey=async goal=>{assert(await clickScale('SYSTEM'),`${label}: SYSTEM route unavailable`);const select=page.locator('#living-panel #living-search-goal:visible').first(),button=page.locator('#living-panel [data-living-action="survey"]:visible').first();assert(await visible(select),`${label}: search goal select unavailable`);assert(await visible(button),`${label}: survey control unavailable`);await select.selectOption(goal);await dispatchVisibleClick(button);await page.waitForFunction(()=>{const s=OFU.v1LivingProduct.snapshot().search;return !s.running&&s.results>0},null,{timeout:120000});const result=page.locator('#living-panel #living-search-results .living-choice:visible').first();assert(await visible(result),`${label}: ${goal} survey produced no visible result`);await dispatchVisibleClick(result);await page.waitForFunction(()=>OFU.v1LivingProduct.runtime.snapshot().stage==='ORBIT',null,{timeout:30000});await settle()};
    const selectMaterialEntity=async()=>{assert(await clickScale('HUMAN'),`${label}: HUMAN route unavailable`);const id=await page.evaluate(()=>{const rows=OFU.v1LivingProduct.runtime.snapshot().rows||[];return rows.find(x=>!['SETTLEMENT','RUIN'].includes(x.kind))?.entityId||null});assert(id,`${label}: no inspectable Human entity`);const choice=page.locator(`#living-panel [data-living-entity="${id}"]:visible`).first();assert(await visible(choice),`${label}: inspectable entity control not visible`);await dispatchVisibleClick(choice);return id};
    try{await fn({page,state,settle,clickScale,clickAction,capture,prove,mark,survey,selectMaterialEntity})}finally{assert.equal(localRequests.length,0,`${label}: unexpected network requests: ${localRequests.join(', ')}`);assert.equal(localErrors.length,0,`${label}: page errors: ${localErrors.join(' | ')}`);await context.close()}
  };

  if(familyEnabled('macro'))await withPage('macro',async({state,clickScale,capture,prove})=>{
    if((await state()).stage!=='UNIVERSE')assert(await clickScale('UNIVERSE'),'macro: initial Universe route unavailable');
    await capture('Universe','forward','renderer-settled Living viewport');
    for(const domain of ['Galaxy','Region','Neighborhood','System','Planet','Surface','Human']){assert(await clickScale(SCALE_STAGE[domain]),`macro: ${domain} route unavailable`);await capture(domain,'forward','visible scale control')}
    await prove('Human','reverse','reverse journey origin at Human; subsequent actions use visible scale controls');
    for(const domain of ['Surface','Planet','System','Neighborhood','Region','Galaxy','Universe']){assert(await clickScale(SCALE_STAGE[domain]),`macro reverse: ${domain} route unavailable`);await prove(domain,'reverse','visible scale control')}
  });

  if(familyEnabled('life'))await withPage('life',async({survey,capture,prove,clickAction,state,settle})=>{
    await survey('BIOSPHERE');await capture('Life','forward','bounded BIOSPHERE survey result');assert(await clickAction('back'),'Life reverse: visible Back unavailable');await settle();assert.equal((await state()).stage,'SYSTEM','Life reverse: Back did not return to System');await prove('Life','reverse','visible Back to System')
  });

  if(familyEnabled('civilization'))await withPage('civilization',async({survey,capture,prove,clickAction,state,settle})=>{
    await survey('CIVILIZATION');await capture('Civilization','forward','bounded CIVILIZATION survey result');assert(await clickAction('back'),'Civilization reverse: visible Back unavailable');await settle();assert.equal((await state()).stage,'SYSTEM','Civilization reverse: Back did not return to System');await prove('Civilization','reverse','visible Back to System')
  });

  if(familyEnabled('matter'))await withPage('matter',async({selectMaterialEntity,clickAction,capture,prove,state,settle})=>{
    const id=await selectMaterialEntity();assert(await clickAction('inspect-material'),'Matter: inspect-material unavailable');await pageWaitStage('MATERIAL');await capture('Matter','forward',`inspect-material ${id}`);
    let reachedMolecular=false,reachedAtomic=false;
    for(let i=0;i<6&&!reachedAtomic;i++){const before=(await state()).stage;assert(await clickAction('deeper'),`Matter: deeper unavailable from ${before}`);await waitStageChange(before);const after=(await state()).stage;if(after==='MOLECULAR'&&!reachedMolecular){reachedMolecular=true;await capture('Molecular','forward','visible deeper control')}if(after==='ATOMIC'){reachedAtomic=true;await capture('Atomic','forward','visible deeper control')}}
    assert(reachedMolecular,'Molecular stage not reached');assert(reachedAtomic,'Atomic stage not reached');
    assert(await clickAction('back'),'Atomic reverse: visible Back unavailable');await settle();assert.equal((await state()).stage,'MOLECULAR','Atomic reverse did not return to Molecular');await prove('Atomic','reverse','visible Back to Molecular');
    assert(await clickAction('back'),'Molecular reverse: first Back unavailable');await settle();assert.equal((await state()).stage,'MICROSTRUCTURE','Molecular reverse did not return to Microstructure');assert(await clickAction('back'),'Molecular reverse: second Back unavailable');await settle();assert.equal((await state()).stage,'MATERIAL','Molecular reverse did not return to Material');await prove('Molecular','reverse','visible Back through Microstructure to Material');
    assert(await clickAction('back'),'Matter reverse: visible Back unavailable');await settle();assert.equal((await state()).stage,'HUMAN','Matter reverse did not return to Human');await prove('Matter','reverse','visible Back to Human');

    async function pageWaitStage(stage){await settle();assert.equal((await state()).stage,stage,`expected ${stage}`)}
    async function waitStageChange(before){for(let i=0;i<60;i++){await new Promise(r=>setTimeout(r,50));if((await state()).stage!==before){await settle();return}}assert.fail(`stage did not change from ${before}`)}
  });

  assert.equal(unexpectedNetworkRequests.length,0,`unexpected network requests: ${unexpectedNetworkRequests.join(', ')}`);
  assert.equal(pageErrors.length,0,`page errors: ${pageErrors.join(' | ')}`);
  const result={schema:'ofu-founder-visual-differential-subject-2',subject:subject.id,sourceSha:subject.sha,artifactSha256:sha256(subject.artifact),artifactBytes:fs.statSync(subject.artifact).size,browser:engine,loadMode:'EXACT_BYTES_SET_CONTENT',domains:DOMAINS,records,pageErrors,unexpectedNetworkRequests,status:'CAPTURED'};
  fs.writeFileSync(path.join(outDir,'subject.json'),JSON.stringify(result,null,2)+'\n');
  await browser.close();return result;
}

const result=await runSubject(subjects[0]);
const domains=FAMILY_DOMAINS[familyFilter];
for(const domain of domains){
  const forward=result.records.find(x=>x.domain===domain&&x.direction==='forward'&&x.screenshot&&x.status==='PROVEN');
  const reverse=result.records.find(x=>x.domain===domain&&x.direction==='reverse'&&x.status==='PROVEN');
  assert(forward,`${subjectFilter}/${familyFilter}/${domain}: forward screenshot evidence missing`);
  assert(reverse,`${subjectFilter}/${familyFilter}/${domain}: reverse proof missing`);
}
const summary={schema:'ofu-founder-visual-browser-shard-3',status:'SHARD_CAPTURE_COMPLETE',browser:engine,loadMode:'EXACT_BYTES_SET_CONTENT',subject:result.subject,sourceSha:result.sourceSha,artifactSha256:result.artifactSha256,artifactBytes:result.artifactBytes,family:familyFilter,domains,records:result.records,pageErrors:result.pageErrors,unexpectedNetworkRequests:result.unexpectedNetworkRequests,createdAt:new Date().toISOString()};
fs.writeFileSync(path.join(evidenceRoot,`shard-${familyFilter}-${subjectFilter}-${engine}.json`),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify({schema:summary.schema,status:summary.status,browser:engine,subject:subjectFilter,family:familyFilter,domains,artifactSha256:summary.artifactSha256,artifactBytes:summary.artifactBytes,records:summary.records.length,pageErrors:summary.pageErrors,unexpectedNetworkRequests:summary.unexpectedNetworkRequests}));
