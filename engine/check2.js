const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{const files=process.argv.slice(2);const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
await p.goto('file://'+path.resolve(__dirname,'template2.html'));
await p.evaluate(()=>Promise.all(['900','700','500'].map(w=>document.fonts.load(w+' 40px Thm','سيرة abc 123'))));
let bad=0;
for(const f of files){for(const d of JSON.parse(fs.readFileSync(f))){await p.evaluate(d=>setup(d),d);
 const r=await p.evaluate(()=>{const out=[];S.forEach((s,k)=>{render(s.a+1.5);const big=parseInt($('#big').style.fontSize),sm=parseInt($('#small').style.fontSize);
   const ov=[...s.el.querySelectorAll('.row, .cmp .card, .card')].some(e=>e.scrollWidth>e.clientWidth+2||e.scrollHeight>e.clientHeight+2);
   const h=s.el.firstElementChild?s.el.firstElementChild.getBoundingClientRect().height:0;
   if(big<84||sm<46||ov||h>950) out.push({k,type:s.type,big,sm,ov,h:Math.round(h)});});return out});
 if(r.length){bad++;console.log(path.basename(f),d.num,JSON.stringify(r));}}}
await b.close();console.log('issues:',bad);})();
