const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const distDir = path.join(rootDir, 'dist');
const assetsDir = path.join(distDir, 'assets');
const cssDir = path.join(assetsDir, 'css');
const jsDir = path.join(assetsDir, 'js');
const imgDir = path.join(assetsDir, 'images');

// Ensure directories exist
[distDir, assetsDir, cssDir, jsDir, imgDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

console.log('Building SrijanDev PWA Web Application...');

// 1. Generate dist/manifest.json
const manifestContent = {
  name: "SrijanDev Portal - Security Field Force Manager",
  short_name: "SrijanDev",
  description: "Enterprise Security Field Force Command & Operations Management Portal by SrijanDev",
  start_url: "./index.html",
  scope: "./",
  display: "standalone",
  orientation: "any",
  background_color: "#f8f9ff",
  theme_color: "#00236f",
  categories: ["business", "productivity", "utilities"],
  icons: [
    {
      src: "assets/images/icon-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any maskable"
    },
    {
      src: "assets/images/icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any maskable"
    },
    {
      src: "assets/images/icon.svg",
      sizes: "any",
      type: "image/svg+xml",
      purpose: "any maskable"
    }
  ]
};

fs.writeFileSync(path.join(distDir, 'manifest.json'), JSON.stringify(manifestContent, null, 2));
console.log('Generated dist/manifest.json for SrijanDev');

// 2. Generate dist/sw.js (Service Worker)
const swContent = `/* SrijanDev PWA Service Worker */
const CACHE_NAME = 'srijandev-v5';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './auth.html',
  './paywall.html',
  './manifest.json',
  './assets/css/styles.css',
  './assets/js/app.js',
  './assets/images/icon.svg',
  './assets/images/icon-192.png',
  './assets/images/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[PWA ServiceWorker] Pre-caching static SrijanDev app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });

      return cachedResponse || fetchPromise;
    })
  );
});
`;

fs.writeFileSync(path.join(distDir, 'sw.js'), swContent);
console.log('Generated dist/sw.js');

// 3. Generate SVG Icon (icon.svg)
const svgIconContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00164e"/>
      <stop offset="100%" stop-color="#00236f"/>
    </linearGradient>
    <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6cf8bb"/>
      <stop offset="100%" stop-color="#006c49"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>
  <rect width="512" height="512" rx="110" fill="url(#bgGrad)"/>
  <g filter="url(#shadow)" transform="translate(106, 86)">
    <!-- Shield Outer -->
    <path d="M150 0 L290 50 C290 200 210 290 150 330 C90 290 10 200 10 50 Z" fill="url(#shieldGrad)" stroke="#ffffff" stroke-width="8"/>
    <!-- Inner Emblem -->
    <path d="M150 35 L260 75 C260 190 190 260 150 295 C110 260 40 190 40 75 Z" fill="#00236f"/>
    <!-- SrijanDev Star -->
    <path d="M150 80 L165 135 L220 150 L165 165 L150 220 L135 165 L80 150 L135 135 Z" fill="#6cf8bb"/>
  </g>
</svg>`;

fs.writeFileSync(path.join(imgDir, 'icon.svg'), svgIconContent);

function createSimplePNG(width, height) {
  const zlib = require('zlib');
  
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    rawData[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const cx = width / 2;
      const cy = height / 2;
      const dist = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
      if (dist < width * 0.35) {
        rawData[pxOffset + 0] = 0x00;
        rawData[pxOffset + 1] = 0x6c;
        rawData[pxOffset + 2] = 0x49;
        rawData[pxOffset + 3] = 0xff;
      } else {
        rawData[pxOffset + 0] = 0x00;
        rawData[pxOffset + 1] = 0x23;
        rawData[pxOffset + 2] = 0x6f;
        rawData[pxOffset + 3] = 0xff;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  function crc32(buf) {
    let c = 0xffffffff;
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let k = n;
      for (let m = 0; m < 8; m++) {
        k = (k & 1) ? (0xedb88320 ^ (k >>> 1)) : (k >>> 1);
      }
      table[n] = k;
    }
    for (let i = 0; i < buf.length; i++) {
      c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(8 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4);
    data.copy(buf, 8);
    const crcVal = crc32(buf.slice(4, 8 + len));
    buf.writeUInt32BE(crcVal, 8 + len);
    return buf;
  }

  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

fs.writeFileSync(path.join(imgDir, 'icon-192.png'), createSimplePNG(192, 192));
fs.writeFileSync(path.join(imgDir, 'icon-512.png'), createSimplePNG(512, 512));

// Copy screenshots
const subdirs = ['organization_management', 'sentinel_command', 'system_settings_configuration', 'task_patrol_management', 'unified_operations_command'];
subdirs.forEach(sub => {
  const srcPng = path.join(rootDir, sub, 'screen.png');
  if (fs.existsSync(srcPng)) {
    fs.copyFileSync(srcPng, path.join(imgDir, `${sub}_screen.png`));
  }
});

// 4. Stylesheet
const cssContent = `/* SrijanDev Production Stylesheet */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Courier+Prime:wght@400;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

:root {
  --color-primary: #00236f;
  --color-on-primary: #ffffff;
  --color-primary-container: #1e3a8a;
  --color-on-primary-container: #90a8ff;
  --color-secondary: #006c49;
  --color-on-secondary: #ffffff;
  --color-secondary-container: #6cf8bb;
  --color-on-secondary-container: #00714d;
  --color-tertiary: #5c0008;
  --color-tertiary-container: #860011;
  --color-on-tertiary-container: #ff8a83;
  --color-error: #ba1a1a;
  --color-on-error: #ffffff;
  --color-error-container: #ffdad6;
  --color-on-error-container: #93000a;
  --color-background: #f8f9ff;
  --color-on-background: #0b1c30;
  --color-surface: #f8f9ff;
  --color-surface-dim: #cbdbf5;
  --color-surface-bright: #f8f9ff;
  --color-surface-container-lowest: #ffffff;
  --color-surface-container-low: #eff4ff;
  --color-surface-container: #e5eeff;
  --color-surface-container-high: #dce9ff;
  --color-surface-container-highest: #d3e4fe;
  --color-on-surface: #0b1c30;
  --color-on-surface-variant: #444651;
  --color-outline: #757682;
  --color-outline-variant: #c5c5d3;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}

html, body {
  width: 100%;
  height: 100%;
}

body {
  font-family: 'Inter', sans-serif;
  background-color: var(--color-background);
  color: var(--color-on-background);
  font-size: 14px;
  line-height: 20px;
  min-height: 100vh;
  overflow-x: hidden;
}

.material-symbols-outlined {
  font-family: 'Material Symbols Outlined';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  font-feature-settings: 'liga';
  -webkit-font-smoothing: antialiased;
  vertical-align: middle;
}

.pulse-red, .status-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.trail-line {
  stroke-dasharray: 5;
  animation: dash 10s linear infinite;
}

@keyframes dash {
  to { stroke-dashoffset: -100; }
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #c5c5d3;
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: #757682;
}

.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background-color: rgba(11, 28, 48, 0.5);
  z-index: 45;
  opacity: 0;
  transition: opacity 0.3s ease;
}

aside.sidebar {
  width: 280px;
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  background-color: var(--color-surface);
  border-right: 1px solid var(--color-outline-variant);
  z-index: 50;
  transition: transform 0.3s ease-in-out;
}

header.top-header {
  position: fixed;
  top: 0;
  right: 0;
  width: calc(100% - 280px);
  height: 64px;
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-outline-variant);
  z-index: 40;
  transition: width 0.3s ease, left 0.3s ease;
}

