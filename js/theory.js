/* 음이름·스케일·코드·음정·코드 진행 어휘·박 패턴 데이터 */
"use strict";
/* ---------- 음이름 ---------- */
let naming=store.get('naming','letter');
const LS=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'],LF=['C','D♭','D','E♭','E','F','G♭','G','A♭','A','B♭','B'];
const SS=['도','도♯','레','레♯','미','파','파♯','솔','솔♯','라','라♯','시'],SF=['도','레♭','레','미♭','미','파','솔♭','솔','라♭','라','시♭','시'];
const FLAT_KEYS=new Set([1,3,5,8,10]);
/* 이동도 (Movable Do): 멜로디 탭에서만 으뜸음을 '도'로 읽는다(마이너도 으뜸음 = 도). 다른 탭은 고정도로 표시 */
function movTonic(){return (naming==='movable'&&typeof curTab!=='undefined'&&curTab==='melody'&&typeof M!=='undefined'&&M.q)?M.q.tonic:null;}
function pcName(pc,flat,forceLetter){pc=mod(pc);const L=(forceLetter||naming==='letter');if(L)return (flat?LF:LS)[pc];
  const T=movTonic();if(T!=null){const r=mod(pc-T);return ([1,3,8,10].includes(r)?SF:SS)[r];}return (flat?SF:SS)[pc];}
function noteHTML(m,flat){return `${pcName(m,flat)}<small>${Math.floor(m/12)-1}</small>`;}
function useFlat(tonicPc,iv){const minorish=iv.includes(3)&&!iv.includes(4);return FLAT_KEYS.has(mod(minorish?tonicPc+3:tonicPc));}
function rootFlat(pc){return [1,3,8,10].includes(mod(pc));}
function keyOptions(sel,withRandom=true){sel.innerHTML=(withRandom?'<option value="r">랜덤</option>':'')+[...Array(12).keys()].map(i=>`<option value="${i}">${LS[i]===LF[i]?LS[i]:LS[i]+' / '+LF[i]}</option>`).join('');}

