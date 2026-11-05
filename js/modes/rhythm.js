/* 리듬 받아쓰기: 빠른 입력(박 패턴) · 악보 입력(음표·쉼표) */
"use strict";
/* ================= 리듬 ================= */
/* 내부 표현: 마디 = {sig, ev:[{d:틱, rest, tie, tg:셋잇단 묶음, nom:셋잇단 표기 길이, tcap}]}, 4분음표 = 48틱 */
const R={q:null,ans:[],cur:0,checked:false,sbars:[],sbar:0,mod:{dot:false,rest:false,tup:0}};
const SIGS={'2/4':{g:[48,48],fam:'simple'},'3/4':{g:[48,48,48],fam:'simple'},'4/4':{g:[48,48,48,48],fam:'simple'},'5/4':{g:[48,48,48,48,48],fam:'simple'},
 '2/2':{g:[96,96],fam:'cut'},'3/8':{g:[72],fam:'compound'},'6/8':{g:[72,72],fam:'compound'},'9/8':{g:[72,72,72],fam:'compound'},'12/8':{g:[72,72,72,72],fam:'compound'},
 '5/8':{g:[72,48],fam:'odd',sub:'3+2'},'7/8':{g:[48,48,72],fam:'odd',sub:'2+2+3'},'_b48':{g:[48],fam:'simple'},'_b72':{g:[72],fam:'compound'}};
const SIG_LIST=['2/4','3/4','4/4','5/4','2/2','3/8','6/8','9/8','12/8','5/8','7/8'];
const PATTERN_SIGS=['2/4','3/4','4/4','5/4','3/8','6/8','9/8','12/8'];
const sigTicks=sig=>SIGS[sig].g.reduce((a,b)=>a+b,0);
const TK={192:['w',0],144:['h',1],96:['h',0],72:['q',1],48:['q',0],36:['8',1],24:['8',0],18:['16',1],12:['16',0],6:['32',0]};
const VALKEY={192:'w',144:'hd',96:'h',72:'qd',48:'q',36:'8d',24:'8',18:'16d',12:'16',6:'32'};
const NVALS=[['w','온음표 (Whole)'],['h','2분음표 (Half)'],['hd','점2분음표 (Dotted Half)'],['q','4분음표 (Quarter)'],['qd','점4분음표 (Dotted Quarter)'],['8','8분음표 (8th)'],['8d','점8분음표 (Dotted 8th)'],['16','16분음표 (16th)'],['32','32분음표 (32nd)'],['trip','셋잇단 · 3연음 (Triplet)'],['t5','5연음 (Quintuplet)'],['t6','6연음 (Sextuplet)'],['t7','7연음 (Septuplet)'],['rest','쉼표 (Rest)'],['tie','붙임줄 (Tie)'],['sync','박을 넘는 당김음 (Syncopation)']];
const NV_ALL=NVALS.map(x=>x[0]);const NV_BASIC=NV_ALL.filter(k=>!/^t[567]$/.test(k)); /* 코스·전문가 기본값: 5·6·7연음 제외 */
let TGID=1;const ev=(d,o={})=>Object.assign({d},o);
const C48=[[48],[24,24],[12,12,12,12],[24,12,12],[12,12,24],[36,12],[12,36],[12,24,12],[6,6,12,24],[24,6,6,12],[12,12,6,6,12],[6,6,6,6,24],{t:[16,16,16]},{t:[32,16]},{t:[16,32]},
  {t:[9.6,9.6,9.6,9.6,9.6],n:5},{t:[8,8,8,8,8,8],n:6},{t:[48/7,48/7,48/7,48/7,48/7,48/7,48/7],n:7}];
