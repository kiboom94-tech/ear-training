/* 악보 그리기 (VexFlow 4): 철자 규칙, 멜로디·코드·리듬 악보, 아이콘 */
"use strict";
/* ================= 오선보 (VexFlow) ================= */
const VF=()=>window.Vex&&window.Vex.Flow;
const GOODC='#1d8a52',BADC='#c23b35',GREYC='#a8aeb5';
const SHN=['c','c#','d','d#','e','f','f#','g','g#','a','a#','b'],FLN=['c','db','d','eb','e','f','gb','g','ab','a','bb','b'];
const NAT=[0,2,4,5,7,9,11],LET='cdefgab';
function vkey(m,flat){return (flat?FLN:SHN)[mod(m)]+'/'+(Math.floor(m/12)-1);}
function vkeyLetter(m,li){const d=mod(m-NAT[li]);const off=d>6?d-12:d;const acc={'0':'','1':'#','2':'##','-1':'b','-2':'bb'}[off];if(acc===undefined)return null;return LET[li]+acc+'/'+(Math.floor((m-off)/12)-1);}
const MODE_OFF={major:[0,0],dorian:[2,1],phrygian:[4,2],lydian:[5,3],mixolydian:[7,4],minor:[9,5],harmmin:[9,5],melmin:[9,5],locrian:[11,6]};
const MAJ_KEYS={0:'C',1:'Db',2:'D',3:'Eb',4:'E',5:'F',7:'G',8:'Ab',9:'A',10:'Bb',11:'B'};
function speller(sid,tpc,flat){const sc=SCALES[sid],mo=MODE_OFF[sid];
  if(mo){const ppc=mod(tpc-mo[0]);const pk=MAJ_KEYS[ppc]||(flat?'Gb':'F#');const tl=(LET.indexOf(pk[0].toLowerCase())+mo[1])%7;
    return {keySig:pk,spell:m=>{const d=sc.iv.indexOf(mod(m-tpc));return (d>=0&&vkeyLetter(m,(tl+d)%7))||vkey(m,flat);}};}
  if(sc.iv.length===7){const tl=LET.indexOf((flat?FLN:SHN)[mod(tpc)][0]);return {keySig:'C',spell:m=>{const d=sc.iv.indexOf(mod(m-tpc));return (d>=0&&vkeyLetter(m,(tl+d)%7))||vkey(m,flat);}};}
  return {keySig:'C',spell:m=>vkey(m,flat)};}
function chordDeg(i,t){const x=mod(i);if(x===0)return 0;if(x===1||x===2)return 1;if(x===3)return i>12?1:2;if(x===4)return 2;if(x===5)return 3;if(x===6)return i>12?3:4;if(x===7)return 4;
  if(x===8)return ['aug','aug7','maj7s5','7s5s9'].includes(t)?4:5;if(x===9)return t==='dim7'?6:5;return 6;}
function chordSpeller(rpc,t,flat){const rl=LET.indexOf((flat?FLN:SHN)[mod(rpc)][0]);const iv=CH[t].iv;
  return m=>{const pc=mod(m-rpc);const i=iv.find(x=>mod(x)===pc);if(i===undefined)return vkey(m,flat);return vkeyLetter(m,(rl+chordDeg(i,t))%7)||vkey(m,flat);};}
function mkNote(keys,dur,clef,color,opt){const F=VF();const o={keys,duration:dur,clef};if(opt&&opt.up)o.stem_direction=1;else o.auto_stem=true;
  const n=new F.StaveNote(o);if(/^(\d+|[whq])d/.test(dur))F.Dot.buildAndAttach([n],{all:true});if(color)n.setStyle({fillStyle:color,strokeStyle:color});return n;}
