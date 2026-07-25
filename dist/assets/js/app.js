/**
 * SRIJANDEV UNIFIED ENTERPRISE ENGINE (Unolo + Techpurple Hybrid)
 * Production-Ready Clean SPA Engine
 */

const API_BASE_URL = "https://srijandev-backend.onrender.com";

// Application State Management
const appState = {
  currentUser: null,
  activeTab: 'dashboard',
  isChatbotOpen: false
};

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => console.log('[SrijanDev PWA] Service Worker registered:', reg.scope))
      .catch((err) => console.warn('[SrijanDev PWA] Service Worker registration failed:', err));
  });
}

// Initialize Application Engine
document.addEventListener("DOMContentLoaded", () => {
  initEngine();
});

function initEngine() {
  checkSession();
  bindGlobalListeners();
  renderSidebar();
  initClock();
  initRouter();
  initSidebarToggle();
  initModals();
  initDutyPunch();
}

// 1. DYNAMIC SESSION & AUTH VERIFICATION
async function checkSession() {
  const token = localStorage.getItem("token");
  const userDataStr = localStorage.getItem("user") || localStorage.getItem("srijandev_user");

  if (userDataStr) {
    try {
      appState.currentUser = JSON.parse(userDataStr);
      renderUserProfile(appState.currentUser);
      renderSidebar();
    } catch (err) {}
  } else {
    if (!window.location.pathname.includes("auth") && !window.location.pathname.includes("login")) {
      window.location.href = "/auth.html";
      return;
    }
  }

  try {
    let res = await fetch('/api/user/profile').catch(() => fetch(`${API_BASE_URL}/api/user/profile`));
    const data = await res.json();
    if (data && data.user) {
      appState.currentUser = data.user;
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("srijandev_user", JSON.stringify(data.user));
      renderUserProfile(appState.currentUser);
      renderSidebar();
    }
  } catch (err) {
    console.warn('[SrijanDev Engine] Session sync notice:', err);
  }
}

function renderUserProfile(user) {
  let u = user;
  if (!u) {
    try {
      const rawUser = localStorage.getItem('user') || localStorage.getItem('srijandev_user');
      if (rawUser) u = JSON.parse(rawUser);
    } catch (e) {}
  }
  if (!u) return;

  const name = u.name || u.email || u.identifier || 'User';
  const role = (u.role || 'CLIENT').toUpperCase();
  const company = u.company || u.company_name || 'SrijanDev';
  const initials = name.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

  const widget = document.getElementById("user-profile-widget");
  if (widget) {
    widget.innerHTML = '<div class="flex items-center space-x-2">' +
        '<div class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow">' + initials + '</div>' +
        '<div class="text-left">' +
          '<div class="font-bold text-xs text-slate-900 truncate">' + name + '</div>' +
          '<div class="text-[10px] text-slate-500 font-semibold uppercase">' + role + '</div>' +
        '</div>' +
      '</div>';
  }

  const nameEl = document.getElementById('user-profile-name');
  const roleEl = document.getElementById('user-profile-role');
  const initialsEl = document.getElementById('user-avatar-initials');
  const badgeEl = document.getElementById('user-profile-badge');

  if (nameEl) nameEl.innerText = name;
  if (roleEl) roleEl.innerText = role + ' • ' + company;
  if (initialsEl) initialsEl.innerText = initials;

  const mName = document.getElementById('modal-profile-name');
  const mRole = document.getElementById('modal-profile-role');
  const mEmail = document.getElementById('modal-profile-email');
  const mCompany = document.getElementById('modal-profile-company');
  const mSysRole = document.getElementById('modal-profile-system-role');
  const mInitials = document.getElementById('modal-profile-initials');

  if (mName) mName.innerText = name;
  if (mRole) mRole.innerText = role + ' • ' + company;
  if (mEmail) mEmail.innerText = u.email || u.identifier || '';
  if (mCompany) mCompany.innerText = company;
  if (mSysRole) mSysRole.innerText = role;
  if (mInitials) mInitials.innerText = initials;

  const isOwner = (role === 'SUPERADMIN' || role === 'OWNER' || role === 'SUPER_ADMIN' || u.email === 'rajeshbhatti89@gmail.com');
  if (badgeEl) {
    if (isOwner) badgeEl.classList.remove('hidden');
    else badgeEl.classList.add('hidden');
  }
}

// 2. SIDEBAR & ROLE-BASED NAVIGATION (RBAC)
function renderSidebar() {
  const ownerNav = document.getElementById("nav-owner-portal");
  const role = (appState.currentUser?.role || '').toUpperCase();
  const email = appState.currentUser?.email || appState.currentUser?.identifier || '';
  const isOwner = (role === 'OWNER' || role === 'SUPERADMIN' || role === 'SUPER_ADMIN' || email === 'rajeshbhatti89@gmail.com');

  if (ownerNav) {
    if (isOwner) {
      ownerNav.classList.remove('hidden');
      ownerNav.style.display = 'flex';
    } else {
      ownerNav.classList.add('hidden');
      ownerNav.style.display = 'none';
    }
  }
}