const C72=[[72],[48,24],[24,48],[24,24,24],[36,12,24],[12,12,24,24],[24,12,12,24],[24,24,12,12],[12,12,12,12,12,12],[24,12,12,12,12],[12,12,48]];
const C96=[[96],{s:[72,24]},{s:[24,48,24]},{s:[24,72]}];
function cellOK(c,A){if(Array.isArray(c))return c.every(d=>A.has(VALKEY[d]));if(c.t)return c.n?A.has('t'+c.n)&&A.has('16'):A.has('trip')&&c.t.every(d=>A.has(d===32?'q':'8'));return A.has('sync')&&c.s.every(d=>A.has(VALKEY[d]));}
function pushCell(out,c){if(Array.isArray(c))c.forEach(d=>out.push(ev(d)));else if(c.t){const id=TGID++;c.t.forEach(d=>out.push(ev(d,{tg:id,nom:c.n?'16':(d===32?'q':'8'),tcap:48,tn:c.n||3})));}else c.s.forEach(d=>out.push(ev(d)));}
function cellsFor(gl,A){const o=(gl===72?C72:C48).filter(c=>cellOK(c,A));return o.length?o:[[gl]];}
/* 묶음 안 소리 시작 위치(박 머리=0, 8분 뒷박=24 …)들의 약점 가중치 중 가장 큰 값 */
function cellOffsets(c){const ds=Array.isArray(c)?c:(c.t||c.s);const out=[];let p=0;ds.forEach(d=>{out.push(p);p+=d;});return out;}
const offKey=(fam,o,base)=>{const r=o%base;return 'o:'+fam+'|'+(Math.abs(r-Math.round(r))<0.01?Math.round(r):'tup');};
function cellW(c,fam){const base=fam==='compound'?72:48;return Math.max(...cellOffsets(c).map(o=>adaptW('rhythm','rh',offKey(fam,o,base))));}
const pickCell=(cells,fam)=>adaptOn('rh')?wpick(cells,c=>cellW(c,fam)):pick(cells);
function genScoreBar(sig,A,restP){const G=SIGS[sig].g,total=sigTicks(sig);let out=[];let gi=0,pos=0;const fam=famOf(sig);
  if(adaptOn('rh')){restP=restP*clampW(adaptW('rhythm','rh','e:rest'),0.5,2.5);}
  while(gi<G.length){const gl=G[gi];
    if(pos===0&&total===192&&A.has('w')&&Math.random()<0.1){out.push(ev(192));break;}
    if(pos===0&&(total===144||total===192)&&gl===48&&A.has('hd')&&Math.random()<0.15){out.push(ev(144));pos+=144;gi+=3;continue;}
    if(gl===48&&G[gi+1]===48&&pos%96===0&&Math.random()<0.35*clampW(adaptW('rhythm','rh','e:sync'),0.5,2)){const o=C96.filter(c=>cellOK(c,A));if(o.length){pushCell(out,pickCell(o,fam));pos+=96;gi+=2;continue;}}
    if(gl===96){const o=C96.filter(c=>cellOK(c,A));if(o.length&&Math.random()<0.45)pushCell(out,pickCell(o,fam));else{pushCell(out,pickCell(cellsFor(48,A),fam));pushCell(out,pickCell(cellsFor(48,A),fam));}pos+=96;gi++;continue;}
    pushCell(out,pickCell(cellsFor(gl,A),fam));pos+=gl;gi++;}
  if(A.has('rest')&&restP>0)out.forEach(e=>{if(Math.random()<restP)e.rest=true;});
  if(out.every(e=>e.rest))out[0].rest=false;
  if(A.has('tie')){const bnd=new Set();let a=0;G.forEach(g=>{a+=g;bnd.add(a);});let p=0;const cand=[];out.forEach((e,i)=>{p+=e.d;const n=out[i+1];if(n&&bnd.has(p)&&!e.rest&&!n.rest&&!e.tg&&!n.tg)cand.push(i);});
    if(cand.length&&Math.random()<0.6*clampW(adaptW('rhythm','rh','e:tie'),0.5,1.6))out[pick(cand)].tie=true;}
  return out;}
function patEvents(id){const g=PAT[id].g,n=g.length,tn=patTup(id),trip=tn===3,u=tn?48/tn:12,tg=tn?TGID++:null;const out=[];const f=g.indexOf(1);
  const nom=k=>trip?(k===1?'8':'q'):({1:'16',2:'8',3:'8d',4:'q'}[k]||'q');const o=k=>tn?{tg,nom:nom(k),tcap:48,tn}:{};
  if(f<0){out.push(ev(n*u,{rest:true}));return out;}
  if(f>0)out.push(ev(f*u,Object.assign({rest:true},o(f))));
  for(let j=f;j<n;j++)if(g[j]){let k=j+1;while(k<n&&!g[k])k++;out.push(ev((k-j)*u,o(k-j)));}return out;}
const famOf=sig=>SIGS[sig].fam==='compound'?'compound':'simple';
const rhInput=()=>$('#rh-input').value;
function rhSelSigs(){let s=checked($('#rh-sigs'));if(rhInput()==='pattern')s=s.filter(x=>PATTERN_SIGS.includes(x));return s.length?s:['4/4'];}
function rhAllow(){const a=new Set(checked($('#rh-vals')));if(!['w','h','hd','q','qd','8','8d','16','32'].some(k=>a.has(k)))['q','8'].forEach(k=>a.add(k));return a;}
function buildRhPats(){const S=SIMPLE_PATS,C=COMPOUND_PATS;
  checkGroup($('#rh-pats'),[{name:'4분 · 8분 (Quarter · 8th)',items:S.filter(p=>p.g.length===4&&p.lv===1||p.id==='re')},{name:'16분 조합 (16th Combinations)',items:S.filter(p=>p.g.length===4&&p.lv>=2&&p.id!=='re')},{name:'연음 (Tuplets) · 3·5·6·7연음',items:S.filter(p=>patTup(p.id)>0)},{name:'겹박자 패턴 (Compound · 점4분 = 한 박)',items:C}].map(g=>({name:g.name,items:g.items.map(p=>({id:p.id,label:patIcon(p),sub:p.n}))})),'rh');
  checkGroup($('#rh-sigs'),[{name:'홑박자 (Simple)',items:['2/4','3/4','4/4','5/4','2/2']},{name:'겹박자 (Compound)',items:['3/8','6/8','9/8','12/8']},{name:'변박 (Odd Meter)',items:['5/8','7/8']}].map(g=>({name:g.name,items:g.items.map(x=>({id:x,label:x,sub:SIGS[x].sub?SIGS[x].sub+' 묶음':(x==='2/2'?'알라 브레베 (Cut Time)':'')}))})),'rhs');
  checkGroup($('#rh-vals'),[{name:'음표 길이 (Note Values)',items:NVALS.slice(0,9)},{name:'리듬 요소 (Elements)',items:NVALS.slice(9)}].map(g=>({name:g.name,items:g.items.map(([k,n])=>({id:k,label:n}))})),'rhv');}