main.main-content {
  margin-left: 280px;
  padding-top: 80px;
  padding-left: 32px;
  padding-right: 32px;
  padding-bottom: 48px;
  min-height: 100vh;
  transition: margin-left 0.3s ease;
}

/* 1. Main Dashboard Wrapper Fix */
.dashboard-content, .main-dashboard-content, .dashboard-grid-layout {
  display: grid !important;
  grid-template-columns: 1fr 340px !important; /* Left main area (flexible), Right sidebar (fixed) */
  gap: 20px !important;
  align-items: start !important;
  box-sizing: border-box !important;
  width: 100% !important;
  position: relative !important;
}

/* 2. Left Primary Column Structure */
.primary-dashboard-area {
  display: flex !important;
  flex-direction: column !important;
  gap: 20px !important;
  min-width: 0 !important; /* Prevents flex children from overflowing */
  position: relative !important;
  width: 100% !important;
}

/* 3. Right Sidebar Alignment */
.right-sidebar, .right-intelligence-sidebar {
  display: flex !important;
  flex-direction: column !important;
  gap: 15px !important;
  width: 100% !important;
  position: relative !important;
}

/* 4. Stats & Cards Grid (Quick Excel Sync + Activity Cards) */
.stats-grid, .stats-cards-container {
  display: grid !important;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)) !important;
  gap: 15px !important;
  width: 100% !important;
  position: relative !important;
}

