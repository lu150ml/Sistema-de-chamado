const API_URL = 'http://localhost:3000';

// Helpers
function showMessage(elementId, msg, isError = false) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = msg;
    el.style.color = isError ? 'var(--danger)' : 'var(--secondary)';
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 5000);
}

function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
}

// --- Auth Logic (index.html) ---
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    document.getElementById('toggleRegister').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('registerForm').classList.toggle('hidden');
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Login failed');

            localStorage.setItem('token', data.token);
            localStorage.setItem('role', data.role);
            localStorage.setItem('username', data.username);

            window.location.href = data.role === 'admin' ? 'admin.html' : 'dashboard.html';
        } catch (err) {
            showMessage('errorMessage', err.message, true);
        }
    });

    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('regUsername').value;
        const password = document.getElementById('regPassword').value;
        const role = document.getElementById('regRole').value;

        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, role })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);
            showMessage('regMessage', 'Conta criada! Faça login acima.');
            document.getElementById('registerForm').reset();
            document.getElementById('registerForm').classList.add('hidden');
        } catch (err) {
            showMessage('regMessage', err.message, true);
        }
    });
}

// --- Common Logic ---
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'index.html';
    });
}

// --- Formatters ---
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleString('pt-BR');
}

function getStatusBadge(status) {
    return `<span class="badge badge-${status}">${status.replace('_', ' ')}</span>`;
}


// ─── SLA Helpers ──────────────────────────────────────────────────────────────

/**
 * Calculates the duration between two ISO date strings.
 * Returns { hours, minutes, totalMinutes, label } or null.
 */
function calcSLADuration(fromDateStr, toDateStr) {
    if (!fromDateStr || !toDateStr) return null;
    const diffMs = new Date(toDateStr) - new Date(fromDateStr);
    if (diffMs < 0) return null;
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    let label = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
    return { hours, minutes, totalMinutes, label };
}

/**
 * Returns an HTML chip badge for SLA duration.
 * Green (<2h), Yellow (2–4h), Red (>4h), Gray (pending).
 */
function getSLAChip(fromDateStr, toDateStr, pendingLabel = '⏳ Aguardando') {
    const sla = calcSLADuration(fromDateStr, toDateStr);
    if (!sla) return `<span class="sla-chip none">${pendingLabel}</span>`;

    let cls = 'ok', icon = '✅';
    if (sla.totalMinutes > 240) { cls = 'over'; icon = '🔴'; }
    else if (sla.totalMinutes > 120) { cls = 'warn'; icon = '⚠️'; }

    return `<span class="sla-chip ${cls}">${icon} ${sla.label}</span>`;
}

/**
 * Builds the full HTML for the SLA timeline block shown in the edit modal.
 */
