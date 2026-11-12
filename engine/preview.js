const {chromium}=require('playwright');const fs=require('fs');const path=require('path');const {execSync}=require('child_process');
(async()=>{const [,,f,out,times='1.6,7.5,13,16']=process.argv;const items=JSON.parse(fs.readFileSync(f));fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
await p.goto('file://'+path.resolve(__dirname,'template.html'));
for(const d of items){await p.evaluate(d=>setup(d),d);await p.evaluate(()=>document.fonts.ready);const ts=times.split(',');
for(const s of ts){await p.evaluate(t=>render(t),+s);await p.screenshot({path:`${out}/${d.id}_${s}.png`});}
execSync(`ffmpeg -y -loglevel error ${ts.map(s=>`-i ${out}/${d.id}_${s}.png`).join(' ')} -filter_complex "hstack=${ts.length},scale=1600:-1" ${out}/sheet_${d.id}.png`);}
await b.close();})();
