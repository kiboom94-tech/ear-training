import { chromium } from 'playwright';
const b = await chromium.launch(); const page = await (await b.newContext({viewport:{width:1366,height:900}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto('http://127.0.0.1:8765/index.html#chord'); await page.waitForTimeout(400);
// 코드 보통: 항상 'm7'을 고름 → m7 외 항목은 틀림, 착각 쌍 기록
await page.click('#seg-chord button[data-lv="2"]'); await page.waitForTimeout(100);
for(let i=0;i<25;i++){ await page.evaluate(()=>{const b=document.querySelector('#ch-choices .choice[data-id="m7"]');b.click();}); await page.evaluate(()=>chNew()); }
const ch = await page.evaluate(()=>{const A=adapt.chord;return {n:A.n, items:Object.fromEntries(Object.entries(A.items).map(([k,v])=>[k,{t:v.t,c:v.c,st:adaptState('chord',k),w:+adaptWeight('chord',k).toFixed(2),conf:v.conf}]))}});
console.log('chord', JSON.stringify(ch));
// 출제 빈도: 100문제 생성 시 m7(익힘) 대 나머지
const freq = await page.evaluate(()=>{const f={};for(let i=0;i<300;i++){SILENT=true;chNew();SILENT=false;f[C.q.id]=(f[C.q.id]||0)+1;}return f;});
console.log('freq', JSON.stringify(freq));
// 멜로디: 정답을 그대로 입력(모두 맞음) 3문제 → 도수 익힘 상태 확인, 리듬 틀리게 1문제
await page.evaluate(()=>showTab('melody')); await page.click('#seg-melody button[data-lv="2"]'); await page.waitForTimeout(100);
for(let r=0;r<4;r++){ await page.evaluate((r)=>{M.ans=M.q.ev.map(e=>e.m==null?"R":e.m);M.dur=M.q.ev.map(e=>r===3?1:e.d);melSlots();},r); await page.click('#mel-check'); await page.waitForTimeout(50); await page.evaluate(()=>melNew()); }
console.log('melody', await page.evaluate(()=>Object.entries(adapt.melody.items).map(([k,v])=>`${k}:${v.c}/${v.t}:${adaptState('melody',k)}`).join(' ')));
// 리듬 악보: 전부 4분음표로 채움 → 박 안 위치 기록
await page.evaluate(()=>showTab('rhythm')); await page.click('#seg-rhythm button[data-lv="3"]'); await page.waitForTimeout(100);
for(let b2=0;b2<40;b2++){const done=await page.evaluate(()=>R.sbars.every(x=>barUsed(x)>=sigTicks(x.sig)-0.01));if(done)break;const fam=await page.evaluate(()=>SIGS[R.sbars[R.sbar].sig].fam);await page.click(fam==='compound'?'#rh-durpad [data-dt="24"]':'#rh-durpad [data-dt="48"]');}
await page.click('#rh-check'); await page.waitForTimeout(50);
console.log('rhythm', await page.evaluate(()=>Object.entries(adapt.rhythm.items).map(([k,v])=>`${k}:${v.c}/${v.t}`).join(' ')));
// 코드 진행
await page.evaluate(()=>showTab('prog')); await page.click('#seg-prog button[data-lv="2"]'); await page.waitForTimeout(100);
await page.evaluate(()=>{G.ans=G.q.seq.map(v=>v.id);G.ans[G.ans.length-1]=G.q.pool.find(x=>x.id!==G.ans[G.ans.length-1]).id;pgSlots();}); await page.click('#pg-check'); await page.waitForTimeout(50);
console.log('prog', await page.evaluate(()=>Object.entries(adapt.prog.items).map(([k,v])=>`${k}:${v.c}/${v.t}`).join(' ')));
// 음정·스케일 한 번씩
await page.evaluate(()=>showTab('interval')); await page.locator('#iv-choices .choice').nth(0).click(); await page.waitForTimeout(50);
await page.evaluate(()=>showTab('scale')); await page.locator('#sc-choices .choice').nth(0).click(); await page.waitForTimeout(50);
console.log('iv/sc', await page.evaluate(()=>Object.keys(adapt.interval.items).join(' ')+' | '+Object.keys(adapt.scale.items).join(' ')));
// 기록 화면
await page.evaluate(()=>showTab('stats')); await page.waitForTimeout(200);
await page.screenshot({path:'shots/flow/pc-stats-adapt.png',fullPage:true});
console.log('stats text', (await page.textContent('#st-conf')).slice(0,120));
console.log('errors', errs); await b.close();
