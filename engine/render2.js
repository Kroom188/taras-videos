// usage: node engine/render2.js content.json outDir [onlyId]   (PREVIEW=1 -> also PNG stills)
const {chromium}=require('playwright');const {spawn,execFileSync}=require('child_process');const fs=require('fs');const path=require('path');
(async()=>{
 const [,,dataFile,outDir,only]=process.argv; const items=JSON.parse(fs.readFileSync(dataFile));
 fs.mkdirSync(outDir,{recursive:true});
 const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1080,height:1920}});
 await p.goto('file://'+path.resolve(__dirname,'template2.html'));
 await p.evaluate(()=>Promise.all(['900','700','500'].map(w=>document.fonts.load(w+' 40px Thm','سيرة abc 123'))));
 for(const d of items){ if(only&&d.id!==only)continue;
  await p.evaluate(d=>setup(d),d);
  const {DUR,EV}=await p.evaluate(()=>({DUR:window.DUR,EV:window.EVENTS}));
  const evf=path.join(outDir,`events_${d.id}.json`), wav=path.join(outDir,`audio_${d.id}.wav`);
  fs.writeFileSync(evf,JSON.stringify({duration:DUR,events:EV}));
  execFileSync('python3',[path.join(__dirname,'audio2.py'),evf,wav]);
  const fps=30,n=Math.ceil(DUR*fps),out=path.join(outDir,`video_${d.id}.mp4`);
  const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate',''+fps,'-i','-','-i',wav,'-shortest',
   '-c:v','libx264','-preset','medium','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-movflags','+faststart',out]);
  for(let i=0;i<n;i++){ await p.evaluate(t=>render(t),i/fps); const buf=await p.screenshot({type:'jpeg',quality:92}); if(!ff.stdin.write(buf)) await new Promise(r=>ff.stdin.once('drain',r)); }
  ff.stdin.end(); await new Promise(r=>ff.on('close',r)); fs.unlinkSync(evf); fs.unlinkSync(wav);
  console.log('done',out,DUR.toFixed(1)+'s');
 }
 await b.close();
})();
