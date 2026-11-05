/* 공통 유틸과 localStorage 저장 (eartr_ 접두어) */
"use strict";
/* ---------- 유틸 ---------- */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const rnd=n=>Math.floor(Math.random()*n), pick=a=>a[rnd(a.length)];
const mod=(n,m=12)=>((n%m)+m)%m;
function wpick(items,wf){const ws=items.map(wf);const tot=ws.reduce((a,b)=>a+b,0);let r=Math.random()*tot;for(let i=0;i<items.length;i++){r-=ws[i];if(r<=0)return items[i];}return items[items.length-1];}
const isMobile=()=>window.matchMedia('(max-width:640px)').matches;
if(navigator.maxTouchPoints>0||'ontouchstart' in window)document.documentElement.classList.add('touch');
const store={get(k,d){try{const v=localStorage.getItem('eartr_'+k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem('eartr_'+k,JSON.stringify(v))}catch(e){}}};
