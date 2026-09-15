import fs from 'node:fs/promises';
import path from 'node:path';
import { transformPhase2Renderer } from './phase2-renderer-transform.mjs';
import { transformPhase2Experience } from './phase2-experience-transform.mjs';

const root=process.cwd();
const sourceDir=path.join(root,'src','experiments','spatial-continuum');
const outDir=path.join(root,'reports','ci','phase2-materialized-source');
await fs.mkdir(outDir,{recursive:true});

const rendererPath=path.join(sourceDir,'renderer.js');
const experiencePath=path.join(sourceDir,'experience.js');
const rendererSource=await fs.readFile(rendererPath,'utf8');
const experienceSource=await fs.readFile(experiencePath,'utf8');

const renderer=transformPhase2Renderer(rendererSource);
let experience=transformPhase2Experience(experienceSource);
const legacyImport="import { createContinuumRenderer } from './renderer.js';";
const phase2Import="import { createContinuumRenderer } from './renderer-phase2.js';";
if(!experience.includes(legacyImport)) throw new Error('materializer: renderer import anchor missing');
experience=experience.replace(legacyImport,phase2Import);

await fs.writeFile(path.join(outDir,'renderer.js'),renderer);
await fs.writeFile(path.join(outDir,'experience.js'),experience);
await fs.writeFile(path.join(outDir,'manifest.json'),JSON.stringify({
  sourceSha:process.env.OFU_SOURCE_SHA||null,
  rendererBytes:Buffer.byteLength(renderer),
  experienceBytes:Buffer.byteLength(experience),
  directPhase2RendererImport:experience.includes(phase2Import)
},null,2));
console.log('PHASE2_SOURCE_MATERIALIZED',outDir);
