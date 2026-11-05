/* 코드 종류 */
"use strict";
/* ================= 코드 ================= */
const C={q:null,done:false};
PRESETS.chord=lv=>{const ids=CHORDS.filter(c=>lv>=4?true:lv===3?c.lv<=3&&c.g!=='얼터드 텐션 (Altered Tension)'||['7b9','7s9'].includes(c.id):c.lv<=lv).map(c=>c.id);
  setChecked($('#ch-types'),lv===1?['maj','m']:lv===2?['maj','m','dim','aug','sus4','maj7','7','m7','m7b5']:ids);
  $('#ch-voice').value=lv<=2?'close':lv===3?'std':'open';$('#ch-mode').value=lv===1?'both':'block';$('#ch-root').value='r';$('#ch-weak').checked=true;};
function voice(root,iv,vm){
  if(vm==='std')return iv.map(i=>root+i);
  if(vm==='open'){const up=iv.filter(i=>i!==0).map(i=>root+i+(i<7?12:0));return [root-12,...up].sort((a,b)=>a-b);}
  let pcs=[...new Set(iv.map(i=>mod(i)))].sort((a,b)=>a-b);
  if(vm==='inv'){const k=rnd(Math.min(pcs.length,4));pcs=[...pcs.slice(k),...pcs.slice(0,k)];}
  const out=[];let prev=-1;pcs.forEach(pc=>{let n=root+pc;if(vm==='inv'&&out.length===0&&n>root+6)n-=12;while(n<=prev)n+=12;out.push(n);prev=n;});return out;
}
function chPlay(notes,mode){stopAll();let t=now();mode=mode||$('#ch-mode').value;
  if(mode==='arp'||mode==='both'){const g=0.32/spd('chord');notes.forEach((m,i)=>piano(m,t+i*g,mode==='arp'?(1.6-i*0.1)/Math.min(1,spd('chord')):0.6/spd('chord')));t+=notes.length*g+0.25;}
  if(mode==='block'||mode==='both')chordAt(notes,t,1.8/Math.min(1,spd('chord')));}
function chNew(){stopAll();let types=checked($('#ch-types'));if(types.length<2){types=['maj','m'];}
  const id=adaptPick('chord','ch',types,x=>x);
  const rv=$('#ch-root').value,rpc=rv==='r'?rnd(12):+rv;const root=48+rpc+(rpc<4?12:0);const vm=$('#ch-voice').value;
  C.q={id,root,vm,notes:voice(root,CH[id].iv,vm),types};C.done=false;
  renderChoices($('#ch-choices'),types.map(t=>({id:t,label:CH[t].disp,sub:CH[t].kr})),chAnswer,it=>CH[it.id].g);
  $('#ch-fb').innerHTML='';$('#ch-cmp').innerHTML='';clearStaff($('#ch-staff'));needRange(Math.min(...C.q.notes),Math.max(...C.q.notes));autoPlay(()=>chPlay(C.q.notes));}
function chAnswer(it,btn){if(C.done)return;C.done=true;const q=C.q,ok=it.id===q.id;btn.classList.add(ok?'right':'wrong');
  if(!ok){const rb=revealChoice($('#ch-choices'),q.id);if(rb)rb.classList.add('right');}
  const nm=pcName(mod(q.root),rootFlat(q.root),true)+CH[q.id].sym;
  record('chord',CH[q.id].disp,ok);adaptRecord('chord',q.id,ok,it.id);sessAdd('chord',ok);
  feedback($('#ch-fb'),ok,ok?`정답! ${nm} · ${CH[q.id].kr}`:`정답은 ${CH[q.id].disp} · ${CH[q.id].kr}였어요.`,`이번 코드: ${nm} · 구성음 (Chord Tones) ${q.notes.map(m=>pcName(m,rootFlat(q.root))).join(' ')}`);
  cmpButtons($('#ch-cmp'),()=>chPlay(q.notes),ok?null:()=>chPlay(voice(q.root,CH[it.id].iv,q.vm==='inv'?'close':q.vm)),`내 답 듣기 · ${CH[it.id].disp}`);
  {const mine=voice(q.root,CH[it.id].iv,q.vm==='inv'?'close':q.vm);const ch=[{midis:q.notes,spell:chordSpeller(mod(q.root),q.id,rootFlat(q.root)),top:nm,bottom:'정답',color:ok?null:GOODC}];
   if(!ok)ch.push({midis:mine,spell:chordSpeller(mod(q.root),it.id,rootFlat(q.root)),top:pcName(mod(q.root),rootFlat(q.root),true)+CH[it.id].sym,bottom:'내 답',color:BADC});
   safeDraw(()=>drawChords($('#ch-staff'),{title:ok?'악보 (Score)':'정답과 내 답 비교 (Compare)',chords:ch}));}
  if(ok)autoNext('chord');}
