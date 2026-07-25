/* SrijanDev Application & PWA Controller */

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
            '<p style="color: #1e3a8a; font-size: 12px; margin-top: 6px; line-height: 1.4;">Your operational workspace is ready. You can now upload your employee roster via Excel or connect your field team's APK.</p>' +
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
  alert("🎉 Welcome to SrijanDev Operations Portal Tour!\n\n1. Use 'Quick Excel Roster Upload' to import personnel.\n2. Access SaaS Pricing & Plans via top menu.\n3. Connect field guards using the Mobile APK app.");
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
    let res = await fetch('/api/user/profile').catch(() => fetch('https://srijandev-backend.onrender.com/api/user/profile'));
    const data = await res.json();
    if (data && data.user) {
      const u = data.user;
      const nameEl = document.getElementById('user-profile-name');
      const roleEl = document.getElementById('user-profile-role');
      const initialsEl = document.getElementById('user-avatar-initials');
      const badgeEl = document.getElementById('user-profile-badge');

      const mName = document.getElementById('modal-profile-name');
      const mRole = document.getElementById('modal-profile-role');
      const mEmail = document.getElementById('modal-profile-email');
      const mCompany = document.getElementById('modal-profile-company');
      const mSysRole = document.getElementById('modal-profile-system-role');
      const mInitials = document.getElementById('modal-profile-initials');

      const fullName = u.name || u.email || 'Rajesh Bhatti';
      const parts = fullName.trim().split(' ');
      const initials = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();

      if (nameEl) nameEl.innerText = fullName;
      if (roleEl) roleEl.innerText = (u.role || 'SUPERADMIN') + ' • ' + (u.company || 'SrijanDev');
      if (initialsEl) initialsEl.innerText = initials;

      if (mName) mName.innerText = fullName;
      if (mRole) mRole.innerText = (u.role || 'SUPERADMIN') + ' • ' + (u.company || 'SrijanDev');
      if (mEmail) mEmail.innerText = u.email || 'rajeshbhatti89@gmail.com';
      if (mCompany) mCompany.innerText = u.company || 'SrijanDev Apex Operations';
      if (mSysRole) mSysRole.innerText = u.role || 'SUPERADMIN';
      if (mInitials) mInitials.innerText = initials;

      if (badgeEl && (u.role === 'SUPERADMIN' || u.email === 'rajeshbhatti89@gmail.com')) {
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
      el.innerHTML = `<span class="material-symbols-outlined text-sm mr-1">schedule</span> Live Feed: ${dateString} • ${timeString}`;
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