function rhPalGroups(fam){const S=SIMPLE_PATS;if(fam==='compound')return [{name:'겹박자 패턴 (Compound · 점4분 = 한 박)',items:COMPOUND_PATS}];
  return [{name:'4분 · 8분 (Quarter · 8th)',items:S.filter(p=>p.g.length===4&&p.lv===1||p.id==='re')},{name:'16분 조합 (16th Combinations)',items:S.filter(p=>p.g.length===4&&p.lv>=2&&p.id!=='re')},{name:'연음 (Tuplets) · 3·5·6·7연음',items:S.filter(p=>patTup(p.id)>0)}];}
function rhPatPreset(lv){setChecked($('#rh-pats'),[...SIMPLE_PATS,...COMPOUND_PATS].filter(p=>p.lv<=lv&&(lv>=3||!patTup(p.id))&&!/^t[567]$/.test(p.id)).map(p=>p.id));}
function rhInputToggle(){const sc=rhInput()==='score';$('#rh-pat-box').style.display=sc?'none':'';$('#rh-val-box').style.display=sc?'':'none';
  $('#rh-pattern-ui').style.display=sc?'none':'';$('#rh-score-ui').style.display=sc?'':'none';
  $('#rh-title').textContent=sc?'들은 리듬 (Rhythm)을 음표와 쉼표로 채우세요':'들은 리듬 (Rhythm)을 박 (Beat)마다 고르세요';
  $$('#rh-modetg button').forEach(b=>b.classList.toggle('on',b.dataset.v===rhInput()));}
AFTERCHANGE.rhythm=e=>{if(e&&e.target&&e.target.id==='rh-input')rhInputToggle();};
PRESETS.rhythm=lv=>{const P={1:{inp:'pattern',sigs:['4/4'],bars:'1',tempo:70,mixed:false,vals:['h','q','8','rest'],rp:'0.1'},2:{inp:'pattern',sigs:['4/4','3/4'],bars:'2',tempo:80,mixed:false,vals:['h','q','8','16','rest'],rp:'0.1'},
  3:{inp:'score',sigs:['4/4','3/4','6/8'],bars:'2',tempo:80,mixed:false,vals:['h','q','qd','8','8d','16','rest','tie'],rp:'0.1'},4:{inp:'score',sigs:['4/4','3/4','2/4','5/4','6/8','7/8'],bars:'4',tempo:90,mixed:true,vals:NV_BASIC,rp:'0.2'}}[lv];
  $('#rh-input').value=P.inp;setChecked($('#rh-sigs'),P.sigs);$('#rh-bars').value=P.bars;$('#rh-tempo').value=P.tempo;$('#rh-mixed').checked=P.mixed;setChecked($('#rh-vals'),P.vals);$('#rh-restp').value=P.rp;
  rhPatPreset(lv);$('#rh-metromode').value='off';$('#rh-metrovol').value=1;$('#rh-count').checked=true;rhInputToggle();};
function rhNew(){stopAll();const rq=takeReplay('rhythm');if(rq&&rq.mode!==rhInput()){$('#rh-input').value=rq.mode;rhInputToggle();}const mode=rhInput();const sigs=rhSelSigs();const nb=+$('#rh-bars').value||1;const mixed=$('#rh-mixed').checked;const pickSig=()=>adaptPick('rhythm','rh',sigs,x=>'s:'+x);const fixed=pickSig();
  const bars=[];for(let b=0;b<nb;b++){const sig=mixed?pickSig():fixed;
    if(mode==='score')bars.push({sig,ev:genScoreBar(sig,rhAllow(),+$('#rh-restp').value)});
    else{const fam=famOf(sig);const list=fam==='compound'?COMPOUND_PATS:SIMPLE_PATS;let ids=checked($('#rh-pats')).filter(id=>list.some(p=>p.id===id));if(!ids.length)ids=list.filter(p=>p.lv===1).map(p=>p.id);
      const n=SIGS[sig].g.length;let beats,guard=0;do{beats=[];for(let k=0;k<n;k++)beats.push(ids.length>1?wpick(ids,id=>(PAT[id].g.every(v=>!v)?0.35:1)*adaptW('rhythm','rh','p:'+id)):ids[0]);guard++;}while(guard<20&&beats.every(id=>PAT[id].g.every(v=>!v)));
      if(b===0&&PAT[beats[0]].g[0]===0&&ids.some(id=>PAT[id].g[0]===1)&&Math.random()<0.7)beats[0]=pick(ids.filter(id=>PAT[id].g[0]===1));
      bars.push({sig,beats,ev:beats.flatMap(patEvents)});}}
  const meta=[];bars.forEach((b,bi)=>{if(b.beats)b.beats.forEach((id,k)=>meta.push({bar:bi,k,fam:famOf(b.sig)}));});
  R.q={mode,bars,meta};if(rq)R.q=rq;R.ans=R.q.meta.map(()=>null);R.cur=0;R.checked=false;R.sbars=R.q.bars.map(b=>({sig:b.sig,ev:[]}));R.sbar=0;R.sel=null;R.mod={dot:false,rest:false,tup:0};
  const sl=[...new Set(R.q.bars.map(b=>b.sig))];const dropped=mode==='pattern'?checked($('#rh-sigs')).filter(x=>!PATTERN_SIGS.includes(x)):[];
  $('#rh-meta').innerHTML=`박자 <b>${sl.join(' · ')}</b>${sl.length>1?' (박자 변화 · Mixed Meter)':''} · ${R.q.bars.length}마디 · 템포는 4분음표 기준${dropped.length?`<br><span class="warn">빠른 입력에서는 ${dropped.join('·')} 박자를 쓸 수 없어서 빠졌어요. 악보 입력으로 바꾸면 나와요.</span>`:''}`;
  $('#rh-fb').innerHTML='';$('#rh-fb').className='feedback';$('#rh-cmp').innerHTML='';clearStaff($('#rh-answer'));$('#rh-swarn').textContent='';
  if(mode==='score'){renderDurpad();sRender();}else rhView();
  at(0.15,()=>rhPlayQ());}
