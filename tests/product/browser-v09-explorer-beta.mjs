import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const sourceSha=process.env.OFU_SOURCE_SHA;if(!sourceSha)throw new Error('OFU_SOURCE_SHA required');
const manifest=JSON.parse(fs.readFileSync('dist/rendering-build-manifest.json','utf8'));if(manifest.sourceCommit!==sourceSha)throw new Error('source mismatch');
const file=path.resolve('dist/One_File_Universe.html'),evidenceDir=path.resolve('dist/evidence/product-v09');fs.mkdirSync(evidenceDir,{recursive:true});
const browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});const page=await context.newPage();
const errors=[],requests=[];page.on('pageerror',e=>errors.push(String(e.message||e).slice(0,500)));page.on('request',r=>requests.push({url:r.url(),type:r.resourceType(),nav:r.isNavigationRequest()}));
const url=pathToFileURL(file).href,shots=[];
const shot=async name=>{const out=path.join(evidenceDir,`v09-${name}.png`);await page.screenshot({path:out,fullPage:true});shots.push(path.basename(out))};
try{
 await page.goto(url,{waitUntil:'load'});
 await page.waitForFunction(()=>globalThis.__OFU_BASELINE_REPORT__?.status==='READY'&&OFU?.v08ExploreNavigation?.state?.ready&&OFU?.v09ExplorerBeta?.state?.ready&&OFU?.v09ExplorerScene?.snapshot().ready,{},{timeout:30000});
 const initial=await page.evaluate(()=>({text:String(document.querySelector('[data-workspace-panel="explore"]')?.innerText||'').replace(/\s+/g,' ').trim(),targets:OFU.v08ExploreNavigation.state.targets.length,beta:OFU.v09ExplorerBeta.snapshot(),scene:OFU.v09ExplorerScene.snapshot()}));
 for(const phrase of ['Explorer Beta','Where you are','Discover','Try something different','World differences','Recent & bookmarked'])if(!initial.text.includes(phrase))throw new Error('missing Explorer Beta hierarchy: '+phrase);
 if(/galaxyX|sectorX|siteX|[0-9a-f]{40,}/i.test(initial.text))throw new Error('technical identity leaked into Explore');
 if(initial.scene.bodies.length!==initial.targets||!initial.scene.selection)throw new Error('scene seam target mismatch');
 await shot('desktop-explore');
 if(initial.targets>1){
  const first=await page.evaluate(()=>OFU.v09ExplorerBeta.snapshot().session.current);
  await page.click('[data-explore-target="1"]');await page.waitForFunction(first=>OFU.v09ExplorerBeta.snapshot().session.current!==first,first);
  await page.click('#beta-bookmark');await page.click('#beta-pin');
  const pinned=await page.evaluate(()=>OFU.v09ExplorerBeta.snapshot().session.pinned);if(!pinned)throw new Error('comparison pin not stored');
  await page.click('[data-explore-target="0"]');await page.waitForFunction(pinned=>OFU.v09ExplorerBeta.snapshot().session.current!==pinned,pinned);
  await page.waitForFunction(()=>document.querySelectorAll('#beta-compare-body tr').length>=6);
  const compare=await page.evaluate(()=>({rows:document.querySelectorAll('#beta-compare-body tr').length,copy:document.getElementById('beta-compare-copy')?.textContent,recent:document.querySelectorAll('#beta-recent-list .beta-world-card').length,bookmarks:document.querySelectorAll('#beta-bookmark-list .beta-world-card').length}));
  if(compare.rows<6||compare.recent<1||compare.bookmarks<1||!/compared with pinned/i.test(compare.copy||''))throw new Error('comparison/session flow incomplete '+JSON.stringify(compare));
 }
 await page.click('[data-open-workspace="inspect"]');await page.waitForFunction(()=>OFU.productUI.state.workspace==='inspect');await page.waitForFunction(()=>/sections below separate|outside the range|selected world is changing|part of the generated universe/i.test(document.getElementById('inspector-overview-copy')?.textContent||''));
 const inspect=await page.evaluate(()=>({overview:document.getElementById('inspector-overview-copy')?.textContent,environment:document.getElementById('inspector-environment-copy')?.textContent,biology:document.getElementById('inspector-biology-copy')?.textContent,technical:document.querySelector('.raw-details')?.open===true}));
 if(inspect.technical)throw new Error('advanced technical details opened by default');if(!/world|object/i.test(inspect.overview||'')||!/environment|forcing|waiting/i.test(inspect.environment||''))throw new Error('plain-language Inspector missing '+JSON.stringify(inspect));
 await shot('desktop-inspect');
 await page.click('[data-workspace="explore"]');await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>document.documentElement.dataset.ofuMobile==='true'&&__OFU_MOBILE_INTERACTION__?.snapshot().active===true);await page.waitForFunction(()=>__OFU_MOBILE_INTERACTION__.snapshot().sheet==='peek');
 const mobile=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,sheet:__OFU_MOBILE_INTERACTION__.snapshot().sheet,breadcrumb:getComputedStyle(document.querySelector('.beta-breadcrumbs')).overflowX,scene:OFU.v09ExplorerScene.snapshot()}));
 if(mobile.overflow>2||mobile.sheet!=='peek'||mobile.scene.ready!==true)throw new Error('mobile Explorer Beta composition failed '+JSON.stringify(mobile));
 await shot('mobile-explore');
 const unexpected=requests.filter(r=>!(r.nav&&r.type==='document'&&r.url===url)&&!r.url.startsWith('data:')&&!r.url.startsWith('blob:')&&!r.url.startsWith('about:'));if(unexpected.length)throw new Error('unexpected network requests '+JSON.stringify(unexpected));if(errors.length)throw new Error('page errors '+JSON.stringify(errors));
 const evidence={status:'PASS',exactSourceSha:sourceSha,product:'Explorer Beta',orientation:true,boundedDiscovery:true,comparison:true,sessionState:true,plainLanguageInspector:true,laneBSceneSeam:true,mobileViewportFirst:true,offline:true,screenshots:shots};fs.writeFileSync(path.join(evidenceDir,'v09-explorer-beta.json'),JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
}finally{await context.close();await browser.close()}
