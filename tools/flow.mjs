// 모든 탭 × 난이도 × (PC·휴대폰) 실행 테스트: 문제 생성 → 답 입력 → 채점까지. 오류와 피드백 문구를 기록한다
import { chromium, devices } from 'playwright';
const out = process.argv[2] || 'shots/flow'; const only = process.argv[3];
const browser = await chromium.launch(); const errors = []; const log = [];
const modes = ['melody','chord','prog','rhythm','scale','interval'];
for (const [vp, opts] of [['pc', { viewport: { width: 1366, height: 900 } }], ['ph', { ...devices['iPhone 12'], viewport:{width:390,height:844} }]]) {
  if (only && only !== vp) continue;
  const ctx = await browser.newContext({ ...opts, deviceScaleFactor: 1 }); const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`${vp}: ${e.message}`));
  page.on('console', m => { if ((m.type() === 'error' || m.type()==='warning') && !/AudioContext was not allowed/.test(m.text())) errors.push(`${vp} console: ${m.text().slice(0,200)}`); });
  await page.goto('http://127.0.0.1:8765/index.html#course', { waitUntil: 'load' }); await page.waitForTimeout(500);
  for (const mode of modes) {
    await page.evaluate(m => showTab(m), mode); await page.waitForTimeout(100);
    for (const lv of [1,2,3,4]) {
      await page.click(`#seg-${mode} button[data-lv="${lv}"]`); await page.waitForTimeout(150);
      // 가로 넘침 검사
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (over > 2) log.push(`${vp} ${mode} lv${lv}: 가로 넘침 ${over}px`);
      await page.screenshot({ path: `${out}/${vp}-${mode}-${lv}.png`, fullPage: true });
      try {
        if (['chord','scale','interval'].includes(mode)) {
          const pre = {chord:'ch',scale:'sc',interval:'iv'}[mode];
          const n = await page.locator(`#${pre}-choices .choice`).count();
          // 접힌 그룹도 열어서 선택
          await page.evaluate(p => document.querySelectorAll(`#${p}-choices details`).forEach(d => d.open = true), pre);
          await page.locator(`#${pre}-choices .choice`).nth(Math.floor(n/2)).click();
          await page.waitForTimeout(100);
          const fb = await page.textContent(`#${pre}-fb`); const cmp = await page.locator(`#${pre}-cmp .btn`).count();
          log.push(`${vp} ${mode} lv${lv}: 보기 ${n}개 · 피드백 "${fb.slice(0,40)}" · 비교버튼 ${cmp}`);
        } else if (mode === 'melody') {
          const info = await page.evaluate(() => ({ L: M.q.ev.length, rhy: melRhy(), show: melShowCount(), durbar: !document.querySelector('#mel-durbar').hidden, keys: document.querySelectorAll('#mel-piano .wk').length, pad: M.q.pad, total: M.q.ev.reduce((a,e)=>a+e.d,0), vals: checked(document.querySelector('#mel-vals')).join(',') }));
          // 건반 입력: 답 길이만큼 (칸 수 숨김이면 정답 개수만큼)
          for (let i = (await page.evaluate(() => M.ans.length)); i < info.L; i++) {
            if (info.rhy && i % 3 === 2) await page.click('#mel-durbar [data-rb="1"]');
            else await page.locator('#mel-piano .wk').nth(i % 5).dispatchEvent('pointerdown');
          }
          await page.click('#mel-check'); await page.waitForTimeout(100);
          const fb = await page.textContent('#mel-fb'); const cmp = await page.locator('#mel-cmp .btn').count();
          log.push(`${vp} ${mode} lv${lv}: 칸 ${info.L} · 리듬 ${info.rhy} · 칸수표시 ${info.show} · 입력판 ${info.durbar} · 흰건반 ${info.keys} · 총박 ${info.total}+${info.pad} · 출제 ${info.vals} · "${fb.slice(0,40)}" · 비교 ${cmp}`);
          if (lv === 4 || lv === 1) await page.screenshot({ path: `${out}/${vp}-${mode}-${lv}-done.png`, fullPage: true });
        } else if (mode === 'prog') {
          const n = await page.evaluate(() => G.q.seq.length);
          await page.evaluate(() => document.querySelectorAll('#pg-palette details').forEach(d => d.open = true));
          for (let i = 0; i < n; i++) { await page.locator('#pg-palette .choice').nth(i % 3).click(); await page.waitForTimeout(30); }
          await page.click('#pg-check'); await page.waitForTimeout(100);
          const fb = await page.textContent('#pg-fb'); const cmp = await page.locator('#pg-cmp .btn').count(); const pal = await page.locator('#pg-palette .choice').count();
          log.push(`${vp} ${mode} lv${lv}: 코드 ${n}개 · 보기 ${pal} · "${fb.slice(0,40)}" · 비교 ${cmp}`);
          if (lv === 4) await page.screenshot({ path: `${out}/${vp}-${mode}-${lv}-done.png`, fullPage: true });
        } else if (mode === 'rhythm') {
          const info = await page.evaluate(() => ({ mode: R.q.mode, n: R.ans.length, pats: document.querySelectorAll('#rh-palette .pat').length, bars: R.q.bars.map(b=>b.sig).join(' ') }));
          if (info.mode === 'pattern') { for (let i = 0; i < info.n; i++) { await page.locator('#rh-palette .pat').nth(i % 4).click(); await page.waitForTimeout(20); } }
          else { // 악보 입력: 각 마디를 4분음표로 채움 (겹박자는 8분)
            for (let b = 0; b < 40; b++) { const done = await page.evaluate(() => R.sbars.every(x => barUsed(x) >= sigTicks(x.sig) - 0.01)); if (done) break;
              const fam = await page.evaluate(() => SIGS[R.sbars[R.sbar].sig].fam); await page.click(fam === 'compound' || fam==='odd' ? '#rh-durpad [data-dt="24"]' : '#rh-durpad [data-dt="48"]'); await page.waitForTimeout(15); } }
          await page.click('#rh-check'); await page.waitForTimeout(100);
          const fb = await page.textContent('#rh-fb'); const cmp = await page.locator('#rh-cmp .btn').count();
          log.push(`${vp} ${mode} lv${lv}: ${info.mode} · 박자 ${info.bars} · 보기 ${info.pats} · "${fb.slice(0,40)}" · 비교 ${cmp}`);
          if (lv === 1 || lv === 4) await page.screenshot({ path: `${out}/${vp}-${mode}-${lv}-done.png`, fullPage: true });
        }
      } catch (e) { errors.push(`${vp} ${mode} lv${lv}: ${e.message.split('\n')[0]}`); }
      await page.click(`#${ {melody:'mel',chord:'ch',prog:'pg',rhythm:'rh',scale:'sc',interval:'iv'}[mode] }-next`); await page.waitForTimeout(80);
    }
  }
  // 휴대폰: ⚙ 메뉴, 단축키 숨김
  if (vp === 'ph') {
    await page.evaluate(() => showTab('melody'));
    const kbd = await page.evaluate(() => [...document.querySelectorAll('kbd')].filter(k => k.offsetParent !== null).length);
    await page.click('#gear'); await page.waitForTimeout(100);
    const open = await page.evaluate(() => document.querySelector('#globals').classList.contains('open'));
    await page.screenshot({ path: `${out}/ph-gear.png` });
    log.push(`ph: 보이는 kbd ${kbd}개 · ⚙ 열림 ${open}`);
    await page.click('#gear');
  }
  await ctx.close();
}
await browser.close();
console.log(log.join('\n')); console.log('--- errors ---'); console.log(errors.length ? errors.join('\n') : 'none');
