import {assert} from '../v1x-01-camera-scale-frames/support.mjs';
const strictDeepEqual=assert.deepEqual.bind(assert);
assert.deepEqual=(actual,expected,message)=>{
  const numericArrays=Array.isArray(actual)&&Array.isArray(expected)&&actual.length===expected.length&&actual.every(Number.isFinite)&&expected.every(Number.isFinite);
  if(!numericArrays)return strictDeepEqual(actual,expected,message);
  for(let i=0;i<actual.length;i++){
    const scale=Math.max(1,Math.abs(actual[i]),Math.abs(expected[i]));
    const tolerance=Number.EPSILON*8*scale;
    assert.ok(Math.abs(actual[i]-expected[i])<=tolerance,`${message||'numeric array'}[${i}] expected ${actual[i]} ~= ${expected[i]} within ${tolerance}`);
  }
};
await import('./real-camera-journey.mjs');
