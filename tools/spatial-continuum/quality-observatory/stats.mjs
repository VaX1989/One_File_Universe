const finite = values => values.filter(Number.isFinite).map(Number).sort((a,b)=>a-b);

export const clamp01 = value => Math.max(0, Math.min(1, value));

export const quantile = (values, q) => {
  const xs=finite(values);
  if(!xs.length)return null;
  if(xs.length===1)return xs[0];
  const position=(xs.length-1)*Math.max(0,Math.min(1,q));
  const lower=Math.floor(position),upper=Math.ceil(position),weight=position-lower;
  return xs[lower]*(1-weight)+xs[upper]*weight;
};

export const median = values => quantile(values,0.5);

export const mad = values => {
  const center=median(values);
  if(center===null)return null;
  return median(finite(values).map(value=>Math.abs(value-center)));
};

export const summarizeDistribution = values => {
  const xs=finite(values);
  return xs.length?{
    samples:xs.length,
    min:xs[0],
    p50:quantile(xs,0.5),
    p95:quantile(xs,0.95),
    p99:quantile(xs,0.99),
    max:xs.at(-1)
  }:{samples:0,min:null,p50:null,p95:null,p99:null,max:null};
};

export const robustOutlierIndexes = (values, zLimit=4.5) => {
  const numeric=values.map(value=>Number.isFinite(value)?Number(value):null);
  const xs=numeric.filter(value=>value!==null);
  if(xs.length<5)return [];
  const center=median(xs),spread=mad(xs);
  if(!Number.isFinite(spread)||spread===0)return [];
  const scale=1.4826*spread;
  const out=[];
  numeric.forEach((value,index)=>{
    if(value===null)return;
    const z=Math.abs(value-center)/scale;
    if(z>zLimit)out.push({index,value,robustZ:z,median:center,mad:spread,zLimit});
  });
  return out;
};

export const relativeGrowth = (start,end) => {
  if(!Number.isFinite(start)||!Number.isFinite(end))return null;
  if(start===0)return end===0?0:null;
  return (end-start)/Math.abs(start);
};
