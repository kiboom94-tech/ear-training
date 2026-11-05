/* 공통 UI: 체크박스 묶음, 기록·적응 출제 엔진, 난이도/설정 저장, 보기 버튼, 채점 표시, 음표·쉼표 입력판, 속도 바 */
"use strict";
/* ---------- 체크박스 묶음 ---------- */
function checkGroup(el,groups,prefix){
  el.innerHTML=groups.map((g,gi)=>`<div class="cg"><div class="cg-h"><b>${g.name}</b><span><a data-all="${gi}">전체</a> · <a data-none="${gi}">해제</a></span></div><div class="cg-items">${g.items.map(it=>`<label class="chk"><input type="checkbox" id="${prefix}-${it.id.replace(/[^A-Za-z0-9]/g,c=>'_'+c.charCodeAt(0))}" data-v="${it.id}"><span>${it.label}${it.sub?`<small>${it.sub}</small>`:''}</span></label>`).join('')}</div></div>`).join('');
  el.querySelectorAll('.cg').forEach(cg=>{
    cg.querySelector('[data-all]').onclick=()=>{cg.querySelectorAll('input').forEach(i=>i.checked=true);el.dispatchEvent(new Event('change',{bubbles:true}));};
    cg.querySelector('[data-none]').onclick=()=>{cg.querySelectorAll('input').forEach(i=>i.checked=false);el.dispatchEvent(new Event('change',{bubbles:true}));};
  });
}
const checked=el=>[...el.querySelectorAll('input:checked')].map(i=>i.dataset.v);
const setChecked=(el,vals)=>el.querySelectorAll('input').forEach(i=>i.checked=vals.includes(i.dataset.v));
function groupBy(arr,keyFn){const m=new Map();arr.forEach(x=>{const k=keyFn(x);if(!m.has(k))m.set(k,[]);m.get(k).push(x);});return [...m].map(([name,items])=>({name,items}));}

/* ---------- 기록 ---------- */
let stats=store.get('stats',{});const sess={};
const MODE_NAMES={melody:'멜로디 (Melody)',chord:'코드 (Chord)',prog:'코드 진행 (Progression)',rhythm:'리듬 (Rhythm)',scale:'스케일 (Scale)',interval:'음정 (Interval)'};
function record(mode,item,ok){
  const s=stats[mode]=stats[mode]||{c:0,t:0,items:{}};
  if(item!=null){s.t++;if(ok)s.c++;const it=s.items[item]=s.items[item]||{c:0,t:0};it.t++;if(ok)it.c++;}
  store.set('stats',stats);
}
/* 문제 하나를 채점할 때마다: 적응 기록, 반응 시간, 날짜별 기록, 틀린 문제 저장, 코스, 동기화 */
function sessAdd(mode,ok,score){const rt=rtNow(mode);adaptTick(mode,ok,rt);histAdd(mode,ok,rt);SLOWNOW=false;
  const s=sess[mode]=sess[mode]||{c:0,t:0,streak:0};s.t++;if(ok){s.c++;s.streak++;}else s.streak=0;showScore(mode);bumpDaily();courseRecord(mode,score==null?(ok?1:0):score);
  if(typeof reviewAfter==='function')reviewAfter(mode,ok);if(typeof syncSoon==='function')syncSoon();}
/* ---- 반응 시간: 문제가 처음 나온(소리가 나기 시작한) 때부터 채점까지 ---- */
const QSTART={};
const qStart=m=>{QSTART[m]=SILENT?null:Date.now();};
function rtNow(m){if(!QSTART[m])return null;return Math.min(600,(Date.now()-QSTART[m])/1000);}
/* 고르는 문제(코드·스케일·음정)에서 평소보다 훨씬 오래 걸린 정답은 '익힘'으로 올리지 않는다 */
let SLOWNOW=false;
function isSlow(m){const r=rtNow(m);if(r==null)return false;const rs=(adaptMode(m).rts||[]).slice().sort((a,b)=>a-b);const med=rs.length>=5?rs[rs.length>>1]:6;return r>Math.max(8,med*2.5);}
/* ---- 날짜별 기록: eartr_hist = { 'YYYY-MM-DD': { [mode]: {c,t,ms} } } ---- */
let hist=store.get('hist',{});
function histAdd(m,ok,rt){const d=todayStr();const day=hist[d]=hist[d]||{};const x=day[m]=day[m]||{c:0,t:0,ms:0};x.t++;if(ok)x.c++;if(rt!=null)x.ms+=Math.round(rt*1000);
  const keys=Object.keys(hist).sort();if(keys.length>120)keys.slice(0,keys.length-120).forEach(k=>delete hist[k]);store.set('hist',hist);}
