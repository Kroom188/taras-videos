// usage: [FONT=cairo] node engine/render_intro.js out.mp4 [stills_dir]
const {chromium}=require('playwright');const {spawn,execFileSync}=require('child_process');const fs=require('fs');const path=require('path');
(async()=>{
 const [,,out,stills]=process.argv; fs.mkdirSync(path.dirname(out),{recursive:true});
 const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1080,height:1920}});
 const TPL=require('./fontswap')('intro.html'); await p.goto(TPL.url);
 await p.evaluate(()=>Promise.all(['900','700','500'].map(w=>document.fonts.load(w+' 40px Thm','سيرة abc 123'))).then(()=>document.fonts.ready));
 await p.waitForTimeout(300);
 const {DUR,SFX,MUSIC}=await p.evaluate(()=>({DUR:window.DUR,SFX:window.SFX,MUSIC:window.MUSIC}));
 if(stills){fs.mkdirSync(stills,{recursive:true});const B=60/122.006;
   for(const bb of [0,3.6,5,8,11.5,14,16.5,20,26,32,37,39.5,43,47]){await p.evaluate(t=>render(t),bb*B);await p.screenshot({path:path.join(stills,`b${String(bb).padStart(4,'0')}.png`)});}
   await b.close();TPL.cleanup();return;}
 const evf=out+'.events.json',wav=out+'.wav';
 fs.writeFileSync(evf,JSON.stringify({duration:DUR,music:MUSIC,sfx:SFX}));
 execFileSync('python3',[path.join(__dirname,'intro_audio.py'),evf,wav],{stdio:'inherit'});
 const fps=30,n=Math.ceil(DUR*fps);
 const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate',''+fps,'-i','-','-i',wav,'-shortest',
  '-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart',out]);
 for(let i=0;i<n;i++){await p.evaluate(t=>render(t),i/fps);const buf=await p.screenshot({type:'jpeg',quality:93});if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));}
 ff.stdin.end();await new Promise(r=>ff.on('close',r));fs.unlinkSync(evf);fs.unlinkSync(wav);
 await b.close();TPL.cleanup();console.log('done',out,DUR.toFixed(1)+'s');
})();