function buildSLATimeline(ticket) {
    const opened    = ticket.created_at;
    const started   = ticket.started_at;
    const responded = ticket.responded_at;

    // Step 1 — Aberto
    const step1 = `
        <div class="sla-step">
            <div class="sla-step-icon done">📋</div>
            <div class="sla-step-body">
                <div class="sla-step-label">Chamado Aberto</div>
                <div class="sla-step-date">${formatDate(opened)}</div>
            </div>
        </div>`;

    // Step 2 — Atendimento Iniciado
    const step2Icon = started ? 'active' : 'pending';
    const step2Date = started
        ? `${formatDate(started)} &nbsp;${getSLAChip(opened, started, '')}`
        : '<em style="color:var(--text-muted)">Não iniciado ainda</em>';
    const step2 = `
        <div class="sla-step">
            <div class="sla-step-icon ${step2Icon}">🔧</div>
            <div class="sla-step-body">
                <div class="sla-step-label">Atendimento Iniciado</div>
                <div class="sla-step-date">${step2Date}</div>
            </div>
        </div>`;

    // Step 3 — Respondido / Concluído
    const step3Icon = responded ? 'done' : 'pending';
    const step3Date = responded
        ? `${formatDate(responded)} &nbsp;${getSLAChip(opened, responded, '')}`
        : '<em style="color:var(--text-muted)">Não respondido ainda</em>';
    const step3 = `
        <div class="sla-step">
            <div class="sla-step-icon ${step3Icon}">✅</div>
            <div class="sla-step-body">
                <div class="sla-step-label">Chamado Respondido / Concluído</div>
                <div class="sla-step-date">${step3Date}</div>
            </div>
        </div>`;

    // Summary banners
    let summary = '';
    if (started) {
        const s = calcSLADuration(opened, started);
        summary += `<div style="margin-top:0.5rem; padding:0.5rem 0.75rem; background:#EFF6FF; border-radius:6px; font-size:0.8rem; color:#1E40AF;">
            ⏱️ <strong>Tempo até iniciar atendimento:</strong> ${s ? s.label : '—'}
        </div>`;
    }
    if (responded) {
        const s = calcSLADuration(opened, responded);
        summary += `<div style="margin-top:0.5rem; padding:0.5rem 0.75rem; background:#F0FDF4; border-radius:6px; font-size:0.8rem; color:#065F46;">
            🏁 <strong>Tempo total de resposta (SLA):</strong> ${s ? s.label : '—'}
        </div>`;
    }

    return `
        <div class="sla-timeline">
            <div class="sla-timeline-title">📊 Linha do Tempo — SLA</div>
            ${step1}${step2}${step3}
        </div>
        ${summary}`;
}

// ─── END SLA Helpers ──────────────────────────────────────────────────────────


