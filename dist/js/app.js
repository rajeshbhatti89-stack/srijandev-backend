// State Management
let currentTenant = null;
let currentUser = null;
let isAdminPage = false;
let isPortalPage = false;
let isMarketingPage = false;

document.addEventListener('DOMContentLoaded', async () => {
  detectPageType();
  await checkAuthStatus();
  renderHeaderNav();
  initPageData();
});

// Detect Active Page Type
function detectPageType() {
  const path = window.location.pathname;
  const urlParams = new URLSearchParams(window.location.search);
  const tenantParam = urlParams.get('tenant');

  if (path === '/admin' || path === '/super-admin') {
    isAdminPage = true;
  } else if (tenantParam || path === '/portal') {
    isPortalPage = true;
  } else {
    isMarketingPage = true;
  }
}

// Fetch Current Auth Session
async function checkAuthStatus() {
  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const data = await res.json();
      currentUser = data.user;
      if (data.tenant) {
        currentTenant = data.tenant;
      }
    } else {
      currentUser = null;
    }
  } catch (err) {
    currentUser = null;
  }
}

// Render Universal Header Navigation & Quick Switcher
function renderHeaderNav() {
  const nav = document.getElementById('headerNav');
  if (!nav) return;

  const urlParams = new URLSearchParams(window.location.search);
  const activeTenant = urlParams.get('tenant') || '';

  nav.innerHTML = `
    <div style="display:flex; align-items:center; gap: 10px;">
      <select onchange="handleTenantSwitch(this.value)" class="form-select" style="padding:0.4rem 0.8rem; font-size:0.85rem; background: var(--bg-card);">
        <option value="" ${isMarketingPage ? 'selected' : ''}>🌐 Marketing Hub (srijandev.in)</option>
        <option value="apex" ${activeTenant === 'apex' ? 'selected' : ''}>🏢 Apex (Both Suites)</option>
        <option value="shield" ${activeTenant === 'shield' ? 'selected' : ''}>🛡️ Shield (Patrol Only)</option>
        <option value="logistics" ${activeTenant === 'logistics' ? 'selected' : ''}>🚛 Logistics (Workforce Only)</option>
        <option value="admin" ${isAdminPage ? 'selected' : ''}>🔐 Super-Admin Panel</option>
      </select>

      ${currentUser ? `
        <span style="font-size:0.85rem; color:var(--accent-cyan); font-weight:600;">👤 ${currentUser.name}</span>
        <button class="btn btn-secondary btn-sm" onclick="handleLogout()">Logout</button>
      ` : `
        <button class="btn btn-primary btn-sm" onclick="openLoginModal()">Login</button>
      `}
    </div>
  `;
}

function handleTenantSwitch(val) {
  if (val === 'admin') {
    window.location.href = '/admin';
  } else if (val === '') {
    window.location.href = '/';
  } else {
    window.location.href = `/?tenant=${val}`;
  }
}

// Initialize Active Page Specific Data
async function initPageData() {
  if (isAdminPage) {
    if (currentUser && currentUser.role === 'super_admin') {
      loadSuperAdminDashboard();
    } else {
      openLoginModal('Super-Admin Login');
    }
  } else if (isPortalPage) {
    await loadTenantPortal();
  }
}

/* ==========================================================================
   SUPER-ADMIN PANEL LOGIC (admin.html)
   ========================================================================== */

async function loadSuperAdminDashboard() {
  await Promise.all([loadLeadsList(), loadTenantsList()]);
}

async function loadLeadsList() {
  try {
    const res = await fetch('/api/admin/leads');
    if (!res.ok) return;
    const data = await res.json();
    const tbody = document.getElementById('leadsTableBody');
    if (!tbody) return;

    document.getElementById('statLeads').innerText = data.leads.length;

    tbody.innerHTML = data.leads.map(l => `
      <tr>
        <td>#${l.id}</td>
        <td><strong>${escapeHtml(l.company_name)}</strong></td>
        <td>${escapeHtml(l.full_name || l.contact_person)}</td>
        <td>${escapeHtml(l.email)}<br><small style="color:var(--text-muted);">${escapeHtml(l.phone)}</small></td>
        <td><code style="color:var(--accent-cyan);">${escapeHtml(l.preferred_subdomain || l.desired_subdomain)}.srijandev.in</code></td>
        <td><span class="badge badge-cyan">${escapeHtml(l.required_suites || 'Both Suites')}</span></td>
        <td><span class="badge ${l.status === 'provisioned' ? 'badge-emerald' : 'badge-amber'}">${l.status}</span></td>
        <td>
          ${l.status !== 'provisioned' ? `
            <button class="btn btn-emerald btn-sm" onclick="prefillProvisionFromLead(${l.id}, '${escapeJs(l.company_name)}', '${escapeJs(l.preferred_subdomain || l.desired_subdomain)}', '${escapeJs(l.email)}', '${escapeJs(l.full_name || l.contact_person)}')">
              ⚡ Provision
            </button>
          ` : '<span style="color:var(--text-muted);">Provisioned</span>'}
        </td>
      </tr>
    `).join('');
  } catch (e) {
    console.error('Error loading leads:', e);
  }
}

