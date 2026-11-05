/* 멜로디 받아쓰기 */
"use strict";
/* ================= 멜로디 ================= */
const M={q:null,ans:[],dur:[],checked:false};
PRESETS.melody=lv=>{
  /* 난이도는 '출제되는 음 길이'만 바꾼다. 입력판은 항상 전부 보인다. */
  const P={1:{sc:['major'],len:4,leap:'2',range:'7',below:false,start:true,end:true,give:true,rhy:true,tempo:72,vals:['h','q'],cnt:true},
           2:{sc:['major','minor'],len:5,leap:'3',range:'12',below:false,start:true,end:true,give:true,rhy:true,tempo:80,vals:['h','q','8','rq'],cnt:true},
           3:{sc:Object.keys(SCALES).filter(k=>SCALES[k].lv<=2),len:7,leap:'4',range:'12',below:true,start:false,end:true,give:false,rhy:true,tempo:90,vals:['h','qd','q','8','rh','rq','r8'],cnt:true},
           4:{sc:Object.keys(SCALES).filter(k=>SCALES[k].lv<=4),len:10,leap:'7',range:'19',below:true,start:false,end:false,give:false,rhy:true,tempo:100,vals:['w','hd','h','qd','q','8d','8','16','rw','rhd','rh','rqd','rq','r8d','r8','r16'],cnt:false}}[lv];
  setChecked($('#mel-scales'),P.sc);$('#mel-len').value=P.len;$('#mel-leap').value=P.leap;$('#mel-range').value=P.range;$('#mel-key').value='r';
  $('#mel-below').checked=P.below;$('#mel-start').checked=P.start;$('#mel-end').checked=P.end;$('#mel-give').checked=P.give;$('#mel-rhy').checked=P.rhy;$('#mel-showcount').checked=P.cnt;
  $('#mel-oct').checked=false;$('#mel-ref').checked=lv<=2;$('#mel-labels').checked=lv<=1;$('#mel-tempo').value=P.tempo;setChecked($('#mel-vals'),P.vals);
};
/* 멜로디 리듬: 박 단위 길이(4분=1). 박 안에서 시작해 박 끝에서 끝나는 묶음(cell)만 쓰고, 마디(4/4)를 넘지 않게 채운다 */
const MVAL={4:'w',3:'hd',2:'h',1.5:'qd',1:'q',0.75:'8d',0.5:'8',0.25:'16'};
const MDUR={4:'w',3:'hd',2:'h',1.5:'qd',1:'q',0.75:'8d',0.5:'8',0.25:'16'};
const MCELLS=[[1],[2],[0.5,0.5],[1.5,0.5],[0.75,0.25],[0.25,0.25,0.5],[0.5,0.25,0.25],[0.25,0.25,0.25,0.25],[3],[4],[1,0.5,0.5]];
const MNAME={4:'온',3:'점2분',2:'2분',1.5:'점4분',1:'4분',0.75:'점8분',0.5:'8분',0.25:'16분'};
const MBAR=4; /* 한 마디 = 4박 (4/4) */
function melAllow(){const a=new Set(checked($('#mel-vals')));if(![4,3,2,1.5,1,0.75,0.5,0.25].some(b=>a.has(MVAL[b])))['q','8','h'].forEach(k=>a.add(k));if(a.has('rest'))Object.values(MVAL).forEach(k=>{if(a.has(k))a.add('r'+k);});return a;}
function genMelody(){
  let scs=checked($('#mel-scales'));if(!scs.length)scs=['major'];
  const sid=pick(scs),sc=SCALES[sid];const kv=$('#mel-key').value;const tpc=kv==='r'?rnd(12):+kv;
  let tonic=60+tpc;if(tonic>66)tonic-=12;
  const len=numVal('mel-len',2,16,4),leap=+$('#mel-leap').value,range=+$('#mel-range').value,below=$('#mel-below').checked?7:0;
  const low=tonic-below,high=tonic+range;const pool=[];for(let m=low;m<=high;m++)if(sc.iv.includes(mod(m-tonic)))pool.push(m);
  let idx=$('#mel-start').checked?pool.indexOf(tonic):rnd(pool.length);const notes=[pool[idx]];
  for(let i=1;i<len;i++){const cands=[];for(let k=-leap;k<=leap;k++){const j=idx+k;if(j<0||j>=pool.length)continue;cands.push(k);}
    const k=wpick(cands,k=>(k===0?0.25:1/Math.abs(k))*adaptW('melody','mel','d:'+mod(pool[idx+k]-tonic))*adaptW('melody','mel','l:'+k));idx+=k;notes.push(pool[idx]);}
  if($('#mel-end').checked&&len>1){const tons=pool.filter(m=>mod(m-tonic)===0);const prev=notes[len-2];notes[len-1]=tons.reduce((a,b)=>Math.abs(b-prev)<Math.abs(a-prev)?b:a);}
  const ev=[];let pad=0;
  if($('#mel-rhy').checked){const A=melAllow();const cells=MCELLS.filter(c=>c.every(b=>A.has(MVAL[b])));if(!cells.length)cells.push([1]);
    let ni=0,pos=0; /* pos: 마디 안 위치(박) */
    while(ni<len-1){const left=len-1-ni,room=MBAR-pos;
      let opts=cells.filter(c=>c.length<=left&&c.reduce((a,b)=>a+b,0)<=room);if(!opts.length)opts=[[1]];
      if(opts.some(c=>c[0]<3)&&Math.random()<0.6)opts=opts.filter(c=>c[0]<3); /* 3·4박짜리는 덜 나오게 */
      const c=adaptOn('mel')?wpick(opts,c=>c.reduce((a,b)=>a+adaptW('melody','mel','v:'+b),0)/c.length):pick(opts);
      const restFirst=A.has('r'+MVAL[c[0]])&&ev.length>0&&Math.random()<0.22*clampW(adaptW('melody','mel','rest'),0.5,2.5)&&ev[ev.length-1].m!==null;
      c.forEach((b,j)=>{if(j===0&&restFirst)ev.push({m:null,d:b});else if(ni<len-1)ev.push({m:notes[ni++],d:b});else ev.push({m:null,d:b});pos=(pos+b)%MBAR;});}
    /* 마지막 음: 마디 끝까지 채우는 길이 중 허용된 가장 긴 것. 모자라면 쉼표로 마디를 채운다(표시용) */
    const room=MBAR-pos;const prefs=[4,3,2,1].filter(d=>d<=room&&A.has(MVAL[d]));const fin=prefs.length?prefs[0]:1;
    ev.push({m:notes[len-1],d:fin});pad=room-fin;}
  else notes.forEach((m,i)=>ev.push({m,d:i===len-1?2:1}));
  const flat=useFlat(tpc,sc.iv);const avg=notes.reduce((x,y)=>x+y,0)/notes.length;
  return {sid,sc,tonic,notes,ev,pad,low,high,flat,sp:speller(sid,tpc,flat),clef:avg<57?'bass':'treble'};
}
const MDUR_BTNS=[4,3,2,1.5,1,0.75,0.5,0.25];
const MKEYS={4:'7',2:'6',1:'5',0.5:'4',0.25:'3'};
const melRhy=()=>$('#mel-rhy').checked;
const melShowCount=()=>$('#mel-showcount').checked;
const melMax=()=>melShowCount()?M.q.ev.length:32;
function melKey(m){if(paused)stopAll();const c=ac();piano(m,c.currentTime+0.01,0.6);if(M.checked)return;
  if(M.sel!=null&&M.sel<M.ans.length){M.ans[M.sel]=m;M.sel=null;melDurbar();melSlots();return;}
  if(M.ans.length<melMax()){M.ans.push(m);M.dur.push(M.curDur);melSlots();}}