function showScore(mode){const s=sess[mode]||{c:0,t:0,streak:0};const el=$('#sc-'+mode);if(el)el.innerHTML=`이번 연습 <b>${s.c}</b> / ${s.t}${s.streak>1?` · 연속 ${s.streak}`:''}`;}
function weakWeight(mode,item){const it=stats[mode]?.items?.[item];if(!it||it.t<3)return 1.5;return 1+4*(1-it.c/it.t);}

/* ================= 적응 출제 (Adaptive) =================
   항목(key)마다 '처음 → 배우는 중 → 익힘 → 복습' 상태를 두고, 정답률과 착각 쌍에 따라 다음 문제의 빈도를 바꾼다.
   저장: eartr_adapt = { [mode]: { n: 푼 문제 수, items: { key: {c,t,streak,lvl,due,lapses,conf:{다른key:횟수}} }, hist:[최근 정답 0/1] } } */
let adapt=store.get('adapt',{});
const ADAPT_REVIEW=[5,15,40];           /* 익힌 항목을 다시 묻는 간격(문제 수) */
const ADAPT_KNOWN=3;                    /* 연속 정답 몇 번이면 '익힘' */
const adaptMode=m=>adapt[m]=adapt[m]||{n:0,items:{},hist:[]};
const adaptItem=(m,k)=>{const A=adaptMode(m);return A.items[k]=A.items[k]||{c:0,t:0,streak:0,lvl:0,due:0,lapses:0,conf:{}};};
function adaptState(m,k){const it=adaptMode(m).items[k];if(!it||!it.t)return 'new';if(it.streak>=ADAPT_KNOWN)return adaptMode(m).n>=it.due?'review':'known';return 'learn';}
/* 한 항목의 결과 기록. chosen: 대신 고른(착각한) 항목 key */
function adaptRecord(m,k,ok,chosen){if(k==null)return;const A=adaptMode(m),it=adaptItem(m,k);it.t++;
  if(typeof courseTouch==='function')courseTouch(m,k);
  if(ok&&SLOWNOW){it.c++;it.slow=(it.slow||0)+1;it.due=A.n+2;} /* 맞혔지만 오래 걸림: 연속 정답으로 치지 않고 곧 다시 묻는다 */
  else if(ok){it.c++;it.streak++;if(it.streak>=ADAPT_KNOWN){it.lvl++;it.due=A.n+ADAPT_REVIEW[Math.min(it.lvl-1,ADAPT_REVIEW.length-1)];}}
  else{if(it.streak>=ADAPT_KNOWN)it.lapses++;it.streak=0;it.lvl=0;it.due=A.n+3+rnd(4);if(chosen!=null&&chosen!==k){it.conf[chosen]=(it.conf[chosen]||0)+1;const o=adaptItem(m,chosen);o.conf[k]=(o.conf[k]||0)+1;}}
  store.set('adapt',adapt);}
/* 문제 하나를 마칠 때마다 호출: 문제 수와 최근 정답 기록 */
function adaptTick(m,ok,rt){const A=adaptMode(m);A.n++;A.hist.push(ok?1:0);if(A.hist.length>20)A.hist=A.hist.slice(-20);
  if(rt!=null){A.rts=A.rts||[];A.rts.push(Math.round(rt*10)/10);if(A.rts.length>30)A.rts=A.rts.slice(-30);}store.set('adapt',adapt);}
function adaptRecentAcc(m){const h=adaptMode(m).hist;return h.length<5?0.65:h.reduce((a,b)=>a+b,0)/h.length;}
/* 항목 가중치: 처음 1 · 배우는 중 1~4(정답률 낮을수록 큼, 방금 틀린 것은 잠시 0.1) · 익힘 0.15 · 복습 때 1.3 */
function adaptWeight(m,k){const A=adaptMode(m),it=A.items[k];const acc=adaptRecentAcc(m);const newBoost=acc>0.8?1.6:acc<0.5?0.5:1;
  if(!it||!it.t)return 1*newBoost;const st=adaptState(m,k);
  if(st==='known')return 0.15;if(st==='review')return 1.3;
  if(A.n<it.due)return 0.1;return (1+3*(1-it.c/it.t))*(2-newBoost);}
