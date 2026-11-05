// 사용법: node shot.mjs <outdir> [tabs...]  — PC(1366)·아이폰(390) 두 크기로 각 탭 전체 화면을 찍는다
import { chromium, devices } from 'playwright';
const out = process.argv[2] || 'shots';
const tabs = process.argv.slice(3).length ? process.argv.slice(3) : ['course','melody','chord','prog','rhythm','scale','interval','stats'];
const browser = await chromium.launch();
const errors = [];
for (const [name, opts] of [['pc', { viewport: { width: 1366, height: 900 } }], ['ph', { ...devices['iPhone 12'], viewport:{width:390,height:844} }]]) {
  const ctx = await browser.newContext({ ...opts, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`${name}: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`${name} console: ${m.text()}`); });
  await page.goto('http://127.0.0.1:8765/index.html#course', { waitUntil: 'load' });
  await page.waitForTimeout(600);
  for (const t of tabs) {
    await page.evaluate(t => showTab(t), t);
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${out}/${name}-${t}.png`, fullPage: true });
  }
  await ctx.close();
}
await browser.close();
console.log(errors.length ? errors.join('\n') : 'no page errors');