function melRest(d){if(M.checked||!melRhy())return;M.curDur=d;if(M.sel!=null&&M.sel<M.ans.length){M.ans[M.sel]='R';M.dur[M.sel]=d;M.sel=null;melDurbar();melSlots();return;}
  if(M.ans.length<melMax()){M.ans.push('R');M.dur.push(d);melDurbar();melSlots();}}
function melDurbar(){const el=$('#mel-durbar');if(!melRhy()){el.hidden=true;return;}el.hidden=false;
  el.innerHTML=durGrid({cols:MDUR_BTNS.map(b=>({v:b,name:MNAME[b],key:MKEYS[b]})),sel:M.curDur,noteAttr:'data-b',restAttr:'data-rb',noteHelp:'고른 뒤 건반',restHelp:'누르면 바로 들어감',icon:(v,r)=>durIcon(v*48,r)})+
    `<span class="durhelp">${M.sel!=null?`<b>${M.sel+1}번째 칸</b>을 고치는 중이에요. 길이·건반·쉼표 중 하나를 누르세요.`:'음표는 길이를 고른 뒤 건반을 누르고, 쉼표는 쉼표 줄에서 바로 누르세요. 칸을 누르면 그 칸을 고칠 수 있어요.'}</span>`;}
function melRef(t){const q=M.q,iv=q.sc.iv;const third=iv.includes(4)?4:iv.includes(3)?3:4;const fifth=iv.includes(7)?7:iv.includes(6)?6:8;
  chordAt([q.tonic-12,q.tonic,q.tonic+third,q.tonic+fifth],t,1.1);piano(q.tonic,t+1.3,0.8);return t+2.4;}
