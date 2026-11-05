/* 틀린 문제 복습 (Review): 틀린 문제를 그대로 저장해 두었다가 같은 문제를 다시 낸다.
   저장: eartr_wrong = { [mode]: [ {id, q:문제(저장용), miss:틀린 횟수, t:저장 시각} ] } · 모드마다 최대 30개
   복습에서 맞히면 목록에서 빠지고, 또 틀리면 맨 뒤로 간다. */
"use strict";
let wrongQ=store.get('wrong',{});
const REPLAY={},REVIEWING={};
/* 모드별 문제 ⇄ 저장용 변환 (함수·객체 참조는 id로 바꿔 저장) */
const QIO={
 chord:{get:()=>C.q,put:q=>q},
 scale:{get:()=>S.q,put:q=>q},
 interval:{get:()=>Object.assign({},I.q,{iv:I.q.iv.id}),put:q=>Object.assign({},q,{iv:INTERVALS.find(i=>i.id===q.iv)})},
 melody:{get:()=>{const q=M.q;return {sid:q.sid,tonic:q.tonic,notes:q.notes,ev:q.ev,pad:q.pad,low:q.low,high:q.high,flat:q.flat,clef:q.clef};},
   put:q=>Object.assign({},q,{sc:SCALES[q.sid],sp:speller(q.sid,mod(q.tonic),q.flat)})},
 prog:{get:()=>{const q=G.q;return {mode:q.mode,key:q.key,flat:q.flat,seq:q.seq.map(v=>v.id),pool:q.pool.map(v=>v.id),prog:q.prog?q.prog.id:null};},
   put:q=>{const V=VOCAB[q.mode],f=id=>V.find(v=>v.id===id);return {mode:q.mode,key:q.key,flat:q.flat,seq:q.seq.map(f),pool:q.pool.map(f),prog:q.prog?PROGMAP[q.prog]:undefined};}},
 rhythm:{get:()=>JSON.parse(JSON.stringify(R.q)),put:q=>q}
};
const REVIEW_PRE={melody:'mel',chord:'ch',prog:'pg',rhythm:'rh',scale:'sc',interval:'iv'};
/* 각 모드의 '새 문제' 함수 처음에 부른다. 복습 차례면 저장된 문제를 돌려주고, 아니면 null */
function takeReplay(m){qStart(m);const r=REPLAY[m];REPLAY[m]=null;
  if(!r){REVIEWING[m]=null;rvTag(m);return null;}
  try{const q=QIO[m].put(JSON.parse(JSON.stringify(r.q)));REVIEWING[m]=r.id;rvTag(m);return q;}catch(e){REVIEWING[m]=null;rvTag(m);return null;}}
/* 채점 뒤 (sessAdd에서) */
function reviewAfter(m,ok){if(!QIO[m])return;const L=wrongQ[m]=wrongQ[m]||[];
  if(REVIEWING[m]){const i=L.findIndex(x=>x.id===REVIEWING[m]);if(i>=0){const [x]=L.splice(i,1);if(!ok){x.miss++;L.push(x);}}REVIEWING[m]=null;}
  else if(!ok){try{L.push({id:Date.now().toString(36)+rnd(1e6).toString(36),q:JSON.parse(JSON.stringify(QIO[m].get())),miss:1,t:Date.now()});if(L.length>30)L.shift();}catch(e){}}
  store.set('wrong',wrongQ);reviewBtn(m);}
function startReview(m){const L=wrongQ[m];if(!L||!L.length)return;REPLAY[m]=L[0];NEWQ[m]();}
function reviewBtn(m){const b=document.getElementById(REVIEW_PRE[m]+'-review');if(!b)return;const n=(wrongQ[m]||[]).length;b.disabled=!n;b.querySelector('.rvn').textContent=n;}
function rvTag(m){const t=document.getElementById('rvtag-'+m);if(t)t.hidden=!REVIEWING[m];}
/* 버튼 만들기: 각 모드 보조 버튼 줄 끝에 '틀린 문제 복습' */
function initReview(){Object.keys(REVIEW_PRE).forEach(m=>{const pre=REVIEW_PRE[m];const sub=document.querySelector('#p-'+m+' .controls.sub');if(!sub)return;
  const b=document.createElement('button');b.className='btn';b.id=pre+'-review';b.title='틀렸던 문제를 그대로 다시 풀어요';
  b.innerHTML='틀린 문제 복습 <span class="en">(Review)</span> <b class="rvn">0</b>';b.onclick=()=>startReview(m);sub.appendChild(b);
  const h=document.querySelector('#p-'+m+' .qhead h2');if(h){const t=document.createElement('span');t.className='rvtag';t.id='rvtag-'+m;t.hidden=true;t.textContent='복습 문제 (Review)';h.appendChild(t);}
  reviewBtn(m);rvTag(m);});}
