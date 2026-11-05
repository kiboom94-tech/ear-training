/* 기기 연결 · 선생님 시트 동기화 (Sync)
   학생 코드 하나로 휴대폰·PC 기록을 합치고, 선생님 구글 시트에 요약을 남긴다.
   서버는 구글 Apps Script 웹 앱 하나 (tools/sync-apps-script.gs). 설정 방법은 docs/기록-동기화-방안.md
   합치는 규칙(3-way): 숫자 카운터(c,t,n,ms,lapses,slow,conf)는 '시트 값 + 이 기기에서 늘어난 만큼',
   그 밖의 값은 이 기기에서 바뀌었으면 이 기기 값, 아니면 시트 값. 코스 통과는 어느 한쪽이라도 통과면 통과. */
"use strict";
let syncCfg=store.get('sync',{url:'',code:'',name:'',base:null,last:0});
let syncing=false,syncTimer=null;
const SYNC_CNT=new Set(['c','t','n','ms','lapses','slow']);
const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function merge3(r,l,b,key,cnt){
  if(isObj(r)||isObj(l)){if(!isObj(l))return r;if(!isObj(r))return l;const out={};const bb=isObj(b)?b:{};
    new Set([...Object.keys(r),...Object.keys(l)]).forEach(k=>{const v=merge3(r[k],l[k],bb[k],k,cnt||k==='conf');if(v!==undefined)out[k]=v;});return out;}
  if(l===undefined)return r;if(r===undefined)return l;
  if(typeof l==='number'&&typeof r==='number'&&(cnt||SYNC_CNT.has(key)))return Math.max(0,r+l-(typeof b==='number'?b:0));
  return JSON.stringify(l)!==JSON.stringify(b)?l:r;}
function snapshot(){return {stats,adapt,course,daily,hist,wrong:wrongQ,profile:{name:syncCfg.name||''}};}
function mergeAll(R,L,B){const m=merge3(R||{},L,B||{},'',false);
  /* 코스 통과: 한쪽이라도 통과면 통과, 최고 점수는 큰 쪽 */
  const rs=(R&&R.course&&R.course.st)||{},ls=(L.course&&L.course.st)||{};
  if(m.course&&m.course.st)for(const id in m.course.st){const a=rs[id]||{},b=ls[id]||{};m.course.st[id].cleared=!!(a.cleared||b.cleared);m.course.st[id].best=Math.max(a.best||0,b.best||0);}
  if(m.daily){const a=(R&&R.daily)||{},b=L.daily||{};m.daily.streak=Math.max(a.streak||0,b.streak||0);}
  m.profile={name:(L.profile&&L.profile.name)||(R&&R.profile&&R.profile.name)||''}; /* 이름은 비어 있지 않은 쪽 */
  return m;}
function applySnap(m){stats=m.stats||{};adapt=m.adapt||{};course=Object.assign({st:{},active:null,last:null,unlockAll:false},m.course||{});daily=Object.assign({date:null,count:0,streak:0,goal:30},m.daily||{});hist=m.hist||{};wrongQ=m.wrong||{};
  store.set('stats',stats);store.set('adapt',adapt);store.set('course',course);store.set('daily',daily);store.set('hist',hist);store.set('wrong',wrongQ);
  if(m.profile&&m.profile.name&&!syncCfg.name){syncCfg.name=m.profile.name;store.set('sync',syncCfg);const n=$('#sync-name');if(n)n.value=syncCfg.name;}
  renderDailyChip();Object.keys(REVIEW_PRE).forEach(reviewBtn);if(curTab==='stats')renderStats();if(curTab==='course')renderCourse();}
/* 선생님 시트에 보이는 요약 한 줄 */
function syncSummary(){let wk=0,wc=0;for(let i=0;i<7;i++){const d=new Date();d.setDate(d.getDate()-i);const x=hist[dstr(d)]||{};for(const m in x){wk+=x[m].t;wc+=x[m].c;}}
  const modes=Object.keys(MODE_NAMES).map(m=>{const s=stats[m];return s&&s.t?`${Math.round(s.c/s.t*100)}% (${s.t})`:'';});
  const weak=[];for(const m in adapt)for(const k in adapt[m].items){const it=adapt[m].items[k];if(it.t>=3&&adaptState(m,k)==='learn')weak.push({m,k,p:it.c/it.t});}
  weak.sort((a,b)=>a.p-b.p);
  return {today:todayCount(),streak:curStreak(),week:wk,weekAcc:wk?Math.round(wc/wk*100)+'%':'',cleared:Object.values(course.st||{}).filter(x=>x.cleared).length,
    modes,weak:weak.slice(0,5).map(x=>MODE_NAMES[x.m].split(' (')[0]+' · '+adaptLabel(x.m,x.k)).join(', ')};}
