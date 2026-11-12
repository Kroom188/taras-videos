const {chromium}=require('playwright');const {spawn}=require('child_process');const fs=require('fs');const path=require('path');
(async()=>{
 const [,,dataFile,outDir,only]=process.argv; const items=JSON.parse(fs.readFileSync(dataFile));
 fs.mkdirSync(outDir,{recursive:true});
 const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1080,height:1920}});
 await p.goto('file://'+path.resolve(__dirname,'template.html'));await p.evaluate(()=>Promise.all(['900','700','500'].map(w=>document.fonts.load(w+' 40px Thm','سيرة abc 123')))); await p.evaluate(()=>document.fonts.ready);
 for(const d of items){ if(only&&d.id!==only)continue;
  await p.evaluate(d=>setup(d),d); await p.evaluate(()=>document.fonts.ready);
  const fps=30,n=d.duration*fps,out=path.join(outDir,`video_${d.id}.mp4`);
  const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate',''+fps,'-i','-',
   '-i',(fs.existsSync(path.join(outDir,`audio_${d.id}.wav`))?path.join(outDir,`audio_${d.id}.wav`):path.join(__dirname,'bg_music.wav')),'-shortest',
   '-c:v','libx264','-preset','medium','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-movflags','+faststart',out]);
  for(let i=0;i<n;i++){ await p.evaluate(t=>render(t),i/fps); const buf=await p.screenshot({type:'jpeg',quality:92}); if(!ff.stdin.write(buf)) await new Promise(r=>ff.stdin.once('drain',r)); }
  ff.stdin.end(); await new Promise(r=>ff.on('close',r));
  if(process.env.PREVIEW) for(const s of [1.5,7,12,15.5]){await p.evaluate(t=>render(t),s);await p.screenshot({path:path.join(outDir,`frame_${d.id}_${s}.png`)});}
  console.log('done',out);
 }
 await b.close();
})();