// --- User Dashboard Logic (dashboard.html) ---
async function loadUserTickets() {
    try {
        const res = await fetch(`${API_URL}/api/tickets/my`, { headers: getAuthHeaders() });
        const text = await res.text();
        const data = res.ok ? JSON.parse(text) : null;
        if (!res.ok) {
            if (res.status === 403) {
                localStorage.clear();
                window.location.href = 'index.html';
                return;
            }
            throw new Error(data?.error || 'Failed to load tickets');
        }

        const tbody = document.getElementById('userTicketsBody');
        tbody.innerHTML = '';
        data.forEach(t => {
            const tr = document.createElement('tr');
            const slaTo = t.responded_at || t.started_at;
            tr.innerHTML = `
                <td>#${t.id}</td>
                <td><strong>${t.title}</strong></td>
                <td>${getStatusBadge(t.status)}</td>
                <td>${t.queue}</td>
                <td>${formatDate(t.created_at)}</td>
                <td class="sla-col">${getSLAChip(t.created_at, slaTo, '⏳ Aguardando')}</td>
                <td style="max-width:300px">
                    <div style="font-size:0.875rem; margin-bottom:4px"><strong>Sua desc:</strong> ${t.description}</div>
                    ${t.resolution_notes
                        ? `<div style="padding:4px; background:#F1F5F9; border-radius:4px; font-size:0.875rem; border-left:3px solid var(--secondary);"><strong>Admin:</strong> ${t.resolution_notes}</div>`
                        : '<span style="color:var(--text-muted);font-size:0.875rem;">Aguardando...</span>'}
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error(err);
    }
}

// New Ticket Modal logic
const newTicketModal = document.getElementById('newTicketModal');
if (newTicketModal) {
    document.getElementById('openNewTicketModal').addEventListener('click', () => {
        newTicketModal.classList.add('active');
    });
    document.getElementById('closeNewTicketModal').addEventListener('click', () => {
        newTicketModal.classList.remove('active');
    });

    document.getElementById('newTicketForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('ticketTitle').value;
        const description = document.getElementById('ticketDesc').value;

        try {
            const res = await fetch(`${API_URL}/api/tickets`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ title, description })
            });
            if (!res.ok) throw new Error('Failed to create ticket');

            newTicketModal.classList.remove('active');
            document.getElementById('newTicketForm').reset();
            loadUserTickets();
        } catch (err) {
            alert(err.message);
        }
    });
}


// --- Admin Dashboard Logic (admin.html) ---
let currentAdminTickets = [];

async function loadAdminTickets() {
    try {
        const res = await fetch(`${API_URL}/api/tickets`, { headers: getAuthHeaders() });
        const data = await res.json();

        if (!res.ok) {
            if (res.status === 403) {
                localStorage.clear();
                window.location.href = 'index.html';
            }
            throw new Error(data.error);
        }

        currentAdminTickets = data;
        renderAdminTickets(data);
    } catch(err) {
        console.error(err);
    }
}

function renderAdminTickets(tickets) {
    const tbody = document.getElementById('adminTicketsBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    tickets.forEach(t => {
        const tr = document.createElement('tr');
        const slaTo = t.responded_at || t.started_at;
        tr.innerHTML = `
            <td>#${t.id}</td>
            <td>${t.creator}</td>
            <td><strong>${t.title}</strong></td>
            <td>${t.queue}</td>
            <td>${getStatusBadge(t.status)}</td>
            <td class="sla-col">${getSLAChip(t.created_at, slaTo, '⏳ Pendente')}</td>
            <td>
                <button class="btn btn-secondary" style="padding:0.25rem 0.75rem; font-size:0.875rem;" onclick="openEditModal(${t.id})">Analisar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Edit Modal logic
const editTicketModal = document.getElementById('editTicketModal');
if (editTicketModal) {
    document.getElementById('closeEditTicketModal').addEventListener('click', () => {
        editTicketModal.classList.remove('active');
    });

    window.openEditModal = (id) => {
        const ticket = currentAdminTickets.find(t => t.id === id);
        if (!ticket) return;

        document.getElementById('editTicketIdSpan').textContent = ticket.id;
        document.getElementById('editTicketOriginalDesc').textContent = ticket.description;
        document.getElementById('editTicketId').value = ticket.id;
        document.getElementById('editStatus').value = ticket.status;
        document.getElementById('editQueue').value = ticket.queue;
        document.getElementById('editNotes').value = ticket.resolution_notes || '';

        // Render SLA timeline into the designated container
        const slaContainer = document.getElementById('slaTimelineContainer');
        if (slaContainer) slaContainer.innerHTML = buildSLATimeline(ticket);

        editTicketModal.classList.add('active');
    };

    document.getElementById('editTicketForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editTicketId').value;
        const status = document.getElementById('editStatus').value;
        const queue = document.getElementById('editQueue').value;
        const resolution_notes = document.getElementById('editNotes').value;

        try {
            const res = await fetch(`${API_URL}/api/tickets/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ status, queue, resolution_notes })
            });
            if (!res.ok) throw new Error('Update failed');

            editTicketModal.classList.remove('active');
            loadAdminTickets();
        } catch(err) {
            alert(err.message);
        }
    });
}

// Export BI Report
const exportBtn = document.getElementById('exportReportBtn');
if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
        try {
            const res = await fetch(`${API_URL}/api/reports/tickets`, { headers: getAuthHeaders() });
            const data = await res.json();

            if (!res.ok) throw new Error("Failed to load report");

            // Convert to CSV — now includes SLA columns
            const headers = ['ID', 'Título', 'Criador', 'Status', 'Fila', 'CriadoEm', 'IniciadoEm', 'RespondidoEm', 'SLA_InicioMin', 'SLA_RespostaMin'];
            const rows = data.map(t => {
                const slaInicio   = calcSLADuration(t.created_at, t.started_at);
                const slaResposta = calcSLADuration(t.created_at, t.responded_at);
                return [
                    t.id,
                    `"${t.title.replace(/"/g, '""')}"`,
                    `"${t.creator}"`,
                    t.status,
                    `"${t.queue}"`,
                    t.created_at,
                    t.started_at  || '',
                    t.responded_at || '',
                    slaInicio   ? slaInicio.totalMinutes   : '',
                    slaResposta ? slaResposta.totalMinutes : ''
                ];
            });

            const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url  = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `chamados_bi_${new Date().getTime()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch(err) {
            alert(err.message);
        }
    });
}
