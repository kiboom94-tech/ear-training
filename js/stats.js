/* 기록 화면 */
"use strict";
/* ================= 기록 화면 ================= */
/* 날짜별 기록: 최근 14일 막대(높이=푼 문제 수, 초록=맞힌 비율) + 모드별 최근 7일 vs 그 전 7일 */
function renderHistory(){const days=[];for(let i=13;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);days.push(dstr(d));}
  const tot=d=>{const x=hist[d]||{};let c=0,t=0;for(const m in x){c+=x[m].c;t+=x[m].t;}return {c,t};};
  const mx=Math.max(1,...days.map(d=>tot(d).t));
  const bars=days.map(d=>{const {c,t}=tot(d);const h=t/mx*100;return `<div class="hbar" title="${d} · ${t}문제 중 ${c}개 정답"><span>${t||''}</span><i style="height:${h*(t?(1-c/t):0)}%"></i><i class="ok" style="height:${h*(t?c/t:0)}%;border-radius:${c===t?'4px 4px 0 0':'0'}"></i></div>`;}).join('');
  const lab=days.map((d,i)=>`<span class="${i===13?'today':''}">${i===13?'오늘':(+d.slice(5,7))+'/'+(+d.slice(8))}</span>`).join('');
  const sum=(m,from,to)=>{let c=0,t=0,ms=0;for(let i=from;i<to;i++){const d=new Date();d.setDate(d.getDate()-i);const x=(hist[dstr(d)]||{})[m];if(x){c+=x.c;t+=x.t;ms+=x.ms||0;}}return {c,t,ms};};
  const rows=Object.keys(MODE_NAMES).map(m=>{const a=sum(m,0,7),b=sum(m,7,14);if(!a.t&&!b.t)return '';const pa=a.t?Math.round(a.c/a.t*100):null,pb=b.t?Math.round(b.c/b.t*100):null;
    const diff=pa!=null&&pb!=null?pa-pb:null;const sec=a.t&&a.ms?(a.ms/a.t/1000).toFixed(1)+'초':'–';
    return `<tr><td>${MODE_NAMES[m]}</td><td class="n">${a.t}</td><td class="n">${pa!=null?pa+'%':'–'}</td><td class="n">${pb!=null?pb+'%':'–'}</td><td class="n ${diff>0?'up':diff<0?'down':''}">${diff==null?'–':(diff>0?'▲ ':diff<0?'▼ ':'')+Math.abs(diff)+'%p'}</td><td class="n">${sec}</td></tr>`;}).join('');
  if(!days.some(d=>tot(d).t)){$('#st-hist').innerHTML='<p class="mini">아직 날짜별 기록이 없어요. 문제를 풀면 날마다 푼 문제 수와 정답률이 막대로 쌓여요.</p>';return;}
  $('#st-hist').innerHTML=`<div class="hchart">${bars}</div><div class="hdays">${lab}</div><div class="mini" style="margin:4px 0 10px">막대 높이는 푼 문제 수, <b style="color:var(--good)">초록</b>은 맞힌 문제예요.</div>
    ${rows?`<table class="st"><thead><tr><th>영역</th><th class="n">최근 7일</th><th class="n">정답률</th><th class="n">그 전 7일</th><th class="n">변화</th><th class="n">평균 시간</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="tip">평균 시간은 문제가 나온 때부터 채점까지 걸린 시간이에요. 코드·스케일·음정에서 평소보다 훨씬 오래 걸려 맞힌 항목은 '익힘'으로 올라가지 않고 곧 다시 나와요.</div>`:'<p class="mini">아직 날짜별 기록이 없어요.</p>'}`;}
function renderStats(){renderHistory();const rows=Object.keys(MODE_NAMES).map(m=>{const s=stats[m]||{c:0,t:0};const p=s.t?Math.round(s.c/s.t*100):0;return `<tr><td>${MODE_NAMES[m]}</td><td class="n">${s.c} / ${s.t}</td><td class="n">${s.t?p+'%':'–'}</td><td><div class="meter"><i style="width:${p}%"></i></div></td></tr>`;}).join('');
  $('#st-modes').innerHTML=`<table class="st"><thead><tr><th>영역</th><th class="n">맞힘 / 시도</th><th class="n">정답률</th><th></th></tr></thead><tbody>${rows}</tbody></table><div class="tip">멜로디·코드 진행·리듬은 항목(스케일, 코드, 박 패턴) 단위로도 따로 집계해요.</div>`;
  const items=[];for(const m in stats)for(const k in (stats[m].items||{})){const it=stats[m].items[k];if(it.t>=2)items.push({m,k,...it,p:it.c/it.t});}
  items.sort((a,b)=>a.p-b.p||b.t-a.t);const top=items.filter(x=>x.p<1).slice(0,14);
  renderAdapt();
  $('#st-weak').innerHTML=top.length?`<table class="st"><thead><tr><th>영역</th><th>항목</th><th class="n">정답률</th><th class="n">시도</th></tr></thead><tbody>${top.map(x=>`<tr><td>${MODE_NAMES[x.m]}</td><td>${x.k}</td><td class="n">${Math.round(x.p*100)}%</td><td class="n">${x.t}</td></tr>`).join('')}</tbody></table><div class="tip">각 모드 설정의 ‘적응 출제 (Adaptive)’가 켜져 있으면 이 항목들이 더 자주 나와요. 아래 약점 지도에서 항목별 상태를 볼 수 있어요.</div>`:'<p class="mini">아직 데이터가 부족해요. 문제를 풀수록 여기에 자주 틀리는 항목이 모여요.</p>';}
let resetArmed=false;
$('#st-reset').onclick=()=>{if(!resetArmed){resetArmed=true;$('#st-confirm').textContent='한 번 더 누르면 모든 기록이 지워져요.';setTimeout(()=>{resetArmed=false;$('#st-confirm').textContent='';},4000);return;}
  stats={};store.set('stats',stats);adapt={};store.set('adapt',adapt);hist={};store.set('hist',hist);wrongQ={};store.set('wrong',wrongQ);Object.keys(REVIEW_PRE).forEach(reviewBtn);resetArmed=false;$('#st-confirm').textContent='기록을 지웠어요.';renderStats();};
