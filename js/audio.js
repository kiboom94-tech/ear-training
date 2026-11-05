/* 소리: 샘플 로딩(이번 문제 음역 우선), 음 재생, 리버브, 메트로놈 클릭, 재생/일시정지 */
"use strict";
/* ---------- 오디오 ---------- */
let drumBus=null;let AC=null, master=null, noiseBuf=null, active=[], timers=[];
function ac(){
  if(!AC){AC=new (window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.gain.value=+$('#g-vol').value;
    const comp=AC.createDynamicsCompressor();comp.threshold.value=-8;comp.ratio.value=2.5;comp.attack.value=0.01;comp.release.value=0.25;master.connect(comp);compNode=comp;routeOutput(IS_IOS);setupReverb(AC,comp);drumBus=AC.createGain();drumBus.gain.value=master.gain.value;drumBus.connect(comp);
    noiseBuf=AC.createBuffer(1,AC.sampleRate*0.3,AC.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
  if(AC.state==='suspended')AC.resume();return AC;
}
const mtof=m=>440*Math.pow(2,(m-69)/12);
/* 악기 샘플: 그랜드피아노 (Salamander), 하프·클래식 기타 (tonejs-instruments), 드럼 (Tone.js acoustic kit) */
const NOTE_PC={C:0,Cs:1,D:2,Ds:3,E:4,F:5,Fs:6,G:7,Gs:8,A:9,As:10,B:11};
const fileMidi=n=>{const m=n.match(/^([A-G]s?)(\d)$/);return 12*(+m[2]+1)+NOTE_PC[m[1]];};
const INSTR={
 piano:{name:'그랜드피아노 (Grand Piano)',dir:'samples/',files:[1,2,3,4,5,6,7].flatMap(o=>['C','Ds','Fs','A'].map(n=>n+o)),gain:1.1,rel:0.12},
 harp:{name:'하프 (Harp)',dir:'samples/harp/',files:'A2 A4 A6 B1 B3 B5 B6 C3 C5 D2 D4 D6 D7 E1 E3 E5 F2 F4 F6 F7 G1 G3 G5'.split(' '),gain:1.25,rel:0.35},
 guitar:{name:'클래식 기타 (Nylon Guitar)',dir:'samples/guitar/',files:'A2 A3 A4 A5 As5 B1 B2 B3 B4 Cs3 Cs4 Cs5 D2 D3 D5 Ds4 E2 E3 E4 E5 Fs2 Fs3 Fs4 Fs5 G3 G5 Gs2 Gs4 Gs5'.split(' '),gain:1.3,rel:0.25}
};
const SB={piano:{},harp:{},guitar:{}},LOADST={};const DRUM={};
let curInst=store.get('inst','piano');
/* 샘플은 한꺼번에 받지 않고 3개씩 차례로 받는다. 이번 문제 음역(NEED)에 가까운 파일부터 먼저. */
const LOADQ={};let NEED=[55,79];
function loadInst(name){if(LOADST[name])return;const I=INSTR[name];LOADST[name]={done:0,total:I.files.length};LOADQ[name]={pending:I.files.slice(),running:0};sortQueue(name);pumpLoad(name);}
function sortQueue(name){const Q=LOADQ[name];if(!Q)return;const [lo,hi]=NEED,mid=(lo+hi)/2;const near=f=>{const m=fileMidi(f);return m>=lo-6&&m<=hi+6;};
  Q.pending.sort((a,b)=>{const na=near(a),nb=near(b);if(na!==nb)return na?-1:1;return Math.abs(fileMidi(a)-mid)-Math.abs(fileMidi(b)-mid);});}
function pumpLoad(name){const Q=LOADQ[name],I=INSTR[name],st=LOADST[name];if(!Q)return;const c=ac();
  while(Q.running<3&&Q.pending.length){const f=Q.pending.shift();Q.running++;
    fetch(I.dir+f+'.mp3').then(r=>{if(!r.ok)throw 0;return r.arrayBuffer();}).then(b=>new Promise((res,rej)=>c.decodeAudioData(b,res,rej))).then(buf=>{SB[name][fileMidi(f)]=buf;}).catch(()=>{})
      .finally(()=>{Q.running--;st.done++;sampleStatus();pumpLoad(name);});}}
/* 새 문제가 나오면 그 음역을 먼저 받도록 큐를 다시 정렬 */
function needRange(lo,hi){NEED=[lo,hi];sortQueue(curInst);}
function rangeReady(){const st=LOADST[curInst],Q=LOADQ[curInst];if(!st||!Q)return true;if(st.done>=st.total)return true;const [lo,hi]=NEED;
  return !Q.pending.some(f=>{const m=fileMidi(f);return m>=lo-6&&m<=hi+6;})&&Q.running===0||INSTR[curInst].files.every(f=>{const m=fileMidi(f);return !(m>=lo-6&&m<=hi+6)||SB[curInst][m]!=null;});}
/* 새 문제 자동 재생: 필요한 샘플이 올 때까지 최대 3초 기다렸다가 들려준다 (휴대폰 데이터에서 처음 몇 초 무음 방지) */
function autoPlay(fn,maxMs=3000){if(SILENT)return;const t0=Date.now();const el=$('#snd-status');
  const go=()=>{at(0.15,fn);sampleStatus();};if(rangeReady()){go();return;}
  if(el)el.textContent='이 문제 소리 불러오는 중…';const h=setInterval(()=>{if(rangeReady()||Date.now()-t0>maxMs){clearInterval(h);go();}},100);}
function loadDrums(){const c=ac();['snare','hihat','tom1'].forEach(n=>fetch('samples/drums/'+n+'.mp3').then(r=>r.arrayBuffer()).then(b=>new Promise((res,rej)=>c.decodeAudioData(b,res,rej))).then(buf=>{DRUM[n]=buf;}).catch(()=>{}));}
function loadSamples(){loadInst(curInst);loadDrums();}
function sampleStatus(){const el=$('#snd-status');if(!el)return;const st=LOADST[curInst];if(!st)return;
  el.textContent=st.done<st.total?`소리 불러오는 중 ${Math.round(st.done/st.total*100)}%`:(Object.keys(SB[curInst]).length?'소리 준비 완료':'기본 합성음');}
function nearestSample(m){const B=SB[curInst];let best=null,bd=99;for(const k in B){const d=Math.abs(m-k);if(d<bd){bd=d;best=+k;}}return bd<=6?best:null;}
function piano(m,t,dur,vel=0.7){
  const c=ac(),s=nearestSample(m),I=INSTR[curInst];mark(t+dur);
  if(s==null)return synthPiano(m,t,dur,vel);
  const src=c.createBufferSource();src.buffer=SB[curInst][s];src.playbackRate.value=Math.pow(2,(m-s)/12);
  const g=c.createGain();const pk=vel*I.gain*(0.94+Math.random()*0.08);const rel=t+Math.max(dur,0.25);
  g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(pk,t+0.004);g.gain.setValueAtTime(pk,rel);g.gain.setTargetAtTime(0.0001,rel,I.rel);
  src.connect(g);g.connect(master);src.start(t);src.stop(rel+I.rel*8);active.push(g);
}
function rhSound(){const el=document.getElementById('rh-sound');return el&&el.value?el.value:'mallet';}
function drum(name,t,vol){const c=ac();if(!DRUM[name])return false;const s=c.createBufferSource();s.buffer=DRUM[name];const g=c.createGain();g.gain.value=vol;s.connect(g);g.connect(drumBus||master);s.start(t);active.push(g);return true;}
/* 공간 울림 (Reverb) */
let wetGain=null;
function makeImpulse(c,sec,decay){const len=Math.floor(c.sampleRate*sec);const b=c.createBuffer(2,len,c.sampleRate);for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);for(let i=0;i<len;i++){const tt=i/len;d[i]=(Math.random()*2-1)*Math.pow(1-tt,decay)*(i<c.sampleRate*0.012?i/(c.sampleRate*0.012):1);}}return b;}
function setupReverb(c,dest){const conv=c.createConvolver();conv.buffer=makeImpulse(c,2.6,3.2);const pre=c.createBiquadFilter();pre.type='highpass';pre.frequency.value=220;
  const tone=c.createBiquadFilter();tone.type='lowpass';tone.frequency.value=7500;wetGain=c.createGain();applyReverb();
  master.connect(pre);pre.connect(conv);conv.connect(tone);tone.connect(wetGain);wetGain.connect(dest);}
function applyReverb(){if(wetGain)wetGain.gain.value=($('#g-rev')&&$('#g-rev').checked)?0.32:0;}
function synthPiano(m,t,dur,vel=0.7){mark(t+dur);
  const c=ac(),f=mtof(m),g=c.createGain(),lp=c.createBiquadFilter();
  lp.type='lowpass';lp.frequency.setValueAtTime(Math.min(f*6,9000),t);lp.frequency.exponentialRampToValueAtTime(Math.max(f*2,500),t+1.2);
  [[1,1],[2,.35],[3,.14],[4,.06]].forEach(([h,a])=>{const o=c.createOscillator();o.type='sine';o.frequency.value=f*h;const og=c.createGain();og.gain.value=a;o.connect(og);og.connect(lp);o.start(t);o.stop(t+dur+1.3);});
  lp.connect(g);g.connect(master);const pk=vel*0.22;
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(pk,t+0.006);g.gain.exponentialRampToValueAtTime(pk*0.3,t+Math.max(dur,0.4));g.gain.exponentialRampToValueAtTime(0.0001,t+dur+1.0);
  active.push(g);
}
/* 리듬 문제 소리: 부드러운 나무 건반(마림바풍) 기본, 울림 없음 */
function mallet(t,accent,f){const c=ac();const out=c.createGain();out.connect(drumBus||master);const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2600;lp.connect(out);
  [[1,1,0.32],[3.93,0.18,0.06],[9.2,0.04,0.02]].forEach(([h,a,d])=>{const o=c.createOscillator();o.type='sine';o.frequency.value=f*h;const g=c.createGain();
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(a*(accent?0.6:0.48),t+0.003);g.gain.exponentialRampToValueAtTime(0.0001,t+d+0.05);o.connect(g);g.connect(lp);o.start(t);o.stop(t+d+0.1);});
  active.push(out);}
function hit(t,accent=false){mark(t+0.15);const s=rhSound();
  if(s==='mallet')return mallet(t,accent,392);if(s==='low')return mallet(t,accent,196);
  if(drum(s,t,accent?0.8:0.65))return;mallet(t,accent,392);}
/* 메트로놈: 기본 전자 메트로놈 '삑' 소리. vol로 크기 조절 (예비박은 크게, 문제 중에는 점점 작게) */
function click(t,accent,vol=1){mark(t+0.05);const c=ac();const o=c.createOscillator();o.type='square';o.frequency.value=accent?1600:1050;
  const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3200;const g=c.createGain();const pk=(accent?0.2:0.14)*vol;
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(pk,0.0002),t+0.002);g.gain.exponentialRampToValueAtTime(0.0001,t+0.035);
  o.connect(lp);lp.connect(g);g.connect(drumBus||master);o.start(t);o.stop(t+0.05);active.push(g);}