const adaptOn=pre=>{const el=document.getElementById(pre+'-adapt')||document.getElementById(pre+'-weak');return !el||el.checked;};
const clampW=(w,lo,hi)=>Math.min(hi,Math.max(lo,w));
/* 후보 중 하나를 가중치로 고름. keyFn: 후보 → key */
function adaptPick(m,pre,cands,keyFn){if(!adaptOn(pre)||cands.length<2)return pick(cands);return wpick(cands,c=>adaptWeight(m,keyFn(c)));}
function adaptW(m,pre,k){return adaptOn(pre)?adaptWeight(m,k):1;}
/* 기록 화면용 라벨 */
const DEG_NAME={0:'1도 (Tonic)',1:'♭2도',2:'2도',3:'♭3도',4:'3도',5:'4도',6:'♯4·♭5도',7:'5도',8:'♭6도',9:'6도',10:'♭7도',11:'7도'};
function adaptLabel(m,k){const [kind,...r]=k.split(':');const v=r.join(':');
  if(m==='chord')return CH[k]?CH[k].disp+' · '+CH[k].kr:k;
  if(m==='scale')return SCALES[k]?SCALES[k].n:k;
  if(m==='interval'){const iv=INTERVALS.find(i=>i.id===kind);return (iv?iv.n:kind)+' · '+({up:'상행',down:'하행',harm:'화성'}[v]||v);}
  if(m==='melody'){if(kind==='d')return '도수 '+(DEG_NAME[v]||v);if(kind==='l'){const n=+v;return n===0?'같은 음 반복':`${Math.abs(n)+1}도 ${n>0?'상행':'하행'}`;}if(kind==='rest')return '쉼표 듣기';if(kind==='oct')return '옥타브 구별';if(kind==='v')return (MNAME[v]||v)+' 길이';}
  if(m==='prog'){const lb=id=>{const x=VOCAB.major.find(y=>y.id===id)||VOCAB.minor.find(y=>y.id===id);return x?x.lb:id;};if(kind==='c')return '코드 '+lb(v);if(kind==='p')return '코드 쌍 '+v.split('>').map(lb).join(' → ');if(kind==='p')return '코드 쌍 '+v.replace('>',' → ');if(kind==='g')return PROGMAP[v]?PROGMAP[v].n:v;}
  if(m==='rhythm'){if(kind==='p')return PAT[v]?PAT[v].n:v;if(kind==='b'){const [sig,k2]=v.split('|');return `${sig} ${+k2+1}박째`;}if(kind==='s')return '박자 '+v;
    if(kind==='o'){const [fam,off]=v.split('|');return (fam==='compound'?'겹박 ':'')+({0:'박 머리',12:'16분 2번째',24:'8분 뒷박',36:'16분 4번째',48:'8분 3번째',60:'16분 6번째',16:'셋잇단 2번째',32:'셋잇단 3번째',6:'32분 뒷자리',tup:'연음 안 위치'}[off]||off+'틱');}if(kind==='e')return {tie:'붙임줄',rest:'쉼표',sync:'당김음'}[v]||v;if(kind==='v')return (RDUR.find(x=>x[0]==v)||[0,v])[1]+' 길이';}
  return k;}
