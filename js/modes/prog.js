/* 코드 진행 (도수) */
"use strict";
/* ================= 코드 진행 ================= */
const G={q:null,ans:[],cur:0,checked:false};
const isSec=v=>v.cat.startsWith('세컨더리');
const vb=v=>v.bass==null?v.r:v.bass;
function chName(v,key,flat){flat=flat||v.lb.split('/')[0].includes('♭');return pcName(mod(key+v.r),flat)+CH[v.t].sym+(vb(v)!==v.r?'/'+pcName(mod(key+vb(v)),flat):'');}
const sameChord=(a,v)=>a.id===v.id||(a.r===v.r&&a.t===v.t&&mod(vb(a))===mod(vb(v)));
const GENRES={classical:'클래식 (Classical)',kpop:'가요·K-pop',pop:'팝·록 (Pop · Rock)',church:'교회음악 (Hymn · CCM)',jazz:'재즈 (Jazz)'};
const PROGS=[
 ['auth','정격 종지 (Authentic Cadence)','classical church','major','I IV V I',1],
 ['plagal','변격 종지·아멘 종지 (Plagal Cadence)','classical church','major','I IV I',1],
 ['half','반종지 (Half Cadence)','classical','major','I vi ii V',1],
 ['decep','위종지 (Deceptive Cadence)','classical','major','I IV V vi',2],
 ['cad64','종지 6/4 (Cadential 6-4)','classical church','major','I IV I_5 V7 I',3],
 ['ii6','ii6 종지 (I–ii6–V–I)','classical church','major','I ii_4 V7 I',3],
 ['circle','5도권 진행 (Circle of Fifths)','classical jazz','major','I IV viid iii vi ii V I',3],
 ['canon','캐논 진행 (Pachelbel\'s Canon)','classical kpop church','major','I V vi iii IV I IV V',2],
 ['canonb','캐논 진행 · 베이스 순차 (Canon, Stepwise Bass)','classical kpop church','major','I V_7 vi iii_5 IV I_3 IV V',3],
 ['mauth','단조 정격 종지 (Minor Authentic Cadence)','classical','minor','i iv V i',1],
 ['mpredom','단조 ii°–V (Minor Predominant)','classical','minor','i bVI iid V i',2],
 ['neap','나폴리 6화음 (Neapolitan Sixth)','classical','minor','i bII_4 V7 i',4],
 ['lament','라멘트 베이스 (Lament Bass)','classical pop','minor','i i_b7 i_6 bVI V',4],
 ['andal','안달루시아 종지 (Andalusian Cadence)','classical pop','minor','i bVII bVI V',2],
 ['picardy','피카르디 3도 (Picardy Third)','classical church','minor','i iv V Ipic',3],
 ['4536','4536 진행 · 왕도 진행 (Royal Road)','kpop','major','IV V iii vi',1],
 ['4536-7','4536 진행 7화음 (Royal Road, 7ths)','kpop','major','IVM7 V iii7 vi7',2],
 ['4536-III','4-5-3-6 세컨더리 (IV–V–III7–vi)','kpop pop','major','IVM7 V7 V7/vi vi7',3],
 ['1625','1625 진행 (I–vi–ii–V)','kpop jazz','major','I vi ii V',1],
 ['2516','2-5-1-6 진행 (ii7–V7–IΔ7–vi7)','kpop jazz','major','ii7 V7 IM7 vi7',2],
 ['ballad','발라드 베이스 하행 (Ballad Descending Bass)','kpop church','major','I V_7 vi I_5 IV I_3 ii7 V',3],
 ['4m','4-4m 진행 (IV–iv, Minor Subdominant)','kpop pop','major','I IV iv I',3],
 ['jttou','저스트 투 오브 어스 진행 (Just the Two of Us)','kpop pop','major','IVM7 V7/vi vi7 v7 I7',4],
 ['citypop','시티팝 진행 (City Pop)','kpop','major','IVM7 iii7 vi7 ii7 V7sus4',4],
 ['6451','6-4-5-1 진행 (vi–IV–V–I)','kpop pop','major','vi IV V I',1],
 ['axis','1564 진행 · 액시스 (Axis Progression)','pop kpop church','major','I V vi IV',1],
 ['6415','6415 진행 (vi–IV–I–V)','pop','major','vi IV I V',1],
 ['50s','1645 진행 · 50년대 (Doo-wop)','pop','major','I vi IV V',1],
 ['145','1-4-5-4 진행 (Rock, I–IV–V–IV)','pop','major','I IV V IV',1],
 ['blues12','12마디 블루스 (12-Bar Blues)','pop jazz','major','I7 I7 I7 I7 IV7 IV7 I7 I7 V7 IV7 I7 V7',3],
 ['mixo','믹솔리디안 록 (I–♭VII–IV–I)','pop','major','I bVII IV I',2],
 ['aeol','♭VI–♭VII–I 종지 (Aeolian Cadence)','pop','major','I bVI bVII I',3],
 ['minpop','단조 팝 (i–♭VI–♭III–♭VII)','pop kpop','minor','i bVI bIII bVII',2],
 ['minpop2','단조 팝 2 (i–♭VII–♭VI–♭VII)','pop','minor','i bVII bVI bVII',2],
 ['hymn','찬송가 기본 (Hymn Basic)','church','major','I IV I V I',1],
 ['hymn2','찬송가 ii6 종지 (Hymn with ii6)','church','major','I vi ii_4 V I',3],
 ['ccm4','CCM 4-1-5-6 (IV–I–V–vi)','church pop','major','IV I V vi',1],
 ['ccmsus','CCM sus 종지 (Vsus4–V)','church pop','major','I IV Vsus4 V',2],
 ['worship','워십 베이스 상행 (Worship Bass Walk-up)','church','major','IV I_3 ii7 V I',3],
 ['gospel','가스펠 IV/5 진행 (Gospel IV/V)','church kpop','major','vi7 ii7 IV_5 I',3],
 ['pedal','토닉 페달 (Tonic Pedal, IV/1)','church','major','I IV_1 I IV_1',3],
 ['251','투파이브원 (ii–V–I)','jazz','major','ii7 V7 IM7',2],
 ['turn','턴어라운드 (Turnaround)','jazz','major','IM7 vi7 ii7 V7',2],
 ['3625','3-6-2-5-1 (iii–VI7–ii–V–I)','jazz','major','iii7 V7/ii ii7 V7 IM7',3],
 ['m251','마이너 투파이브원 (Minor ii–V–i)','jazz','minor','iiø7 V7b9 i7',3],
 ['backdoor','백도어 진행 (Backdoor ii–V)','jazz','major','iv7 bVII7 IM7',4],
 ['tritone','트라이톤 대리 (Tritone Substitution)','jazz','major','ii7 bII7 IM7',4]
].map(([id,n,g,mode,seq,lv])=>({id,n,g:g.split(' '),mode,seq:seq.split(' '),lv}));
const PROGMAP=Object.fromEntries(PROGS.map(p=>[p.id,p]));
function buildVocab(){const mode=$('#pg-mode').value;const prev=checked($('#pg-vocab'));
  checkGroup($('#pg-vocab'),groupBy(VOCAB[mode],v=>v.cat).map(g=>({name:g.name,items:g.items.map(v=>({id:v.id,label:v.lb,sub:'C 기준 '+chName(v,0,mode==='minor'||FLAT_KEYS.has(v.r))}))})),'pg-'+mode);
  setChecked($('#pg-vocab'),prev);return prev;}