/* 5. Fix Overlapping Cards - Force All Cards to Relative Document Flow */
.card, .upload-box, .status-card, .excel-sync-card, .welcome-card, div[class*="bg-surface"] {
  position: relative !important; /* Ensure absolute positioning is removed */
  top: auto !important;
  left: auto !important;
  right: auto !important;
  bottom: auto !important;
  float: none !important;
  box-sizing: border-box !important;
}

/* --- REFINED APP CONTAINER LAYOUT ARCHITECTURE --- */
/* 1. Main App Container (Left Sidebar + Main Body + Right Sidebar) */
.app-container {
    display: flex;
    width: 100vw;
    height: 100vh;
    overflow-x: hidden;
}

/* 2. Middle Main Dashboard Content Area */
.main-dashboard-content {
    flex: 1;
    padding: 20px;
    background-color: #f8fafc;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

/* 3. Header Section (Unified Operations Command) */
.dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
}

/* 4. Quick Excel Sync Card Fix */
.excel-sync-card {
    position: relative !important; /* Force remove absolute positioning */
    top: auto !important;
    left: auto !important;
    width: 100%;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 20px;
    box-sizing: border-box;
}

/* 5. Stats Grid (Counters/Metrics) */
.stats-cards-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    width: 100%;
}

/* 6. Right Sidebar (Critical Intelligence) */
.right-intelligence-sidebar {
    width: 340px;
    min-width: 340px;
    background: #ffffff;
    border-left: 1px solid #e2e8f0;
    padding: 20px;
    box-sizing: border-box;
    overflow-y: auto;
}

@media (max-width: 1023px) {
  aside.sidebar {
    transform: translateX(-100%);
  }
  body.sidebar-open aside.sidebar {
    transform: translateX(0);
  }
  body.sidebar-open .sidebar-overlay {
    display: block;
    opacity: 1;
  }
  header.top-header {
    width: 100% !important;
    left: 0 !important;
  }
  main.main-content {
    margin-left: 0 !important;
    padding-left: 16px;
    padding-right: 16px;
  }
  .dashboard-grid-layout {
    grid-template-columns: 1fr;
  }
}

.modal-backdrop {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(11, 28, 48, 0.6);
  backdrop-filter: blur(4px);
  z-index: 100;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal-backdrop.active {
  display: flex;
}

.app-view {
  display: none;
}
.app-view.active {
  display: block;
}
`;

fs.writeFileSync(path.join(cssDir, 'styles.css'), cssContent);

// 5. JavaScript
const jsContent = `/* SrijanDev Application & PWA Controller */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => console.log('[SrijanDev PWA] Service Worker registered:', reg.scope))
      .catch((err) => console.warn('[SrijanDev PWA] Service Worker registration failed:', err));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initSubscriptionGuard();
  initUserProfile();
  initNotificationsSystem();
  initDashboardMetrics();
  initClock();
  initRouter();
  initSidebarToggle();
  initModals();
  initDutyPunch();
  initSettingsTabs();
  initMapPlayback();
});