/* ---- 재생 ---- */
function playBars(bars,opt={}){stopAll();const tk=60/bpm('rhythm')/48;let t=now();const t0=ac().currentTime;const mm=$('#rh-metromode').value,mv=+$('#rh-metrovol').value||1;if(!bars.length)return;
  const lead=opt.lead==null?($('#rh-count').checked?'bar':0):opt.lead;const f=bars[0];const sub=SIGS[f.sig].fam!=='simple'&&SIGS[f.sig].fam!=='cut';
  if(lead){const G=SIGS[f.sig].g;(lead==='bar'?G:G.slice(0,lead)).forEach((gl,k)=>{click(t,k===0,mv);if(sub)for(let e=24;e<gl;e+=24)click(t+e*tk,false,0.55*mv);t+=gl*tk;});}
  const total=bars.reduce((a,b)=>a+sigTicks(b.sig),0);let pos=0,tied=false;
  bars.forEach((b,bi)=>{const bt=t+pos*tk;
    /* 예비박 뒤 메트로놈: 점점 작아짐 / 계속 같은 크기 / 마디 첫 박만 */
    if(mm!=='off'){let gp=0;SIGS[b.sig].g.forEach((gl,k)=>{const v=mm==='fade'?0.5-0.38*((pos+gp)/Math.max(1,total)):0.5;if(mm!=='first'||k===0)click(bt+gp*tk,k===0,v*mv);gp+=gl;});}
    let p=0;b.ev.forEach(e=>{if(!e.rest&&!e.ghost&&!tied)hit(bt+p*tk,p===0);tied=!e.rest&&!!e.tie;p+=e.d;});
    if(opt.hl)opt.hl(bi,bt-t0,tk,b);pos+=sigTicks(b.sig);});
  at(t+pos*tk-t0,()=>$$('#p-rhythm .playing').forEach(e=>e.classList.remove('playing')));}