/* ---------- 이론 데이터 ---------- */
const SCALES={
 major:{n:'메이저 (Major)',s:'이오니안 (Ionian)',g:'기본 (Basic)',iv:[0,2,4,5,7,9,11],lv:1},
 minor:{n:'내추럴 마이너 (Natural Minor)',s:'에올리안 (Aeolian)',g:'기본 (Basic)',iv:[0,2,3,5,7,8,10],lv:1},
 harmmin:{n:'하모닉 마이너 (Harmonic Minor)',g:'기본 (Basic)',iv:[0,2,3,5,7,8,11],lv:2},
 melmin:{n:'멜로딕 마이너 (Melodic Minor)',s:'재즈 마이너 (Jazz Minor)',g:'기본 (Basic)',iv:[0,2,3,5,7,9,11],lv:2},
 dorian:{n:'도리안 (Dorian)',g:'교회선법 (Church Modes)',iv:[0,2,3,5,7,9,10],lv:2},
 phrygian:{n:'프리지안 (Phrygian)',g:'교회선법 (Church Modes)',iv:[0,1,3,5,7,8,10],lv:3},
 lydian:{n:'리디안 (Lydian)',g:'교회선법 (Church Modes)',iv:[0,2,4,6,7,9,11],lv:2},
 mixolydian:{n:'믹솔리디안 (Mixolydian)',g:'교회선법 (Church Modes)',iv:[0,2,4,5,7,9,10],lv:2},
 locrian:{n:'로크리안 (Locrian)',g:'교회선법 (Church Modes)',iv:[0,1,3,5,6,8,10],lv:3},
 majpent:{n:'메이저 펜타토닉 (Major Pentatonic)',g:'펜타토닉·블루스 (Pentatonic · Blues)',iv:[0,2,4,7,9],lv:1},
 minpent:{n:'마이너 펜타토닉 (Minor Pentatonic)',g:'펜타토닉·블루스 (Pentatonic · Blues)',iv:[0,3,5,7,10],lv:1},
 blues:{n:'블루스 (Blues)',s:'마이너 블루스 (Minor Blues)',g:'펜타토닉·블루스 (Pentatonic · Blues)',iv:[0,3,5,6,7,10],lv:2},
 majblues:{n:'메이저 블루스 (Major Blues)',g:'펜타토닉·블루스 (Pentatonic · Blues)',iv:[0,2,3,4,7,9],lv:3},
 dorb2:{n:'도리안 ♭2 (Dorian ♭2)',s:'멜로딕 마이너 2번째 모드',g:'멜로딕 마이너 계열 (Melodic Minor Modes)',iv:[0,1,3,5,7,9,10],lv:4},
 lydaug:{n:'리디안 오그먼트 (Lydian Augmented)',s:'멜로딕 마이너 3번째 모드',g:'멜로딕 마이너 계열 (Melodic Minor Modes)',iv:[0,2,4,6,8,9,11],lv:4},
 lyddom:{n:'리디안 도미넌트 (Lydian Dominant)',s:'멜로딕 마이너 4번째 모드',g:'멜로딕 마이너 계열 (Melodic Minor Modes)',iv:[0,2,4,6,7,9,10],lv:3},
 mixb6:{n:'믹솔리디안 ♭6 (Mixolydian ♭6)',s:'멜로딕 마이너 5번째 모드',g:'멜로딕 마이너 계열 (Melodic Minor Modes)',iv:[0,2,4,5,7,8,10],lv:4},
 locs2:{n:'로크리안 ♮2 (Locrian ♮2)',s:'멜로딕 마이너 6번째 모드',g:'멜로딕 마이너 계열 (Melodic Minor Modes)',iv:[0,2,3,5,6,8,10],lv:4},
 altered:{n:'얼터드 (Altered)',s:'슈퍼 로크리안 (Super Locrian)',g:'멜로딕 마이너 계열 (Melodic Minor Modes)',iv:[0,1,3,4,6,8,10],lv:4},
 phrygdom:{n:'프리지안 도미넌트 (Phrygian Dominant)',s:'하모닉 마이너 5번째 모드',g:'하모닉 계열 (Harmonic Modes)',iv:[0,1,4,5,7,8,10],lv:3},
 harmmaj:{n:'하모닉 메이저 (Harmonic Major)',g:'하모닉 계열 (Harmonic Modes)',iv:[0,2,4,5,7,8,11],lv:4},
 hunmin:{n:'헝가리안 마이너 (Hungarian Minor)',g:'하모닉 계열 (Harmonic Modes)',iv:[0,2,3,6,7,8,11],lv:4},
 whole:{n:'홀톤 (Whole Tone)',g:'대칭·기타 (Symmetric · Others)',iv:[0,2,4,6,8,10],lv:3},
 dimhw:{n:'디미니시 반-온 (Half-Whole Diminished)',s:'콤비네이션 디미니시 (Dominant Diminished)',g:'대칭·기타 (Symmetric · Others)',iv:[0,1,3,4,6,7,9,10],lv:3},
 dimwh:{n:'디미니시 온-반 (Whole-Half Diminished)',g:'대칭·기타 (Symmetric · Others)',iv:[0,2,3,5,6,8,9,11],lv:4},
 bebopdom:{n:'비밥 도미넌트 (Bebop Dominant)',g:'대칭·기타 (Symmetric · Others)',iv:[0,2,4,5,7,9,10,11],lv:4},
 bebopmaj:{n:'비밥 메이저 (Bebop Major)',g:'대칭·기타 (Symmetric · Others)',iv:[0,2,4,5,7,8,9,11],lv:4},
 hirajoshi:{n:'히라조시 (Hirajoshi)',s:'일본 음계 (Japanese Scale)',g:'대칭·기타 (Symmetric · Others)',iv:[0,2,3,7,8],lv:4},
 chromatic:{n:'크로매틱 (Chromatic)',s:'멜로디 전용',g:'대칭·기타 (Symmetric · Others)',iv:[0,1,2,3,4,5,6,7,8,9,10,11],lv:5}
};
const CHORDS=[
 ['트라이어드 (Triad)','maj','','Major','메이저 (Major)',[0,4,7],1],
 ['트라이어드 (Triad)','m','m','m','마이너 (Minor)',[0,3,7],1],
 ['트라이어드 (Triad)','dim','dim','dim','디미니시 (Diminished)',[0,3,6],2],
 ['트라이어드 (Triad)','aug','aug','aug','오그먼트 (Augmented)',[0,4,8],2],
 ['서스·식스·애드 (sus · 6 · add)','sus2','sus2','sus2','서스2 (Suspended 2nd)',[0,2,7],3],
 ['서스·식스·애드 (sus · 6 · add)','sus4','sus4','sus4','서스4 (Suspended 4th)',[0,5,7],2],
 ['서스·식스·애드 (sus · 6 · add)','6','6','6','식스 (Sixth)',[0,4,7,9],3],
 ['서스·식스·애드 (sus · 6 · add)','m6','m6','m6','마이너 식스 (Minor 6th)',[0,3,7,9],3],
 ['서스·식스·애드 (sus · 6 · add)','add9','add9','add9','애드 나인 (Added 9th)',[0,4,7,14],3],
 ['서스·식스·애드 (sus · 6 · add)','madd9','madd9','madd9','마이너 애드 나인 (Minor add 9th)',[0,3,7,14],4],
 ['서스·식스·애드 (sus · 6 · add)','69','6/9','6/9','식스 나인 (Six-Nine)',[0,4,7,9,14],4],
 ['서스·식스·애드 (sus · 6 · add)','m69','m6/9','m6/9','마이너 식스 나인 (Minor Six-Nine)',[0,3,7,9,14],4],
 ['7화음 (7th)','maj7','maj7','maj7','메이저 세븐 (Major 7th)',[0,4,7,11],2],
 ['7화음 (7th)','7','7','7','도미넌트 세븐 (Dominant 7th)',[0,4,7,10],2],
 ['7화음 (7th)','m7','m7','m7','마이너 세븐 (Minor 7th)',[0,3,7,10],2],
 ['7화음 (7th)','m7b5','m7♭5','m7♭5','하프 디미니시 (Half-Diminished)',[0,3,6,10],2],
 ['7화음 (7th)','dim7','dim7','dim7','디미니시 세븐 (Diminished 7th)',[0,3,6,9],3],
 ['7화음 (7th)','mmaj7','mMaj7','mMaj7','마이너 메이저 세븐 (Minor-Major 7th)',[0,3,7,11],3],
 ['7화음 (7th)','7sus4','7sus4','7sus4','세븐 서스4 (7th Suspended 4th)',[0,5,7,10],3],
 ['7화음 (7th)','aug7','7♯5','7♯5','오그먼트 세븐 (Augmented 7th)',[0,4,8,10],4],
 ['7화음 (7th)','maj7s5','maj7♯5','maj7♯5','오그먼트 메이저 세븐 (Augmented Major 7th)',[0,4,8,11],4],
 ['7화음 (7th)','7b5','7♭5','7♭5','세븐 플랫 파이브 (7th Flat 5)',[0,4,6,10],4],
 ['9th 텐션 (9th)','maj9','maj9','maj9','메이저 나인 (Major 9th)',[0,4,7,11,14],3],
 ['9th 텐션 (9th)','9','9','9','도미넌트 나인 (Dominant 9th)',[0,4,7,10,14],3],
 ['9th 텐션 (9th)','m9','m9','m9','마이너 나인 (Minor 9th)',[0,3,7,10,14],3],
 ['9th 텐션 (9th)','mmaj9','mMaj9','mMaj9','마이너 메이저 나인 (Minor-Major 9th)',[0,3,7,11,14],4],
 ['9th 텐션 (9th)','9sus4','9sus4','9sus4','나인 서스4 (9th Suspended 4th)',[0,5,7,10,14],4],
 ['9th 텐션 (9th)','m9b5','m9♭5','m9♭5','하프 디미니시 나인 (Half-Diminished 9th)',[0,3,6,10,14],4],
 ['11th 텐션 (11th)','11','11','11','도미넌트 일레븐 (3음 생략) (Dominant 11th, no 3rd)',[0,7,10,14,17],4],
 ['11th 텐션 (11th)','m11','m11','m11','마이너 일레븐 (Minor 11th)',[0,3,7,10,14,17],4],
 ['11th 텐션 (11th)','maj7s11','maj7♯11','maj7♯11','메이저 세븐 ♯11 (Major 7th Sharp 11)',[0,4,7,11,18],4],
 ['11th 텐션 (11th)','maj9s11','maj9♯11','maj9♯11','메이저 나인 ♯11 (Major 9th Sharp 11)',[0,4,7,11,14,18],4],
 ['11th 텐션 (11th)','7s11','7♯11','7♯11','세븐 ♯11 (7th Sharp 11)',[0,4,7,10,18],4],
 ['11th 텐션 (11th)','9s11','9♯11','9♯11','나인 ♯11 (9th Sharp 11)',[0,4,7,10,14,18],4],
 ['13th 텐션 (13th)','13','13','13','도미넌트 13 (5음 생략) (Dominant 13th, no 5th)',[0,4,10,14,21],4],
 ['13th 텐션 (13th)','maj13','maj13','maj13','메이저 13 (Major 13th)',[0,4,11,14,21],4],
 ['13th 텐션 (13th)','m13','m13','m13','마이너 13 (Minor 13th)',[0,3,10,14,17,21],4],
 ['13th 텐션 (13th)','13sus4','13sus4','13sus4','13 서스4 (13th Suspended 4th)',[0,5,10,14,21],4],
 ['13th 텐션 (13th)','13s11','13♯11','13♯11','13 ♯11 (13th Sharp 11)',[0,4,10,14,18,21],4],
 ['얼터드 텐션 (Altered Tension)','7b9','7♭9','7♭9','세븐 ♭9 (7th Flat 9)',[0,4,7,10,13],3],
 ['얼터드 텐션 (Altered Tension)','7s9','7♯9','7♯9','세븐 ♯9 (헨드릭스) (7th Sharp 9, Hendrix)',[0,4,7,10,15],3],
 ['얼터드 텐션 (Altered Tension)','7b13','7♭13','7♭13','세븐 ♭13 (7th Flat 13)',[0,4,10,20],4],
 ['얼터드 텐션 (Altered Tension)','7b9b13','7♭9♭13','7♭9♭13','세븐 ♭9 ♭13 (7th Flat 9 Flat 13)',[0,4,10,13,20],4],
 ['얼터드 텐션 (Altered Tension)','7s9b13','7♯9♭13','7♯9♭13','알트 (♯9 ♭13) (Altered, ♯9 ♭13)',[0,4,10,15,20],4],
 ['얼터드 텐션 (Altered Tension)','7b9s11','7♭9♯11','7♭9♯11','세븐 ♭9 ♯11 (7th Flat 9 Sharp 11)',[0,4,10,13,18],4],
 ['얼터드 텐션 (Altered Tension)','7s5s9','7♯5♯9','7♯5♯9','세븐 ♯5 ♯9 (7th Sharp 5 Sharp 9)',[0,4,8,10,15],4],
 ['얼터드 텐션 (Altered Tension)','13b9','13♭9','13♭9','13 ♭9 (13th Flat 9)',[0,4,10,13,21],4],
 ['얼터드 텐션 (Altered Tension)','dimmaj7','dim(maj7)','dim(maj7)','디미니시 메이저 세븐 (Diminished Major 7th)',[0,3,6,11],4]
].map(([g,id,sym,disp,kr,iv,lv])=>({g,id,sym,disp,kr,iv,lv}));
const CH=Object.fromEntries(CHORDS.map(c=>[c.id,c]));
const INTERVALS=[
 [1,'단2도 (minor 2nd)','m2',2],[2,'장2도 (Major 2nd)','M2',1],[3,'단3도 (minor 3rd)','m3',2],[4,'장3도 (Major 3rd)','M3',1],[5,'완전4도 (Perfect 4th)','P4',2],[6,'증4도/감5도 (Tritone)','TT',3],[7,'완전5도 (Perfect 5th)','P5',1],
 [8,'단6도 (minor 6th)','m6',3],[9,'장6도 (Major 6th)','M6',2],[10,'단7도 (minor 7th)','m7',3],[11,'장7도 (Major 7th)','M7',3],[12,'완전8도 (Octave)','P8',1],
 [13,'단9도 (minor 9th)','m9',4],[14,'장9도 (Major 9th)','M9',4],[15,'단10도 (minor 10th)','m10',4],[16,'장10도 (Major 10th)','M10',4],[17,'완전11도 (Perfect 11th)','P11',4],[18,'증11도 (Augmented 11th)','A11',4],[19,'완전12도 (Perfect 12th)','P12',4],[20,'단13도 (minor 13th)','m13',4],[21,'장13도 (Major 13th)','M13',4]
].map(([s,n,a,lv])=>({s,n,a,lv,id:'i'+s}));