async function loadTenantsList() {
  try {
    const res = await fetch('/api/admin/tenants');
    if (!res.ok) return;
    const data = await res.json();
    const tbody = document.getElementById('tenantsTableBody');
    if (!tbody) return;

    document.getElementById('statTenants').innerText = data.tenants.length;

    tbody.innerHTML = data.tenants.map(t => {
      const suites = [];
      if (t.enable_workforce) suites.push('<span class="badge badge-cyan">Smart Field Workforce</span>');
      if (t.enable_patrol) suites.push('<span class="badge badge-indigo" style="background:rgba(99,102,241,0.15); color:var(--accent-indigo);">Security & Patrol</span>');
      
      const isSuspended = t.status === 'suspended';
      const statusBadge = isSuspended
        ? '<span class="badge badge-rose">suspended</span>'
        : '<span class="badge badge-emerald">active</span>';

      const toggleAction = isSuspended
        ? `<button class="btn btn-emerald btn-sm" onclick="handleToggleTenantStatus(${t.id}, 'active')">Enable</button>`
        : `<button class="btn btn-secondary btn-sm" style="color:var(--accent-amber);" onclick="handleToggleTenantStatus(${t.id}, 'suspended')">Disable</button>`;

      return `
        <tr>
          <td>#${t.id}</td>
          <td><strong>${escapeHtml(t.name)}</strong></td>
          <td><a href="/?tenant=${t.subdomain}" target="_blank" style="font-weight:bold;">${escapeHtml(t.subdomain)}.srijandev.in</a></td>
          <td>${escapeHtml(t.contact_email)}</td>
          <td><div style="display:flex; gap:6px; flex-wrap:wrap;">${suites.join('')}</div></td>
          <td>${statusBadge}</td>
          <td>
            <div style="display:flex; gap:6px;">
              ${toggleAction}
              <button class="btn btn-secondary btn-sm" style="color:var(--accent-rose);" onclick="handleDeleteTenant(${t.id}, '${escapeJs(t.name)}')">🗑️ Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (e) {
    console.error('Error loading tenants:', e);
  }
}

async function handleToggleTenantStatus(tenantId, newStatus) {
  try {
    const res = await fetch(`/api/admin/tenants/${tenantId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (res.ok) {
      showAlert(data.message, 'success');
      loadTenantsList();
    } else {
      showAlert(data.message || data.error, 'error');
    }
  } catch (e) {
    showAlert('Failed to update tenant status.', 'error');
  }
}

async function handleDeleteTenant(tenantId, tenantName) {
  if (!confirm(`Are you sure you want to permanently delete '${tenantName}' and all associated user data? This action cannot be undone.`)) {
    return;
  }
  try {
    const res = await fetch(`/api/admin/tenants/${tenantId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (res.ok) {
      showAlert(data.message, 'success');
      loadTenantsList();
    } else {
      showAlert(data.message || data.error, 'error');
    }
  } catch (e) {
    showAlert('Failed to delete tenant.', 'error');
  }
}

function prefillProvisionFromLead(leadId, company, subdomain, email, adminName) {
  switchAdminTab('provision');
  document.getElementById('provLeadId').value = leadId;
  document.getElementById('provName').value = company;
  document.getElementById('provSubdomain').value = subdomain;
  document.getElementById('provEmail').value = email;
  document.getElementById('provAdminName').value = adminName;
  showAlert('Lead loaded into Provisioner Form.', 'success');
}

function switchAdminTab(tabName) {
  document.querySelectorAll('.tabs-container .tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

  if (tabName === 'provision') {
    document.getElementById('adminTabProvision').classList.add('active');
    document.getElementById('tabBtnProvision').classList.add('active');
  } else if (tabName === 'leads') {
    document.getElementById('adminTabLeads').classList.add('active');
    document.getElementById('tabBtnLeads').classList.add('active');
    loadLeadsList();
  } else if (tabName === 'tenants') {
    document.getElementById('adminTabTenants').classList.add('active');
    document.getElementById('tabBtnTenants').classList.add('active');
    loadTenantsList();
  }
}

async function handleProvisionTenant(e) {
  e.preventDefault();
  const payload = {
    lead_id: document.getElementById('provLeadId').value || null,
    name: document.getElementById('provName').value,
    subdomain: document.getElementById('provSubdomain').value,
    contact_email: document.getElementById('provEmail').value,
    admin_name: document.getElementById('provAdminName').value,
    admin_password: document.getElementById('provPassword').value || 'WelcomeSrijan123!',
    enable_workforce: document.getElementById('provEnableWorkforce').checked,
    enable_patrol: document.getElementById('provEnablePatrol').checked
  };

  try {
    const res = await fetch('/api/admin/provision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok) {
      showAlert(`Client Portal '${payload.name}' provisioned! Verification Link: ${data.verificationUrl}`, 'success');
      document.getElementById('provisionForm').reset();
      loadSuperAdminDashboard();
    } else {
      showAlert(data.message || data.error, 'error');
    }
  } catch (err) {
    showAlert('Failed to provision client portal.', 'error');
  }
}

/* ==========================================================================
   DYNAMIC CLIENT TENANT PORTAL LOGIC (portal.html)
   ========================================================================== */

async function loadTenantPortal() {
  try {
    const res = await fetch('/api/tenant/info');
    if (!res.ok) {
      const err = await res.json();
      showAlert(err.message || 'Tenant access error', 'error');
      return;
    }
    const data = await res.json();
    currentTenant = data.tenant;

    document.getElementById('portalHeaderTitle').innerText = `${currentTenant.name}`;
    document.getElementById('tenantTitle').innerText = currentTenant.name;
    document.getElementById('tenantSubdomainBadge').innerText = `${currentTenant.subdomain}.srijandev.in`;

    const badgesContainer = document.getElementById('tenantSuitesBadges');
    const tabsContainer = document.getElementById('clientTabsContainer');
    badgesContainer.innerHTML = '';
    tabsContainer.innerHTML = '';

    let firstActiveTab = null;

    if (currentTenant.enable_workforce) {
      badgesContainer.innerHTML += `<span class="badge badge-cyan">Smart Field Workforce</span>`;
      tabsContainer.innerHTML += `<button class="tab-btn active" id="tabBtnWorkforce" onclick="switchClientTab('workforce')">📍 Smart Field Workforce Suite</button>`;
      firstActiveTab = 'workforce';
    }

    if (currentTenant.enable_patrol) {
      badgesContainer.innerHTML += `<span class="badge badge-indigo" style="background:rgba(99,102,241,0.15); color:var(--accent-indigo);">Security & Patrol</span>`;
      tabsContainer.innerHTML += `<button class="tab-btn ${!firstActiveTab ? 'active' : ''}" id="tabBtnPatrol" onclick="switchClientTab('patrol')">🛡️ Security & Patrol Operations</button>`;
      if (!firstActiveTab) firstActiveTab = 'patrol';
    }

    if (firstActiveTab) {
      switchClientTab(firstActiveTab);
    }
  } catch (err) {
    console.error('Failed to load tenant portal info:', err);
  }
}

function switchClientTab(tabName) {
  document.querySelectorAll('#clientTabsContainer .tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('#tenantPortalView .tab-content').forEach(c => c.classList.remove('active'));

  if (tabName === 'workforce') {
    const btn = document.getElementById('tabBtnWorkforce');
    if (btn) btn.classList.add('active');
    document.getElementById('clientTabWorkforce').classList.add('active');
    loadWorkforceData();
  } else if (tabName === 'patrol') {
    const btn = document.getElementById('tabBtnPatrol');
    if (btn) btn.classList.add('active');
    document.getElementById('clientTabPatrol').classList.add('active');
    loadPatrolData();
  }
}

// Workforce Suite API Handlers
async function loadWorkforceData() {
  try {
    const [attRes, leaveRes] = await Promise.all([
      fetch('/api/tenant/attendance'),
      fetch('/api/tenant/leaves')
    ]);

    if (attRes.ok) {
      const attData = await attRes.json();
      document.getElementById('attendanceTableBody').innerHTML = attData.attendance.map(a => `
        <tr>
          <td><strong>${escapeHtml(a.user_name)}</strong></td>
          <td><span class="badge ${a.type === 'clock_in' ? 'badge-emerald' : 'badge-amber'}">${a.type.replace('_', ' ').toUpperCase()}</span></td>
          <td><code>${a.latitude ? a.latitude.toFixed(4) : 28.6139}, ${a.longitude ? a.longitude.toFixed(4) : 77.2090}</code></td>
          <td>${escapeHtml(a.location_name || 'Main Gate Location')}</td>
          <td>${new Date(a.timestamp).toLocaleString()}</td>
        </tr>
      `).join('');
    }

    if (leaveRes.ok) {
      const leaveData = await leaveRes.json();
      document.getElementById('leavesTableBody').innerHTML = leaveData.leaves.map(l => `
        <tr>
          <td><strong>${escapeHtml(l.user_name)}</strong></td>
          <td><span class="badge badge-cyan">${l.leave_type.toUpperCase()}</span></td>
          <td>${l.start_date} to ${l.end_date}</td>
          <td>${escapeHtml(l.reason || 'N/A')}</td>
          <td><span class="badge badge-emerald">${l.status}</span></td>
        </tr>
      `).join('');
    }
  } catch (e) {
    console.error('Error loading workforce data:', e);
  }
}

async function handleClockAttendance(type) {
  if (!currentUser) {
    openLoginModal();
    return;
  }
  try {
    const res = await fetch('/api/tenant/attendance/clock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, latitude: 28.6139, longitude: 77.2090, location_name: 'Field Operation HQ' })
    });
    const data = await res.json();
    if (res.ok) {
      document.getElementById('clockStatusMsg').innerHTML = `<span style="color:var(--accent-emerald);">Recorded ${type.replace('_', ' ')} at ${new Date().toLocaleTimeString()}</span>`;
      loadWorkforceData();
    } else {
      showAlert(data.message || data.error, 'error');
    }
  } catch (e) {
    showAlert('Clocking failed.', 'error');
  }
}

async function handleLeaveSubmit(e) {
  e.preventDefault();
  if (!currentUser) {
    openLoginModal();
    return;
  }
  const payload = {
    leave_type: document.getElementById('leaveType').value,
    start_date: document.getElementById('leaveStart').value,
    end_date: document.getElementById('leaveEnd').value,
    reason: 'Operational Leave'
  };

  try {
    const res = await fetch('/api/tenant/leaves', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      showAlert('Leave request submitted!', 'success');
      loadWorkforceData();
    } else {
      const data = await res.json();
      showAlert(data.message || data.error, 'error');
    }
  } catch (e) {
    showAlert('Failed to submit leave.', 'error');
  }
}

// Patrol Operations Suite API Handlers
async function loadPatrolData() {
  try {
    const [cpRes, scanRes, incRes] = await Promise.all([
      fetch('/api/tenant/checkpoints'),
      fetch('/api/tenant/scans'),
      fetch('/api/tenant/incidents')
    ]);

    if (cpRes.ok) {
      const cpData = await cpRes.json();
      const select = document.getElementById('scanCheckpointSelect');
      select.innerHTML = cpData.checkpoints.map(c => `<option value="${c.id}">${escapeHtml(c.name)} (${c.qr_code_data})</option>`).join('');

      document.getElementById('checkpointsTableBody').innerHTML = cpData.checkpoints.map(c => `
        <tr>
          <td><strong>${escapeHtml(c.name)}</strong></td>
          <td><code style="color:var(--accent-cyan);">${escapeHtml(c.qr_code_data)}</code></td>
          <td>${escapeHtml(c.location_description || 'Building Perimeter')}</td>
        </tr>
      `).join('');
    }

    if (scanRes.ok) {
      const scanData = await scanRes.json();
      document.getElementById('scansTableBody').innerHTML = scanData.scans.map(s => `
        <tr>
          <td><strong>${escapeHtml(s.guard_name)}</strong></td>
          <td>${escapeHtml(s.checkpoint_name)}</td>
          <td>${escapeHtml(s.notes)}</td>
          <td>${new Date(s.timestamp).toLocaleTimeString()}</td>
        </tr>
      `).join('');
    }

    if (incRes.ok) {
      const incData = await incRes.json();
      document.getElementById('incidentsTableBody').innerHTML = incData.incidents.map(i => `
        <tr>
          <td><strong>${escapeHtml(i.title)}</strong></td>
          <td>${escapeHtml(i.description)}</td>
          <td>${escapeHtml(i.reporter_name)}</td>
          <td><span class="badge ${i.severity === 'critical' ? 'badge-rose' : 'badge-amber'}">${i.severity.toUpperCase()}</span></td>
          <td><span class="badge badge-cyan">${i.status}</span></td>
          <td>${new Date(i.timestamp).toLocaleString()}</td>
        </tr>
      `).join('');
    }
  } catch (e) {
    console.error('Error loading patrol data:', e);
  }
}

async function handleScanSubmit() {
  if (!currentUser) {
    openLoginModal();
    return;
  }
  const cpId = document.getElementById('scanCheckpointSelect').value;
  const notes = document.getElementById('scanNotes').value;

  if (!cpId) {
    showAlert('Select a checkpoint to scan.', 'error');
    return;
  }

  try {
    const res = await fetch('/api/tenant/scans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkpoint_id: cpId, notes })
    });
    if (res.ok) {
      showAlert('QR Checkpoint Scan verified and logged!', 'success');
      loadPatrolData();
    } else {
      const data = await res.json();
      showAlert(data.message || data.error, 'error');
    }
  } catch (e) {
    showAlert('Failed to log patrol scan.', 'error');
  }
}

async function handleIncidentSubmit(e) {
  e.preventDefault();
  if (!currentUser) {
    openLoginModal();
    return;
  }
  const payload = {
    title: document.getElementById('incTitle').value,
    severity: document.getElementById('incSeverity').value,
    description: document.getElementById('incDesc').value
  };

  try {
    const res = await fetch('/api/tenant/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      showAlert('Security Incident report dispatched!', 'success');
      loadPatrolData();
    } else {
      const data = await res.json();
      showAlert(data.message || data.error, 'error');
    }
  } catch (e) {
    showAlert('Failed to log incident.', 'error');
  }
}

/* ==========================================================================
   MODAL & AUTHENTICATION HANDLERS
   ========================================================================== */

function openLeadModal(tierName = '') {
  const modal = document.getElementById('leadModal');
  if (!modal) return;
  modal.classList.add('active');
}

function closeLeadModal() {
  const modal = document.getElementById('leadModal');
  if (modal) modal.classList.remove('active');
}

async function handleLeadSubmit(e) {
  e.preventDefault();
  const payload = {
    full_name: document.getElementById('leadFullName').value,
    company_name: document.getElementById('leadCompany').value,
    email: document.getElementById('leadEmail').value,
    phone: document.getElementById('leadPhone').value,
    employee_count: document.getElementById('leadEmpCount').value,
    preferred_subdomain: document.getElementById('leadSubdomain').value,
    required_suites: document.getElementById('leadSuites').value
  };

  try {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok) {
      closeLeadModal();
      showAlert(data.message, 'success');
    } else {
      showAlert(data.message || data.error, 'error');
    }
  } catch (err) {
    showAlert('Submission error. Please check form inputs.', 'error');
  }
}

function openLoginModal(title = 'Sign In') {
  const modal = document.getElementById('loginModal');
  if (!modal) return;
  const titleEl = document.getElementById('loginModalTitle');
  if (titleEl) titleEl.innerText = title;
  modal.classList.add('active');
}

function closeLoginModal() {
  const modal = document.getElementById('loginModal');
  if (modal) modal.classList.remove('active');
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  const endpoint = isAdminPage ? '/api/admin/login' : '/api/auth/login';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (res.ok) {
      currentUser = data.user;
      closeLoginModal();
      showAlert(`Welcome back, ${currentUser.name}!`, 'success');
      window.location.reload();
    } else {
      showAlert(data.message || data.error, 'error');
    }
  } catch (err) {
    showAlert('Login failed.', 'error');
  }
}

async function handleLogout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    await fetch('/api/admin/logout', { method: 'POST' });
  } catch (e) {}
  currentUser = null;
  currentTenant = null;
  document.cookie = "srijan_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  showAlert('Logged out successfully.', 'success');
  setTimeout(() => {
    window.location.href = isAdminPage ? '/admin' : '/';
  }, 400);
}

// Utility: Notifications & Sanitization
function showAlert(msg, type = 'info') {
  const container = document.getElementById('alertContainer');
  if (!container) return;

  const alert = document.createElement('div');
  alert.className = `alert-banner`;
  alert.style.borderColor = type === 'error' ? 'var(--accent-rose)' : 'var(--accent-emerald)';
  alert.style.background = type === 'error' ? 'rgba(244,63,94,0.15)' : 'rgba(16,185,129,0.15)';
  alert.innerHTML = `<div><strong>${type.toUpperCase()}:</strong> ${escapeHtml(msg)}</div>`;

  container.appendChild(alert);
  setTimeout(() => alert.remove(), 6000);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, match => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[match]);
}

function escapeJs(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "\\'");
}
