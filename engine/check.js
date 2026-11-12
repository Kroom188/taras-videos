// layout check for many content files: prints items whose text had to shrink a lot or overflows
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{const files=process.argv.slice(2);const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
await p.goto('file://'+path.resolve(__dirname,'template.html'));
await p.evaluate(()=>Promise.all(['900','700','500'].map(w=>document.fonts.load(w+' 40px Thm','سيرة abc 123'))));
for(const f of files){for(const d of JSON.parse(fs.readFileSync(f))){await p.evaluate(d=>setup(d),d);
 const r=await p.evaluate(()=>({hook:[...document.querySelectorAll('.hook .ln')].map(l=>parseInt(l.style.fontSize)),fact:parseInt(document.getElementById('fact').style.fontSize),
  card:document.getElementById('detail').getBoundingClientRect().height, rowsW:Math.max(...[...document.querySelectorAll('.row')].map(r=>r.scrollWidth-r.clientWidth),0)}));
 const bad=r.hook.some(s=>s<76)||r.fact<64||r.card>900||r.rowsW>2;
 if(bad) console.log(path.basename(f),d.id,JSON.stringify(r),d.hook.replace('<br>',' / '));}}
await b.close();console.log('checked');})();