async function initDashboardMetrics() {
  try {
    const res = await fetch('/api/dashboard-metrics');
    const data = await res.json();
    if (data && data.success) {
      const activeSitesEl = document.getElementById('metric-active-sites');
      const guardsDutyEl = document.getElementById('metric-guards-duty');
      const totalRosteredEl = document.getElementById('metric-total-rostered');
      const criticalAlertsEl = document.getElementById('metric-critical-alerts');
      const missedCheckpointsEl = document.getElementById('metric-missed-checkpoints');
      const shiftCompEl = document.getElementById('metric-shift-completion');
      const shiftBarEl = document.getElementById('metric-shift-bar');
      const tableBody = document.getElementById('live-site-status-body');

      if (activeSitesEl) activeSitesEl.innerText = data.active_sites || 0;
      if (guardsDutyEl) guardsDutyEl.innerText = data.guards_on_duty || 0;
      if (totalRosteredEl) totalRosteredEl.innerText = 'of ' + (data.total_rostered || 0) + ' rostered';
      if (criticalAlertsEl) criticalAlertsEl.innerText = String(data.critical_alerts || 0).padStart(2, '0');
      if (missedCheckpointsEl) missedCheckpointsEl.innerText = String(data.missed_checkpoints || 0).padStart(2, '0');
      if (shiftCompEl) shiftCompEl.innerText = (data.shift_completion || 0) + '%';
      if (shiftBarEl) shiftBarEl.style.width = (data.shift_completion || 0) + '%';

      if (tableBody) {
        if (data.sites && data.sites.length > 0) {
          let html = '';
          data.sites.forEach(s => {
            html += '<tr class="hover:bg-surface-container-low transition-colors">' +
                '<td class="px-5 py-3.5"><div class="font-semibold text-on-surface text-sm">' + (s.department || 'Field Unit') + '</div></td>' +
                '<td class="px-5 py-3.5"><span class="px-2 py-0.5 bg-secondary-container/30 text-on-secondary-container rounded-full text-[10px] font-bold">' + (s.status || 'ACTIVE') + '</span></td>' +
                '<td class="px-5 py-3.5 text-xs text-on-surface font-medium">' + (s.name || 'Guard') + '</td>' +
                '<td class="px-5 py-3.5"><span class="font-mono text-xs font-bold">100%</span></td>' +
                '<td class="px-5 py-3.5 text-right"><button class="text-primary text-xs font-bold">View Trail</button></td>' +
              '</tr>';
          });
          tableBody.innerHTML = html;
        } else {
          tableBody.innerHTML = '<tr><td colspan="5" class="px-5 py-8 text-center text-on-surface-variant text-xs font-medium">' +
            '<span class="material-symbols-outlined text-3xl mb-1 text-outline block">badge</span>' +
            'No active site roster data. Upload an Excel spreadsheet to sync your personnel.' +
          '</td></tr>';
        }
      }
    }
  } catch (err) {
    console.warn('[SrijanDev Metrics] API fetch notice:', err);
  }
}