function stopAll(){timers.forEach(clearTimeout);timers=[];SCHED=[];playEnd=0;if(!AC)return;if(paused){resumeAudio();}const n=AC.currentTime;active.forEach(g=>{try{g.gain.cancelScheduledValues(n);g.gain.setTargetAtTime(0.0001,n,0.015);}catch(e){}});active=[];$$('.playing').forEach(e=>e.classList.remove('playing'));}


/* ---- 출력 경로: 일반 / 호환 모드 (아이폰: 소리를 <audio> 요소로 내보내 무음 스위치·웹뷰 제한을 피함) ---- */
const IS_IOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
let compNode=null,streamDest=null,outEl=null,compatOn=false;
function routeOutput(on){if(!AC||!compNode)return;try{compNode.disconnect();}catch(e){}
  if(on){try{if(!streamDest){streamDest=AC.createMediaStreamDestination();outEl=document.createElement('audio');outEl.setAttribute('playsinline','');outEl.setAttribute('webkit-playsinline','');outEl.autoplay=true;outEl.srcObject=streamDest.stream;document.body.appendChild(outEl);}
      compNode.connect(streamDest);compatOn=true;outEl.play().catch(()=>{});return;}catch(e){compatOn=false;}}
  compatOn=false;if(outEl)try{outEl.pause();}catch(e){}compNode.connect(AC.destination);}
