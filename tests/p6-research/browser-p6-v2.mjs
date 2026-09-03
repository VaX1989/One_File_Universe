import fs from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
const name=process.env.BROWSER||'chromium',engine={chromium,firefox,webkit}[name];if(!engine)throw new Error('unsupported browser');
const browser=await engine.launch({headless:true}),page=await browser.newPage();
for(const file of ['src/kernel/sha256.js','src/kernel/p2-unicode.js','src/kernel/p2-canonical.js','src/domains/astronomy/p3-skeleton.js','src/domains/astronomy/p3-canonical.js','src/temporal/p4-temporal.js','src/domains/planetology/p5-canonical.js'])await page.addScriptTag({content:fs.readFileSync(file,'utf8')});
let p6=fs.readFileSync('research/p6/biosphere-model-v2.mjs','utf8').replace(/^export\s+/gm,'');
p6+='\nglobalThis.P6W2={P6_STATES,P6_IDENTITY_POLICY,semanticManifestHash,canonicalP5SourceEnvelope,adaptP5EnvironmentV1,evaluateCanonicalMinimum,adaptP5ResearchExtensionV02,composeResearchEnvironment,createP2BiosphereBindings,generateBiosphereMacro,materializeMeso};';
await page.addScriptTag({content:p6});
const result=await page.evaluate(()=>{
  const P=OFU.p2,A=OFU.p3Astronomy,P5=OFU.p5Planetology,X=P6W2,seed=Uint8Array.from({length:32},(_,i)=>i),ctx={masterSeed:seed,semanticManifestHash:A.semanticManifestHash()};
  let chosen=null;
  outer:for(let gi=0;gi<30000;gi++){
    const gk={x:BigInt((gi%120)-60),y:BigInt((Math.floor(gi/120)%120)-60),z:BigInt(Math.floor(gi/14400)-1)},g=A.resolveGalaxy(ctx,gk);if(g.status!=='PRESENT')continue;
    const base={galaxyX:gk.x,galaxyY:gk.y,galaxyZ:gk.z};
    for(let i=0n;i<100000n;i++){
      const k={...base,sectorX:0n,sectorY:0n,sectorZ:0n,siteX:i%512n,siteY:(i/512n)%512n,siteZ:(i/(512n*512n))%512n},sys=A.resolveSystem(ctx,k);if(sys.status!=='PRESENT'||sys.facts.planetCount===0n)continue;
      for(let slot=0n;slot<sys.facts.planetCount;slot++){
        const key={...k,orbitSlot:slot},s=A.planetaryInputSnapshot(ctx,key);if(s.status==='PRESENT'&&s.formation.bulkPriorClass==='TERRESTRIAL'&&s.formation.baselineMassMilliEarth>=1000n&&s.formation.baselineMassMilliEarth<=8000n){chosen={key,s};break outer}
      }
    }
  }
  if(!chosen)throw new Error('no supported planet');
  const planet=P5.realizePhysicalPlanet(ctx,P5.adaptP3PlanetaryInputSnapshot(chosen.s)),topology=P5.createTerrainTopology(planet),projection=P5.p6EnvironmentalProjection(planet,topology),canonical=X.adaptP5EnvironmentV1(X.canonicalP5SourceEnvelope(P5,projection)),minimum=X.evaluateCanonicalMinimum(canonical);
  const ext=X.adaptP5ResearchExtensionV02({version:'p6-environment-research-v0.2',authority:'P5_RESEARCH_DRAFT',planetId:chosen.s.planetId,environmentalEpochRef:'BROWSER_RESEARCH_T0',energy:{baselineInsolationPpm:Number(chosen.s.orbit.baselineInsolationPpm)},temperature:{meanK:288,minSeasonalK:250,maxSeasonalK:315,highLatitudeSeasonalityK:45},atmosphere:{pressurePa:101325,columnEquivalentPressurePa:101325,pressureInterpretation:'RESEARCH',heavyGasRetentionProxy:0.9,xuvEscapeKgS:1000},solvent:{surfaceWaterRegime:'LIQUID_SURFACE_CAPABLE',deepWaterRegime:'RESEARCH'},geology:{activityProxy:0.4,regimeProxy:'RESEARCH'},terrain:{oceanFractionPpm:500000,reliefScaleM:4000},radiation:{xuvFractionProxy:0.00001}}),env=X.composeResearchEnvironment(canonical,ext),uid=P.universeIdentity(seed,ctx.semanticManifestHash).digest,mh=X.semanticManifestHash(P),bindings=X.createP2BiosphereBindings({p2:P,masterSeed:seed,p6SemanticManifestHash:mh,canonicalUniverseIdentity:uid}),macro=X.generateBiosphereMacro(env,bindings),indexes=Array.from({length:Math.min(4,macro.commitments.lineageCount)},(_,i)=>i),meso=X.materializeMeso(env,macro,bindings,{lineageIndexes:indexes,speciesPerLineage:2});
  return {status:'PASS',browser:navigator.userAgent,planetId:P.hex(chosen.s.planetId),manifestHash:P.hex(mh),canonicalState:canonical.state,minimumCanGenerate:minimum.canGenerateBiosphere,biosphereId:P.hex(macro.biosphereId),lineages:meso.lineages.map(x=>P.hex(x.lineageId)).sort(),species:meso.species.map(x=>P.hex(x.speciesId)).sort(),primaryProductivityU:macro.productivity.primaryProductivityU};
});
await browser.close();fs.mkdirSync('dist/evidence/p6',{recursive:true});fs.writeFileSync(`dist/evidence/p6/browser-${name}.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