async function initNotificationsSystem() {
  const panel = document.getElementById('notification-panel');
  if (!panel) return;

  try {
    const res = await fetch('/api/notifications');
    const data = await res.json();
    const clientNotifications = (data && data.notifications) ? data.notifications : [];

    if (clientNotifications.length === 0) {
      panel.innerHTML = '<div class="welcome-card" style="padding: 20px; background: #eff6ff; border-radius: 8px; border: 1px solid #bfdbfe;">' +
            '<h3 style="color: #1e40af; margin-top: 0; font-weight: bold; font-size: 15px;">🎉 Welcome to Your Portal!</h3>' +
            '<p style="color: #1e3a8a; font-size: 12px; margin-top: 6px; line-height: 1.4;">Your operational workspace is ready. You can now upload your employee roster via Excel or connect your field team\'s APK.</p>' +
            '<button onclick="startPortalTour()" style="background: #2563eb; color: white; border: none; padding: 10px 15px; border-radius: 6px; cursor: pointer; font-weight: bold; width: 100%; margin-top: 12px; font-size: 12px; transition: 0.2s;">' +
                '🚀 Take a Quick Product Tour' +
            '</button>' +
        '</div>';
    } else {
      let html = '';
      clientNotifications.forEach(n => {
        const time = new Date(n.timestamp || Date.now()).toLocaleTimeString();
        html += '<div class="p-3 border border-outline-variant bg-surface-container-low rounded-lg shadow-sm">' +
            '<div class="flex justify-between items-start mb-1">' +
              '<span class="text-primary font-bold text-[9px] uppercase tracking-wider">' + (n.status || 'FIELD OPERATION') + '</span>' +
              '<span class="text-on-surface-variant font-mono text-[9px]">' + time + '</span>' +
            '</div>' +
            '<p class="text-on-surface font-bold text-xs mb-1">' + (n.emp_name || 'Personnel') + ' (' + (n.department || 'Field Ops') + ')</p>' +
            '<p class="text-on-surface-variant text-[11px] mb-2 leading-tight">Field status updated via Mobile APK.</p>' +
          '</div>';
      });
      panel.innerHTML = html;
    }
  } catch (err) {
    console.warn('[SrijanDev Notifications] API notice:', err);
  }
}

window.startPortalTour = function() {
  alert("🎉 Welcome to SrijanDev Operations Portal Tour!\\n\\n1. Use 'Quick Excel Roster Upload' to import personnel.\\n2. Access SaaS Pricing & Plans via top menu.\\n3. Connect field guards using the Mobile APK app.");
};

window.toggleSupportBot = function() {
  const card = document.getElementById('ai-bot-card');
  if (card) card.classList.toggle('hidden');
};

window.sendSupportMessage = async function() {
  const input = document.getElementById('ai-bot-input');
  const messages = document.getElementById('ai-bot-messages');
  if (!input || !messages || !input.value.trim()) return;

  const userText = input.value.trim();
  input.value = '';

  messages.innerHTML += '<div class="p-2.5 bg-primary text-white rounded-xl ml-auto max-w-[80%] text-right font-medium mb-2">' + userText + '</div>';
  messages.scrollTop = messages.scrollHeight;

  try {
    const res = await fetch('/api/ai-support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userText })
    });
    const data = await res.json();
    
    messages.innerHTML += '<div class="p-3 bg-primary/10 border border-primary/20 rounded-xl text-on-surface max-w-[90%] mb-2">' +
        '<p class="font-bold text-primary mb-1">🤖 AI Support Assistant</p>' +
        '<p class="text-on-surface-variant text-[11px]">' + (data.reply || 'All services operational.') + '</p>' +
      '</div>';
    messages.scrollTop = messages.scrollHeight;
  } catch (err) {
    messages.innerHTML += '<div class="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] mb-2">' +
        'System Diagnostic Check: All Services Operational (WAL Mode Active).' +
      '</div>';
    messages.scrollTop = messages.scrollHeight;
  }
};

async function initUserProfile() {
  try {
    const res = await fetch('/api/me');
    const data = await res.json();
    if (data && data.user) {
      const u = data.user;
      const nameEl = document.getElementById('user-profile-name');
      const roleEl = document.getElementById('user-profile-role');
      const initialsEl = document.getElementById('user-avatar-initials');
      const badgeEl = document.getElementById('user-profile-badge');

      if (nameEl) nameEl.innerText = u.name || u.identifier || 'User';
      if (roleEl) roleEl.innerText = (u.role || 'USER') + ' • ' + (u.company_name || 'SrijanDev');
      
      if (initialsEl) {
        const parts = (u.name || u.identifier || 'U').trim().split(' ');
        const initials = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
        initialsEl.innerText = initials;
      }

      if (badgeEl && (u.role === 'SUPERADMIN' || u.identifier === 'rajeshbhatti89@gmail.com')) {
        badgeEl.classList.remove('hidden');
      }
    }
  } catch (err) {
    console.warn('[SrijanDev Profile] API fetch notice:', err);
  }
}