const ADAPT_KIND={d:'도수 (Scale Degree)',l:'도약 (Leap)',rest:'쉼표',oct:'옥타브',v:'음 길이 (Note Value)',c:'코드 (Chord)',p:'코드 쌍 · 박 패턴',g:'진행 (Progression)',b:'마디 안 위치 (Beat Position)',s:'박자 (Time Signature)',o:'박 안 위치 (Onset)',e:'리듬 요소'};
function adaptKind(m,k){if(['chord','scale','interval'].includes(m))return '';const kind=k.split(':')[0];if(m==='rhythm'&&kind==='p')return '박 패턴 (Beat Pattern)';if(m==='prog'&&kind==='p')return '코드 쌍 (Chord Pair)';return ADAPT_KIND[kind]||kind;}
/* 기록 화면: 약점 지도 + 자주 헷갈리는 쌍 */
function renderAdapt(){const ST={new:['처음','var(--line)'],learn:['배우는 중','var(--bad)'],known:['익힘','var(--good)'],review:['복습 차례','var(--mark)']};
  let h='';const pairs=[];
  for(const m of Object.keys(MODE_NAMES)){const A=adapt[m];if(!A||!Object.keys(A.items).length)continue;
    const keys=Object.keys(A.items).filter(k=>A.items[k].t>0);const groups=groupBy(keys,k=>adaptKind(m,k));
    const cnt={new:0,learn:0,known:0,review:0};keys.forEach(k=>cnt[adaptState(m,k)]++);
    h+=`<details class="cgp" open><summary><b>${MODE_NAMES[m]}</b><span>익힘 ${cnt.known+cnt.review} · 배우는 중 ${cnt.learn} · ${A.n}문제</span></summary>${groups.map(g=>`${g.name?`<div class="mini" style="margin:6px 0 2px">${g.name}</div>`:''}<div class="wmap">${g.items.sort((a,b)=>(A.items[a].c/A.items[a].t)-(A.items[b].c/A.items[b].t)).map(k=>{const it=A.items[k],st=adaptState(m,k),acc=Math.round(it.c/it.t*100);
      return `<span class="wchip" style="--c:${ST[st][1]}" title="${ST[st][0]} · ${it.c}/${it.t}">${adaptLabel(m,k)}<small>${acc}% · ${ST[st][0]}${it.slow?` · 느림 ${it.slow}`:''}</small></span>`;}).join('')}</div>`).join('')}</details>`;
    keys.forEach(k=>{for(const o in A.items[k].conf){if(k<o)pairs.push({m,a:k,b:o,n:A.items[k].conf[o]});}});}
  $('#st-adapt').innerHTML=h||'<p class="mini">아직 데이터가 없어요. 문제를 풀면 항목별로 처음 → 배우는 중 → 익힘 상태가 쌓여요.</p>';
  pairs.sort((a,b)=>b.n-a.n);const top=pairs.slice(0,12);
  $('#st-conf').innerHTML=top.length?`<table class="st"><thead><tr><th>영역</th><th>헷갈리는 쌍</th><th class="n">횟수</th></tr></thead><tbody>${top.map(x=>`<tr><td>${MODE_NAMES[x.m]}</td><td>${adaptLabel(x.m,x.a)} ↔ ${adaptLabel(x.m,x.b)}</td><td class="n">${x.n}</td></tr>`).join('')}</tbody></table><div class="tip">틀렸을 때 대신 고른 답을 세요. 적응 출제가 켜져 있으면 이 쌍이 같은 묶음에서 더 자주 나와요.</div>`:'<p class="mini">아직 헷갈린 기록이 없어요.</p>';}

/* ---------- 난이도 / 설정 저장 ---------- */
const LEVELS=[['1','쉬움'],['2','보통'],['3','어려움'],['4','전문가'],['c','사용자']];
const PRESETS={},NEWQ={},AFTERCHANGE={};
let quiet=false;
function initSeg(mode){
  const el=$('#seg-'+mode);el.innerHTML=LEVELS.map(([v,n])=>`<button data-lv="${v}">${n}</button>`).join('');
  el.onclick=e=>{const b=e.target.closest('button');if(!b)return;
    if(course.active&&STAGE[course.active].mode===mode)exitCourse();
    if(b.dataset.lv==='c'){setSeg(mode,'c');$('#set-'+mode).open=true;saveSet(mode);return;}
    quiet=true;PRESETS[mode](+b.dataset.lv);quiet=false;setSeg(mode,b.dataset.lv);saveSet(mode);NEWQ[mode]();};
  $('#set-'+mode).addEventListener('change',e=>{if(quiet)return;if(course.active&&STAGE[course.active].mode===mode)exitCourse();if(AFTERCHANGE[mode])AFTERCHANGE[mode](e);setSeg(mode,'c');saveSet(mode);NEWQ[mode]();});
}
function setSeg(mode,lv){if(typeof SPEED!=='undefined'&&SPEED[mode]&&SPEED[mode].sync)SPEED[mode].sync();$$('#seg-'+mode+' button').forEach(b=>b.classList.toggle('on',b.dataset.lv===lv));}
function curSeg(mode){return $('#seg-'+mode+' button.on')?.dataset.lv||'1';}
function saveSet(mode){const vals={};$('#set-'+mode).querySelectorAll('input,select').forEach(i=>{if(!i.id)return;vals[i.id]=i.type==='checkbox'?i.checked:i.value;});store.set('set_'+mode,{lv:curSeg(mode),vals});}
function loadSet(mode,defLv){
  let s=store.get('set_'+mode,null);if(mode==='rhythm'&&s&&!('rh-input' in s.vals))s=null;
  if(mode==='rhythm'&&s&&s.vals['rh-metro']===true&&!('rh-metromode' in s.vals))s.vals['rh-metromode']='fade';quiet=true;
  if(s){if(AFTERCHANGE[mode]&&s.vals['pg-mode']){$('#pg-mode').value=s.vals['pg-mode'];AFTERCHANGE[mode]({target:$('#pg-mode')});}
    for(const id in s.vals){const i=document.getElementById(id);if(!i)continue;if(i.type==='checkbox')i.checked=s.vals[id];else i.value=s.vals[id];}
    setSeg(mode,s.lv);}
  else{PRESETS[mode](defLv);setSeg(mode,String(defLv));}
  quiet=false;
}
function numVal(id,lo,hi,def){let v=parseInt($('#'+id).value,10);if(isNaN(v))v=def;return Math.min(hi,Math.max(lo,v));}

