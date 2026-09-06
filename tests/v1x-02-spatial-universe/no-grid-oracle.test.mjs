import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const productionRoot=path.join(root,'src/v1x-02-spatial-universe');
const files=fs.readdirSync(productionRoot).filter(name=>name.endsWith('.js')).sort();
assert.ok(files.length>0,'spatial production sources missing');
const patterns=[
  ['macro-axis-token',/macro\s*row|macro\s*col(?:umn)?/i],
  ['primary-axis-index',/\brow(?:Index|Number|Offset)|\b(?:col|column)(?:Index|Number|Offset|Count)s?\b/i],
  ['modulo-axis-placement',/%\s*(?:cols?|columns?|columnCount)\b/i],
  ['quotient-axis-placement',/Math\.floor\s*\(\s*[A-Za-z_$][\w$]*\s*\/\s*(?:cols?|columns?|columnCount)\b/i],
  ['named-primary-lattice',/primary(?:Grid|Lattice)|layout(?:Grid|Rows|Columns)/i]
];
const violations=[];
for(const name of files){const source=fs.readFileSync(path.join(productionRoot,name),'utf8');for(const [label,re] of patterns)if(re.test(source))violations.push(name+':'+label);assert.match(source,/\bz\s*:/,'source must materially emit a z coordinate');}
assert.deepEqual(violations,[],'forbidden primary planar placement assumptions returned');
console.log(JSON.stringify({status:'PASS',oracle:'v1x02-no-primary-planar-index-layout',filesScanned:files.length,violations:0,requiresThreeDimensionalCoordinateEmission:true}));
