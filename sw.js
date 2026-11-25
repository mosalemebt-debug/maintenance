/* Service Worker – برنامج الصيانة (تشغيل بدون إنترنت) */
const V = 'maint-v20';
const FB = 'https://www.gstatic.com/firebasejs/10.12.2/';
const PRE = [
  './', 'index.html', 'style.css', 'firebase-config.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png',
  'js/firebase-layer.js', 'js/core.js', 'js/app.js', 'js/round.js', 'js/notices.js', 'js/purchases.js', 'js/reports.js', 'js/edit.js', 'js/daily-report.js', 'js/sla.js', 'js/backup.js', 'js/pr-form.js', 'js/inbox.js', 'js/audit.js', 'js/assets-base.js', 'js/assets-locations.js', 'js/assets-dashboard.js', 'js/assets-ops.js', 'js/assets-registry.js', 'js/xlsx-template.js', 'js/assets-import.js', 'js/assets-ac.js', 'js/assets-matrix.js', 'js/stock.js', 'js/print.js', 'js/jobsheets.js', 'js/inputs.js', 'js/sync.js', 'js/boot.js',
  FB + 'firebase-app.js', FB + 'firebase-firestore.js', FB + 'firebase-auth.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(V)
      .then(c => Promise.allSettled(PRE.map(u => c.add(new Request(u, { cache: 'reload' })))))
      .then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  const same = u.origin === location.origin;
  const cdn = (u.hostname === 'www.gstatic.com' && u.pathname.startsWith('/firebasejs/')) || u.hostname === 'cdnjs.cloudflare.com';
  if (!same && !cdn) return;               // لا نتدخل في طلبات Firestore / Auth
  if (same) {
    // ملفات الموقع: الشبكة أولاً (عشان التحديثات)، ولو مفيش إنترنت نرجع للنسخة المحفوظة
    e.respondWith(
      Promise.race([fetch(r), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 3000))])
        .then(res => { if (res && res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; })
        .catch(() => caches.match(r, { ignoreSearch: true })
          .then(m => m || (r.mode === 'navigate' ? caches.match('index.html') : null) || new Response('', { status: 504 })))
    );
  } else {
    // مكتبات خارجية بنسخ ثابتة: المحفوظ أولاً
    e.respondWith(
      caches.match(r).then(m => m || fetch(r).then(res => {
        if (res && (res.ok || res.type === 'opaque')) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); }
        return res;
      }))
    );
  }
});