function buildProgList(){checkGroup($('#pg-progs'),Object.keys(GENRES).map(g=>({name:GENRES[g],items:PROGS.filter(p=>p.g[0]===g).map(p=>({id:p.id,label:p.n,sub:p.seq.map(id=>VOCAB[p.mode].find(v=>v.id===id).lb).join(' – ')+(p.g.length>1?' · '+p.g.slice(1).map(x=>GENRES[x].split(' (')[0]).join(', '):'')}))})),'pgp');}
function pgSrcToggle(){const genre=$('#pg-src').value==='genre';const hide=el=>{if(el)el.style.display=genre?'none':'';};
  hide($('#pg-mode').closest('label'));hide($('#pg-len').closest('label'));hide($('#pg-resolve').closest('label'));hide($('#pg-vocab'));hide($('#pg-vocab-label'));
  $('#pg-progs').style.display=genre?'':'none';$('#pg-progs-label').style.display=genre?'':'none';}
AFTERCHANGE.prog=e=>{const id=e&&e.target&&e.target.id;if(id==='pg-mode'){buildVocab();PRESETS.prog(levelOfVocabFallback(),true);}if(id==='pg-src')pgSrcToggle();};
function levelOfVocabFallback(){const l=curSeg('prog');return l==='c'?2:+l;}
PRESETS.prog=(lv,keepSrc)=>{const mode=$('#pg-mode').value;const V=VOCAB[mode];
  let ids;if(lv===1)ids=mode==='major'?['I','IV','V']:['i','iv','V'];
  else if(lv===2)ids=V.filter(v=>v.cat.startsWith('다이아토닉 3화음')&&v.lv<=2).map(v=>v.id);
  else if(lv===3)ids=V.filter(v=>v.cat.startsWith('다이아토닉 7화음')&&v.lv<=3||(isSec(v)&&v.lv<=3)).map(v=>v.id);
  else ids=V.filter(v=>!v.cat.startsWith('다이아토닉 3화음')).map(v=>v.id);
  setChecked($('#pg-vocab'),ids);setChecked($('#pg-progs'),PROGS.filter(p=>p.lv<=(lv<=2?1:lv===3?3:4)).map(p=>p.id));
  if(!keepSrc){$('#pg-src').value=lv===1?'random':'genre';pgSrcToggle();}
  $('#pg-len').value={1:4,2:4,3:6,4:8}[lv];$('#pg-beats').value=lv<=2?'4':'2';
  $('#pg-start').checked=lv<=3;$('#pg-resolve').checked=true;$('#pg-ref').checked=lv<=2;$('#pg-tempo').value={1:80,2:90,3:96,4:110}[lv];$('#pg-key').value='r';};