function hlBeats(off){return (bi,s,tk,b)=>{let gp=0;SIGS[b.sig].g.forEach((gl,k)=>{const idx=R.q.meta.findIndex(m=>m.bar===bi+off&&m.k===k);at(s+gp*tk,()=>$$('#rh-bars-view .slot').forEach((e,j)=>e.classList.toggle('playing',j===idx)));gp+=gl;});};}
function hlBars(off){return (bi,s)=>at(s,()=>$$('#rh-chips .bchip').forEach((e,j)=>e.classList.toggle('playing',j===bi+off)));}
function rhPlayQ(){if(!R.q)return;playBars(R.q.bars,{hl:R.q.mode==='score'?hlBars(0):hlBeats(0)});}
function rhPlayBar(b){playBars([R.q.bars[b]],{hl:R.q.mode==='score'?hlBars(b):hlBeats(b)});}
function rhPlayBeat(i){const m=R.q.meta[i];const id=R.q.bars[m.bar].beats[m.k];playBars([{sig:m.fam==='compound'?'_b72':'_b48',ev:patEvents(id)}],{lead:1,hl:(bi,s)=>at(s,()=>$$('#rh-bars-view .slot').forEach((e,j)=>e.classList.toggle('playing',j===i)))});}
function ansBars(){if(R.q.mode==='score')return R.sbars;return R.q.bars.map((b,bi)=>({sig:b.sig,ev:b.beats.flatMap((_,k)=>{const i=R.q.meta.findIndex(m=>m.bar===bi&&m.k===k);const a=R.ans[i];return a?patEvents(a):[ev(SIGS[b.sig].g[k],{rest:true,ghost:true})];})}));}
function rhMine(){if(!R.q)return;playBars(ansBars(),{hl:R.q.mode==='score'?hlBars(0):hlBeats(0)});}
/* ---- 패턴 입력 ---- */
function rhView(res){const q=R.q;let h='';q.bars.forEach((b,bi)=>{const showSig=bi===0||b.sig!==q.bars[bi-1].sig;
  h+=`<div class="bar-row"><button class="barplay" data-bar="${bi}" title="${bi+1}마디만 듣기">▶ ${bi+1}${showSig?`<small>${b.sig}</small>`:''}</button>`;
  b.beats.forEach((_,k)=>{const i=q.meta.findIndex(m=>m.bar===bi&&m.k===k),a=R.ans[i];let cls='slot rslot';if(q.meta[i].fam==='compound')cls+=' wide';if(!a)cls+=' empty';if(i===R.cur&&!R.checked)cls+=' cur';if(res)cls+=res[i]?' right':' wrong';
    h+=`<button class="${cls}" data-i="${i}" aria-label="${bi+1}마디 ${k+1}박"><span class="bplay" data-beat="${i}" title="이 박만 듣기" role="button">▶</span>${a?patIcon(PAT[a]):`<small>${k+1}박</small>`}</button>`;});h+=`<span class="bar-sep"></span></div>`;});
  $('#rh-bars-view').innerHTML=h;
  /* 보기는 출제 설정과 상관없이 그 박자(홑/겹)의 패턴 전체를 항상 같은 순서·같은 자리에 보여준다 */
  const fam=q.meta[R.cur]?q.meta[R.cur].fam:'simple';const groups=rhPalGroups(fam);
  $('#rh-palette').innerHTML=groups.map(g=>`<div class="pal-group"><div>${g.name}</div><div class="palette">${g.items.map(p=>`<button class="pat" data-id="${p.id}">${patIcon(p)}<span>${p.n}</span></button>`).join('')}</div></div>`).join('');
  $('#rh-palette').onclick=e=>{const b=e.target.closest('.pat');if(!b||R.checked)return;R.ans[R.cur]=b.dataset.id;const nxt=R.ans.findIndex(a=>a==null);R.cur=nxt>=0?nxt:R.cur;rhView();};
  const ab=ansBars();if(res){let i=0;ab.forEach(b=>{let p=0;const G=SIGS[b.sig].g;b.ev.forEach(e=>{let acc=0,k=0;for(;k<G.length;k++){if(p<acc+G[k])break;acc+=G[k];}e.color=undefined;p+=e.d;});});
    ab.forEach((b,bi)=>{let p=0;const G=SIGS[b.sig].g;b.ev.forEach(e=>{let acc=0,k=0;for(;k<G.length;k++){if(p<acc+G[k])break;acc+=G[k];}const idx=q.meta.findIndex(m=>m.bar===bi&&m.k===k);e.color=res[idx]?GOODC:BADC;p+=e.d;});});}
  safeDraw(()=>drawBars($('#rh-staff'),{bars:ab,title:res?'내 답 (My Answer)':'내가 적은 리듬 (My Rhythm)'}));
  $('#rh-bars-view').onclick=e=>{const bp=e.target.closest('.barplay'),bt=e.target.closest('.bplay');if(bp){rhPlayBar(+bp.dataset.bar);return;}if(bt){e.stopPropagation();rhPlayBeat(+bt.dataset.beat);return;}
    const s=e.target.closest('.slot');if(!s||R.checked)return;const i=+s.dataset.i;if(R.cur===i&&R.ans[i]){R.ans[i]=null;}R.cur=i;rhView();};}
/* ---- 악보 입력 (음표·쉼표 채우기) ---- */
const DURS=[[192,'7','온음표'],[96,'6','2분'],[48,'5','4분'],[24,'4','8분'],[12,'3','16분'],[6,'2','32분']];
const DICON={};
function durIcon(ticks,rest){const k=ticks+(rest?'r':'');if(DICON[k])return DICON[k];if(!VF())return TK[ticks][0];
  try{const F=VF();const d=document.createElement('div');const S=0.5,W=64,H=92;const r=new F.Renderer(d,F.Renderer.Backends.SVG);r.resize(Math.round(W*S),Math.round(H*S));const ctx=r.getContext();ctx.scale(S,S);
    /* 음표와 쉼표 모두 같은 오선, 같은 기준선(가운데 줄)에 그려서 위아래·좌우 위치를 맞춤 */
    const st=new F.Stave(8,2,W-8,{left_bar:false,right_bar:false,space_above_staff_ln:3});st.setBegBarType(F.Barline.type.NONE);st.setEndBarType(F.Barline.type.NONE);st.setContext(ctx).draw();
    const n=new F.StaveNote({keys:[rest?(ticks===192?'d/5':'b/4'):'b/4'],duration:TK[ticks][0]+(TK[ticks][1]?'d':'')+(rest?'r':''),clef:'treble',stem_direction:1});if(TK[ticks][1])F.Dot.buildAndAttach([n],{all:true});
    const v=new F.Voice({num_beats:4,beat_value:4}).setStrict(false);v.addTickables([n]);new F.Formatter().joinVoices([v]).format([v],10);v.draw(ctx,st);
    DICON[k]='<span class="pnote">'+d.innerHTML+'</span>';}catch(e){console.warn('icon',e);DICON[k]=TK[ticks][0];}return DICON[k];}
