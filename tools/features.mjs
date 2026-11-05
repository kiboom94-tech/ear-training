import { chromium } from 'playwright';
const b = await chromium.launch(); const errs=[];
const mk=async()=>{const ctx=await b.newContext({viewport:{width:1366,height:900}});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));return {ctx,p};};
const A=await mk(); const page=A.p;
await page.goto('http://127.0.0.1:8765/index.html#chord'); await page.waitForTimeout(500);
// 1) 틀린 문제 복습: 코드에서 일부러 틀리기 3번
await page.click('#seg-chord button[data-lv="2"]'); await page.waitForTimeout(100);
const wrongIds=[];
for(let i=0;i<3;i++){const id=await page.evaluate(()=>{const q=C.q;const w=q.types.find(t=>t!==q.id);document.querySelector(`#ch-choices .choice[data-id="${w}"]`).click();return q.id+'@'+q.root;});wrongIds.push(id);await page.click('#ch-next');}
const rv1=await page.evaluate(()=>({n:wrongQ.chord.length,btn:document.querySelector('#ch-review .rvn').textContent,dis:document.querySelector('#ch-review').disabled}));
await page.click('#ch-review'); await page.waitForTimeout(50);
const rq=await page.evaluate(()=>({q:C.q.id+'@'+C.q.root,tag:!document.querySelector('#rvtag-chord').hidden}));
await page.evaluate(()=>document.querySelector(`#ch-choices .choice[data-id="${C.q.id}"]`).click()); // 이번엔 맞힘
const rv2=await page.evaluate(()=>wrongQ.chord.length);
console.log('review chord', JSON.stringify({wrongIds,rv1,rq,rv2}));
// 멜로디·코드 진행·리듬·음정·스케일 복습 왕복
for(const [m,pre,wrong] of [['melody','mel',"M.ans=M.q.ev.map(()=> 'R');M.dur=M.q.ev.map(()=>1);melSlots();melCheck();"],['prog','pg',"G.ans=G.q.seq.map(v=>G.q.pool.find(x=>x.id!==v.id).id);pgSlots();pgCheck();"],['rhythm','rh',"if(R.q.mode==='pattern'){R.ans=R.q.meta.map(()=> 'qr');rhView();}else{R.sbars.forEach(b=>{b.ev=[ev(sigTicks(b.sig),{rest:true})];});}rhCheck();"],['interval','iv',"const w=I.q.ids.find(x=>x!==I.q.iv.id);document.querySelector(`#iv-choices .choice[data-id=\"${w}\"]`).click();"],['scale','sc',"const w=S.q.ids.find(x=>x!==S.q.id);document.querySelector(`#sc-choices .choice[data-id=\"${w}\"]`).click();"]]){
  await page.evaluate(m=>showTab(m),m);await page.waitForTimeout(80);
  const before=await page.evaluate(new Function('return JSON.stringify(QIO["'+m+'"].get())'));
  await page.evaluate(new Function(wrong));await page.click(`#${pre}-next`);await page.waitForTimeout(50);
  await page.click(`#${pre}-review`);await page.waitForTimeout(80);
  const after=await page.evaluate(new Function('return JSON.stringify(QIO["'+m+'"].get())'));
  console.log('review',m,before===after?'same question ✓':'DIFFERENT', await page.evaluate(m=>wrongQ[m].length,m));
}
// 2) 날짜별 기록·반응 시간
await page.evaluate(()=>showTab('stats')); await page.waitForTimeout(150);
console.log('hist', JSON.stringify(await page.evaluate(()=>hist[todayStr()])), (await page.textContent('#st-hist')).slice(0,60));
await page.screenshot({path:'shots/flow/pc-stats-hist.png',fullPage:false,clip:{x:0,y:400,width:1366,height:700}});
// 3) 느린 정답 → streak 안 오름
await page.evaluate(()=>showTab('chord'));await page.evaluate(()=>{chNew();adaptMode('chord').rts=[2,2,2,2,2,2];QSTART.chord=Date.now()-30000;});
const sl=await page.evaluate(()=>{const id=C.q.id;const st0=(adapt.chord.items[id]||{streak:0}).streak;document.querySelector(`#ch-choices .choice[data-id="${id}"]`).click();const it=adapt.chord.items[id];return {st0,st1:it.streak,slow:it.slow};});
console.log('slow', JSON.stringify(sl));
// 4) 베이스만 듣기, 메트로놈 음색, 이동도
await page.evaluate(()=>showTab('prog'));await page.click('#pg-bass');
for(const v of ['wood','hihat','stick','beep'])await page.selectOption('#g-click',v);
await page.selectOption('#g-naming','movable');await page.evaluate(()=>showTab('melody'));await page.waitForTimeout(80);
console.log('movable', await page.evaluate(()=>({tonic:pcName(M.q.tonic),fifth:pcName(M.q.tonic+7),b3:pcName(M.q.tonic+3),meta:document.querySelector('#mel-meta').textContent.slice(0,40)})));
await page.evaluate(()=>showTab('chord'));console.log('movable off-tab', await page.evaluate(()=>pcName(0)));
await page.selectOption('#g-naming','letter');
// 5) 코스 숙련도 표시
await page.evaluate(()=>showTab('course'));await page.click('#course-go');await page.waitForTimeout(80);
for(let i=0;i<4;i++){await page.evaluate(()=>{const m=curTab;if(m==='interval'){document.querySelector(`#iv-choices .choice[data-id="${I.q.iv.id}"]`).click();ivNew();}});}
console.log('course banner', (await page.textContent('#cb-interval')).replace(/\s+/g,' ').slice(0,120));
// 6) 동기화: 기기 A·B
const SYNC='http://127.0.0.1:8770/exec';
await page.evaluate(()=>showTab('stats'));await page.fill('#sync-code','ycd-01');await page.fill('#sync-name','김테스트');await page.fill('#sync-url',SYNC);await page.click('#sync-save');await page.waitForTimeout(800);
const aStat=await page.evaluate(()=>({status:document.querySelector('#sync-status').textContent,chordT:stats.chord.t,code:syncCfg.code}));
const B=await mk();await B.p.goto('http://127.0.0.1:8765/index.html?sync='+encodeURIComponent(SYNC)+'&code=ycd-01#interval');await B.p.waitForTimeout(500);
await B.p.evaluate(()=>{for(let i=0;i<3;i++){document.querySelector(`#iv-choices .choice[data-id="${I.q.iv.id}"]`).click();ivNew();}});
await B.p.waitForTimeout(2500); // 시작 동기화(1.5초)
const bState=await B.p.evaluate(async()=>{await syncNow(true);return {chordT:stats.chord&&stats.chord.t,ivT:stats.interval.t,url:location.href,status:document.querySelector('#sync-status').textContent.slice(0,30)};});
const aAfter=await page.evaluate(async()=>{await syncNow(true);return {chordT:stats.chord.t,ivT:stats.interval.t};});
const bAgain=await B.p.evaluate(async()=>{await syncNow(true);return {chordT:stats.chord.t,ivT:stats.interval.t};});
const dump=await (await fetch('http://127.0.0.1:8770/_dump')).json();
console.log('sync', JSON.stringify({aStat,bState,aAfter,bAgain,sum:dump.sums['YCD-01']}));
console.log('errors',errs); await b.close();
