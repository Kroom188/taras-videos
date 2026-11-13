// usage: [FONT=cairo] node engine/render_banner.js out_dir
// Writes youtube-banner.png (2560x1440, upload this) and a preview with the device-safe guides.
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{
 const out=process.argv[2]||'youtube';fs.mkdirSync(out,{recursive:true});
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:2560,height:1440}});
 const TPL=require('./fontswap')('youtube_banner.html');await p.goto(TPL.url);
 await p.evaluate(()=>Promise.all(['900','700','500'].map(w=>document.fonts.load(w+' 40px Thm','سيرة'))).then(()=>document.fonts.ready));
 await p.evaluate(()=>Promise.all([...document.images].map(i=>i.complete?1:new Promise(r=>i.onload=r))));
 await p.evaluate(()=>fitAll());
 await p.screenshot({path:path.join(out,'youtube-banner.png')});
 await p.evaluate(()=>document.body.classList.add('guides'));
 await p.screenshot({path:path.join(out,'youtube-banner-guides.png')});
 await b.close();TPL.cleanup();console.log('done');
})();
