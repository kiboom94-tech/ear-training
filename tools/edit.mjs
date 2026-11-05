import { chromium } from 'playwright';
const b = await chromium.launch(); const page = await (await b.newContext({viewport:{width:1366,height:900}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push(e.message)); page.on('console',m=>{if(m.type()==='warning'&&/staff/.test(m.text()))errs.push('warn '+m.text());});
await page.goto('http://127.0.0.1:8765/index.html#rhythm'); await page.waitForTimeout(400);
await page.click('#seg-rhythm button[data-lv="3"]'); await page.waitForTimeout(100);
// 4분 3개 입력 → 둘째 음표를 악보에서 클릭 → 8분쉼표로 교체 시도(길이 바뀜) → 성공, 길이 합 확인
for(let i=0;i<3;i++) await page.click('#rh-durpad [data-dt="48"]');
const nsvg = await page.locator('#rh-sstaff svg .vf-stavenote').count();
await page.locator('#rh-sstaff svg .vf-stavenote').nth(1).dispatchEvent('pointerdown');
const sel = await page.evaluate(()=>R.sel);
await page.click('#rh-durpad [data-dr="24"]');
const after = await page.evaluate(()=>({ev:R.sbars[0].ev.map(e=>(e.rest?'r':'n')+e.d),sel:R.sel,used:barUsed(R.sbars[0])}));
// 다시 그 음표(이제 8분쉼표)를 2분음표로 → 넘침 경고
await page.locator('#rh-sstaff svg .vf-stavenote').nth(1).dispatchEvent('pointerdown'); await page.click('#rh-durpad [data-dt="192"]');
const warn = await page.textContent('#rh-swarn');
// 취소: 같은 음표 다시 클릭
await page.locator('#rh-sstaff svg .vf-stavenote').nth(1).dispatchEvent('pointerdown');
const selAfter = await page.evaluate(()=>R.sel);
console.log('rhythm-edit', JSON.stringify({nsvg,sel,after,warn,selAfter}));
await page.screenshot({path:'shots/flow/pc-edit-rhythm.png',fullPage:true});
// 멜로디: 음 3개 입력 → 악보의 둘째 음표 클릭 → 건반 → 교체
await page.evaluate(()=>showTab('melody')); await page.click('#seg-melody button[data-lv="2"]'); await page.waitForTimeout(100);
await page.evaluate(()=>{M.ans=[M.q.ev[0].m,60,62];M.dur=[M.q.ev[0].d,1,1];melSlots();});
const mn = await page.locator('#mel-staff svg .vf-stavenote').count();
await page.locator('#mel-staff svg .vf-stavenote').nth(1).dispatchEvent('pointerdown');
const msel = await page.evaluate(()=>M.sel);
await page.locator('#mel-piano .wk').nth(4).dispatchEvent('pointerdown');
console.log('melody-edit', JSON.stringify({mn,msel,ans:await page.evaluate(()=>M.ans),sel2:await page.evaluate(()=>M.sel)}));
console.log('errors',errs); await b.close();
