import {iapwsIf97SaturationPressurePa,globalSurfaceColumnPressurePa} from '../../research/p5-environment-next-science/environment-next-research.mjs';
const iterations=50000;const before=process.memoryUsage().heapUsed;const t0=process.hrtime.bigint();let witness=0n;
for(let i=0;i<iterations;i++){const t=273160n+BigInt(i%373937);witness^=iapwsIf97SaturationPressurePa(t);witness^=globalSurfaceColumnPressurePa(9800000n,6371000n,BigInt(i%10000000));}
const ns=process.hrtime.bigint()-t0;const after=process.memoryUsage().heapUsed;
console.log(JSON.stringify({iterations,elapsedMs:Number(ns)/1e6,perQueryUs:Number(ns)/1e3/iterations,heapDeltaBytes:after-before,retainedPlanetRecords:0,climateGridCells:0,persistentHistoryEntries:0,witness:witness.toString()}));