const RDUR=[[192,'온','7'],[144,'점2분',''],[96,'2분','6'],[72,'점4분',''],[48,'4분','5'],[36,'점8분',''],[24,'8분','4'],[18,'점16분',''],[12,'16분','3'],[6,'32분','2']];
function renderDurpad(){const m=R.mod;
  $('#rh-durpad').innerHTML=durGrid({cols:RDUR.map(([t,n,k])=>({v:t,name:n,key:k})),sel:null,noteAttr:'data-dt',restAttr:'data-dr',noteHelp:'누르면 바로 들어감',restHelp:'누르면 바로 들어감',icon:durIcon})+
  `<div class="dp-row"><span class="mini" style="align-self:center">연음 (Tuplet):</span>${[3,5,6,7].map(n=>`<button class="tg${m.tup===n?' on':''}" data-tup="${n}">${n}연음${n===3?'<kbd>9</kbd>':''}</button>`).join('')}</div>
  <div class="dp-row"><button class="tg" data-a="tie">붙임줄 (Tie)<kbd>T</kbd></button>
  <button class="tg" data-a="back">← 지우기<kbd>⌫</kbd></button><button class="tg" data-a="clearbar">이 마디 지우기</button>${m.dot||m.rest?`<span class="mini">키보드 ${m.dot?'점':''}${m.dot&&m.rest?'·':''}${m.rest?'쉼표':''} 대기 중</span>`:''}
  ${R.sel?`<span class="mini"><b>${R.sel.bar+1}마디 ${R.sel.k+1}번째</b>를 고치는 중이에요. 길이나 쉼표를 누르면 바로 바뀌어요. (악보의 음표를 다시 누르면 취소)</span>`:''}</div>`;}
function sAddDirect(t,rest){const dotted=!!TK[t]&&TK[t][1]===1;if(dotted&&R.mod.tup)return sWarn('연음 안에는 점음표를 넣을 수 없어요.');R.mod.rest=rest;R.mod.dot=dotted;sAdd(dotted?t/1.5:t);}
const r6=x=>Math.round(x*1e6)/1e6; /* 연음 길이(9.6틱 등)의 소수 오차 정리 */
function barUsed(b){return r6(b.ev.reduce((a,e)=>a+e.d,0));}
function openTrip(b){const l=b.ev[b.ev.length-1];if(!l||!l.tg)return null;const used=r6(b.ev.filter(e=>e.tg===l.tg).reduce((a,e)=>a+e.d,0));return used<l.tcap-0.01?{tg:l.tg,cap:l.tcap,left:r6(l.tcap-used),tn:l.tn||3}:null;}
/* n연음: 3연음은 같은 길이 2개 자리에 3개, 5·6·7연음은 4개 자리에 n개 */
const TUP_RATIO={3:2,5:4,6:4,7:4};
function sWarn(t){$('#rh-swarn').textContent=t;}
/* 고른 음표를 새 길이·쉼표로 바꾼다. 연음 안의 음표는 길이를 못 바꾸고 음표↔쉼표만 바꿀 수 있다 */
function sReplace(d,rest){const sel=R.sel,b=R.sbars[sel.bar],e=b.ev[sel.k];if(!e){R.sel=null;return;}
  if(e.tg){const nomT=DURS.find(x=>TK[x[0]][0]===e.nom);if(!nomT||nomT[0]!==d)return sWarn('연음 안의 음표는 길이를 바꿀 수 없어요. 음표↔쉼표만 바꾸거나, 지우고 다시 넣으세요.');}
  else{const cap=sigTicks(b.sig);if(r6(barUsed(b)-e.d+d)>cap+0.01)return sWarn(`그 길이로 바꾸면 마디가 넘쳐요. (남은 길이: ${remLabel(cap-barUsed(b)+e.d,b.sig)})`);e.d=d;}
  e.rest=rest;if(rest)e.tie=false;R.sel=null;sWarn('');if(!rest){const c=ac();hit(c.currentTime+0.01,false);}renderDurpad();sRender();}
function sAdd(nt){if(R.checked||!R.q)return;
  if(R.sel){let d=nt;if(R.mod.dot){d=nt*1.5;if(!TK[d])return sWarn('이 길이에는 점을 붙일 수 없어요.');}const rest=R.mod.rest;R.mod.dot=false;R.mod.rest=false;return sReplace(d,rest);}
  const b=R.sbars[R.sbar];const cap=sigTicks(b.sig),used=barUsed(b);let d=nt,o={rest:R.mod.rest};
  if(R.mod.tup){const n=R.mod.tup,op=openTrip(b);if(op&&op.tn!==n)return sWarn(`${op.tn}연음 묶음을 먼저 채워 주세요.`);d=nt*TUP_RATIO[n]/n;
    if(op){if(d>op.left+0.01)return sWarn(`${n}연음 묶음에 남은 길이보다 길어요.`);o.tg=op.tg;o.tcap=op.cap;}else{o.tg=TGID++;o.tcap=nt*TUP_RATIO[n];}o.nom=TK[nt][0];o.tn=n;}
  else{if(R.mod.dot){d=nt*1.5;if(!TK[d])return sWarn('이 길이에는 점을 붙일 수 없어요.');}const op=openTrip(b);if(op)return sWarn(`${op.tn}연음 묶음을 먼저 채워 주세요.`);}
  if(used+d>cap+0.01)return sWarn(`이 마디에 남은 길이보다 길어요. (남은 길이: ${remLabel(cap-used,b.sig)})`);
  sWarn('');b.ev.push(ev(d,o));R.mod.dot=false;R.mod.rest=false;if(R.mod.tup&&!openTrip(b))R.mod.tup=0;
  if(!o.rest){const c=ac();hit(c.currentTime+0.01,false);}
  if(barUsed(b)>=cap-0.01&&R.sbar<R.sbars.length-1)R.sbar++;renderDurpad();sRender();}