/* ---------- 공통: 하나 고르는 문제 ---------- */
/* 보기가 많으면(13개 이상) 그룹별로 접었다 펼 수 있게. 휴대폰에서는 첫 그룹만 펼쳐 둔다 */
function renderChoices(el,items,onPick,groupOf){
  const btn=(it,i)=>`<button class="choice" data-i="${i}" data-id="${it.id}">${it.label}${it.sub?`<small>${it.sub}</small>`:''}</button>`;
  if(groupOf&&items.length>12){const gs=groupBy(items.map((it,i)=>({it,i})),x=>groupOf(x.it));
    el.innerHTML=gs.map((g,gi)=>`<details class="cgp"${(!isMobile()||gi===0)?' open':''}><summary><b>${g.name}</b><span>${g.items.length}개</span></summary><div class="choices">${g.items.map(x=>btn(x.it,x.i)).join('')}</div></details>`).join('');}
  else el.innerHTML=`<div class="choices">${items.map(btn).join('')}</div>`;
  el.onclick=e=>{const b=e.target.closest('.choice');if(!b)return;onPick(items[+b.dataset.i],b);};}
/* 정답·내 답 버튼이 접힌 그룹 안에 있으면 펼쳐서 보여준다 */
function revealChoice(el,id){const b=el.querySelector(`.choice[data-id="${CSS.escape(String(id))}"]`);if(!b)return null;const d=b.closest('details');if(d)d.open=true;return b;}
/* 채점 뒤 공통 버튼: 정답 듣기 · 내 답 듣기 */
function cmpButtons(el,onAns,onMine,mineLabel){el.innerHTML=`<button class="btn" data-c="a">정답 듣기 (Answer)</button>${onMine?`<button class="btn" data-c="m">${mineLabel||'내 답 듣기 (My Answer)'}</button>`:''}`;
  el.onclick=e=>{const b=e.target.closest('[data-c]');if(!b)return;if(b.dataset.c==='a')onAns();else if(onMine)onMine();};}
function feedback(el,ok,main,sub){el.className='feedback '+(ok?'good':'bad');el.innerHTML=main+(sub?`<span class="sub">${sub}</span>`:'');}
function autoNext(mode){if($('#g-auto').checked)at(1.3,()=>NEWQ[mode]());}

/* ================= 공통: 음표·쉼표 입력판 ================= */
/* cols:[{v,name,key}] · 음표 줄과 쉼표 줄을 같은 길이끼리 위아래로 맞춘다. 휴대폰에서는 4~5칸씩 접는다. */
function durGrid({cols,sel,noteAttr,restAttr,noteHelp,restHelp,icon}){
  const per=isMobile()?(cols.length<=8?4:5):cols.length;const mob=per<cols.length;
  const chunks=[];for(let i=0;i<cols.length;i+=per)chunks.push(cols.slice(i,i+per));
  const head=(t,h)=>mob?`<span class="dg-l head">${t}<small>${h}</small></span>`:`<span class="dg-l">${t}<small>${h}</small></span>`;
  return chunks.map((ch,ci)=>`<div class="durgrid" style="grid-template-columns:${mob?'':'auto '}repeat(${ch.length},minmax(0,1fr))">
    ${head('음표',ci===0?noteHelp:'')}${ch.map(c=>`<button class="dbtn${sel===c.v?' on':''}" ${noteAttr}="${c.v}" title="${c.name}음표">${icon(c.v,false)}<span>${c.name}${c.key?`<kbd>${c.key}</kbd>`:''}</span></button>`).join('')}
    ${head('쉼표',ci===0?restHelp:'')}${ch.map(c=>`<button class="dbtn rest-btn" ${restAttr}="${c.v}" title="${c.name}쉼표">${icon(c.v,true)}<span>${c.name}${mob?'':'쉼표'}</span></button>`).join('')}
  </div>`).join('');}