function melPlay(withRef,mine){stopAll();let t=now();if(withRef)t=melRef(t);const spb=60/bpm('melody');
  if(melRhy()){for(let k=0;k<4;k++)click(t+k*spb,k===0,0.9);t+=4*spb;}
  const seq=mine?M.ans.map((a,i)=>({m:a==='R'?null:a,d:melRhy()?(M.dur[i]||1):(M.q.ev[i]?M.q.ev[i].d:1)})):M.q.ev;
  seq.forEach(e=>{if(e.m!=null)piano(e.m,t,e.d*spb*0.95);t+=e.d*spb;});}
function melNew(){
  stopAll();M.q=genMelody();M.ans=[];M.dur=[];M.sel=null;M.curDur=1;M.checked=false;
  if($('#mel-give').checked){M.ans=[M.q.ev[0].m];M.dur=[M.q.ev[0].d];}
  const kname=pcName(M.q.tonic,M.q.flat);const nr=M.q.ev.filter(e=>e.m==null).length;
  const cnt=melShowCount()?` · ${M.q.notes.length}음${nr?` + 쉼표 ${nr}개 (칸 ${M.q.ev.length}개)`:''}`:(melRhy()?' · 칸 수 숨김':` · ${M.q.notes.length}음`);
  $('#mel-meta').innerHTML=`스케일 <b>${kname} ${M.q.sc.n}</b>${cnt}${$('#mel-give').checked?` · 첫 음 ${noteHTML(M.q.notes[0],M.q.flat).replace(/<small>/,'').replace('</small>','')}`:''}`;
  buildPiano($('#mel-piano'),...pianoRange(),melKey);
  melDurbar();melSlots();$('#mel-fb').innerHTML='';$('#mel-fb').className='feedback';$('#mel-cmp').innerHTML='';clearStaff($('#mel-staff-ans'));
  needRange(Math.min(M.q.low,M.q.tonic-12),M.q.high);autoPlay(()=>melPlay($('#mel-ref').checked));
}
function melItems(seq,clef,sp,colFn){const rk=clef==='bass'?'d/3':'b/4',rw=clef==='bass'?'f/3':'d/5';return seq.map((e,i)=>({keys:[e.m==null?(e.d===4?rw:rk):sp.spell(e.m)],dur:(MDUR[e.d]||'q')+(e.m==null?'r':''),color:e.ghost?GREYC:(colFn?colFn(i):null),tie:!!e.tie,i:e.ghost?null:(e.i!=null?e.i:i)}));}
/* 박 단위 길이를 표기 가능한 음표 길이로 쪼갬 (예: 2.5박 → 2 + 0.5, 붙임줄) */
function splitDur(d){const out=[];let r=d;[4,3,2,1.5,1,0.75,0.5,0.25].forEach(u=>{while(r>=u-1e-6){out.push(u);r-=u;}});if(!out.length)out.push(0.25);return out;}
/* 멜로디(박 단위)를 4/4 마디로 나눈다. 마디를 넘는 음은 둘로 나누고 붙임줄로 잇는다. padGrey: 마지막 마디의 빈 자리를 회색 쉼표로 채움 */
function melMeasures(seq,padGrey){const bars=[[]];let pos=0;
  seq.forEach((e,i)=>{let d=e.d;let first=true;while(d>1e-6){const room=MBAR-pos;const take=Math.min(d,room);
    const parts=splitDur(take);parts.forEach((pd,k)=>{const last=(k===parts.length-1)&&(d-take<1e-6);bars[bars.length-1].push({m:e.m,d:pd,i,ghost:e.ghost,tie:e.m!=null&&!last});});
    pos+=take;d-=take;first=false;if(pos>=MBAR-1e-6){pos=0;if(d>1e-6||i<seq.length-1)bars.push([]);}}});
  if(padGrey&&pos>1e-6){splitDur(MBAR-pos).forEach(pd=>bars[bars.length-1].push({m:null,d:pd,ghost:true}));}
  return bars.filter(b=>b.length);}