function syncStatus(t,bad){const el=$('#sync-status');if(el){el.textContent=t;el.style.color=bad?'var(--bad)':'';}}
function syncReady(){return !!(syncCfg.url&&syncCfg.code);}
async function syncNow(manual){if(!syncReady()){if(manual)syncStatus('학생 코드와 동기화 주소를 먼저 넣고 저장하세요.',true);return;}if(syncing)return;syncing=true;syncStatus('동기화 중…');
  try{const r=await fetch(syncCfg.url+(syncCfg.url.includes('?')?'&':'?')+'code='+encodeURIComponent(syncCfg.code),{cache:'no-store'});const j=await r.json();if(!j.ok)throw new Error(j.error||'server');
    const merged=mergeAll(j.data,snapshot(),syncCfg.base);applySnap(merged);
    const p=await fetch(syncCfg.url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({code:syncCfg.code,name:syncCfg.name||merged.profile.name,data:merged,summary:syncSummary()})});
    const pj=await p.json();if(!pj.ok)throw new Error(pj.error||'save');
    syncCfg.base=JSON.parse(JSON.stringify(merged));syncCfg.last=Date.now();store.set('sync',syncCfg);syncStatus('마지막 동기화: '+new Date(syncCfg.last).toLocaleString('ko-KR'));}
  catch(e){syncStatus('동기화하지 못했어요. 인터넷 연결이나 주소를 확인하세요. 기록은 이 기기에 그대로 남아 있어요. ('+(e.message||e)+')',true);}
  finally{syncing=false;}}
/* 문제를 풀 때마다 부른다: 20초 동안 더 풀지 않으면 한 번 동기화 */
function syncSoon(){if(!syncReady())return;clearTimeout(syncTimer);syncTimer=setTimeout(()=>syncNow(false),20000);}
function initSync(){
  /* 선생님이 보낸 링크(?sync=주소&code=코드)로 들어오면 자동으로 채운다 */
  try{const u=new URL(location.href);const su=u.searchParams.get('sync'),sc=u.searchParams.get('code');
    if(su||sc){if(su)syncCfg.url=su;if(sc)syncCfg.code=sc.trim().toUpperCase();store.set('sync',syncCfg);u.searchParams.delete('sync');u.searchParams.delete('code');history.replaceState(null,'',u.pathname+u.search+u.hash);}}catch(e){}
  $('#sync-code').value=syncCfg.code||'';$('#sync-name').value=syncCfg.name||'';$('#sync-url').value=syncCfg.url||'';
  $('#sync-save').onclick=()=>{const code=$('#sync-code').value.trim().toUpperCase().replace(/[^A-Z0-9가-힣_-]/g,'');const url=$('#sync-url').value.trim();
    if(code!==syncCfg.code)syncCfg.base=null; /* 코드를 바꾸면 처음부터 합치기 */
    syncCfg.code=code;syncCfg.name=$('#sync-name').value.trim().slice(0,30);syncCfg.url=url;store.set('sync',syncCfg);$('#sync-code').value=code;
    if(syncReady())syncNow(true);else syncStatus('저장했어요. 학생 코드와 주소를 모두 넣으면 동기화가 시작돼요.');};
  $('#sync-now').onclick=()=>syncNow(true);
  $('#sync-off').onclick=()=>{syncCfg={url:'',code:'',name:'',base:null,last:0};store.set('sync',syncCfg);$('#sync-code').value='';$('#sync-name').value='';$('#sync-url').value='';syncStatus('동기화를 껐어요. 기록은 이 기기에 그대로 있어요.');};
  syncStatus(syncReady()?(syncCfg.last?'마지막 동기화: '+new Date(syncCfg.last).toLocaleString('ko-KR'):'아직 동기화하지 않았어요.'):'동기화가 꺼져 있어요. (기록은 이 기기에만 저장돼요)');
  if(syncReady())setTimeout(()=>syncNow(false),1500);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&syncReady()&&syncTimer){clearTimeout(syncTimer);syncTimer=null;syncNow(false);}});}