function vfCtx(el,w,h){el.innerHTML='';el.classList.add('staff');const F=VF();const r=new F.Renderer(el,F.Renderer.Backends.SVG);r.resize(w,h);const c=r.getContext();return c;}
function clearStaff(el){if(!el)return;el.innerHTML='';el.classList.remove('staff');}
function staffTitle(el,txt){const d=document.createElement('div');d.className='staff-title';d.textContent=txt;el.prepend(d);}
function drawSeq(el,{clef='treble',keySig='C',items,title,onPick}){
  if(!VF()){el.innerHTML='';return;}const F=VF();const n=items.length;const w=Math.max(300,110+n*46);const ctx=vfCtx(el,w,150);
  const st=new F.Stave(4,22,w-10);st.addClef(clef);if(keySig&&keySig!=='C')st.addKeySignature(keySig);st.setContext(ctx).draw();
  if(n){const notes=items.map(it=>mkNote(it.keys,it.dur||'q',clef,it.color));const v=new F.Voice({num_beats:4,beat_value:4}).setMode(F.Voice.Mode.SOFT);v.addTickables(notes);
    F.Accidental.applyAccidentals([v],keySig||'C');const beams=F.Beam.generateBeams(notes);new F.Formatter().joinVoices([v]).format([v],w-st.getNoteStartX()-24);
    v.draw(ctx,st);beams.forEach(b=>b.setContext(ctx).draw());if(onPick)notes.forEach((n,k)=>{if(items[k].i!=null)pickable(n,()=>onPick(items[k].i));});}
  if(title)staffTitle(el,title);}
/* 여러 마디 악보(멜로디 리듬용): 첫 마디에 음자리표·조표·박자표, 마디선으로 구분. 폭이 모자라면 줄을 바꾼다 */
const KSN={G:1,D:2,A:3,E:4,B:5,'F#':6,'C#':7,F:1,Bb:2,Eb:3,Ab:4,Db:5,Gb:6,Cb:7};
function drawMeasures(el,{clef='treble',keySig='C',timeSig='4/4',measures,title,onPick}){
  if(!VF()){el.innerHTML='';return;}const F=VF();if(!measures.length)measures=[[]];
  const W=Math.max(300,(el.parentElement&&el.parentElement.clientWidth||640)-12);
  const first=78+10*(KSN[keySig]||0)+(timeSig?28:0);const mw=m=>Math.max(100,30+m.length*40);
  const rows=[];let row=[],rw=0;
  measures.forEach(m=>{let w=mw(m)+(row.length?0:first);if(row.length&&rw+w>W-10){rows.push(row);row=[];rw=0;w=mw(m)+first;}row.push({m,w});rw+=w;});
  if(row.length)rows.push(row);
  const RH=140;const ctx=vfCtx(el,W,rows.length*RH);const drawn=[];
  rows.forEach((row,ri)=>{let x=4;row.forEach((it,j)=>{const st=new F.Stave(x,ri*RH+22,it.w);
    if(j===0){st.addClef(clef);if(keySig&&keySig!=='C')st.addKeySignature(keySig);if(ri===0&&timeSig)st.addTimeSignature(timeSig);}
    st.setContext(ctx).draw();
    if(it.m.length){const notes=it.m.map(n=>mkNote(n.keys,n.dur||'q',clef,n.color));const v=new F.Voice({num_beats:4,beat_value:4}).setMode(F.Voice.Mode.SOFT);v.addTickables(notes);
      F.Accidental.applyAccidentals([v],keySig||'C');const beams=F.Beam.generateBeams(notes);
      new F.Formatter().joinVoices([v]).format([v],Math.max(30,it.w-(st.getNoteStartX()-x)-16));v.draw(ctx,st);beams.forEach(b=>b.setContext(ctx).draw());
      it.m.forEach((n,k)=>{drawn.push({n,note:notes[k],row:ri});if(onPick&&n.i!=null)pickable(notes[k],()=>onPick(n.i));});}
    x+=it.w;});});
  drawn.forEach((d,i)=>{if(!d.n.tie)return;const nx=drawn[i+1];try{new F.StaveTie({first_note:d.note,last_note:(nx&&nx.row===d.row)?nx.note:null,first_indices:[0],last_indices:[0]}).setContext(ctx).draw();}catch(e){}});
  if(title)staffTitle(el,title);}