function sAction(a){if(R.checked||!R.q)return;let b=R.sbars[R.sbar];R.sel=null;
  if(a==='back'){if(!b.ev.length&&R.sbar>0){R.sbar--;b=R.sbars[R.sbar];}b.ev.pop();sWarn('');}
  if(a==='clearbar'){b.ev=[];}
  if(a==='tie'){let tb=b;if(!tb.ev.length&&R.sbar>0)tb=R.sbars[R.sbar-1];const l=tb.ev[tb.ev.length-1];if(!l||l.rest)return sWarn('붙임줄은 음표 뒤에만 붙일 수 있어요.');l.tie=!l.tie;sWarn(l.tie?'붙임줄을 붙였어요. 다음 음표가 이어져요.':'');}
  renderDurpad();sRender();}
function remLabel(rem,sig){if(SIGS[sig].fam==='simple'||SIGS[sig].fam==='cut'){const x=rem/48;return (Math.abs(x-Math.round(x))<0.01?Math.round(x):x.toFixed(2).replace(/0+$/,''))+'박';}const x=rem/24;return '8분 '+(Math.abs(x-Math.round(x))<0.01?Math.round(x):x.toFixed(2))+'개';}
function ghostFill(b,color){const rem=r6(sigTicks(b.sig)-barUsed(b));const out=[];if(openTrip(b))return out;let r=rem;[192,96,48,24,12,6].forEach(d=>{while(r>=d-0.01&&Number.isInteger(r)){out.push(ev(d,{rest:true,ghost:true,color}));r-=d;}});return out;}
function sRender(res){$('#rh-chips').innerHTML=R.sbars.map((b,i)=>{const cap=sigTicks(b.sig),u=barUsed(b);const full=u>=cap-0.01;let cls='bchip';if(i===R.sbar&&!R.checked)cls+=' cur';if(res)cls+=res[i]?' right':' wrong';
  return `<button class="${cls}" data-bar="${i}"><span class="bplay2" data-play="${i}" title="${i+1}마디만 듣기" role="button">▶</span><b>${i+1}마디</b> <span class="sig">${b.sig}</span><small>${full?'다 채움':remLabel(cap-u,b.sig)+' 남음'}</small></button>`;}).join('');
  $('#rh-chips').onclick=e=>{const p=e.target.closest('[data-play]');if(p){e.stopPropagation();rhPlayBar(+p.dataset.play);return;}const c=e.target.closest('.bchip');if(!c||R.checked)return;R.sbar=+c.dataset.bar;sWarn('');sRender();};
  const view=R.sbars.map((b,i)=>({sig:b.sig,ev:[...b.ev.map((e,k)=>(R.sel&&R.sel.bar===i&&R.sel.k===k&&!R.checked)?Object.assign({},e,{color:SELC}):e),...(R.checked?[]:ghostFill(b,i===R.sbar?'#8fa6d8':GREYC))]}));
  /* 음표를 누르면 그 음표를 고치는 상태. 다시 누르면 취소 */
  const onPick=R.checked?null:(bi,k)=>{if(!R.sbars[bi].ev[k])return;R.sel=(R.sel&&R.sel.bar===bi&&R.sel.k===k)?null:{bar:bi,k};R.sbar=bi;sWarn('');renderDurpad();sRender();};
  safeDraw(()=>drawBars($('#rh-sstaff'),{bars:view,onPick,title:res?'내 답 (My Answer)':'내가 적은 리듬 (My Rhythm) · 음표를 누르면 바로 고칠 수 있어요 · 회색은 빈 자리'}));}
