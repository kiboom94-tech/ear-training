/* 음정 */
"use strict";
/* ================= 음정 ================= */
const I={q:null,done:false};
PRESETS.interval=lv=>{const ids=lv===1?['i2','i4','i7','i12']:lv===2?['i1','i2','i3','i4','i5','i7','i9','i12']:INTERVALS.filter(x=>x.lv<=(lv===3?3:4)).map(x=>x.id);
  setChecked($('#iv-list'),ids);$('#iv-up').checked=true;$('#iv-down').checked=lv>=2;$('#iv-harm').checked=lv>=3;$('#iv-weak').checked=true;};
function ivPlay(q){stopAll();const t=now();if(q.dir==='harm'){piano(q.a,t,1.6);piano(q.b,t,1.6);}else{const k=spd('interval');piano(q.a,t,0.9/k);piano(q.b,t+0.75/k,1.2/k);}}
function ivNew(){stopAll();let ids=checked($('#iv-list'));if(ids.length<2)ids=['i4','i7'];const dirs=['up','down','harm'].filter(d=>$('#iv-'+d).checked);if(!dirs.length)dirs.push('up');
  const pair=adaptPick('interval','iv',ids.flatMap(x=>dirs.map(d=>x+':'+d)),x=>x);const [id,dir]=pair.split(':');const iv=INTERVALS.find(i=>i.id===id);
  let lo=48+rnd(16);if(lo+iv.s>84)lo=84-iv.s;let q=I.q={iv,dir,ids,a:dir==='down'?lo+iv.s:lo,b:dir==='down'?lo:lo+iv.s};{const r=takeReplay('interval');if(r)q=I.q=r;}I.done=false;
  $('#iv-meta').textContent={up:'상행 음정 (Ascending Melodic)',down:'하행 음정 (Descending Melodic)',harm:'화성 음정 (Harmonic) · 동시에'}[q.dir];
  renderChoices($('#iv-choices'),q.ids.map(x=>{const v=INTERVALS.find(i=>i.id===x);return {id:x,label:v.n,sub:v.a+' · 반음 '+v.s+'개'};}),ivAnswer,it=>INTERVALS.find(i=>i.id===it.id).s<=12?'옥타브 안 (Simple Interval)':'복음정 (Compound Interval)');$('#iv-fb').innerHTML='';$('#iv-cmp').innerHTML='';clearStaff($('#iv-staff'));clearStaff($('#iv-staff2'));needRange(Math.min(q.a,q.b),Math.max(q.a,q.b));autoPlay(()=>ivPlay(q));}
function ivAnswer(it,btn){if(I.done)return;I.done=true;const q=I.q,ok=it.id===q.iv.id;btn.classList.add(ok?'right':'wrong');if(!ok){const rb=revealChoice($('#iv-choices'),q.iv.id);if(rb)rb.classList.add('right');}
  record('interval',q.iv.n,ok);SLOWNOW=ok&&isSlow('interval');adaptRecord('interval',q.iv.id+':'+q.dir,ok,it.id+':'+q.dir);sessAdd('interval',ok);
  feedback($('#iv-fb'),ok,ok?`정답! ${q.iv.n}`:`정답은 ${q.iv.n}였어요.`,`${noteHTML(q.a).replace(/<\/?small>/g,'')} → ${noteHTML(q.b).replace(/<\/?small>/g,'')}`);
  {const mine=INTERVALS.find(i=>i.id===it.id);cmpButtons($('#iv-cmp'),()=>ivPlay(q),ok?null:()=>{const s=mine.s;const lo=Math.min(q.a,q.b);ivPlay({dir:q.dir,a:q.dir==='down'?lo+s:lo,b:q.dir==='down'?lo:lo+s});},`내 답 듣기 · ${mine.n}`);}
  const ivStaff=(el,s,title,color)=>{const lo=Math.min(q.a,q.b),hi=lo+s;const lk=vkey(lo,FLAT_KEYS.has(mod(lo))&&mod(lo)!==6);const STEPS={1:1,2:1,3:2,4:2,5:3,6:3,7:4,8:5,9:5,10:6,11:6,12:7,13:8,14:8,15:9,16:9,17:10,18:10,19:11,20:12,21:12};
   const hk=vkeyLetter(hi,(LET.indexOf(lk[0])+STEPS[s])%7)||vkey(hi,false);const clef=(lo+hi)/2<57?'bass':'treble';
   safeDraw(()=>drawSeq(el,{clef,title,items:(q.dir==='harm'?[{keys:[lk,hk],dur:'h'}]:(q.dir==='down'?[{keys:[hk],dur:'h'},{keys:[lk],dur:'h'}]:[{keys:[lk],dur:'h'},{keys:[hk],dur:'h'}])).map(x=>({...x,color}))}));};
  ivStaff($('#iv-staff'),q.iv.s,(ok?'':'정답 · ')+q.iv.n,null);
  if(!ok){const mine=INTERVALS.find(i=>i.id===it.id);ivStaff($('#iv-staff2'),mine.s,'내 답 · '+mine.n,BADC);}
  if(ok)autoNext('interval');}
