const {chromium}=require('playwright');const fs=require('fs');const path=require('path');const {execSync}=require('child_process');
(async()=>{const [,,f,out]=process.argv;const items=JSON.parse(fs.readFileSync(f));fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
const TPL=require('./fontswap')('template2.html'); await p.goto(TPL.url);
await p.evaluate(()=>Promise.all(['900','700','500'].map(w=>document.fonts.load(w+' 40px Thm','سيرة abc 123'))));
for(const d of items){await p.evaluate(d=>setup(d),d);
 const ts=await p.evaluate(()=>{const S=[];let t=0;return window.EVENTS.filter(e=>e.type==='impact'||e.type==='whoosh').map(e=>e.t)});
 const shots=ts.map((a,i)=>a+(i<ts.length-1?ts[i+1]-a-0.45:3.4));
 for(let i=0;i<shots.length;i++){await p.evaluate(t=>render(t),shots[i]);await p.screenshot({path:`${out}/${d.id}_${i}.png`});}
 execSync(`ffmpeg -y -loglevel error ${shots.map((_,i)=>`-i ${out}/${d.id}_${i}.png`).join(' ')} -filter_complex "hstack=${shots.length},scale=1800:-1" ${out}/sheet_${d.id}.png`);}
await b.close(); TPL.cleanup();})();