function genProg(){
  const kv=$('#pg-key').value,key=kv==='r'?rnd(12):+kv;
  if($('#pg-src').value==='genre'){let pids=checked($('#pg-progs'));if(!pids.length)pids=['axis'];
    /* 진행 자체의 약점 + 그 진행에 든 코드들의 약점 평균 */
    const P=PROGMAP[adaptOn('pg')?wpick(pids,id=>{const pp=PROGMAP[id];const cw=pp.seq.reduce((a,c)=>a+adaptW('prog','pg','c:'+c),0)/pp.seq.length;return adaptW('prog','pg','g:'+id)*(0.5+0.5*cw);}):pick(pids)];const V=VOCAB[P.mode];
    const seq=P.seq.map(id=>V.find(v=>v.id===id));const used=new Set();pids.forEach(pid=>{const pp=PROGMAP[pid];if(pp.mode===P.mode)pp.seq.forEach(x=>used.add(x));});
    V.filter(v=>v.cat.startsWith('다이아토닉 3화음')&&v.lv<=2).forEach(v=>used.add(v.id));
    return {mode:P.mode,key,seq,flat:useFlat(key,P.mode==='minor'?[0,3]:[0,4]),pool:V.filter(v=>used.has(v.id)),prog:P};}
  const mode=$('#pg-mode').value,V=VOCAB[mode];let ids=checked($('#pg-vocab'));if(ids.length<2)ids=mode==='major'?['I','IV','V']:['i','iv','V'];
  const pool=V.filter(v=>ids.includes(v.id));const len=numVal('pg-len',2,12,4);
  const tonicV=V.find(v=>v.id===(mode==='major'?'I':'i'));const seq=[];
  for(let i=0;i<len;i++){
    if(i===0&&$('#pg-start').checked){seq.push(tonicV);continue;}
    const prev=seq[i-1];
    if(prev&&isSec(prev)&&$('#pg-resolve').checked){const tgt=mod(prev.r+5);const opts=pool.filter(v=>v.r===tgt&&!isSec(v));if(opts.length&&Math.random()<0.85){seq.push(pick(opts));continue;}}
    let c,guard=0;do{c=adaptOn('pg')?wpick(pool,v=>adaptW('prog','pg','c:'+v.id)*(prev?clampW(adaptW('prog','pg','p:'+prev.id+'>'+v.id),0.5,3):1)):pick(pool);guard++;}while(guard<30&&prev&&(c.id===prev.id||(i===len-1&&isSec(c))));seq.push(c);
  }
  return {mode,key,seq,flat:useFlat(key,mode==='minor'?[0,3]:[0,4]),pool};}
