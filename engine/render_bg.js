// usage: node engine/render_bg.js engine/studio_bg.html out.mp4 [seconds] [still.png]
const {chromium}=require('playwright');const {spawn}=require('child_process');const path=require('path');
(async()=>{const [,,tpl,out,secs='23',still]=process.argv;const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
await p.goto('file://'+path.resolve(tpl));await p.waitForTimeout(400);
if(still){await p.evaluate(()=>render(2));await p.screenshot({path:still});}
if(out!=='-'){const fps=30,n=Math.round(+secs*fps);
const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate',''+fps,'-i','-','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',out]);
for(let i=0;i<n;i++){await p.evaluate(t=>render(t),i/fps);const buf=await p.screenshot({type:'jpeg',quality:92});if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));}
ff.stdin.end();await new Promise(r=>ff.on('close',r));}
await b.close();})();