function melSlots(res,rres){const q=M.q,give=$('#mel-give').checked,rh=melRhy();const show=melShowCount();
  const N=M.checked?Math.max(q.ev.length,M.ans.length):(show?q.ev.length:Math.min(32,M.ans.length+1));
  $('#mel-slots').innerHTML=[...Array(N).keys()].map(i=>{const a=M.ans[i];let cls='slot';if(a==null)cls+=' empty';if(!M.checked&&(M.sel!=null?i===M.sel:i===M.ans.length))cls+=' cur';if(give&&i===0)cls+=' given';
    if(res){cls+=res[i]&&(!rres||rres[i])?' right':(res[i]?' rwrong':' wrong');}
    const lab=a==null?(i+1):(a==='R'?'쉼표':noteHTML(a,q.flat));
    return `<button class="${cls}" data-i="${i}">${lab}${rh&&a!=null?`<span class="dlab">${MNAME[M.dur[i]]||''}</span>`:''}</button>`;}).join('');
  $('#mel-slots').onclick=e=>{const b=e.target.closest('.slot');if(!b||M.checked)return;const i=+b.dataset.i;if(i>=M.ans.length)return;M.sel=M.sel===i?null:i;if(M.sel!=null&&rh)M.curDur=M.dur[i];melDurbar();melSlots();};
  const col=i=>res?(res[i]&&(!rres||rres[i])?GOODC:(res[i]?'#c77700':BADC)):((M.sel===i&&!M.checked)?SELC:null);
  const mine=M.ans.map((a,i)=>({m:a==='R'?null:a,d:rh?(M.dur[i]||1):1}));
  const title=res?'내 답 (My Answer)'+(rres?' · 초록 정답 · 주황 리듬만 틀림 · 빨강 음이 틀림':''):'내가 적은 음 (My Notes) · 음표를 누르면 그 칸을 고칠 수 있어요';
  /* 악보의 음표를 누르면 그 칸을 고치는 상태가 된다 (칸을 누른 것과 같음) */
  const onPick=M.checked?null:i=>{M.sel=M.sel===i?null:i;if(M.sel!=null&&rh)M.curDur=M.dur[i];melDurbar();melSlots();};
  if(rh)safeDraw(()=>drawMeasures($('#mel-staff'),{clef:q.clef,keySig:q.sp.keySig,timeSig:'4/4',title,onPick,measures:melMeasures(mine,true).map(b=>melItems(b,q.clef,q.sp,k=>col(b[k].i)))}));
  else safeDraw(()=>drawSeq($('#mel-staff'),{clef:q.clef,keySig:q.sp.keySig,title,onPick,items:melItems(mine,q.clef,q.sp,col)}));}