function drawChords(el,{chords,title}){
  if(!VF()){el.innerHTML='';return;}const F=VF();const W=Math.max(320,(el.parentElement&&el.parentElement.clientWidth||640)-12);const first=70,mw=112;
  const perRow=Math.max(1,Math.floor((W-first-10)/mw));const rows=Math.ceil(chords.length/perRow);const RH=250;const ctx=vfCtx(el,Math.min(W,first+10+Math.min(perRow,chords.length)*mw),rows*RH);
  chords.forEach((c,idx)=>{const r=Math.floor(idx/perRow),j=idx%perRow;const y=r*RH;const x=5+(j===0?0:first+j*mw);const wd=j===0?first+mw:mw;
    const t=new F.Stave(x,y+30,wd),b=new F.Stave(x,y+120,wd);if(j===0){t.addClef('treble');b.addClef('bass');}
    t.setContext(ctx).draw();b.setContext(ctx).draw();
    if(j===0){new F.StaveConnector(t,b).setType('brace').setContext(ctx).draw();new F.StaveConnector(t,b).setType('singleLeft').setContext(ctx).draw();}
    new F.StaveConnector(t,b).setType('singleRight').setContext(ctx).draw();
    const up=c.midis.filter(m=>m>=60).sort((a,b)=>a-b),lo=c.midis.filter(m=>m<60).sort((a,b)=>a-b);
    const tn=up.length?mkNote(up.map(c.spell),'w','treble',c.color):new F.GhostNote('w');const bn=lo.length?mkNote(lo.map(c.spell),'w','bass',c.color):new F.GhostNote('w');
    const vt=new F.Voice({num_beats:4,beat_value:4}).setStrict(false);vt.addTickables([tn]);const vb=new F.Voice({num_beats:4,beat_value:4}).setStrict(false);vb.addTickables([bn]);
    if(up.length)F.Accidental.applyAccidentals([vt],'C');if(lo.length)F.Accidental.applyAccidentals([vb],'C');
    new F.Formatter().joinVoices([vt]).joinVoices([vb]).format([vt,vb],wd-(j===0?first-8:24));vt.draw(ctx,t);vb.draw(ctx,b);
    const tx=x+(j===0?first-10:12);ctx.save();ctx.setFont('Arial',13,'bold');if(c.color)ctx.setFillStyle(c.color);if(c.top)ctx.fillText(c.top,tx,y+22);ctx.setFont('Arial',12,'normal');if(c.bottom)ctx.fillText(c.bottom,tx,y+RH-12);ctx.restore();});
  if(title)staffTitle(el,title);}
/* 패턴이 n연음인지: 길이 3·5·7, 그리고 겹박자 패턴이 아닌 길이 6 */
const TUP_OCC={3:2,5:4,6:4,7:4};
function patTup(id){const p=PAT[id];if(!p)return 0;const n=p.g.length;if(n===3||n===5||n===7)return n;if(n===6&&!COMPOUND_PATS.some(c=>c.id===id))return 6;return 0;}
function beatNotes(id,color,comp){const F=VF();if(!id)return {notes:[mkNote(['b/4'],comp?'qdr':'qr','percussion',GREYC)],trip:false,tup:0};const g=PAT[id].g,n=g.length,tup=patTup(id),trip=tup===3;
  const D=trip?{1:'8',2:'q',3:'h'}:{1:'16',2:'8',3:'8d',4:'q',6:'qd'};const segs=[];const f=g.indexOf(1);
  if(f<0)segs.push({len:n,rest:true});else{if(f>0)segs.push({len:f,rest:true});for(let j=f;j<n;j++)if(g[j]){let k=j+1;while(k<n&&!g[k])k++;segs.push({len:k-j,rest:false});}}
  return {notes:segs.map(s=>mkNote(['b/4'],(D[s.len]||'q')+(s.rest?'r':''),'percussion',color,{up:true})),trip,tup};}
