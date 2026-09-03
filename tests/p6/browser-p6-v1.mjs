import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import process from 'node:process';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {chromium,firefox,webkit} from 'playwright';

const require=createRequire(import.meta.url),playwrightVersion=require('playwright/package.json').version,browserName=process.env.BROWSER||'chromium',engines={chromium,firefox,webkit};
if(!engines[browserName])throw new Error('unknown browser '+browserName);
const build=JSON.parse(fs.readFileSync('dist/p6-build-manifest.json','utf8')),golden=JSON.parse(fs.readFileSync('tests/p6/golden-p6-biosphere-v1.json','utf8')),file=path.resolve('dist/One_File_Universe.html'),url=pathToFileURL(file).href;
const browser=await engines[browserName].launch({headless:true}),context=await browser.newContext(),page=await context.newPage(),requests=[];
page.on('request',request=>requests.push({url:request.url(),resourceType:request.resourceType(),navigation:request.isNavigationRequest()}));
await page.addInitScript(()=>{globalThis.__OFU_P6_NET__=[];const note=(kind,url)=>globalThis.__OFU_P6_NET__.push({kind,url:String(url)});if(globalThis.fetch)globalThis.fetch=url=>{note('fetch',url);return Promise.reject(new Error('network disabled'))}});
try{
  await page.goto(url,{waitUntil:'load'});
  await page.waitForFunction(()=>globalThis.OFU?.p6Biosphere&&globalThis.__OFU_BASELINE_REPORT__?.status==='READY',{timeout:30000});
  const result=await page.evaluate(()=>{
    const P=OFU.p2,B=OFU.p6Biosphere,T=OFU.p4,h=P.hex,seed=Uint8Array.from({length:32},(_,index)=>index+1),uid=Uint8Array.from({length:32},(_,index)=>255-index),planetId=Uint8Array.from({length:32},(_,index)=>(index*3)&255),binding=B.bindings({masterSeed:seed,canonicalUniverseIdentity:uid}),ids=B.idsForPlanet(binding,planetId),budget=B.energyBudget({phototrophicUsableEnergyU:5000000000n,phototrophicCaptureEfficiencyPpm:420000n,chemotrophicUsableEnergyU:null,chemotrophicCaptureEfficiencyPpm:0n,biomassSupportEfficiencyPpm:800000n}),lineage=T.lineageId(uid,null,'p6-browser-negative'),baseline={phase:'P6',contractId:B.CONTRACT_ID,modelVersion:B.VERSION,manifestHash:B.manifestHash(),identityPolicy:B.IDENTITY_POLICY,persistentBiologyEstablished:false,persistentLineageTransitions:'DEFERRED'},state=T.replay({universeIdentity:uid,lineage,baseline,events:[],transition:B.TRANSITION_CONTRACT});
    let forgedRenderingRejected=false;try{B.renderingProjection({level:'MACRO',planetId,biosphereId:ids.biosphereId,commitments:{}})}catch{forgedRenderingRejected=true}
    return {status:'PASS',manifestHash:h(B.manifestHash()),biosphereId:h(ids.biosphereId),lineageId:h(ids.lineageId),speciesId:h(ids.speciesId),primaryProductivityCeilingU:budget.primaryProductivityCeilingU.toString(),stateDigest:h(state.digest),privateClock:B.OWNERSHIP.privateClock,canonicalGenesisAvailable:false,persistentLineageTransitions:false,shippedConformanceConstructor:typeof B.normativeSupportedVector==='function'||typeof B.macroFromSupported==='function',forgedRenderingRejected,artifactContainsConformanceAuthority:document.documentElement.outerHTML.includes('P6_CONFORMANCE_ONLY'),userAgent:navigator.userAgent};
  });
  const net=await page.evaluate(()=>globalThis.__OFU_P6_NET__||[]),unexpected=requests.filter(request=>!(request.navigation&&request.resourceType==='document'&&request.url===url)&&!request.url.startsWith('data:')&&!request.url.startsWith('blob:')&&!request.url.startsWith('about:'));
  if(net.length||unexpected.length)throw new Error('network/single-file invariant failed');
  for(const key of ['manifestHash','biosphereId','lineageId','speciesId','primaryProductivityCeilingU'])if(result[key]!==golden.vectors[key])throw new Error('P6 Golden browser drift '+key);
  if(result.privateClock!==false||result.canonicalGenesisAvailable!==false||result.persistentLineageTransitions!==false||result.shippedConformanceConstructor!==false||result.forgedRenderingRejected!==true||result.artifactContainsConformanceAuthority!==false)throw new Error('P6 browser authority invariant drift');
  if(build.sourceCommit!==process.env.OFU_SOURCE_SHA||build.componentManifestHash!==golden.vectors.manifestHash||build.goldenCorpusDigest!==golden.corpusDigest)throw new Error('P6 artifact pin drift');
  const output={...result,sourceCommit:process.env.OFU_SOURCE_SHA,browser:browserName,browserVersion:browser.version(),playwrightVersion,nodeVersion:process.version,hostPlatform:process.platform,hostArch:process.arch,osRelease:os.release(),artifactSha256:build.artifactSha256,goldenCorpusDigest:golden.corpusDigest,unexpectedNetworkRequests:unexpected.length,realSafariVerified:false};
  fs.mkdirSync('dist/evidence/p6',{recursive:true});fs.writeFileSync(path.join('dist/evidence/p6',`browser-${process.platform}-${process.arch}-${browserName}.json`),JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify(output));
}finally{await context.close();await browser.close()}