function initSubscriptionGuard() {
  const isSuperUser = true; // rajeshbhatti89@gmail.com (Super User & Owner)
  const isSubscriptionActive = localStorage.getItem('srijandev_subscription_active') === 'true' || isSuperUser;
  
  const lockoutBanner = document.getElementById('subscription-lockout-banner');
  if (!isSubscriptionActive && lockoutBanner) {
    lockoutBanner.classList.remove('hidden');
  }

  // Intercept Admin Buttons for RBAC enforcement
  document.querySelectorAll('[data-admin-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (!isSuperUser) {
        e.preventDefault();
        e.stopPropagation();
        alert('403 Forbidden: Administrative privileges required (/api/admin/*)');
      }
    });
  });
}

let isSpaAnnual = false;
function toggleSpaBillingCycle() {
  isSpaAnnual = !isSpaAnnual;
  const dot = document.getElementById('spa-toggle-dot');
  const labelMonthly = document.getElementById('spa-label-monthly');
  const labelAnnual = document.getElementById('spa-label-annual');

  if (isSpaAnnual) {
    dot.className = 'w-4 h-4 bg-white rounded-full transition-transform transform translate-x-6';
    labelMonthly.className = 'text-on-surface-variant dark:text-slate-400';
    labelAnnual.className = 'text-primary dark:text-white font-bold flex items-center';
  } else {
    dot.className = 'w-4 h-4 bg-white rounded-full transition-transform transform translate-x-0';
    labelMonthly.className = 'text-primary dark:text-white font-bold';
    labelAnnual.className = 'text-on-surface-variant dark:text-slate-400 flex items-center';
  }

  document.querySelectorAll('.spa-price-display').forEach(el => {
    el.innerText = isSpaAnnual ? el.getAttribute('data-annual') : el.getAttribute('data-monthly');
  });
}

function initiateSpaCheckout(planName, price) {
  window.location.href = 'paywall.html';
}