/* 코드 진행 어휘: id, 표기, 근음(키 기준), 코드타입, 분류, 난이도 */
const VOCAB={
 major:[
  ['I','I',0,'maj','다이아토닉 3화음 (Diatonic Triads)',1],['ii','ii',2,'m','다이아토닉 3화음 (Diatonic Triads)',2],['iii','iii',4,'m','다이아토닉 3화음 (Diatonic Triads)',2],['IV','IV',5,'maj','다이아토닉 3화음 (Diatonic Triads)',1],['V','V',7,'maj','다이아토닉 3화음 (Diatonic Triads)',1],['vi','vi',9,'m','다이아토닉 3화음 (Diatonic Triads)',2],['viid','vii°',11,'dim','다이아토닉 3화음 (Diatonic Triads)',3],
  ['IM7','IΔ7',0,'maj7','다이아토닉 7화음 (Diatonic 7ths)',3],['ii7','ii7',2,'m7','다이아토닉 7화음 (Diatonic 7ths)',3],['iii7','iii7',4,'m7','다이아토닉 7화음 (Diatonic 7ths)',3],['IVM7','IVΔ7',5,'maj7','다이아토닉 7화음 (Diatonic 7ths)',3],['V7','V7',7,'7','다이아토닉 7화음 (Diatonic 7ths)',3],['vi7','vi7',9,'m7','다이아토닉 7화음 (Diatonic 7ths)',3],['viiø7','viiø7',11,'m7b5','다이아토닉 7화음 (Diatonic 7ths)',3],
  ['V7/ii','V7/ii',9,'7','세컨더리 도미넌트 (Secondary Dominant)',3],['V7/iii','V7/iii',11,'7','세컨더리 도미넌트 (Secondary Dominant)',4],['V7/IV','V7/IV',0,'7','세컨더리 도미넌트 (Secondary Dominant)',4],['V7/V','V7/V',2,'7','세컨더리 도미넌트 (Secondary Dominant)',3],['V7/vi','V7/vi',4,'7','세컨더리 도미넌트 (Secondary Dominant)',3],
  ['iv','iv',5,'m','차용화음 (Borrowed Chords · Modal Interchange)',4],['iv7','iv7',5,'m7','차용화음 (Borrowed Chords · Modal Interchange)',4],['bIII','♭III',3,'maj','차용화음 (Borrowed Chords · Modal Interchange)',4],['bVI','♭VI',8,'maj','차용화음 (Borrowed Chords · Modal Interchange)',4],['bVIM7','♭VIΔ7',8,'maj7','차용화음 (Borrowed Chords · Modal Interchange)',4],['bVII','♭VII',10,'maj','차용화음 (Borrowed Chords · Modal Interchange)',4],['bVII7','♭VII7',10,'7','차용화음 (Borrowed Chords · Modal Interchange)',4],['iiø7','iiø7',2,'m7b5','차용화음 (Borrowed Chords · Modal Interchange)',4],['bIIM7','♭IIΔ7',1,'maj7','차용화음 (Borrowed Chords · Modal Interchange)',5],
  ['IM9','IΔ9',0,'maj9','텐션 코드 (Tension Chords)',5],['I69','I6/9',0,'69','텐션 코드 (Tension Chords)',5],['ii9','ii9',2,'m9','텐션 코드 (Tension Chords)',5],['ii11','ii11',2,'m11','텐션 코드 (Tension Chords)',5],['IVM7s11','IVΔ7♯11',5,'maj7s11','텐션 코드 (Tension Chords)',5],['V9','V9',7,'9','텐션 코드 (Tension Chords)',5],['V13','V13',7,'13','텐션 코드 (Tension Chords)',5],['V7b9','V7♭9',7,'7b9','텐션 코드 (Tension Chords)',5],['V7alt','V7alt',7,'7s9b13','텐션 코드 (Tension Chords)',5],['V9sus4','V9sus4',7,'9sus4','텐션 코드 (Tension Chords)',5],['vi9','vi9',9,'m9','텐션 코드 (Tension Chords)',5]
 ],
 minor:[
  ['i','i',0,'m','다이아토닉 3화음 (Diatonic Triads)',1],['iid','ii°',2,'dim','다이아토닉 3화음 (Diatonic Triads)',2],['bIII','♭III',3,'maj','다이아토닉 3화음 (Diatonic Triads)',2],['iv','iv',5,'m','다이아토닉 3화음 (Diatonic Triads)',1],['v','v',7,'m','다이아토닉 3화음 (Diatonic Triads)',2],['V','V',7,'maj','다이아토닉 3화음 (Diatonic Triads)',1],['bVI','♭VI',8,'maj','다이아토닉 3화음 (Diatonic Triads)',2],['bVII','♭VII',10,'maj','다이아토닉 3화음 (Diatonic Triads)',2],['viid','vii°',11,'dim','다이아토닉 3화음 (Diatonic Triads)',3],
  ['i7','i7',0,'m7','다이아토닉 7화음 (Diatonic 7ths)',3],['imM7','imΔ7',0,'mmaj7','다이아토닉 7화음 (Diatonic 7ths)',4],['iiø7','iiø7',2,'m7b5','다이아토닉 7화음 (Diatonic 7ths)',3],['bIIIM7','♭IIIΔ7',3,'maj7','다이아토닉 7화음 (Diatonic 7ths)',3],['iv7','iv7',5,'m7','다이아토닉 7화음 (Diatonic 7ths)',3],['v7','v7',7,'m7','다이아토닉 7화음 (Diatonic 7ths)',3],['V7','V7',7,'7','다이아토닉 7화음 (Diatonic 7ths)',3],['bVIM7','♭VIΔ7',8,'maj7','다이아토닉 7화음 (Diatonic 7ths)',3],['bVII7','♭VII7',10,'7','다이아토닉 7화음 (Diatonic 7ths)',3],['viid7','vii°7',11,'dim7','다이아토닉 7화음 (Diatonic 7ths)',3],
  ['V7/iv','V7/iv',0,'7','세컨더리 도미넌트 (Secondary Dominant)',4],['V7/V','V7/V',2,'7','세컨더리 도미넌트 (Secondary Dominant)',3],['V7/bVI','V7/♭VI',3,'7','세컨더리 도미넌트 (Secondary Dominant)',4],
  ['IV','IV',5,'maj','차용화음 (Borrowed Chords · Modal Interchange)',4],['IV7','IV7',5,'7','차용화음 (Borrowed Chords · Modal Interchange)',4],['Ipic','I (Picardy)',0,'maj','차용화음 (Borrowed Chords · Modal Interchange)',4],['bII','♭II (Neapolitan)',1,'maj','차용화음 (Borrowed Chords · Modal Interchange)',4],['bIIM7','♭IIΔ7',1,'maj7','차용화음 (Borrowed Chords · Modal Interchange)',5],
  ['im9','i9',0,'m9','텐션 코드 (Tension Chords)',5],['im69','i6/9',0,'m69','텐션 코드 (Tension Chords)',5],['iiø9','iiø9',2,'m9b5','텐션 코드 (Tension Chords)',5],['iv9','iv9',5,'m9','텐션 코드 (Tension Chords)',5],['V7b9','V7♭9',7,'7b9','텐션 코드 (Tension Chords)',5],['V7b13','V7♭13',7,'7b9b13','텐션 코드 (Tension Chords)',5],['V7alt','V7alt',7,'7s9b13','텐션 코드 (Tension Chords)',5],['bVIM9','♭VIΔ9',8,'maj9','텐션 코드 (Tension Chords)',5],['bVIIM7s11','♭VII9',10,'9','텐션 코드 (Tension Chords)',5]
 ]
};
for(const k in VOCAB) VOCAB[k]=VOCAB[k].map(([id,lb,r,t,cat,lv])=>({id,lb,r,t,cat,lv}));
{const SL='전위·슬래시 코드 (Inversions · Slash Chords)',SU='서스·블루스·대리 코드 (Sus · Blues · Substitute)';const mk=([id,lb,r,t,cat,lv,bass])=>({id,lb,r,t,cat,lv,bass});
VOCAB.major.push(...[['I_3','I/3',0,'maj',SL,4,4],['I_5','I/5',0,'maj',SL,4,7],['ii_4','ii/4',2,'m',SL,4,5],['ii7_5','ii7/5',2,'m7',SL,4,7],['iii_5','iii/5',4,'m',SL,4,7],
 ['IV_6','IV/6',5,'maj',SL,4,9],['IV_1','IV/1',5,'maj',SL,4,0],['IV_5','IV/5',5,'maj',SL,4,7],['V_7','V/7',7,'maj',SL,4,11],['V_2','V/2',7,'maj',SL,4,2],['V7_4','V7/4',7,'7',SL,4,5],
 ['Vsus4','Vsus4',7,'sus4',SU,4],['V7sus4','V7sus4',7,'7sus4',SU,4],['I7','I7',0,'7',SU,4],['IV7','IV7',5,'7',SU,4],['v7','v7',7,'m7',SU,4],['bII7','♭II7',1,'7',SU,5]].map(mk));
VOCAB.minor.push(...[['i_b3','i/♭3',0,'m',SL,4,3],['i_5','i/5',0,'m',SL,4,7],['i_b7','i/♭7',0,'m',SL,4,10],['i_6','i/6',0,'m',SL,4,9],['iv_b6','iv/♭6',5,'m',SL,4,8],['bII_4','♭II/4',1,'maj',SL,4,5],['V_7','V/7',7,'maj',SL,4,11],
 ['Vsus4','Vsus4',7,'sus4',SU,4],['V7sus4','V7sus4',7,'7sus4',SU,4]].map(mk));}

