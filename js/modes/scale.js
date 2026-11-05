/* 스케일 */
"use strict";
/* ================= 스케일 ================= */
const S={q:null,done:false};
const scaleIdKeys=()=>Object.keys(SCALES).filter(k=>k!=='chromatic');
PRESETS.scale=lv=>{const L={1:['major','minor','majpent','minpent'],2:['major','minor','harmmin','melmin','dorian','lydian','mixolydian','majpent','minpent','blues'],
  3:scaleIdKeys().filter(k=>SCALES[k].lv<=3),4:scaleIdKeys()}[lv];setChecked($('#sc-scales'),L);$('#sc-dir').value=lv<=2?'up':'updown';$('#sc-tempo').value={1:96,2:110,3:126,4:140}[lv];$('#sc-chord').checked=lv<=1;$('#sc-weak').checked=true;};
function scNotes(id,tonic){const iv=SCALES[id].iv;const up=[...iv.map(i=>tonic+i),tonic+12];const d=$('#sc-dir').value;return d==='up'?up:d==='down'?up.slice().reverse():[...up,...up.slice(0,-1).reverse()];}
function scPlay(id,tonic){stopAll();let t=now();const e=60/bpm('scale')/2*2;
  if($('#sc-chord').checked){const iv=SCALES[id].iv;const third=iv.includes(4)?4:iv.includes(3)?3:4;chordAt([tonic-12,tonic,tonic+third,tonic+(iv.includes(7)?7:6)],t,1);t+=1.4;}
  const ns=scNotes(id,tonic);ns.forEach((m,i)=>piano(m,t+i*e,i===ns.length-1?1.2:e*1.05));}
function scNew(){stopAll();let ids=checked($('#sc-scales'));if(ids.length<2)ids=['major','minor'];
  const id=adaptPick('scale','sc',ids,x=>x);const tonic=55+rnd(10);S.q={id,tonic,ids};{const r=takeReplay('scale');if(r)S.q=r;}S.done=false;
  renderChoices($('#sc-choices'),S.q.ids.map(k=>({id:k,label:SCALES[k].n,sub:SCALES[k].s||''})),scAnswer,it=>SCALES[it.id].g);$('#sc-fb').innerHTML='';$('#sc-cmp').innerHTML='';clearStaff($('#sc-staff'));clearStaff($('#sc-staff2'));needRange(S.q.tonic-12,S.q.tonic+12);autoPlay(()=>scPlay(S.q.id,S.q.tonic));}
function scRef(){const q=S.q;if(!q)return;stopAll();const iv=SCALES[q.id].iv;const third=iv.includes(4)?4:iv.includes(3)?3:4;chordAt([q.tonic-12,q.tonic,q.tonic+third,q.tonic+(iv.includes(7)?7:6)],now(),1.2);}
function scAnswer(it,btn){if(S.done)return;S.done=true;const q=S.q,ok=it.id===q.id;btn.classList.add(ok?'right':'wrong');if(!ok){const rb=revealChoice($('#sc-choices'),q.id);if(rb)rb.classList.add('right');}
  record('scale',SCALES[q.id].n,ok);SLOWNOW=ok&&isSlow('scale');adaptRecord('scale',q.id,ok,it.id);sessAdd('scale',ok);const fl=useFlat(mod(q.tonic),SCALES[q.id].iv);
  feedback($('#sc-fb'),ok,ok?`정답! ${SCALES[q.id].n}`:`정답은 ${SCALES[q.id].n}였어요.`,`${pcName(q.tonic,fl)} ${SCALES[q.id].n}: ${SCALES[q.id].iv.map(i=>pcName(q.tonic+i,fl)).join(' ')}`);
  cmpButtons($('#sc-cmp'),()=>scPlay(q.id,q.tonic),ok?null:()=>scPlay(it.id,q.tonic),`내 답 듣기 · ${SCALES[it.id].n}`);
  {const sp=speller(q.id,mod(q.tonic),fl);const ns=[...SCALES[q.id].iv.map(i=>q.tonic+i),q.tonic+12];safeDraw(()=>drawSeq($('#sc-staff'),{title:(ok?'':'정답 · ')+SCALES[q.id].n,items:ns.map(m=>({keys:[sp.spell(m)],dur:'q'}))}));
   if(!ok){const fl2=useFlat(mod(q.tonic),SCALES[it.id].iv);const sp2=speller(it.id,mod(q.tonic),fl2);const ns2=[...SCALES[it.id].iv.map(i=>q.tonic+i),q.tonic+12];
     safeDraw(()=>drawSeq($('#sc-staff2'),{title:'내 답 · '+SCALES[it.id].n,items:ns2.map(m=>({keys:[sp2.spell(m)],dur:'q',color:SCALES[q.id].iv.includes(mod(m-q.tonic))?null:BADC}))}));}}
  if(ok)autoNext('scale');}
