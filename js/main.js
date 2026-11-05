/* 초기화, 탭 전환, 단축키 */
"use strict";
/* ================= 초기화 ================= */
function init(){
  $('#g-naming').value=naming;$('#g-vol').value=store.get('vol',0.7);$('#g-auto').checked=store.get('auto',false);
  $('#g-naming').onchange=e=>{naming=e.target.value;store.set('naming',naming);buildVocab();refreshCurrent();};
  $('#g-vol').oninput=e=>{store.set('vol',+e.target.value);if(master)master.gain.value=+e.target.value;if(drumBus)drumBus.gain.value=+e.target.value;};
  $('#g-auto').onchange=e=>store.set('auto',e.target.checked);
  $('#g-inst').value=curInst;$('#g-inst').onchange=e=>{curInst=e.target.value;store.set('inst',curInst);loadInst(curInst);sampleStatus();};
  $('#g-rev').checked=store.get('rev',true);$('#g-rev').onchange=e=>{store.set('rev',e.target.checked);applyReverb();};
  loadSamples();
  keyOptions($('#mel-key'));keyOptions($('#pg-key'));keyOptions($('#ch-root'));
  checkGroup($('#mel-scales'),groupBy(Object.entries(SCALES),([k,v])=>v.g).map(g=>({name:g.name,items:g.items.map(([k,v])=>({id:k,label:v.n,sub:v.s}))})),'mel');
  {const NV=[['w','온','Whole'],['hd','점2분','Dotted Half'],['h','2분','Half'],['qd','점4분','Dotted Quarter'],['q','4분','Quarter'],['8d','점8분','Dotted 8th'],['8','8분','8th'],['16','16분','16th']];
   checkGroup($('#mel-vals'),[{name:'음표 (Notes) · 쉼표 (Rests)',items:NV.flatMap(([k,n,e])=>[{id:k,label:n+'음표',sub:e},{id:'r'+k,label:n+'쉼표',sub:e+' Rest'}])}],'melv');}
  checkGroup($('#sc-scales'),groupBy(Object.entries(SCALES).filter(([k])=>k!=='chromatic'),([k,v])=>v.g).map(g=>({name:g.name,items:g.items.map(([k,v])=>({id:k,label:v.n,sub:v.s}))})),'sc');
  checkGroup($('#ch-types'),groupBy(CHORDS,c=>c.g).map(g=>({name:g.name,items:g.items.map(c=>({id:c.id,label:'C'+(c.sym||''),sub:c.kr}))})),'ch');
  checkGroup($('#iv-list'),[{name:'옥타브 안 (Simple Interval)',items:INTERVALS.filter(i=>i.s<=12)},{name:'복음정 (Compound Interval)',items:INTERVALS.filter(i=>i.s>12)}].map(g=>({name:g.name,items:g.items.map(i=>({id:i.id,label:i.n,sub:i.a}))})),'iv');
  buildVocab();buildProgList();buildRhPats();
  Object.assign(NEWQ,{melody:melNew,chord:chNew,prog:pgNew,rhythm:rhNew,scale:scNew,interval:ivNew});
  ['melody','chord','prog','rhythm','scale','interval'].forEach(m=>{initSeg(m);loadSet(m,1);showScore(m);});
  if(store.get('setver',0)<3){const lv=curSeg('melody');quiet=true;if(lv!=='c')PRESETS.melody(+lv);
    else{const mv=checked($('#mel-vals'));if(!mv.some(x=>/^r(?!est)/.test(x)))setChecked($('#mel-vals'),[...mv,...mv.map(x=>'r'+x)]);}quiet=false;saveSet('melody');store.set('setver',3);}{const sp=store.get('set_prog',null);if(sp&&sp.vals&&sp.vals['pg-src']==null){$('#pg-src').value='random';}}pgSrcToggle();rhInputToggle();renderDailyChip();buildSpeedBars();{const mv=checked($('#mel-vals'));if(!mv.length){setChecked($('#mel-vals'),['h','q']);saveSet('melody');}}if(!store.get('rhsnd2',false)){$('#rh-sound').value='mallet';saveSet('rhythm');store.set('rhsnd2',true);}
  $('#gear').onclick=()=>{const g=$('#globals');const on=g.classList.toggle('open');$('#gear').classList.toggle('on',on);$('#gear').setAttribute('aria-expanded',on);};
  $('#mel-play').onclick=()=>playToggle('melody');$('#mel-refbtn').onclick=()=>{stopAll();melRef(now());};
  $('#mel-mine').onclick=()=>{if(M.q&&M.ans.length)melPlay(false,true);};
  $('#mel-back').onclick=melBack;$('#mel-clear').onclick=melClear;
  $('#mel-durbar').onclick=e=>{const rb=e.target.closest('[data-rb]');if(rb){melRest(+rb.dataset.rb);return;}const b=e.target.closest('[data-b]');if(!b||M.checked)return;const d=+b.dataset.b;M.curDur=d;if(M.sel!=null){M.dur[M.sel]=d;M.sel=null;}melDurbar();melSlots();};
  $('#mel-check').onclick=melCheck;$('#mel-next').onclick=melNew;
  $('#ch-play').onclick=()=>playToggle('chord');$('#ch-arp').onclick=()=>chPlay(C.q.notes,'arp');$('#ch-next').onclick=chNew;
  $('#pg-play').onclick=()=>playToggle('prog');$('#pg-refbtn').onclick=()=>{stopAll();const q=G.q;chordAt(progVoicings(q.key,[VOCAB[q.mode].find(v=>v.id===(q.mode==='major'?'I':'i'))])[0],now(),1.4);};
  $('#pg-mine').onclick=pgMine;$('#pg-back').onclick=pgBack;$('#pg-clear').onclick=pgClear;$('#pg-check').onclick=pgCheck;$('#pg-next').onclick=pgNew;
  $('#rh-play').onclick=()=>playToggle('rhythm');$('#rh-mine').onclick=rhMine;$('#rh-back').onclick=rhBack;$('#rh-clear').onclick=rhClear;
  $('#rh-durpad').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.dt)sAddDirect(+b.dataset.dt,false);else if(b.dataset.dr)sAddDirect(+b.dataset.dr,true);else if(b.dataset.t)sAdd(+b.dataset.t);else if(b.dataset.tup){const n=+b.dataset.tup;R.mod.tup=R.mod.tup===n?0:n;renderDurpad();}else if(b.dataset.a)sAction(b.dataset.a);};
  $('#rh-modetg').onclick=e=>{const b=e.target.closest('button');if(!b||b.dataset.v===rhInput())return;$('#rh-input').value=b.dataset.v;$('#rh-input').dispatchEvent(new Event('change',{bubbles:true}));};$('#rh-check').onclick=rhCheck;$('#rh-next').onclick=rhNew;
  $('#sc-play').onclick=()=>playToggle('scale');$('#sc-refbtn').onclick=scRef;$('#sc-next').onclick=scNew;
  $('#iv-play').onclick=()=>playToggle('interval');
  Object.values(PLAYBTN).forEach(pre=>{$('#'+pre+'-stop').onclick=stopPlay;});$('#iv-next').onclick=ivNew;
  $('#tabs').onclick=e=>{const b=e.target.closest('button');if(!b)return;showTab(b.dataset.tab);};
  // 화면 크기가 휴대폰↔PC로 바뀌면 입력판·건반을 다시 그림
  window.matchMedia('(max-width:640px)').addEventListener('change',()=>{if(M.q){buildPiano($('#mel-piano'),...pianoRange(),melKey);melDurbar();}if(R.q&&R.q.mode==='score')renderDurpad();});
  // 첫 화면: 문제만 준비하고 소리는 사용자가 누를 때
  ['melody','chord','prog','rhythm','scale','interval'].forEach(m=>prepare(m));
  const h=location.hash.replace('#','');showTab(['course','melody','chord','prog','rhythm','scale','interval','stats'].includes(h)?h:store.get('tab2','course'),true);
}
let prepared={};
function prepare(m){SILENT=true;try{NEWQ[m]();}finally{SILENT=false;}prepared[m]=true;}
let curTab='course';
function showTab(t,initial){curTab=t;stopAll();$$('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===t));$$('.panel').forEach(p=>p.classList.toggle('on',p.id==='p-'+t));
  {const tb=$('#tabs'),b=tb.querySelector('button.on');if(b){const left=b.offsetLeft-(tb.clientWidth-b.offsetWidth)/2;tb.scrollTo({left:Math.max(0,left),behavior:initial?'auto':'smooth'});}
   if($('#globals').classList.contains('open'))$('#gear').click();}
  if(t==='stats')renderStats();if(t==='course')renderCourse();renderBanner(t);store.set('tab2',t);if(!initial){try{history.replaceState(null,'','#'+t);}catch(e){}}}
function refreshCurrent(){if(curTab==='melody'&&M.q){buildPiano($('#mel-piano'),...pianoRange(),melKey);melDurbar();melSlots();}
  else if(NEWQ[curTab])NEWQ[curTab]();}
window.addEventListener('hashchange',()=>{const h=location.hash.replace('#','');if($('#p-'+h))showTab(h,true);});
document.addEventListener('keydown',e=>{const tag=(document.activeElement||{}).tagName;if(['INPUT','SELECT','TEXTAREA'].includes(tag))return;if(e.metaKey||e.ctrlKey||e.altKey)return;if(rhKey(e)||melKeyShortcut(e)){e.preventDefault();return;}
  const map={melody:{p:()=>melPlay(false),c:melCheck},chord:{p:()=>chPlay(C.q.notes)},prog:{p:()=>pgPlayList(G.q.voicings,false,true),c:pgCheck},rhythm:{p:()=>rhPlayQ(),c:rhCheck},scale:{p:()=>scPlay(S.q.id,S.q.tonic)},interval:{p:()=>ivPlay(I.q)}}[curTab];if(!map)return;
  if(e.code==='Space'){e.preventDefault();playToggle(curTab);}else if(e.key==='Escape'){e.preventDefault();stopPlay();}else if(e.key==='Enter'&&map.c){e.preventDefault();map.c();}else if((e.key==='s'||e.key==='S'||e.key==='ㄴ')&&SPEED[curTab]){e.preventDefault();playSlow(curTab);}else if(e.key==='n'||e.key==='N'||e.key==='ㅜ'){e.preventDefault();NEWQ[curTab]();}});
init();