const SIMPLE_PATS=[
 ['q',[1,0,0,0],'4분음표 (Quarter)',1],['qr',[0,0,0,0],'4분쉼표 (Quarter Rest)',1],['ee',[1,0,1,0],'8분 2개 (Two 8ths)',1],['re',[0,0,1,0],'8분쉼표 + 8분 (8th Rest + 8th)',2],
 ['ssss',[1,1,1,1],'16분 4개 (Four 16ths)',2],['ess',[1,0,1,1],'8분 + 16분 2개 (8th + Two 16ths)',2],['sse',[1,1,1,0],'16분 2개 + 8분 (Two 16ths + 8th)',2],['des',[1,0,0,1],'점8분 + 16분 (Dotted 8th + 16th)',2],
 ['sde',[1,1,0,0],'16분 + 점8분 (16th + Dotted 8th)',3],['ses',[1,1,0,1],'16-8-16 (당김) (16-8-16, Syncopation)',3],['rsss',[0,1,1,1],'16분쉼표 + 16분 3개 (16th Rest + Three 16ths)',3],['rss',[0,0,1,1],'8분쉼표 + 16분 2개 (8th Rest + Two 16ths)',3],['rsrs',[0,1,0,1],'뒷박 16분 2개 (Offbeat 16ths)',3],
 ['rssr',[0,1,1,0],'가운데 16분 2개 (Middle 16ths)',4],['rs',[0,1,0,0],'16분쉼표 + 점8분 (16th Rest + Dotted 8th)',4],['rrrs',[0,0,0,1],'마지막 16분만 (Last 16th Only)',4],['srs',[1,0,0,1],'',0],
 ['t5',[1,1,1,1,1],'5연음 (Quintuplet)',4],['t6',[1,1,1,1,1,1],'6연음 (Sextuplet)',4],['t7',[1,1,1,1,1,1,1],'7연음 (Septuplet)',4],
 ['t3',[1,1,1],'8분 셋잇단 (8th Triplet)',3],['tqe',[1,0,1],'셋잇단 4분+8분 (셔플) (Triplet Quarter + 8th, Shuffle)',3],['teq',[1,1,0],'셋잇단 8분+4분 (Triplet 8th + Quarter)',4],['tree',[0,1,1],'셋잇단 쉼표+8분 2개 (Triplet Rest + Two 8ths)',4],['trre',[0,0,1],'셋잇단 마지막만 (Last Triplet Only)',4]
].filter(p=>p[3]>0).map(([id,g,n,lv])=>({id,g,n,lv}));
const COMPOUND_PATS=[
 ['cdq',[1,0,0,0,0,0],'점4분음표 (Dotted Quarter)',1],['cr',[0,0,0,0,0,0],'점4분쉼표 (Dotted Quarter Rest)',1],['c3e',[1,0,1,0,1,0],'8분 3개 (Three 8ths)',1],['cqe',[1,0,0,0,1,0],'4분 + 8분 (Quarter + 8th)',1],
 ['ceq',[1,0,1,0,0,0],'8분 + 4분 (8th + Quarter)',2],['cree',[0,0,1,0,1,0],'8분쉼표 + 8분 2개 (8th Rest + Two 8ths)',2],['crq',[0,0,1,0,0,0],'8분쉼표 + 4분 (8th Rest + Quarter)',3],
 ['c6s',[1,1,1,1,1,1],'16분 6개 (Six 16ths)',3],['cssee',[1,1,1,0,1,0],'16분 2개 + 8분 2개 (Two 16ths + Two 8ths)',3],['cesse',[1,0,1,1,1,0],'8분 + 16분 2개 + 8분 (8th + Two 16ths + 8th)',3],['ceess',[1,0,1,0,1,1],'8분 2개 + 16분 2개 (Two 8ths + Two 16ths)',3],['cdese',[1,0,0,1,1,0],'점8분 + 16분 + 8분 (Dotted 8th + 16th + 8th)',3],
 ['cssq',[1,1,1,0,0,0],'16분 2개 + 4분 (Two 16ths + Quarter)',4],['cqss',[1,0,0,0,1,1],'4분 + 16분 2개 (Quarter + Two 16ths)',4],['crre',[0,0,0,0,1,0],'마지막 8분만 (Last 8th Only)',4]
].map(([id,g,n,lv])=>({id,g,n,lv}));
const PAT=Object.fromEntries([...SIMPLE_PATS,...COMPOUND_PATS].map(p=>[p.id,p]));
const PATSVG={};
function patIcon(p){if(window.Vex&&window.Vex.Flow){if(!PATSVG[p.id])try{PATSVG[p.id]=patNotation(p.id);}catch(e){}if(PATSVG[p.id])return PATSVG[p.id];}
  return patGrid(p);}
function patGrid(p){const cls='g'+(p.g.length===4?4:p.g.length);return `<span class="pi ${cls}">${p.g.map(v=>`<i class="${v?'on':''}"></i>`).join('')}</span>`;}