function soundStatus(){const st=LOADST[curInst];const parts=[`오디오 ${AC?AC.state:'준비 전'}`,`출력 ${compatOn?'호환 모드':'일반'}`,`샘플 ${st?Object.keys(SB[curInst]).length+'/'+st.total:'-'}`];if(navigator.audioSession)parts.push('세션 '+navigator.audioSession.type);return parts.join(' · ');}
function soundTest(){unlockAudio();if(outEl&&compatOn)outEl.play().catch(()=>{});stopAll();const t=now();[60,64,67,72].forEach((m,i)=>piano(m,t+i*0.22,0.5,0.8));
  const el=$('#snd-test-msg');el.hidden=false;el.textContent='도-미-솔-도가 들리면 정상이에요. '+soundStatus();setTimeout(()=>{el.textContent='도-미-솔-도가 들리면 정상이에요. '+soundStatus();},1200);}

/* ---- 휴대폰 소리 잠금 해제 (iOS 무음 스위치·자동재생 제한 대응) ---- */
let audioUnlocked=false,silentEl=null;
function silentWavURL(){const n=4000,b=new ArrayBuffer(44+n),v=new DataView(b);const w=(o,t)=>{for(let i=0;i<t.length;i++)v.setUint8(o+i,t.charCodeAt(i));};
  w(0,'RIFF');v.setUint32(4,36+n,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,8000,true);v.setUint32(28,8000,true);v.setUint16(32,1,true);v.setUint16(34,8,true);w(36,'data');v.setUint32(40,n,true);
  for(let i=0;i<n;i++)v.setUint8(44+i,128);return URL.createObjectURL(new Blob([b],{type:'audio/wav'}));}