function switchTab(tabName) {
  appState.activeTab = tabName;
  window.location.hash = '#' + tabName;
}

// 3. MAIN CONTENT VIEW SWITCHER & ROUTER
function initRouter() {
  function handleRoute() {
    const rawHash = window.location.hash || '#dashboard';
    const cleanHash = rawHash.replace('#', '') || 'dashboard';
    let targetId = 'view-' + cleanHash;

    const views = document.querySelectorAll('.app-view');
    let targetView = document.getElementById(targetId);

    if (!targetView) {
      targetId = 'view-dashboard';
      targetView = document.getElementById('view-dashboard');
    }

    views.forEach(view => {
      if (view === targetView) {
        view.classList.add('active');
        view.style.display = 'block';
      } else {
        view.classList.remove('active');
        view.style.display = 'none';
      }
    });

    document.querySelectorAll('.sidebar-nav-link').forEach(link => {
      const href = link.getAttribute('href');
      if (href === rawHash || (cleanHash === 'dashboard' && (href === '#dashboard' || href === '#'))) {
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

// 4. CHATBOT EVENT LISTENER FIX
function bindGlobalListeners() {
  const chatbotBtn = document.getElementById("ai-bot-toggle-btn") || document.getElementById("floating-chatbot-btn") || document.querySelector(".chat-widget-trigger");
  const chatbotCard = document.getElementById("ai-bot-card") || document.getElementById("chatbot-drawer") || document.querySelector(".chatbot-container");

  window.toggleSupportBot = function() {
    if (chatbotCard) {
      appState.isChatbotOpen = !appState.isChatbotOpen;
      chatbotCard.classList.toggle('hidden');
      chatbotCard.style.display = chatbotCard.classList.contains('hidden') ? 'none' : 'flex';
    }
  };

  if (chatbotBtn) {
    chatbotBtn.onclick = window.toggleSupportBot;
  }
}

window.sendSupportMessage = async function() {
  const input = document.getElementById('ai-bot-input');
  const messages = document.getElementById('ai-bot-messages');
  if (!input || !messages || !input.value.trim()) return;

  const userText = input.value.trim();
  input.value = '';

  messages.innerHTML += `<div class="p-2.5 bg-primary text-white rounded-xl ml-auto max-w-[80%] text-right font-medium mb-2">${userText}</div>`;
  messages.scrollTop = messages.scrollHeight;

  try {
    let res = await fetch('/api/ai-support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userText })
    }).catch(() => fetch(`${API_BASE_URL}/api/ai-support`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userText })
    }));
    const data = await res.json();
    
    messages.innerHTML += `<div class="p-3 bg-primary/10 border border-primary/20 rounded-xl text-on-surface max-w-[90%] mb-2">
      <p class="font-bold text-primary mb-1">🤖 AI Support Assistant</p>
      <p class="text-on-surface-variant text-[11px]">${data.reply || 'All services operational.'}</p>
    </div>`;
    messages.scrollTop = messages.scrollHeight;
  } catch (err) {
    messages.innerHTML += `<div class="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] mb-2">
      System Diagnostics: Render Cloud Backend Active.
    </div>`;
    messages.scrollTop = messages.scrollHeight;
  }
};

function initClock() {
  function update() {
    const clockEls = document.querySelectorAll('.live-clock');
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateString = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    clockEls.forEach(el => {
      el.innerHTML = `<span class="material-symbols-outlined text-sm mr-1">schedule</span> Live Feed: ${dateString} • ${timeString}`;
    });
  }
  update();
  setInterval(update, 1000);
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
      const targetId = btn.getAttribute('data-modal-target');
      const modal = document.getElementById(targetId);
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
        btn.innerHTML = `<span class="material-symbols-outlined text-sm mr-2" style="font-variation-settings: 'FILL' 1;">timer</span> On Duty (Active)`;
        btn.className = 'btn-punch-in bg-error text-on-error px-5 py-2 rounded-lg font-bold text-xs hover:brightness-110 active:scale-95 transition-all flex items-center shadow-sm';
        if (statusIndicator) {
          statusIndicator.innerHTML = `<span class="w-2 h-2 bg-secondary rounded-full animate-pulse"></span> Operational Status: ACTIVE DUTY`;
        }
        startDutyTimer();
      } else {
        btn.innerHTML = `<span class="material-symbols-outlined text-sm mr-2" style="font-variation-settings: 'FILL' 1;">timer</span> Punch In`;
        btn.className = 'btn-punch-in bg-secondary text-on-secondary px-5 py-2 rounded-lg font-bold text-xs hover:brightness-110 active:scale-95 transition-all flex items-center shadow-sm';
        if (statusIndicator) {
          statusIndicator.innerHTML = `<span class="w-2 h-2 bg-secondary rounded-full animate-pulse"></span> Operational Status: SYSTEM STABLE`;
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
    if (timerDisplay) timerDisplay.innerText = `${hrs}:${mins}:${secs}`;
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
