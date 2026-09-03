import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {pathToFileURL} from 'node:url';
import {chromium,firefox,webkit} from 'playwright';
const name=process.env.BROWSER||'chromium',engine={chromium,firefox,webkit}[name];if(!engine)throw new Error('unsupported browser');
const file=path.resolve('dist/One_File_Universe.html'),url=pathToFileURL(file).href,browser=await engine.launch({headless:true}),context=await browser.newContext(),page=await context.newPage();
try{
  await page.goto(url,{waitUntil:'load'});await page.waitForFunction(()=>globalThis.__OFU_BASELINE_REPORT__?.status==='READY',{timeout:30000});
  let p6=fs.readFileSync('research/p6/biosphere-model-v2.mjs','utf8').replace(/^export\s+/gm,'');
  p6+='\nglobalThis.P6W2={P6_STATES,P6_IDENTITY_POLICY,semanticManifestHash,canonicalP5SourceEnvelope,adaptP5EnvironmentV1,evaluateCanonicalMinimum,adaptP5ResearchExtensionV02,composeResearchEnvironment,createP2BiosphereBindings,generateBiosphereMacro,materializeMeso};';
  await page.addScriptTag({content:p6});
  const result=await page.evaluate(()=>{
    const P=OFU.p2,A=OFU.p3Astronomy,P5=OFU.p5Planetology,X=P6W2,seed=Uint8Array.from({length:32},(_,i)=>i),ctx={masterSeed:seed,semanticManifestHash:A.semanticManifestHash()};
    let chosen=null;
    // Exact selector semantics from tests/p5/browser-p5.mjs: only ABSENT is excluded.
    outer:for(let y=0n;y<16n;y++)for(let x=0n;x<512n;x++){
      const base={galaxyX:48n,galaxyY:-50n,galaxyZ:-1n,sectorX:0n,sectorY:0n,sectorZ:0n,siteX:x,siteY:y,siteZ:0n},sys=A.resolveSystem(ctx,base);if(sys.status!=='PRESENT'||sys.facts.planetCount===0n)continue;
      for(let slot=0n;slot<sys.facts.planetCount;slot++){
        const key={...base,orbitSlot:slot},s=A.planetaryInputSnapshot(ctx,key);if(s.status==='ABSENT')continue;
        if(s.formation.bulkPriorClass==='TERRESTRIAL'&&s.formation.baselineMassMilliEarth>=1000n&&s.formation.baselineMassMilliEarth<=8000n){chosen={key,s};break outer}
      }
    }
    if(!chosen)throw new Error('no bounded terrestrial P3 planet found in shipped canonical browser search window');
    const adapted=P5.adaptP3PlanetaryInputSnapshot(chosen.s);if(!P5.assertP3BaselinePreserved(chosen.s,adapted))throw new Error('P3 baseline preservation failed');
    const planet=P5.realizePhysicalPlanet(ctx,adapted);if(planet.status!=='SUPPORTED')throw new Error('P5 physical realization unexpectedly unsupported');
    const topology=P5.createTerrainTopology(planet),projection=P5.p6EnvironmentalProjection(planet,topology),canonical=X.adaptP5EnvironmentV1(X.canonicalP5SourceEnvelope(P5,projection)),minimum=X.evaluateCanonicalMinimum(canonical);
    const ext=X.adaptP5ResearchExtensionV02({version:'p6-environment-research-v0.2',authority:'P5_RESEARCH_DRAFT',planetId:chosen.s.planetId,environmentalEpochRef:'BROWSER_RESEARCH_T0',energy:{baselineInsolationPpm:Number(chosen.s.orbit.baselineInsolationPpm)},temperature:{meanK:288,minSeasonalK:250,maxSeasonalK:315,highLatitudeSeasonalityK:45},atmosphere:{pressurePa:101325,columnEquivalentPressurePa:101325,pressureInterpretation:'RESEARCH',heavyGasRetentionProxy:0.9,xuvEscapeKgS:1000},solvent:{surfaceWaterRegime:'LIQUID_SURFACE_CAPABLE',deepWaterRegime:'RESEARCH'},geology:{activityProxy:0.4,regimeProxy:'RESEARCH'},terrain:{oceanFractionPpm:500000,reliefScaleM:4000},radiation:{xuvFractionProxy:0.00001}}),env=X.composeResearchEnvironment(canonical,ext),uid=P.universeIdentity(seed,ctx.semanticManifestHash).digest,mh=X.semanticManifestHash(P),bindings=X.createP2BiosphereBindings({p2:P,masterSeed:seed,p6SemanticManifestHash:mh,canonicalUniverseIdentity:uid}),macro=X.generateBiosphereMacro(env,bindings),indexes=Array.from({length:Math.min(4,macro.commitments.lineageCount)},(_,i)=>i),meso=X.materializeMeso(env,macro,bindings,{lineageIndexes:indexes,speciesPerLineage:2});
    const browserHeapUsedBytes=globalThis.performance&&performance.memory&&Number.isFinite(performance.memory.usedJSHeapSize)?performance.memory.usedJSHeapSize:null;
    return {status:'PASS',browser:navigator.userAgent,browserHeapUsedBytes,planetId:P.hex(chosen.s.planetId),manifestHash:P.hex(mh),canonicalState:canonical.state,minimumCanGenerate:minimum.canGenerateBiosphere,biosphereId:P.hex(macro.biosphereId),lineages:meso.lineages.map(x=>P.hex(x.lineageId)).sort(),species:meso.species.map(x=>P.hex(x.speciesId)).sort(),primaryProductivityU:macro.productivity.primaryProductivityU};
  });
  result.hostPlatform=process.platform;result.hostArch=process.arch;result.osRelease=os.release();result.sourceCommit=process.env.OFU_SOURCE_SHA;fs.mkdirSync('dist/evidence/p6',{recursive:true});const evidenceName=`browser-${process.platform}-${process.arch}-${name}.json`;fs.writeFileSync(`dist/evidence/p6/${evidenceName}`,JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{await context.close();await browser.close()}