/* ================= 속도 조절 ================= */
const SPEED={melody:{id:'mel-tempo',min:40,max:200,def:80,unit:'BPM',play:()=>melPlay(false)},prog:{id:'pg-tempo',min:40,max:200,def:90,unit:'BPM',play:()=>pgPlayList(G.q.voicings,false,true)},
 rhythm:{id:'rh-tempo',min:40,max:200,def:70,unit:'BPM',play:()=>rhPlayQ()},scale:{id:'sc-tempo',min:40,max:240,def:100,unit:'BPM',play:()=>scPlay(S.q.id,S.q.tonic)},
 chord:{id:'ch-speed',min:40,max:200,def:100,unit:'%',play:()=>chPlay(C.q.notes)},interval:{id:'iv-speed',min:40,max:200,def:100,unit:'%',play:()=>ivPlay(I.q)}};
let SLOWF=1;const SLOW_RATIO=0.65;
function bpm(mode){const c=SPEED[mode];return numVal(c.id,c.min,c.max,c.def)*SLOWF;}
function spd(mode){return bpm(mode)/100;}
function playSlow(mode){SLOWF=SLOW_RATIO;try{SPEED[mode].play();}finally{SLOWF=1;}}
function speedLabel(mode){const c=SPEED[mode];const v=numVal(c.id,c.min,c.max,c.def);return c.unit==='%'?`${v}%`:`${v} BPM`;}
function buildSpeedBars(){Object.keys(SPEED).forEach(mode=>{const c=SPEED[mode];const pn=document.getElementById(c.id).closest('.panel');const ctr=pn.querySelector('.ex .controls.sub')||pn.querySelector('.ex .controls');
  const bar=document.createElement('div');bar.className='speed';bar.id='spd-'+mode;
  bar.innerHTML=`<span class="speed-l">${c.unit==='%'?'속도<span class="en"> (Speed)</span>':'빠르기<span class="en"> (Tempo)</span>'}</span><button class="btn sm" data-d="-1" aria-label="느리게">−</button>
   <input type="range" id="spdr-${mode}" min="${c.min}" max="${c.max}" step="${c.unit==='%'?10:2}" aria-label="재생 속도">
   <button class="btn sm" data-d="1" aria-label="빠르게">+</button><span class="speed-v" id="spdv-${mode}"></span>
   <span class="speed-presets">${(c.unit==='%'?[60,80,100,130]:[60,80,100,120]).map(v=>`<button class="chipbtn" data-v="${v}">${c.unit==='%'?v+'%':v}</button>`).join('')}</span>
   <button class="btn sm" data-slow="1">느리게<span class="en"> 듣기 (Slow)</span><kbd>S</kbd></button>`;
  ctr.after(bar);const rg=bar.querySelector('input');
  const sync=()=>{rg.value=numVal(c.id,c.min,c.max,c.def);$('#spdv-'+mode).textContent=speedLabel(mode);};
  const set=v=>{v=Math.min(c.max,Math.max(c.min,Math.round(v)));document.getElementById(c.id).value=v;sync();saveSet(mode);};
  rg.oninput=()=>set(+rg.value);
  bar.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.slow){playSlow(mode);return;}
    if(b.dataset.d)set(numVal(c.id,c.min,c.max,c.def)+(+b.dataset.d)*(c.unit==='%'?10:5));if(b.dataset.v)set(+b.dataset.v);});
  document.getElementById(c.id).addEventListener('input',sync);document.getElementById(c.id).addEventListener('change',sync);
  SPEED[mode].sync=sync;sync();});}