/* 5·6·7연음은 VexFlow 자동 빔이 어긋나므로 이어지는 음표끼리 직접 빔을 건다 */
function tupBeams(F,notes){const out=[];let run=[];const flush=()=>{if(run.length>1)out.push(new F.Beam(run));run=[];};
  notes.forEach(n=>{if(n.isRest()||!['8','16','32'].includes(n.getDuration()))flush();else run.push(n);});flush();return out;}
function drawRhythm(el,{sig,bpb,comp,beats,colors,title}){
  if(!VF()){el.innerHTML='';return;}const F=VF();const bars=Math.ceil(beats.length/bpb);const W=Math.max(320,(el.parentElement&&el.parentElement.clientWidth||640)-12);
  const bw=bpb*(comp?150:100),first=70;const perRow=Math.max(1,Math.floor((W-first-10)/bw));const rows=Math.ceil(bars/perRow);const RH=110;
  const ctx=vfCtx(el,Math.min(W,first+10+Math.min(perRow,bars)*bw),rows*RH);
  for(let b=0;b<bars;b++){const r=Math.floor(b/perRow),j=b%perRow;const x=5+(j===0?0:first+j*bw),wd=j===0?first+bw:bw;
    const st=new F.Stave(x,r*RH+10,wd);if(j===0)st.addClef('percussion');if(b===0)st.addTimeSignature(sig);st.setContext(ctx).draw();
    const all=[],beams=[],tups=[];for(let k=0;k<bpb;k++){const i=b*bpb+k;if(i>=beats.length)break;const {notes,trip}=beatNotes(beats[i],colors&&colors[i],comp);
      if(trip)tups.push(new F.Tuplet(notes,{num_notes:3,notes_occupied:2}));
      F.Beam.generateBeams(notes,{groups:[comp?new F.Fraction(3,8):new F.Fraction(1,4)],stem_direction:1}).forEach(x=>beams.push(x));all.push(...notes);}
    const v=new F.Voice({num_beats:comp?bpb*3:bpb,beat_value:comp?8:4}).setStrict(false);v.addTickables(all);
    new F.Formatter().joinVoices([v]).format([v],wd-(j===0?first+(b===0?20:0):30));v.draw(ctx,st);beams.forEach(x=>x.setContext(ctx).draw());tups.forEach(x=>x.setContext(ctx).draw());}
  if(title)staffTitle(el,title);}

function patNotation(id){const F=VF();const g=PAT[id].g;const W=g.length>=5?128:g.length===4&&g.some((v,i)=>i&&v)?96:72;const S=0.72;
  const d=document.createElement('div');const r=new F.Renderer(d,F.Renderer.Backends.SVG);r.resize(Math.round(W*S),Math.round(96*S));const ctx=r.getContext();ctx.scale(S,S);
  const st=new F.Stave(0,4,W,{left_bar:false,right_bar:false,space_above_staff_ln:3});st.setBegBarType(F.Barline.type.NONE);st.setEndBarType(F.Barline.type.NONE);st.setContext(ctx).draw();
  const {notes,tup:tn}=beatNotes(id);const tup=tn?new F.Tuplet(notes,{num_notes:tn,notes_occupied:TUP_OCC[tn],ratioed:false}):null;
  const beams=tn>=5?tupBeams(F,notes):F.Beam.generateBeams(notes,{groups:[g.length===6?new F.Fraction(3,8):new F.Fraction(1,4)],stem_direction:1});
  const v=new F.Voice({num_beats:1,beat_value:4}).setStrict(false);v.addTickables(notes);new F.Formatter().joinVoices([v]).format([v],W-22);
  v.draw(ctx,st);beams.forEach(b=>b.setContext(ctx).draw());if(tup)tup.setContext(ctx).draw();
  return '<span class="pnote">'+d.innerHTML+'</span>';}