/* ---- 채점 ---- */
function onsets(bars){let tied=false;return bars.map(b=>{let p=0;const s=[];b.ev.forEach(e=>{if(!e.rest&&!e.ghost&&!tied)s.push(Math.round(p));tied=!e.rest&&!!e.tie;p+=e.d;});return s;});}
function rhCheck(){if(!R.q||R.checked)return;const q=R.q;
  if(q.mode==='pattern'){if(R.ans.some(a=>!a)){feedback($('#rh-fb'),false,'빈 박이 있어요.','쉬는 박은 쉼표 패턴을 골라 주세요.');return;}
    R.checked=true;const res=q.meta.map((m,i)=>PAT[q.bars[m.bar].beats[m.k]].g.join()===PAT[R.ans[i]].g.join());rhView(res);
    q.meta.forEach((m,i)=>{const cid=q.bars[m.bar].beats[m.k];record('rhythm',PAT[cid].n,res[i]);
      adaptRecord('rhythm','p:'+cid,res[i],'p:'+R.ans[i]);adaptRecord('rhythm','b:'+q.bars[m.bar].sig+'|'+m.k,res[i]);if(PAT[cid].g.every(v=>!v))adaptRecord('rhythm','e:rest',res[i]);});
    q.bars.forEach((b,i)=>adaptRecord('rhythm','s:'+b.sig,b.beats.every((_,k)=>res[q.meta.findIndex(m=>m.bar===i&&m.k===k)])));
    const n=res.filter(Boolean).length,ok=n===res.length;sessAdd('rhythm',ok,n/res.length);
    feedback($('#rh-fb'),ok,ok?'정답! 리듬을 정확히 받아 적었어요!':`${res.length}박 중 ${n}박 맞았어요.`,'소리 시작점만 채점하고 음 길이는 보지 않아요.');}
  else{const bad=R.sbars.findIndex(b=>barUsed(b)<sigTicks(b.sig)-0.01||openTrip(b));if(bad>=0){feedback($('#rh-fb'),false,`${bad+1}마디가 아직 다 채워지지 않았어요.`,'쉬는 자리는 쉼표로 채워 주세요.');R.sbar=bad;sRender();return;}
    R.checked=true;const A=onsets(q.bars),U=onsets(R.sbars);const res=A.map((a,i)=>a.join()===U[i].join());
    R.sbars.forEach((b,i)=>{let p=0,tied=false;b.ev.forEach(e=>{const on=!e.rest&&!tied;e.color=res[i]?GOODC:(on&&!A[i].includes(Math.round(p))?BADC:null);tied=!e.rest&&!!e.tie;p+=e.d;});});
    sRender(res);q.bars.forEach((b,i)=>{record('rhythm','악보 입력 · '+b.sig,res[i]);adaptRecord('rhythm','s:'+b.sig,res[i]);
      /* 박 안 위치별: 정답 시작점을 들었는지, 없는 자리에 넣었는지 */
      const fam=famOf(b.sig),base=fam==='compound'?72:48;A[i].forEach(p=>adaptRecord('rhythm',offKey(fam,p,base),U[i].includes(p)));U[i].forEach(p=>{if(!A[i].includes(p))adaptRecord('rhythm',offKey(fam,p,base),false);});
      if(b.ev.some(e=>e.tie))adaptRecord('rhythm','e:tie',res[i]);if(b.ev.some(e=>e.rest))adaptRecord('rhythm','e:rest',res[i]);
      {let p=0,sync=false;const G=SIGS[b.sig].g;b.ev.forEach(e=>{let acc=0;for(const g of G){if(p>acc&&p<acc+g&&p+e.d>acc+g+0.01)sync=true;acc+=g;}p+=e.d;});if(sync)adaptRecord('rhythm','e:sync',res[i]);}});
    const n=res.filter(Boolean).length,ok=n===res.length;sessAdd('rhythm',ok,n/res.length);
    feedback($('#rh-fb'),ok,ok?'정답! 리듬을 정확히 받아 적었어요!':`${res.length}마디 중 ${n}마디 맞았어요.`,'소리 시작 위치로 채점해요. 붙임줄로 이어진 음은 한 번만 소리 나요. 내 답의 빨간 음표는 정답에 없는 자리예요.');}
  const ansView=q.bars.map((b,i)=>{const U=onsets(ansBars())[i]||[];let p=0,tied=false;return {sig:b.sig,ev:b.ev.map(e=>{const on=!e.rest&&!tied;const c=Object.assign({},e,{color:on&&!U.includes(Math.round(p))?BADC:null});tied=!e.rest&&!!e.tie;p+=e.d;return c;})};});
  safeDraw(()=>drawBars($('#rh-answer'),{bars:ansView,title:'정답 악보 (Answer) · 빨간 음표는 내가 놓친 자리'}));
  cmpButtons($('#rh-cmp'),rhPlayQ,rhMine);
  if(R.checked&&$('#rh-fb').classList.contains('good'))autoNext('rhythm');}
function rhBack(){if(!R.q||R.checked)return;if(R.q.mode==='score'){sAction('back');return;}let i=R.ans.length-1;while(i>=0&&!R.ans[i])i--;if(i<0)return;R.ans[i]=null;R.cur=i;rhView();}
function rhClear(){if(!R.q||R.checked)return;if(R.q.mode==='score'){R.sbars.forEach(b=>b.ev=[]);R.sbar=0;R.sel=null;sWarn('');renderDurpad();sRender();}else{R.ans=R.ans.map(()=>null);R.cur=0;rhView();}}
function rhKey(e){if(curTab!=='rhythm'||!R.q||R.q.mode!=='score')return false;const k=e.key;const d=DURS.find(x=>x[1]===k);
  if(d){sAdd(d[0]);return true;}if(k==='.'){R.mod.dot=!R.mod.dot;renderDurpad();return true;}if(k==='0'){R.mod.rest=!R.mod.rest;renderDurpad();return true;}if(k==='9'){R.mod.tup=R.mod.tup===3?0:3;renderDurpad();return true;}
  if(k==='t'||k==='T'||k==='ㅅ'){sAction('tie');return true;}if(k==='Backspace'){sAction('back');return true;}return false;}
