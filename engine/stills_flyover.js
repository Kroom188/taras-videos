const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('file://'+__dirname+'/flyover.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(600);
const ts=process.argv.slice(2).map(Number);
for(const t of ts){await p.evaluate(t=>render(t),t);await p.waitForTimeout(+(process.env.W||0));await p.screenshot({path:'/tmp/claude-0/-home-user-taras-videos/d2d5509f-2e53-5eb4-9d7f-7af198098b19/scratchpad/ref/f_'+String(t).padStart(5,'0')+'.jpg',type:'jpeg',quality:70});}
await b.close()})();