function progVoicings(key,seq){const out=[];let prevMean=64;
  seq.forEach(v=>{const bass=40+mod(key+vb(v)-4);
    const iv=CH[v.t].iv;let pcs=[...new Set(iv.filter(i=>i!==0||iv.length<=3).map(i=>mod(i+key+v.r)))];if(pcs.length>4){const keep=new Set(iv.slice(1).map(i=>mod(i+key+v.r)));pcs=pcs.filter(p=>keep.has(p));}
    let best=null,bs=1e9;for(let start=52;start<=64;start++){if(!pcs.includes(mod(start)))continue;const vv=[];let p=start-1;pcs.slice().sort((a,b)=>mod(a-start)-mod(b-start)).forEach(pc=>{let n=p+1;while(mod(n)!==pc)n++;vv.push(n);p=n;});const mean=vv.reduce((a,b)=>a+b,0)/vv.length;const sc=Math.abs(mean-prevMean)+Math.abs(mean-62)*0.4+(vv[vv.length-1]>79?20:0);if(sc<bs){bs=sc;best=vv;}}
    prevMean=best.reduce((a,b)=>a+b,0)/best.length;out.push([bass,...best]);});return out;}
function pgPlayList(list,withRef,highlight){stopAll();let t=now();const spb=60/bpm('prog');const beats=+$('#pg-beats').value;const dur=spb*beats;
  if(withRef){const q=G.q;const tv=progVoicings(q.key,[VOCAB[q.mode].find(v=>v.id===(q.mode==='major'?'I':'i'))])[0];chordAt(tv,t,1.2);t+=1.8;}
  const t0=ac().currentTime;list.forEach((notes,i)=>{if(notes){chordAt(notes,t,dur*0.92);}if(highlight){const s=t-t0;at(s,()=>{$$('#pg-slots .slot').forEach((e,j)=>e.classList.toggle('playing',j===i));});}t+=dur;});
  if(highlight)at(t-t0,()=>$$('#pg-slots .playing').forEach(e=>e.classList.remove('playing')));}
function pgNew(){stopAll();const q=G.q=genProg();q.voicings=progVoicings(q.key,q.seq);G.ans=q.seq.map(()=>null);G.cur=0;G.checked=false;
  if($('#pg-start').checked){G.ans[0]=q.seq[0].id;G.cur=1;}
  $('#pg-meta').innerHTML=`키 (Key) <b>${pcName(q.key,q.flat)} ${q.mode==='major'?'메이저 (Major)':'마이너 (Minor)'}</b> · 코드 ${q.seq.length}개${q.prog?' · 장르 진행 (Common Progression)':''}`;
  const groups=groupBy(q.pool,v=>v.cat);
  const fold=q.pool.length>12;
  $('#pg-palette').innerHTML=groups.map((g,gi)=>`<details class="cgp"${(!fold||!isMobile()||gi===0)?' open':''}><summary><b>${g.name}</b><span>${g.items.length}개</span></summary><div class="choices">${g.items.map(v=>`<button class="choice" data-id="${v.id}">${v.lb}<small>${chName(v,q.key,q.flat)}</small></button>`).join('')}</div></details>`).join('');
  $('#pg-palette').onclick=e=>{const b=e.target.closest('.choice');if(!b||G.checked)return;G.ans[G.cur]=b.dataset.id;const v=q.pool.find(x=>x.id===b.dataset.id);
    pgPlayList([progVoicings(q.key,[v])[0]],false,false);G.cur=Math.min(G.cur+1,q.seq.length-1);const nxt=G.ans.findIndex(a=>a==null);if(nxt>=0)G.cur=nxt;pgSlots();};
  pgSlots();$('#pg-fb').innerHTML='';$('#pg-fb').className='feedback';$('#pg-cmp').innerHTML='';clearStaff($('#pg-staff'));
  {const all=q.voicings.flat();needRange(Math.min(...all),Math.max(...all));}autoPlay(()=>pgPlayList(q.voicings,$('#pg-ref').checked,true));}
