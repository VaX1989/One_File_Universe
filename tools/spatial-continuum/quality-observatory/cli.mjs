#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { analyzeObservations } from './observatory.mjs';
import { calibratePerceptualDiversity } from './diversity.mjs';
import { buildHumanSummary } from './summary.mjs';

const args=process.argv.slice(2);
const valueOf=name=>{const index=args.indexOf(name);return index>=0?args[index+1]:null};
const observationsPath=valueOf('--observations'),calibrationPath=valueOf('--calibration'),outPath=valueOf('--out'),summaryPath=valueOf('--summary'),campaignId=valueOf('--campaign')||'QUALITY_OBSERVATORY_CLI';
if(!observationsPath||!outPath){console.error('Usage: node cli.mjs --observations observations.json|jsonl --out report.json [--calibration baseline.json] [--summary report.md] [--campaign id]');process.exit(2)}
const readStructured=file=>{const text=fs.readFileSync(file,'utf8').trim();if(!text)return [];if(file.endsWith('.jsonl'))return text.split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line));return JSON.parse(text)};
const observations=readStructured(observationsPath);let calibration=null;
if(calibrationPath){const input=readStructured(calibrationPath);calibration=input.contract==='ofu.r6.quality-observatory.diversity-calibration.v1'?input:calibratePerceptualDiversity(input)}
const report=analyzeObservations({campaignId,observations,calibration});
fs.mkdirSync(path.dirname(path.resolve(outPath)),{recursive:true});fs.writeFileSync(outPath,JSON.stringify(report,null,2)+'\n');
if(summaryPath){fs.mkdirSync(path.dirname(path.resolve(summaryPath)),{recursive:true});fs.writeFileSync(summaryPath,buildHumanSummary(report))}
console.log(JSON.stringify({status:report.status,campaignId:report.campaignId,sampleCount:report.sampleCount,issueCount:report.issueCount,reportHash:report.reportHash},null,2));
