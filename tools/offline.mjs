import { chromium } from 'playwright';
const b = await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844}}); const p=await ctx.newPage(); const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8765/index.html#melody'); await p.waitForTimeout(800);
await p.click('#mel-play'); // 소리 샘플 받기 시작
await p.waitForFunction(()=>navigator.serviceWorker.controller||null,null,{timeout:8000}).catch(()=>{});
await p.reload(); await p.waitForTimeout(2500);
const c1=await p.evaluate(async()=>{const ks=await caches.keys();const out={};for(const k of ks){out[k]=(await (await caches.open(k)).keys()).length;}return {ctrl:!!navigator.serviceWorker.controller,out};});
await ctx.setOffline(true); await p.reload(); await p.waitForTimeout(1500);
const off=await p.evaluate(()=>({title:document.title,tabs:document.querySelectorAll('#tabs button').length,vex:!!window.Vex,staff:!!document.querySelector('#mel-staff svg'),samples:Object.keys(SB.piano).length}));
console.log(JSON.stringify({c1,off,errs}));await b.close();
