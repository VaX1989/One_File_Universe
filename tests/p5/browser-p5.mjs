import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import process from 'node:process';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {chromium,firefox,webkit} from 'playwright';
const require=createRequire(import.meta.url),playwrightVersion=require('playwright/package.json').version;
const name=process.env.BROWSER||'chromium',engines={chromium,firefox,webkit};if(!engines[name])throw new Error('unknown browser '+name);
const build=JSON.parse(fs.readFileSync('dist/p5-build-manifest.json','utf8')),file=path.resolve('dist/One_File_Universe.html'),url=pathToFileURL(file).href;
const browser=await engines[name].launch({headless:true}),context=await browser.newContext(),page=await context.newPage(),requests=[];page.on('request',r=>requests.push({url:r.url(),resourceType:r.resourceType(),navigation:r.isNavigationRequest()}));
await page.addInitScript(()=>{globalThis.__OFU_P5_NET__=[];const note=(kind,url)=>globalThis.__OFU_P5_NET__.push({kind,url:String(url)});if(globalThis.fetch)globalThis.fetch=u=>{note('fetch',u);return Promise.reject(new Error('network disabled'))};if(globalThis.XMLHttpRequest){const X=globalThis.XMLHttpRequest;globalThis.XMLHttpRequest=function(){const x=new X(),open=x.open;x.open=function(m,u,...a){note('xhr',u);return open.call(this,m,u,...a)};return x}}if(globalThis.WebSocket)globalThis.WebSocket=function(u){note('websocket',u);throw new Error('network disabled')};});
try{
  await page.goto(url,{waitUntil:'load'});await page.waitForFunction(()=>globalThis.__OFU_BASELINE_REPORT__?.status==='READY',{timeout:30000});
  const result=await page.evaluate(()=>{
    const O=globalThis.OFU,P=O.p2,A=O.p3Astronomy,P5=O.p5Planetology;
    if(!P5||P5.VERSION!=='p5-planet-physical-1')throw new Error('P5 candidate not loaded');
    const masterSeed=Uint8Array.from({length:32},(_,i)=>i),ctx={masterSeed,semanticManifestHash:A.semanticManifestHash()};
    let chosen=null;
    outer:for(let y=0n;y<16n;y++)for(let x=0n;x<512n;x++){
      const base={galaxyX:48n,galaxyY:-50n,galaxyZ:-1n,sectorX:0n,sectorY:0n,sectorZ:0n,siteX:x,siteY:y,siteZ:0n};
      const system=A.resolveSystem(ctx,base);if(system.status!=='PRESENT'||system.facts.planetCount===0n)continue;
      for(let slot=0n;slot<system.facts.planetCount;slot++){
        const key={...base,orbitSlot:slot},snapshot=A.planetaryInputSnapshot(ctx,key);
        if(snapshot.status==='ABSENT')continue;
        if(snapshot.formation.bulkPriorClass==='TERRESTRIAL'&&snapshot.formation.baselineMassMilliEarth>=1000n&&snapshot.formation.baselineMassMilliEarth<=8000n){chosen={key,snapshot};break outer;}
      }
    }
    if(!chosen)throw new Error('no bounded terrestrial P3 planet found in browser search window');
    const adapted=P5.adaptP3PlanetaryInputSnapshot(chosen.snapshot);if(!P5.assertP3BaselinePreserved(chosen.snapshot,adapted))throw new Error('P3 v1 preservation failed');
    const physical=P5.realizePhysicalPlanet(ctx,adapted);if(physical.status!=='SUPPORTED')throw new Error('bounded terrestrial realization unexpectedly unsupported');
    const physical2=P5.realizePhysicalPlanet(ctx,P5.adaptP3PlanetaryInputSnapshot(A.planetaryInputSnapshot(ctx,chosen.key)));
    const d1=P.hex(P5.physicalDigest(physical)),d2=P.hex(P5.physicalDigest(physical2));if(d1!==d2)throw new Error('P5 direct random access drift');
    const topology=P5.createTerrainTopology(physical),a=P5.generateTerrainPatch(ctx,topology,{face:'PZ',level:3n,x:2n,y:3n}),b=P5.generateTerrainPatch(ctx,topology,{face:'PZ',level:3n,x:3n,y:3n}),seam=P5.commonSeam(a,b);if(seam.commonVertexCount!==5n||seam.maxElevationCodeDelta!==0n)throw new Error('P5 seam invariant failed');
    const children=P5.refinePatchKey({face:'PX',level:2n,x:1n,y:2n}).map(k=>P5.generateTerrainPatch(ctx,topology,k)),projection=P5.projectRefinedChildren(ctx,topology,{face:'PX',level:2n,x:1n,y:2n},children);if(projection.missingParentVertices!==0n||projection.maxParentElevationCodeDelta!==0n)throw new Error('P5 refinement invariant failed');
    const audit=P5.auditCubeFaceContinuityAtLevel(ctx,topology,2n);if(audit.status!=='PASS'||audit.cornerVertices!==8n)throw new Error('P5 cube-face invariant failed');
    const terrainDigest=P.hex(O.sha256.digest(P.encode({a,b,projection,audit})));
    return {physicalDigest:d1,terrainDigest,planetId:P.hex(physical.planetId),radiusM:String(physical.physical.meanRadiusM),gravityMicroMs2:String(physical.physical.surfaceGravityMicroMs2),densityKgM3:String(physical.physical.meanDensityKgM3),coreMassFractionPermille:String(physical.physical.composition.coreMassFractionPermille),p3Contract:adapted.sourceContractId,p3SchemaVersion:String(adapted.sourceSchemaVersion),baselineEpoch:adapted.baselineEpoch,patchVertices:Number(a.vertexCount),materializesGlobalHeightmap:topology.materializesGlobalHeightmap};
  });
  const networkCalls=await page.evaluate(()=>globalThis.__OFU_P5_NET__||[]),unexpected=requests.filter(r=>!(r.navigation&&r.resourceType==='document'&&r.url===url)&&!r.url.startsWith('data:')&&!r.url.startsWith('blob:')&&!r.url.startsWith('about:'));if(networkCalls.length||unexpected.length)throw new Error('network/single-file invariant failed: '+JSON.stringify({networkCalls,unexpected}));
  if(build.sourceCommit!==process.env.OFU_SOURCE_SHA)throw new Error('P5 artifact source pin mismatch');
  const evidence={status:'PASS',test:'P5-SHIPPED-CANDIDATE-v1',sourceCommit:process.env.OFU_SOURCE_SHA,browser:name,browserVersion:browser.version(),playwrightVersion,nodeVersion:process.version,platform:process.platform,arch:process.arch,osRelease:os.release(),artifactSha256:build.artifactSha256,artifactBytes:build.artifactBytes,componentManifestHash:build.componentManifestHash,...result,unexpectedNetworkRequests:unexpected.length,realSafariIOSVerified:false};
  fs.mkdirSync('dist/evidence/p5',{recursive:true});fs.writeFileSync(`dist/evidence/p5/browser-${process.platform}-${process.arch}-${name}.json`,JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence,null,2));
}finally{await context.close();await browser.close()}