function drawBars(el,{bars,title,onPick}){if(!VF()){el.innerHTML='';return;}const F=VF();const W=Math.max(320,(el.parentElement&&el.parentElement.clientWidth||640)-12);
  const items=bars.map((b,i)=>{const showSig=i===0||b.sig!==bars[i-1].sig;return {b,showSig,w:Math.max(100,46+b.ev.length*30)+(showSig?30:0)};});
  const rows=[];let row=[],rw=0;items.forEach(it=>{const add=it.w+(row.length?0:44);if(row.length&&rw+add>W-10){rows.push(row);row=[];rw=0;}rw+=it.w+(row.length?0:44);row.push(it);});if(row.length)rows.push(row);
  const RH=112;const ctx=vfCtx(el,W,rows.length*RH);
  rows.forEach((row,ri)=>{let x=4;row.forEach((it,j)=>{const w=it.w+(j===0?44:0);const st=new F.Stave(x,ri*RH+16,w);if(j===0)st.addClef('percussion');if(it.showSig)st.addTimeSignature(it.b.sig);st.setContext(ctx).draw();
    const notes=[],tups={};it.b.ev.forEach(e=>{const tk=TK[e.d]||['q',0];const nom=e.nom||tk[0],dots=e.nom?0:tk[1];const n=mkNote([e.rest&&e.d===192?'d/5':'b/4'],nom+(dots?'d':'')+(e.rest?'r':''),'percussion',e.color||(e.ghost?GREYC:null),{up:true});notes.push(n);e._n=n;e._r=ri;if(e.tg){(tups[e.tg]=tups[e.tg]||{ns:[],tn:e.tn||3}).ns.push(n);}});
    const tupObjs=Object.values(tups).map(t=>new F.Tuplet(t.ns,{num_notes:t.tn,notes_occupied:TUP_OCC[t.tn]||2,ratioed:false}));
    const big=new Set();Object.values(tups).forEach(t=>{if(t.tn>=5)t.ns.forEach(n=>big.add(n));});
    const G=SIGS[it.b.sig].g;const gn=G.map(()=>[]);let p=0;it.b.ev.forEach((e,k)=>{let acc=0,idx=0;for(;idx<G.length;idx++){if(p<acc+G[idx]-0.01)break;acc+=G[idx];}if(!big.has(notes[k]))gn[Math.min(idx,G.length-1)].push(notes[k]);p+=e.d;});
    const beams=[];gn.forEach((ns,k)=>{if(ns.length>1)F.Beam.generateBeams(ns,{groups:[new F.Fraction(G[k]/24,8)],stem_direction:1}).forEach(bm=>beams.push(bm));});
    Object.values(tups).forEach(t=>{if(t.tn>=5)tupBeams(F,t.ns).forEach(bm=>beams.push(bm));});
    if(notes.length){const v=new F.Voice({num_beats:sigTicks(it.b.sig)/24,beat_value:8}).setStrict(false);v.addTickables(notes);new F.Formatter().joinVoices([v]).format([v],Math.max(40,w-(st.getNoteStartX()-x)-16));v.draw(ctx,st);}
    beams.forEach(bm=>bm.setContext(ctx).draw());tupObjs.forEach(tp=>tp.setContext(ctx).draw());x+=w;});});
  const flat=bars.flatMap(b=>b.ev);flat.forEach((e,i)=>{const n=flat[i+1];if(e.tie&&!e.rest&&n&&!n.rest&&e._n&&n._n&&e._r===n._r){try{new F.StaveTie({first_note:e._n,last_note:n._n,first_indices:[0],last_indices:[0]}).setContext(ctx).draw();}catch(x){}}});
  if(onPick)bars.forEach((b,bi)=>b.ev.forEach((e,k)=>{if(!e.ghost&&e._n)pickable(e._n,()=>onPick(bi,k));}));
  flat.forEach(e=>{delete e._n;delete e._r;});if(title)staffTitle(el,title);}
function safeDraw(fn){try{fn();}catch(e){console.warn('staff',e);}}
const SELC='#2350a8'; /* 고치는 중인 음표 색 */
/* 그려진 음표(VexFlow)의 SVG 묶음에 클릭을 붙인다 */
function pickable(note,fn){try{const g=note.getSVGElement();if(!g)return;g.style.cursor='pointer';g.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();fn();});}catch(e){}}
