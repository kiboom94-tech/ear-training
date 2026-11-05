import { chromium } from 'playwright';
const b = await chromium.launch(); const page = await (await b.newContext({viewport:{width:1366,height:900}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push(e.message)); page.on('console',m=>{if(m.type()==='warning'&&/staff|icon/.test(m.text()))errs.push('warn '+m.text());});
await page.goto('http://127.0.0.1:8765/index.html#rhythm'); await page.waitForTimeout(400);
await page.click('#seg-rhythm button[data-lv="4"]'); await page.waitForTimeout(100);
// 설정: 5·6·7연음 켜기
await page.evaluate(()=>{['t5','t6','t7'].forEach(k=>{document.querySelector(`#rh-vals input[data-v="${k}"]`).checked=true;});document.querySelector('#rh-sigs').dispatchEvent(new Event('change',{bubbles:true}));});
await page.waitForTimeout(100);
// 출제 100마디: 연음 포함 여부·마디 길이 확인
const gen = await page.evaluate(()=>{const cnt={3:0,5:0,6:0,7:0};let bad=0;for(let i=0;i<60;i++){SILENT=true;rhNew();SILENT=false;R.q.bars.forEach(b=>{const tot=b.ev.reduce((a,e)=>a+e.d,0);if(Math.abs(tot-sigTicks(b.sig))>0.01)bad++;const seen=new Set();b.ev.forEach(e=>{if(e.tg&&!seen.has(e.tg)){seen.add(e.tg);cnt[e.tn||3]++;}});});}return {cnt,bad};});
console.log('gen', JSON.stringify(gen));
// 연음이 든 문제를 찾아 화면 캡처
await page.evaluate(()=>{for(let i=0;i<80;i++){SILENT=true;rhNew();SILENT=false;if(R.q.bars.some(b=>b.ev.some(e=>e.tn>=5)))break;}});
// 입력: 5연음 → 16분 5개, 7연음 → 16분 7개, 3연음 → 8분 3개
await page.click('#rh-durpad [data-tup="5"]'); for(let i=0;i<5;i++) await page.click('#rh-durpad [data-dt="12"]');
const s1 = await page.evaluate(()=>({used:barUsed(R.sbars[0]),tup:R.mod.tup,open:!!openTrip(R.sbars[0]),n:R.sbars[0].ev.length}));
await page.click('#rh-durpad [data-tup="7"]'); for(let i=0;i<3;i++) await page.click('#rh-durpad [data-dt="12"]');
await page.click('#rh-durpad [data-tup="5"]'); await page.click('#rh-durpad [data-dt="12"]'); const warn=await page.textContent('#rh-swarn');
await page.click('#rh-durpad [data-tup="7"]'); for(let i=0;i<4;i++) await page.click('#rh-durpad [data-dt="12"]');
await page.click('#rh-durpad [data-tup="3"]'); for(let i=0;i<3;i++) await page.click('#rh-durpad [data-dt="24"]');
const s2 = await page.evaluate(()=>({used:barUsed(R.sbars[0]),tup:R.mod.tup,bar:R.sbar,ghost:ghostFill(R.sbars[0]).length,sig:R.sbars[0].sig}));
console.log('input', JSON.stringify({s1,warn,s2}));
await page.screenshot({path:'shots/flow/pc-tuplet-score.png',fullPage:true});
// 정답을 그대로 베껴 채점 → 전부 맞아야 함
await page.evaluate(()=>{R.sbars=R.q.bars.map(b=>({sig:b.sig,ev:b.ev.map(e=>Object.assign({},e))}));sRender();}); await page.click('#rh-check'); await page.waitForTimeout(50);
console.log('copy-check', await page.textContent('#rh-fb'));
// 빠른 입력: 5·6·7연음 패턴
await page.click('#rh-next'); await page.evaluate(()=>{document.querySelector('#rh-input').value='pattern';document.querySelector('#rh-input').dispatchEvent(new Event('change',{bubbles:true}));}); await page.waitForTimeout(100);
await page.evaluate(()=>{['t5','t6','t7'].forEach(k=>{document.querySelector(`#rh-pats input[data-v="${k}"]`).checked=true;});document.querySelector('#rh-pats').dispatchEvent(new Event('change',{bubbles:true}));}); await page.waitForTimeout(100);
const pal = await page.evaluate(()=>({n:document.querySelectorAll('#rh-palette .pat').length, icons:['t5','t6','t7'].map(id=>!!document.querySelector(`#rh-palette .pat[data-id="${id}"] svg`))}));
await page.evaluate(()=>{R.ans=R.q.meta.map((m,i)=>['t5','t6','t7'][i%3]);rhView();}); await page.click('#rh-check'); await page.waitForTimeout(50);
console.log('pattern', JSON.stringify(pal), (await page.textContent('#rh-fb')).slice(0,30));
await page.screenshot({path:'shots/flow/pc-tuplet-pattern.png',fullPage:true});
// 메트로놈 모드 재생 호출
for (const mm of ['off','fade','same','first']) { await page.evaluate(m=>{document.querySelector('#rh-metromode').value=m;document.querySelector('#rh-metrovol').value=1.2;rhPlayQ();},mm); }
console.log('errors', errs); await b.close();
