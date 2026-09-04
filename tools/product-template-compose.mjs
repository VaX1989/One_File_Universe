const normalizeFragment=value=>value.replace(/\r\n?/g,'\n').trimEnd();

function replaceExactlyOnce(source,pattern,replacement,label){
  const matches=source.match(new RegExp(pattern.source,pattern.flags.includes('g')?pattern.flags:pattern.flags+'g'))||[];
  if(matches.length!==1)throw new Error(`product template seam ${label} expected exactly one match, found ${matches.length}`);
  return source.replace(pattern,replacement);
}

export function composeProductTemplate(template,read){
  let out=template;
  const fragment=path=>normalizeFragment(read(path));
  out=replaceExactlyOnce(out,/<nav class="workspace-nav"[\s\S]*?<\/nav><div style="height:\.75rem" aria-hidden="true"><\/div>/,fragment('src/bootstrap/product/workspace-nav.html'),'workspace-nav');
  out=replaceExactlyOnce(out,/<section class="viewport-shell"[\s\S]*?<\/section>(?=<aside class="panel")/,fragment('src/bootstrap/product/viewport.html'),'viewport');
  out=replaceExactlyOnce(out,/<section class="workspace-panel" data-workspace-panel="explore"[\s\S]*?<\/section>(?=<section class="workspace-panel" data-workspace-panel="inspect")/,fragment('src/bootstrap/product/explore-panel.html'),'explore-panel');
  out=replaceExactlyOnce(out,/<section class="workspace-panel" data-workspace-panel="inspect"[\s\S]*?<\/section>(?=<section class="workspace-panel" data-workspace-panel="lab")/,fragment('src/bootstrap/product/inspect-panel.html'),'inspect-panel');
  out=replaceExactlyOnce(out,/<section class="workspace-panel" data-workspace-panel="lab"[\s\S]*?<\/section>(?=<\/aside>)/,fragment('src/bootstrap/product/lab-panel.html'),'lab-panel');
  return out;
}
