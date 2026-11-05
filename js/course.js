/* 코스(단계 해금)와 오늘의 연습 */
"use strict";
/* ================= 코스 · 오늘의 연습 ================= */
const IV_OCT=INTERVALS.filter(i=>i.s<=12).map(i=>i.id),IV_ALL=INTERVALS.map(i=>i.id);
const SIMPLE_ALL=SIMPLE_PATS.map(p=>p.id),COMP_ALL=COMPOUND_PATS.map(p=>p.id);
const UP={'iv-up':true,'iv-down':false,'iv-harm':false},UPDOWN={'iv-up':true,'iv-down':true,'iv-harm':false};
const RP=(ids,sigs,bars,extra={})=>({checks:{'#rh-pats':ids,'#rh-sigs':sigs},vals:Object.assign({'rh-input':'pattern','rh-bars':bars,'rh-mixed':false},extra)});
const RS=(vals,sigs,bars,extra={})=>({checks:{'#rh-vals':vals,'#rh-sigs':sigs},vals:Object.assign({'rh-input':'score','rh-bars':bars,'rh-mixed':false,'rh-restp':'0.1'},extra)});
const TRACKS=[
 {mode:'interval',name:'음정 (Interval)',stages:[
  {t:'장2도·장3도·완전5도·옥타브',d:'상행 (Ascending)',checks:{'#iv-list':['i2','i4','i7','i12']},vals:UP},
  {t:'완전4도·장6도 추가',d:'상행 (Ascending)',checks:{'#iv-list':['i2','i4','i5','i7','i9','i12']},vals:UP},
  {t:'단2도·단3도·단6도 추가',d:'상행 + 하행',checks:{'#iv-list':['i1','i2','i3','i4','i5','i7','i8','i9','i12']},vals:UPDOWN},
  {t:'옥타브 안 전체',d:'트라이톤 (Tritone)·7도 포함',checks:{'#iv-list':IV_OCT},vals:UPDOWN},
  {t:'화성 음정',d:'두 음 동시에 (Harmonic Interval)',checks:{'#iv-list':IV_OCT},vals:{'iv-up':false,'iv-down':false,'iv-harm':true}},
  {t:'복음정',d:'9도~13도 (Compound Interval), 모든 방향',checks:{'#iv-list':IV_ALL},vals:{'iv-up':true,'iv-down':true,'iv-harm':true}}]},
 {mode:'chord',name:'코드 (Chord)',stages:[
  {t:'메이저 vs 마이너',d:'Major · Minor',base:1,checks:{'#ch-types':['maj','m']}},
  {t:'디미니시·오그먼트 추가',d:'Diminished · Augmented',base:2,checks:{'#ch-types':['maj','m','dim','aug']}},
  {t:'서스 코드',d:'sus2 · sus4',base:2,checks:{'#ch-types':['maj','m','sus2','sus4']}},
  {t:'기본 7화음 4종',d:'maj7 · 7 · m7 · m7♭5',base:2,checks:{'#ch-types':['maj7','7','m7','m7b5']}},
  {t:'7화음 전체',d:'dim7 · mMaj7 · 7sus4 포함',base:2,checks:{'#ch-types':['maj7','7','m7','m7b5','dim7','mmaj7','7sus4']}},
  {t:'9th 텐션',d:'maj9 · 9 · m9 · add9 · 6/9',base:3,checks:{'#ch-types':['maj7','7','m7','maj9','9','m9','add9','69']},vals:{'ch-voice':'std'}},
  {t:'11th · 13th 텐션',d:'m11 · ♯11 · 13',base:3,checks:{'#ch-types':['m11','maj7s11','7s11','13','maj13','m13']},vals:{'ch-voice':'std'},pass:.75},
  {t:'얼터드 텐션',d:'♭9 · ♯9 · ♭13 · alt',base:4,checks:{'#ch-types':['7','7b9','7s9','7b13','7s9b13','13b9','7s11']},vals:{'ch-voice':'open'},pass:.75}]},
 {mode:'scale',name:'스케일 (Scale)',stages:[
  {t:'메이저 vs 내추럴 마이너',d:'Major · Natural Minor',checks:{'#sc-scales':['major','minor']}},
  {t:'세 가지 마이너',d:'Harmonic · Melodic Minor',checks:{'#sc-scales':['major','minor','harmmin','melmin']}},
  {t:'펜타토닉 · 블루스',d:'Pentatonic · Blues',checks:{'#sc-scales':['major','minor','majpent','minpent','blues']}},
  {t:'교회선법 7개',d:'Church Modes',base:2,checks:{'#sc-scales':['major','dorian','phrygian','lydian','mixolydian','minor','locrian']},vals:{'sc-dir':'updown'},pass:.75},
  {t:'재즈 스케일',d:'Lydian Dominant · Altered · Whole Tone · Diminished',base:3,checks:{'#sc-scales':['melmin','lyddom','altered','whole','dimhw','phrygdom']},pass:.75},
  {t:'모든 스케일',d:'29종 전체',base:4,checks:{'#sc-scales':Object.keys(SCALES).filter(k=>k!=='chromatic')},pass:.7}]},
 {mode:'melody',name:'멜로디 (Melody)',stages:[
  {t:'순차 진행 4음',d:'메이저, 2도 (Step)만',base:1,vals:{'mel-len':4,'mel-leap':'1'}},
  {t:'3도 도약 5음',d:'메이저',base:1,vals:{'mel-len':5,'mel-leap':'2'}},
  {t:'5도 도약 6음',d:'메이저, 첫 음 안 알려줌',base:2,checks:{'#mel-scales':['major']},vals:{'mel-len':6,'mel-leap':'4','mel-give':false}},
  {t:'단조 멜로디',d:'Natural · Harmonic Minor',base:2,checks:{'#mel-scales':['minor','harmmin']},vals:{'mel-len':6,'mel-leap':'3'}},
  {t:'리듬이 섞인 멜로디',d:'메이저·마이너 7음, 리듬 변화 (Rhythm Variation)',base:3,checks:{'#mel-scales':['major','minor']},vals:{'mel-len':7,'mel-leap':'4'}},
  {t:'모드 멜로디',d:'Dorian · Mixolydian · Lydian',base:3,checks:{'#mel-scales':['dorian','mixolydian','lydian']},vals:{'mel-len':8,'mel-leap':'4'},pass:.75},
  {t:'펜타토닉 · 블루스 멜로디',d:'Pentatonic · Blues',base:3,checks:{'#mel-scales':['majpent','minpent','blues']},vals:{'mel-len':8,'mel-leap':'3'},pass:.75},
  {t:'전문가 멜로디',d:'10음, 옥타브 도약',base:4,pass:.7}]},
 {mode:'rhythm',name:'리듬 (Rhythm)',stages:[
  {t:'4분음표 · 8분음표',d:'4/4, 1마디 · 빠른 입력',base:1,...RP(['q','qr','ee'],['4/4'],'1')},
  {t:'8분쉼표 (뒷박)',d:'4/4, 2마디',base:1,...RP(['q','qr','ee','re'],['4/4'],'2')},
  {t:'16분음표 기본',d:'16th',base:2,...RP(['q','ee','ssss','ess','sse'],['4/4'],'2')},
  {t:'점8분음표',d:'Dotted 8th',base:2,...RP(['q','ee','ssss','ess','sse','des','sde'],['4/4','3/4'],'2')},
  {t:'당김음 · 16분쉼표',d:'Syncopation',base:3,...RP(['ee','re','ssss','ses','rsss','rss','rsrs'],['4/4'],'2')},
  {t:'셋잇단음표',d:'Triplet · Shuffle',base:3,...RP(['q','ee','t3','tqe','teq'],['4/4'],'2')},
  {t:'6/8 기본',d:'Compound Time',base:2,...RP(['cdq','cr','c3e','cqe','ceq'],['6/8'],'2')},
  {t:'겹박자 16분',d:'6/8 · 9/8 · 12/8',base:3,...RP(COMP_ALL,['6/8','9/8','12/8'],'2'),pass:.75},
  {t:'악보 입력: 2분 · 4분 · 8분',d:'음표와 쉼표를 직접 채우기 (Score)',base:3,...RS(['h','q','8','rest'],['4/4','3/4'],'2')},
  {t:'악보 입력: 점음표 · 16분',d:'Dotted · 16th',base:3,...RS(['h','q','qd','8','8d','16','rest'],['4/4','2/4'],'2')},
  {t:'붙임줄 · 박을 넘는 당김음',d:'Tie · Syncopation',base:3,...RS(['h','q','qd','8','16','rest','tie','sync'],['4/4','2/2'],'2'),pass:.75},
  {t:'박자 변화',d:'4/4 · 3/4 · 2/4가 마디마다 바뀜 (Mixed Meter)',base:3,...RS(['h','q','8','16','rest'],['4/4','3/4','2/4'],'4',{'rh-mixed':true}),pass:.75},
  {t:'변박',d:'5/8 · 7/8 · 5/4 (Odd Meter)',base:4,...RS(['q','qd','8','16','rest'],['5/8','7/8','5/4'],'2'),pass:.7},
  {t:'종합 4마디',d:'모든 음표 · 셋잇단 · 박자 변화',base:4,...RS(NV_BASIC,['4/4','3/4','6/8','2/2','7/8'],'4',{'rh-mixed':true,'rh-restp':'0.2'}),pass:.7},
  {t:'연음 듣기: 3·5·6·7연음',d:'빠른 입력 · Tuplets',base:4,...RP(['q','ee','ssss','t3','t5','t6','t7'],['4/4'],'2'),pass:.75},
  {t:'악보 입력: 5·6·7연음',d:'연음 버튼으로 직접 채우기 (Score)',base:4,...RS(['q','8','16','trip','t5','t6','t7','rest'],['4/4','2/4'],'2'),pass:.7}]},
 {mode:'prog',name:'코드 진행 (Progression)',stages:[
  {t:'I · IV · V',d:'으뜸·버금딸림·딸림화음',base:1,vals:{'pg-src':'random','pg-mode':'major'}},
  {t:'다이아토닉 3화음',d:'Diatonic Triads, 무작위',base:1,checks:{'#pg-vocab':['I','ii','iii','IV','V','vi']},vals:{'pg-src':'random','pg-mode':'major','pg-len':4}},
  {t:'종지 (Cadence)',d:'정격·변격·반·위종지, 찬송가',base:2,checks:{'#pg-progs':['auth','plagal','half','decep','hymn']},vals:{'pg-src':'genre'}},
  {t:'가요·팝 4코드 진행',d:'4536 · 1625 · 1564 · 6415 등',base:2,checks:{'#pg-progs':['4536','1625','axis','6415','50s','6451','145','ccm4']},vals:{'pg-src':'genre'}},
  {t:'7화음 진행',d:'ii–V–I · 턴어라운드 · 시티팝',base:3,checks:{'#pg-progs':['4536-7','2516','251','turn','citypop']},vals:{'pg-src':'genre','pg-start':false}},
  {t:'전위 · 슬래시 코드',d:'캐논 · 발라드 · 찬송가 · 가스펠',base:3,checks:{'#pg-progs':['canonb','ballad','cad64','ii6','hymn2','worship','gospel','pedal','ccmsus']},vals:{'pg-src':'genre'},pass:.75},
  {t:'단조 진행',d:'안달루시아 · 라멘트 · 나폴리',base:3,checks:{'#pg-progs':['mauth','mpredom','andal','minpop','minpop2','picardy','lament','neap']},vals:{'pg-src':'genre'},pass:.75},
  {t:'세컨더리 · 차용 · 재즈',d:'III7 · iv · ♭VII · 백도어 · 블루스',base:4,checks:{'#pg-progs':['4536-III','4m','mixo','aeol','3625','jttou','backdoor','tritone','blues12','m251','circle']},vals:{'pg-src':'genre'},pass:.75},
  {t:'모든 장르 종합',d:'클래식·가요·팝·교회음악·재즈',base:4,checks:{'#pg-progs':PROGS.map(p=>p.id)},vals:{'pg-src':'genre','pg-start':false},pass:.7}]}
];
const STAGE={};TRACKS.forEach(tr=>tr.stages.forEach((s,i)=>{const multi=['melody','rhythm','prog'].includes(tr.mode);Object.assign(s,{id:tr.mode+'-'+i,idx:i,mode:tr.mode,trackName:tr.name,need:s.need||(multi?10:20),pass:s.pass||.8});STAGE[s.id]=s;}));
TRACKS.forEach(tr=>tr.stages.forEach((s,i)=>{s.next=tr.stages[i+1]?tr.stages[i+1].id:null;s.prev=i?tr.stages[i-1].id:null;}));
let course=store.get('course',{st:{},active:null,last:null,unlockAll:false});
let daily=store.get('daily',{date:null,count:0,streak:0,goal:30});
const saveCourse=()=>store.set('course',course),saveDaily=()=>store.set('daily',daily);
function dstr(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
const todayStr=()=>dstr(new Date()),yestStr=()=>{const d=new Date();d.setDate(d.getDate()-1);return dstr(d);};
function bumpDaily(){const t=todayStr();if(daily.date!==t){daily.streak=daily.date===yestStr()?daily.streak+1:1;daily.date=t;daily.count=0;}daily.count++;saveDaily();renderDailyChip();}
function curStreak(){return daily.date===todayStr()||daily.date===yestStr()?daily.streak:0;}
function todayCount(){return daily.date===todayStr()?daily.count:0;}
function renderDailyChip(){const el=$('#daily-chip');if(el)el.innerHTML=`오늘 <b>${todayCount()}</b>/${daily.goal} · 연속 <b>${curStreak()}</b>일`;}
const stState=id=>course.st[id]||{h:[],cleared:false,best:0};
const avgLast=(h,n)=>{const x=h.slice(-n);return x.length?x.reduce((a,b)=>a+b,0)/x.length:0;};
function unlocked(s){return course.unlockAll||!s.prev||stState(s.prev).cleared;}
const MASTER_NEED=0.5; /* 통과하려면 단계에서 3번 이상 나온 항목 중 이 비율 이상이 '익힘'이어야 함 */
function courseTouch(m,k){const a=course.active&&STAGE[course.active];if(!a||a.mode!==m)return;const p=course.st[a.id]=stState(a.id);p.keys=p.keys||[];if(!p.keys.includes(k)){p.keys.push(k);if(p.keys.length>200)p.keys.shift();}}
function stageMastery(s){const p=stState(s.id);const ks=(p.keys||[]).filter(k=>{const it=(adapt[s.mode]||{items:{}}).items[k];return it&&it.t>=3;});
  if(!ks.length)return {r:1,n:0,k:0};const k=ks.filter(x=>['known','review'].includes(adaptState(s.mode,x))).length;return {r:k/ks.length,n:ks.length,k};}
function courseRecord(mode,score){const a=course.active&&STAGE[course.active];if(!a||a.mode!==mode)return;const p=course.st[a.id]=stState(a.id);p.h.push(score);if(p.h.length>a.need*3)p.h=p.h.slice(-a.need*3);
  if(p.h.length>=a.need){const av=avgLast(p.h,a.need);p.best=Math.max(p.best||0,av);if(!p.cleared&&av>=a.pass&&stageMastery(a).r>=MASTER_NEED){p.cleared=true;p.justCleared=true;}}saveCourse();renderBanner(mode);}
function startStage(id){const s=STAGE[id];if(!s)return;const m=s.mode;quiet=true;
  PRESETS[m](s.base||1);const v=s.vals||{};
  if(v['pg-mode']){$('#pg-mode').value=v['pg-mode'];buildVocab();}
  for(const k in v){const i=document.getElementById(k);if(!i)continue;if(i.type==='checkbox')i.checked=v[k];else i.value=v[k];}
  if(m==='rhythm'&&!s.checks)PRESETS.rhythm(s.base||1);
  for(const sel in (s.checks||{}))setChecked($(sel),s.checks[sel]);
  if(m==='prog')pgSrcToggle();if(m==='rhythm')rhInputToggle();
  quiet=false;setSeg(m,'c');saveSet(m);course.active=id;course.last=id;saveCourse();showTab(m);NEWQ[m]();renderBanner(m);}
function exitCourse(){const a=course.active&&STAGE[course.active];course.active=null;saveCourse();if(a)renderBanner(a.mode);}
function renderBanner(mode){const el=$('#cb-'+mode);if(!el)return;const a=course.active&&STAGE[course.active];if(!a||a.mode!==mode){el.hidden=true;el.innerHTML='';return;}
  const p=stState(a.id);const n=Math.min(p.h.length,a.need);const av=Math.round(avgLast(p.h,a.need)*100);el.hidden=false;
  const msg=p.justCleared?`<div class="cleared">통과했어요! ${a.next?'다음 단계가 열렸어요.':'이 트랙을 모두 마쳤어요.'}</div>`:'';if(p.justCleared){p.justCleared=false;saveCourse();}
  el.innerHTML=`<div class="cb-main"><b>코스 · ${a.trackName} ${a.idx+1}단계</b> ${a.t}<div class="mini">${n} / ${a.need}문제 · 최근 ${a.need}문제 정답률 ${p.h.length?av+'%':'–'} · 통과 기준 ${Math.round(a.pass*100)}%${(()=>{const ms=stageMastery(a);return ms.n?` · 익힘 ${ms.k}/${ms.n}개 (절반 이상 필요)`:'';})()}${p.cleared?' · <b style="color:var(--good)">통과</b>':''}</div>
    <div class="meter" style="margin-top:6px"><i style="width:${n/a.need*100}%"></i></div>${msg}</div>
    <div class="controls" style="margin:0">${p.cleared&&a.next?`<button class="btn primary" data-act="next">다음 단계</button>`:''}<button class="btn" data-act="list">코스 목록</button><button class="btn ghost" data-act="exit">코스 나가기</button></div>`;
  el.onclick=e=>{const b=e.target.closest('[data-act]');if(!b)return;const act=b.dataset.act;if(act==='next')startStage(a.next);else if(act==='list')showTab('course');else exitCourse();};}
function continueId(){if(course.last){const s=STAGE[course.last];if(!stState(s.id).cleared)return s.id;if(s.next&&unlocked(STAGE[s.next]))return s.next;}
  for(const tr of TRACKS)for(const s of tr.stages)if(unlocked(s)&&!stState(s.id).cleared)return s.id;return TRACKS[0].stages[0].id;}
function renderCourse(){const tc=todayCount(),g=daily.goal;const cid=continueId(),cs=STAGE[cid];
  $('#today-box').innerHTML=`<div class="today-grid"><div><div class="big">${tc}<span>/ ${g}문제</span></div><div class="meter" style="margin:8px 0 4px"><i style="width:${Math.min(100,tc/g*100)}%;background:${tc>=g?'var(--good)':'var(--accent)'}"></i></div>
    <div class="mini">${tc>=g?'오늘 목표를 채웠어요.':`목표까지 ${g-tc}문제 남았어요.`} 연속 연습 <b>${curStreak()}일</b></div></div>
    <div class="today-act"><button class="btn primary" id="course-go">이어서 하기 · ${cs.trackName.split(' (')[0]} ${cs.idx+1}단계</button><div class="mini">${cs.t}</div></div></div>
    <div class="today-opts"><label for="daily-goal">하루 목표 <select id="daily-goal" style="width:auto">${[10,20,30,50,100].map(x=>`<option${x===g?' selected':''}>${x}</option>`).join('')}</select> 문제</label>
    <label class="chk" for="course-unlock" style="padding:0"><input type="checkbox" id="course-unlock"${course.unlockAll?' checked':''}>모든 단계 열기 (선생님용)</label></div>`;
  $('#course-go').onclick=()=>startStage(cid);$('#daily-goal').onchange=e=>{daily.goal=+e.target.value;saveDaily();renderCourse();renderDailyChip();};
  $('#course-unlock').onchange=e=>{course.unlockAll=e.target.checked;saveCourse();renderCourse();};
  /* 트랙은 접었다 펼 수 있다. 휴대폰에서는 '이어서 하기' 단계가 있는 트랙만 펼쳐 둔다 */
  $('#tracks').innerHTML=TRACKS.map(tr=>{const done=tr.stages.filter(s=>stState(s.id).cleared).length;const open=!isMobile()||tr.mode===cs.mode;
    return `<details class="card track"${open?' open':''}><summary><div class="track-h"><h2>${tr.name}</h2><span class="mini">${done} / ${tr.stages.length} 통과</span></div><div class="meter" style="margin-bottom:10px"><i style="width:${done/tr.stages.length*100}%"></i></div></summary>
    ${tr.stages.map(s=>{const p=stState(s.id),u=unlocked(s);const cls=p.cleared?'done':!u?'locked':s.id===cid?'next':'';const pr=p.h.length?Math.round(avgLast(p.h,s.need)*100)+'%':'';
      return `<button class="stage ${cls}" data-id="${s.id}"${u?'':' aria-disabled="true"'}><span class="num">${p.cleared?'✓':s.idx+1}</span><span class="st-t"><b>${s.t}</b><small>${s.d}</small></span><span class="st-r">${!u?'잠김':p.cleared?'통과':pr?pr:''}</span></button>`;}).join('')}</details>`;}).join('');
  $('#tracks').onclick=e=>{const b=e.target.closest('.stage');if(!b)return;const s=STAGE[b.dataset.id];if(!unlocked(s))return;startStage(s.id);};}