function melCheck(){if(!M.q||M.checked)return;const q=M.q,L=q.ev.length,show=melShowCount();
  if(show&&M.ans.length<L){feedback($('#mel-fb'),false,`아직 ${L-M.ans.length}칸이 비어 있어요.`,'다 채운 뒤 채점하세요. 모르는 음은 대충이라도 넣어 보세요.');return;}
  if(!show&&!M.ans.length){feedback($('#mel-fb'),false,'아직 아무것도 적지 않았어요.','들은 대로 건반을 눌러 적은 뒤 채점하세요.');return;}
  const N=Math.max(L,M.ans.length),oct=$('#mel-oct').checked;
  const res=[...Array(N).keys()].map(i=>{const e=q.ev[i],a=M.ans[i];if(!e||a==null)return false;if(e.m==null)return a==='R';if(a==='R')return false;return oct?mod(e.m)===mod(a):e.m===a;});
  const rh=melRhy();const rres=rh?[...Array(N).keys()].map(i=>!!q.ev[i]&&q.ev[i].d===M.dur[i]):null;M.checked=true;M.sel=null;melDurbar();melSlots(res,rres);
  const give=$('#mel-give').checked;const graded=[...Array(N).keys()].filter(i=>!(give&&i===0));
  const n=res.filter(Boolean).length,rn=rres?rres.filter(Boolean).length:0;const ok=n===N&&(!rres||rn===N);
  const gn=graded.filter(i=>res[i]).length,grn=rres?graded.filter(i=>rres[i]).length:0,GL=Math.max(1,graded.length);
  record('melody',q.sc.n,ok);if(rres)record('melody','리듬 (멜로디 속)',rn===N);
  /* 적응 기록: 도수·도약·쉼표·옥타브·음 길이 */
  {const deg=m=>mod(m-q.tonic);const scIdx=m=>{const i=q.sc.iv.indexOf(deg(m));return i<0?null:Math.floor((m-q.tonic)/12)*q.sc.iv.length+i;};
   for(let i=0;i<L;i++){if(give&&i===0)continue;const e=q.ev[i],a=M.ans[i];const isNote=a!=null&&a!=='R';
     if(e.m==null)adaptRecord('melody','rest',res[i],isNote?'d:'+deg(a):null);
     else{const octOnly=!res[i]&&isNote&&mod(a)===mod(e.m);adaptRecord('melody','d:'+deg(e.m),res[i]||octOnly,isNote?'d:'+deg(a):(a==='R'?'rest':null));if(octOnly)adaptRecord('melody','oct',false);
       const pe=q.ev[i-1];if(i>0&&pe&&pe.m!=null){const ti=scIdx(e.m),pi=scIdx(pe.m);const pa=M.ans[i-1];const ua=(isNote&&pa!=null&&pa!=='R')?scIdx(a)-scIdx(pa):null;
         if(ti!=null&&pi!=null)adaptRecord('melody','l:'+(ti-pi),res[i]&&res[i-1],(ua!=null&&!isNaN(ua)&&ua!==ti-pi)?'l:'+ua:null);}}
     if(rres&&a!=null)adaptRecord('melody','v:'+e.d,rres[i],M.dur[i]!==e.d?'v:'+M.dur[i]:null);}}
  sessAdd('melody',ok,rres?(gn+grn)/(2*GL):gn/GL);
  const ansSeq=[...q.ev,...(q.pad>0?splitDur(q.pad).map(d=>({m:null,d,ghost:true})):[])];
  if(rh)safeDraw(()=>drawMeasures($('#mel-staff-ans'),{clef:q.clef,keySig:q.sp.keySig,timeSig:'4/4',title:'정답 악보 (Answer)',measures:melMeasures(ansSeq,false).map(b=>melItems(b,q.clef,q.sp))}));
  else safeDraw(()=>drawSeq($('#mel-staff-ans'),{clef:q.clef,keySig:q.sp.keySig,title:'정답 악보 (Answer)',items:melItems(q.ev,q.clef,q.sp)}));
  const lenNote=!show&&M.ans.length!==L?` 칸 수가 달라요 (정답 ${L}칸 · 내 답 ${M.ans.length}칸).`:'';
  feedback($('#mel-fb'),ok,ok?(rres?'정답! 음과 리듬 모두 맞았어요!':'정답! 모두 맞았어요!'):(rres?`음 ${n}/${L} · 리듬 ${rn}/${L} 맞았어요.${lenNote}`:`${L}음 중 ${n}음 맞았어요.${lenNote}`),`정답: ${q.ev.map(e=>e.m==null?'쉼표':noteHTML(e.m,q.flat)).join(' – ').replace(/<small>/g,'<sub>').replace(/<\/small>/g,'</sub>')}`);
  cmpButtons($('#mel-cmp'),()=>melPlay(false),()=>melPlay(false,true));
  if(ok)autoNext('melody');}