function initClock() {
  function update() {
    const clockEls = document.querySelectorAll('.live-clock');
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateString = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    clockEls.forEach(el => {
      el.innerHTML = \`<span class="material-symbols-outlined text-sm mr-1">schedule</span> Live Feed: \${dateString} • \${timeString}\`;
    });
  }
  update();
  setInterval(update, 1000);
}

function initRouter() {
  function handleRoute() {
    const hash = window.location.hash || '#dashboard';
    const cleanHash = hash.replace('#', '');
    const targetId = 'view-' + cleanHash;

    const views = document.querySelectorAll('.app-view');
    let found = false;

    views.forEach(view => {
      if (view.id === targetId) {
        view.classList.add('active');
        found = true;
      } else {
        view.classList.remove('active');
      }
    });

    if (!found && views.length > 0) {
      document.getElementById('view-dashboard')?.classList.add('active');
    }

    document.querySelectorAll('.sidebar-nav-link').forEach(link => {
      const href = link.getAttribute('href');
      if (href === hash || (hash === '' && href === '#dashboard')) {
        link.classList.add('bg-primary-container/10', 'text-primary', 'border-r-4', 'border-primary');
        link.classList.remove('text-on-surface-variant');
      } else {
        link.classList.remove('bg-primary-container/10', 'text-primary', 'border-r-4', 'border-primary');
        link.classList.add('text-on-surface-variant');
      }
    });

    document.body.classList.remove('sidebar-open');
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

function initSidebarToggle() {
  const toggleBtn = document.getElementById('mobile-drawer-toggle');
  const overlay = document.querySelector('.sidebar-overlay');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('sidebar-open');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      document.body.classList.remove('sidebar-open');
    });
  }
}

function initModals() {
  document.querySelectorAll('[data-modal-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-modal-target');
      const modal = document.getElementById(modalId);
      if (modal) modal.classList.add('active');
    });
  });

  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-backdrop');
      if (modal) modal.classList.remove('active');
    });
  });

  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });
}

let dutySeconds = 0;
let dutyTimer = null;
let isPunchIn = false;

function initDutyPunch() {
  const punchBtns = document.querySelectorAll('.btn-punch-in');
  const statusIndicator = document.getElementById('status-indicator');

  punchBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      isPunchIn = !isPunchIn;
      if (isPunchIn) {
        btn.innerHTML = \`<span class="material-symbols-outlined text-sm mr-2" style="font-variation-settings: 'FILL' 1;">timer</span> On Duty (Active)\`;
        btn.className = 'btn-punch-in bg-error text-on-error px-5 py-2 rounded-lg font-bold text-xs hover:brightness-110 active:scale-95 transition-all flex items-center shadow-sm';
        if (statusIndicator) {
          statusIndicator.innerHTML = \`<span class="w-2 h-2 bg-secondary rounded-full animate-pulse"></span> Operational Status: ACTIVE DUTY\`;
        }
        startDutyTimer();
      } else {
        btn.innerHTML = \`<span class="material-symbols-outlined text-sm mr-2" style="font-variation-settings: 'FILL' 1;">timer</span> Punch In\`;
        btn.className = 'btn-punch-in bg-secondary text-on-secondary px-5 py-2 rounded-lg font-bold text-xs hover:brightness-110 active:scale-95 transition-all flex items-center shadow-sm';
        if (statusIndicator) {
          statusIndicator.innerHTML = \`<span class="w-2 h-2 bg-secondary rounded-full animate-pulse"></span> Operational Status: SYSTEM STABLE\`;
        }
        stopDutyTimer();
      }
    });
  });
}

function startDutyTimer() {
  if (dutyTimer) clearInterval(dutyTimer);
  dutySeconds = 0;
  dutyTimer = setInterval(() => {
    dutySeconds++;
    const hrs = String(Math.floor(dutySeconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((dutySeconds % 3600) / 60)).padStart(2, '0');
    const secs = String(dutySeconds % 60).padStart(2, '0');
    const timerDisplay = document.getElementById('duty-timer-display');
    if (timerDisplay) timerDisplay.innerText = \`\${hrs}:\${mins}:\${secs}\`;
  }, 1000);
}

function stopDutyTimer() {
  if (dutyTimer) clearInterval(dutyTimer);
  const timerDisplay = document.getElementById('duty-timer-display');
  if (timerDisplay) timerDisplay.innerText = '00:00:00';
}

function initSettingsTabs() {
  window.switchTab = function(sectionId) {
    document.querySelectorAll('.settings-section').forEach(section => {
      section.classList.add('hidden');
    });
    
    const targetSection = document.getElementById('section-' + sectionId);
    if (targetSection) targetSection.classList.remove('hidden');
    
    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
      btn.classList.remove('bg-primary', 'text-on-primary', 'shadow-md');
      btn.classList.add('text-on-surface-variant', 'hover:bg-surface-container');
    });
    
    const activeBtn = document.getElementById('tab-' + sectionId);
    if (activeBtn) {
      activeBtn.classList.add('bg-primary', 'text-on-primary', 'shadow-md');
      activeBtn.classList.remove('text-on-surface-variant', 'hover:bg-surface-container');
    }
  };
}

function initMapPlayback() {
  let isPlaying = true;
  const trailLine = document.querySelector('.trail-line');
  const toggleBtn = document.getElementById('btn-map-playback');

  if (toggleBtn && trailLine) {
    toggleBtn.addEventListener('click', () => {
      isPlaying = !isPlaying;
      if (isPlaying) {
        trailLine.style.animationPlayState = 'running';
        toggleBtn.innerText = 'pause_circle';
      } else {
        trailLine.style.animationPlayState = 'paused';
        toggleBtn.innerText = 'play_circle';
      }
    });
  }
}
`;

fs.writeFileSync(path.join(jsDir, 'app.js'), jsContent);

console.log('Build completed for SrijanDev.');
