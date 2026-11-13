// usage: [FONT=cairo] [TEMPLATE=intro2.html] [MB=4] node engine/render_intro.js out.mp4
//        [STILLS=0,4,12.5] node engine/render_intro.js out.mp4 stills_dir   (beats → PNGs only)
// The template exposes render(t), window.DUR, window.SFX, window.MUSIC; audio is mixed by intro_audio.py.
// MB=n renders n sub-frames per output frame across a 180° shutter and blends them (real motion blur).
const {chromium}=require('playwright');const {spawn,execFileSync}=require('child_process');const fs=require('fs');const path=require('path');
(async()=>{
 const [,,out,stills]=process.argv; const name=process.env.TEMPLATE||'intro.html'; const MB=Math.max(1,+(process.env.MB||1));
 fs.mkdirSync(path.dirname(out),{recursive:true});
 const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1080,height:1920}});
 p.on('pageerror',e=>console.error('PAGE ERROR',e.message));
 const TPL=require('./fontswap')(name); await p.goto(TPL.url);
 await p.evaluate(()=>Promise.all(['900','700','500'].map(w=>document.fonts.load(w+' 40px Thm','سيرة abc 123'))).then(()=>document.fonts.ready));
 await p.evaluate(()=>Promise.all([...document.images].map(i=>i.complete?1:new Promise(r=>i.onload=r))));
 await p.waitForTimeout(400);
 const {DUR,SFX,MUSIC}=await p.evaluate(()=>({DUR:window.DUR,SFX:window.SFX,MUSIC:window.MUSIC}));
 if(stills){fs.mkdirSync(stills,{recursive:true});const B=60/122.006;
   const list=(process.env.STILLS||'0,3.6,5,8.5,10.5,13,16,21,24,29,31,33,35,38,41,43,46,49,53,56.3,60,62,66,70').split(',').map(Number);
   for(const bb of list){await p.evaluate(t=>render(t),bb*B);await p.screenshot({path:path.join(stills,`b${bb.toFixed(2).padStart(6,'0')}.png`)});}
   await b.close();TPL.cleanup();return;}
 const evf=out+'.events.json',wav=out+'.wav';
 fs.writeFileSync(evf,JSON.stringify({duration:DUR,music:MUSIC,sfx:SFX}));
 execFileSync('python3',[path.join(__dirname,'intro_audio.py'),evf,wav],{stdio:'inherit'});
 const fps=30,n=Math.ceil(DUR*fps);
 const vf=MB>1?['-vf',`tmix=frames=${MB},select='not(mod(n\\,${MB}))',setpts=N/${fps}/TB`]:[];
 const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate',''+fps*MB,'-i','-','-i',wav,...vf,'-r',''+fps,'-shortest',
  '-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart',out]);
 // sub-frames of output frame i: t = (i - 0.5*(MB-1)/MB*0.5... ) keep them centred on i/fps inside a half-frame shutter; frame 0 stays exact
 for(let i=0;i<n;i++){for(let k=0;k<MB;k++){const t=Math.max(0,i/fps-(MB-1-k)*(0.5/fps)/MB);
   await p.evaluate(t=>render(t),t);const buf=await p.screenshot({type:'jpeg',quality:92});if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));}}
 ff.stdin.end();await new Promise(r=>ff.on('close',r));fs.unlinkSync(evf);fs.unlinkSync(wav);
 await b.close();TPL.cleanup();console.log('done',out,DUR.toFixed(1)+'s');
})();