function melBack(){if(M.checked)return;const min=$('#mel-give').checked?1:0;if(M.ans.length>min){M.ans.pop();M.dur.pop();M.sel=null;melDurbar();melSlots();}}
function melClear(){if(M.checked)return;const g=$('#mel-give').checked;M.ans=g?[M.q.ev[0].m]:[];M.dur=g?[M.q.ev[0].d]:[];M.sel=null;melDurbar();melSlots();}
/* 멜로디 길이 단축키 (PC): 7 온 · 6 2분 · 5 4분 · 4 8분 · 3 16분 · . 점 · 0 쉼표 */
function melKeyShortcut(e){if(curTab!=='melody'||!M.q||!melRhy()||M.checked)return false;const k=e.key;
  const v=Object.keys(MKEYS).find(b=>MKEYS[b]===k);if(v){M.curDur=+v;if(M.sel!=null){M.dur[M.sel]=+v;M.sel=null;}melDurbar();melSlots();return true;}
  if(k==='.'){const dot={4:4,3:2,2:3,1.5:1,1:1.5,0.75:0.5,0.5:0.75,0.25:0.25}[M.curDur];if(dot!=null){M.curDur=dot;melDurbar();}return true;}
  if(k==='0'){melRest(M.curDur);return true;}
  if(k==='Backspace'){melBack();return true;}return false;}
function isBlack(m){return [1,3,6,8,10].includes(mod(m));}
/* 건반 범위: PC는 옥타브 단위로 넉넉히(최소 2옥타브), 휴대폰은 이번 문제 음역에 딱 맞게 */
function pianoRange(){const q=M.q;let lo=Math.min(q.low,q.tonic),hi=q.high;
  if(isMobile()){if(hi-lo<12)hi=lo+12;}
  else{lo=Math.floor(lo/12)*12;hi=Math.ceil((hi+1)/12)*12-1;if(hi-lo<23)hi=lo+23;}
  return [lo,hi+1];}
function buildPiano(el,low,high,onPress){
  while(isBlack(low))low--;while(isBlack(high))high++;const whites=[];for(let m=low;m<=high;m++)if(!isBlack(m))whites.push(m);
  const W=100/whites.length,all=$('#mel-labels').checked,flat=M.q?M.q.flat:false;let h='';
  whites.forEach((m,i)=>{const lab=(all||mod(m)===0)?pcName(m,flat)+(mod(m)===0?(Math.floor(m/12)-1):''):'';h+=`<div class="wk${M.q&&mod(m-M.q.tonic)===0?' tonic':''}" data-m="${m}" style="left:${i*W}%;width:${W}%">${lab}</div>`;});
  for(let m=low;m<=high;m++)if(isBlack(m)){const i=whites.findIndex(w=>w>m);h+=`<div class="bk" data-m="${m}" style="left:${i*W-W*0.31}%;width:${W*0.62}%"></div>`;}
  el.innerHTML=`<div class="piano-in" style="min-width:${whites.length*(isMobile()?24:32)}px">${h}</div>`;
  el.firstChild.addEventListener('pointerdown',e=>{const k=e.target.closest('[data-m]');if(!k)return;e.preventDefault();k.classList.add('down');setTimeout(()=>k.classList.remove('down'),170);onPress(+k.dataset.m);});
}
