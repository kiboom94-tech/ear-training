/* 기록 화면 */
"use strict";
/* ================= 기록 화면 ================= */
function renderStats(){const rows=Object.keys(MODE_NAMES).map(m=>{const s=stats[m]||{c:0,t:0};const p=s.t?Math.round(s.c/s.t*100):0;return `<tr><td>${MODE_NAMES[m]}</td><td class="n">${s.c} / ${s.t}</td><td class="n">${s.t?p+'%':'–'}</td><td><div class="meter"><i style="width:${p}%"></i></div></td></tr>`;}).join('');
  $('#st-modes').innerHTML=`<table class="st"><thead><tr><th>영역</th><th class="n">맞힘 / 시도</th><th class="n">정답률</th><th></th></tr></thead><tbody>${rows}</tbody></table><div class="tip">멜로디·코드 진행·리듬은 항목(스케일, 코드, 박 패턴) 단위로도 따로 집계해요.</div>`;
  const items=[];for(const m in stats)for(const k in (stats[m].items||{})){const it=stats[m].items[k];if(it.t>=2)items.push({m,k,...it,p:it.c/it.t});}
  items.sort((a,b)=>a.p-b.p||b.t-a.t);const top=items.filter(x=>x.p<1).slice(0,14);
  renderAdapt();
  $('#st-weak').innerHTML=top.length?`<table class="st"><thead><tr><th>영역</th><th>항목</th><th class="n">정답률</th><th class="n">시도</th></tr></thead><tbody>${top.map(x=>`<tr><td>${MODE_NAMES[x.m]}</td><td>${x.k}</td><td class="n">${Math.round(x.p*100)}%</td><td class="n">${x.t}</td></tr>`).join('')}</tbody></table><div class="tip">각 모드 설정의 ‘적응 출제 (Adaptive)’가 켜져 있으면 이 항목들이 더 자주 나와요. 아래 약점 지도에서 항목별 상태를 볼 수 있어요.</div>`:'<p class="mini">아직 데이터가 부족해요. 문제를 풀수록 여기에 자주 틀리는 항목이 모여요.</p>';}
let resetArmed=false;
$('#st-reset').onclick=()=>{if(!resetArmed){resetArmed=true;$('#st-confirm').textContent='한 번 더 누르면 모든 기록이 지워져요.';setTimeout(()=>{resetArmed=false;$('#st-confirm').textContent='';},4000);return;}
  stats={};store.set('stats',stats);adapt={};store.set('adapt',adapt);resetArmed=false;$('#st-confirm').textContent='기록을 지웠어요.';renderStats();};
