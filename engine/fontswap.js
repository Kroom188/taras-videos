// FONT=cairo -> render with the free Cairo font (node_modules/@fontsource/cairo) instead of Thmanyah.
// Returns the template URL to load. Writes a temporary copy next to the template so relative assets still resolve.
const fs=require('fs');const path=require('path');
const AR='U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0898-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC';
module.exports=function templateUrl(name){
  const src=path.resolve(__dirname,name);
  if(process.env.FONT!=='cairo') return {url:'file://'+src,cleanup(){}};
  const f='node_modules/@fontsource/cairo/files/cairo';
  const css=['900','700','500'].map(w=>`@font-face{font-family:Thm;font-weight:${w};src:url(${f}-latin-${w}-normal.woff2)}@font-face{font-family:Thm;font-weight:${w};src:url(${f}-arabic-${w}-normal.woff2);unicode-range:${AR}}`).join('\n');
  const html=fs.readFileSync(src,'utf8').replace(/@font-face\{font-family:Thm;[^}]*\}\n?/g,'').replace('<style>','<style>\n'+css+'\n');
  const tmp=path.resolve(__dirname,'_cairo_'+name); fs.writeFileSync(tmp,html);
  return {url:'file://'+tmp,cleanup(){try{fs.unlinkSync(tmp)}catch(e){}}};
};
