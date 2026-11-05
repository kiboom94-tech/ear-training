/* 오프라인 캐시 (Service Worker)
   - 화면·코드(html/css/js): 인터넷이 되면 항상 새 버전을 받고, 안 되면 저장해 둔 것을 쓴다 (network-first)
   - 소리 샘플·악보 라이브러리·아이콘: 한 번 받으면 저장해 두고 다시 받지 않는다 (cache-first) → 휴대폰 데이터 절약
   새 JS 파일을 추가하면 아래 CORE 목록에도 넣는다. */
const APP = 'eartr-app-v5';
const MEDIA = 'eartr-media-v1';
const CORE = ['./', 'index.html', 'css/style.css', 'manifest.webmanifest', 'vendor/vexflow.js', 'icons/icon-192.png', 'icons/icon-512.png',
  'js/store.js', 'js/audio.js', 'js/theory.js', 'js/notation.js', 'js/ui.js',
  'js/modes/melody.js', 'js/modes/chord.js', 'js/modes/prog.js', 'js/modes/rhythm.js', 'js/modes/scale.js', 'js/modes/interval.js',
  'js/review.js', 'js/course.js', 'js/stats.js', 'js/sync.js', 'js/main.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(APP).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== APP && k !== MEDIA).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // 구글 폰트·동기화 주소는 그대로
  const media = /\/(samples|vendor|icons)\//.test(url.pathname);
  if (media) {
    e.respondWith(caches.open(MEDIA).then(c => c.match(req).then(hit => hit || caches.match(req)).then(hit => hit || fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }))));
    return;
  }
  e.respondWith(fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(APP).then(c => c.put(req, cp)); } return r; })
    .catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('index.html'))));
});