function unlockAudio(){const c=ac();if(compatOn&&outEl&&outEl.paused)outEl.play().catch(()=>{});
  try{if(navigator.audioSession&&navigator.audioSession.type!=='playback')navigator.audioSession.type='playback';}catch(e){}
  if(!audioUnlocked){try{const b=c.createBuffer(1,1,22050),src=c.createBufferSource();src.buffer=b;src.connect(c.destination);src.start(0);}catch(e){}
    if(!navigator.audioSession&&!silentEl&&!compatOn){try{silentEl=document.createElement('audio');silentEl.src=silentWavURL();silentEl.loop=true;silentEl.setAttribute('playsinline','');silentEl.setAttribute('webkit-playsinline','');silentEl.play().catch(()=>{});}catch(e){}}}
  if(c.state!=='running'&&!paused)c.resume().then(()=>{audioUnlocked=c.state==='running';audioHint();}).catch(()=>{});else{audioUnlocked=true;audioHint();}}
['pointerdown','touchend','click','keydown'].forEach(t=>document.addEventListener(t,unlockAudio,{capture:true,passive:true}));
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&AC&&AC.state!=='running'&&!paused)AC.resume().catch(()=>{});});
function audioHint(){const el=$('#audio-hint');if(!el||!AC)return;el.hidden=AC.state==='running'||paused;}
setInterval(audioHint,1000);

let SILENT=false,SCHED=[],paused=false,playEnd=0;
const mark=e=>{if(e>playEnd)playEnd=e;};
function at(sec,fn){if(SILENT)return;const c=ac();SCHED.push({t:c.currentTime+Math.max(0,sec),fn});}
setInterval(()=>{if(!AC||!SCHED.length||paused)return;const n=AC.currentTime;const due=SCHED.filter(x=>x.t<=n);if(!due.length)return;SCHED=SCHED.filter(x=>x.t>n);due.forEach(x=>{try{x.fn();}catch(e){}});},25);
const isPlaying=()=>!!AC&&(paused||AC.currentTime<playEnd);
const PLAYBTN={melody:'mel',chord:'ch',prog:'pg',rhythm:'rh',scale:'sc',interval:'iv'};
function pauseAudio(){paused=true;if(outEl&&compatOn){outEl.muted=true;try{outEl.pause();}catch(e){}}AC.suspend();}
function resumeAudio(){paused=false;AC.resume().then(()=>{if(outEl&&compatOn){outEl.muted=false;outEl.play().catch(()=>{});}}).catch(()=>{});}
function playToggle(mode){if(paused){resumeAudio();return;}if(isPlaying()){pauseAudio();return;}SPEED[mode].play();}
function stopPlay(){stopAll();}
let lastPB='';setInterval(()=>{const st=paused?'p':isPlaying()?'r':'i';if(st===lastPB)return;lastPB=st;
  Object.values(PLAYBTN).forEach(pre=>{const b=document.getElementById(pre+'-play'),sb=document.getElementById(pre+'-stop');if(!b)return;
    b.innerHTML=st==='r'?'❚❚ 일시정지 <span class="en">(Pause)</span><kbd>Space</kbd>':st==='p'?'▶ 계속 <span class="en">(Resume)</span><kbd>Space</kbd>':'▶ 듣기<kbd>Space</kbd>';b.classList.toggle('pausing',st!=='i');if(sb)sb.disabled=st==='i';});},80);
function now(){return ac().currentTime+0.06;}
function chordAt(notes,t,dur){notes.forEach(m=>piano(m,t,dur,0.6));}