function pgBack(){if(!G.q||G.checked)return;const min=$('#pg-start').checked?1:0;let i=G.ans.length-1;while(i>=min&&G.ans[i]==null)i--;if(i<min)return;G.ans[i]=null;G.cur=i;pgSlots();}
function pgClear(){if(!G.q||G.checked)return;const g=$('#pg-start').checked;G.ans=G.q.seq.map((v,i)=>(g&&i===0)?v.id:null);G.cur=g?1:0;pgSlots();}
function pgSlots(res){const q=G.q;$('#pg-slots').innerHTML=q.seq.map((v,i)=>{const a=G.ans[i];const av=a&&q.pool.find(x=>x.id===a);let cls='slot rslot';if(!a)cls+=' empty';if(i===G.cur&&!G.checked)cls+=' cur';if(res)cls+=res[i]?' right':' wrong';else if(i===0&&$('#pg-start').checked)cls+=' given';
    return `<button class="${cls}" data-i="${i}">${av?av.lb:(i+1)}${av?`<small>${chName(av,q.key,q.flat)}</small>`:''}</button>`;}).join('');
  $('#pg-slots').onclick=e=>{const b=e.target.closest('.slot');if(!b||G.checked)return;G.cur=+b.dataset.i;pgSlots();};
  /* 휴대폰에서는 채점 전 '내가 고른 코드' 악보를 생략한다 (큰 보표가 화면을 너무 차지함) */
  if(isMobile()&&!res){clearStaff($('#pg-mystaff'));return;}
  safeDraw(()=>drawChords($('#pg-mystaff'),{title:res?'내 답 (My Answer)':'내가 고른 코드 (My Chords)',chords:G.ans.map((a,i)=>{if(!a)return {midis:[],top:'?',bottom:String(i+1)};const v=q.pool.find(x=>x.id===a);const fl=q.flat||v.lb.split('/')[0].includes('♭');
    return {midis:progVoicings(q.key,[v])[0],spell:chordSpeller(mod(q.key+v.r),v.t,fl),top:chName(v,q.key,q.flat),bottom:v.lb,color:res?(res[i]?GOODC:BADC):null};})}));}
function pgCheck(){if(!G.q||G.checked)return;const q=G.q;if(G.ans.some(a=>a==null)){feedback($('#pg-fb'),false,'빈 칸이 있어요.','모든 칸을 채운 뒤 채점하세요.');return;}
  G.checked=true;const res=q.seq.map((v,i)=>sameChord(q.pool.find(x=>x.id===G.ans[i]),v));pgSlots(res);
  const given=$('#pg-start').checked;q.seq.forEach((v,i)=>{if(i===0&&given)return;record('prog',v.lb,res[i]);adaptRecord('prog','c:'+v.id,res[i],'c:'+G.ans[i]);
    if(i>0)adaptRecord('prog','p:'+q.seq[i-1].id+'>'+v.id,res[i]&&res[i-1]);});
  if(q.prog)adaptRecord('prog','g:'+q.prog.id,res.every(Boolean));
  const n=res.filter(Boolean).length,ok=n===res.length;const graded=res.filter((x,i)=>!(i===0&&given));const score=graded.length?graded.filter(Boolean).length/graded.length:1;
  sessAdd('prog',ok,score);
  feedback($('#pg-fb'),ok,(ok?'정답! 진행을 전부 맞혔어요!':`${res.length}개 중 ${n}개 맞았어요.`)+(q.prog?` <span style="font-weight:400">— ${q.prog.n} · ${q.prog.g.map(x=>GENRES[x].split(' (')[0]).join(', ')}</span>`:''),'정답: '+q.seq.map(v=>`<b>${v.lb}</b> (${chName(v,q.key,q.flat)})`).join(' → '));
  safeDraw(()=>drawChords($('#pg-staff'),{title:'정답 악보 (Answer)',chords:q.seq.map((v,i)=>({midis:q.voicings[i],spell:(()=>{const cs=chordSpeller(mod(q.key+v.r),v.t,q.flat||v.lb.split('/')[0].includes('♭'));return m=>cs(m);})(),top:chName(v,q.key,q.flat),bottom:v.lb,color:res[i]?null:BADC}))}));
  cmpButtons($('#pg-cmp'),()=>pgPlayList(q.voicings,false,true),pgMine);
  if(ok)autoNext('prog');}
function pgMine(){const q=G.q;if(!q)return;pgPlayList(G.ans.map(a=>{if(!a)return null;const v=q.pool.find(x=>x.id===a);return progVoicings(q.key,[v])[0];}),false,true);}
