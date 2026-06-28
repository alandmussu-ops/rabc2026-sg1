// ============================================================
// ADMIN.JS — Dashboard Admin PKTB RABC 2026 SG1
// ============================================================

const ALL_PARTICIPANTS = [
  { id: 1, name: 'Claudya',   city: 'Kefa' },
  { id: 2, name: 'Inggrid',   city: 'Atambua' },
  { id: 3, name: 'Frenti',    city: 'Soe' },
  { id: 4, name: 'Any',       city: 'Kupang' },
  { id: 5, name: 'Anggi',     city: 'Kupang' },
  { id: 6, name: 'Kak Mince', city: 'Waibakul' },
  { id: 7, name: 'Petra',     city: 'Sky, Kupang' },
  { id: 8, name: 'Revan',     city: 'Waikabubak' },
  { id: 9, name: 'Marsel',    city: 'Kupang' },
];

let allSheetData = [];   // data dari Google Sheet
let filteredData = [];   // hasil filter

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  loadAllData();
});

// ============================================================
// LOAD ALL DATA FROM GOOGLE SHEET
// ============================================================
async function loadAllData() {
  const loadingMsg    = document.getElementById('loadingMsg');
  const noGasMsg      = document.getElementById('noGasMsg');
  const tableContainer = document.getElementById('participantTable');

  loadingMsg.classList.remove('hidden');
  noGasMsg.classList.add('hidden');
  tableContainer.classList.add('hidden');

  if (!CONFIG.GAS_URL || CONFIG.GAS_URL === 'GANTI_DENGAN_URL_GOOGLE_APPS_SCRIPT_KAMU') {
    loadingMsg.classList.add('hidden');
    noGasMsg.classList.remove('hidden');
    renderTableOffline();
    return;
  }

  try {
    const url = `${CONFIG.GAS_URL}?action=getAllData`;
    const response = await fetch(url);
    const result = await response.json();

    allSheetData = result.success ? result.data : [];
    renderAll();
  } catch (err) {
    console.error('Load error:', err);
    allSheetData = [];
    renderAll();
  } finally {
    loadingMsg.classList.add('hidden');
    tableContainer.classList.remove('hidden');
  }
}

// ============================================================
// RENDER ALL (merge participants with sheet data)
// ============================================================
function renderAll() {
  // Merge ALL_PARTICIPANTS dengan data sheet
  const merged = ALL_PARTICIPANTS.map(p => {
    const sheetRow = allSheetData.find(r => String(r.ParticipantID) === String(p.id));
    return { ...p, sheetData: sheetRow || null };
  });

  filteredData = merged;
  updateStats(merged);
  renderTable(merged);
}

function renderTableOffline() {
  const merged = ALL_PARTICIPANTS.map(p => ({ ...p, sheetData: null }));
  filteredData = merged;
  updateStats(merged);
  renderTable(merged);
  document.getElementById('participantTable').classList.remove('hidden');
}

// ============================================================
// UPDATE STAT CARDS
// ============================================================
function updateStats(data) {
  const filled   = data.filter(p => p.sheetData).length;
  const completed = data.filter(p => {
    if (!p.sheetData) return false;
    const d = p.sheetData;
    const k1 = d['K1W1_Tindakan'] || d['K1W2_Tindakan'];
    const k2 = d['K2W1_Tindakan'] || d['K2W2_Tindakan'];
    return k1 && k2;
  }).length;

  document.getElementById('stat-total').textContent    = ALL_PARTICIPANTS.length;
  document.getElementById('stat-filled').textContent   = filled;
  document.getElementById('stat-empty').textContent    = ALL_PARTICIPANTS.length - filled;
  document.getElementById('stat-complete').textContent = completed;
}

// ============================================================
// RENDER TABLE
// ============================================================
function renderTable(data) {
  const container = document.getElementById('participantTable');

  if (data.length === 0) {
    container.innerHTML = `<div style="padding:40px;text-align:center;color:var(--gray-text);">Tidak ada peserta yang sesuai filter.</div>`;
    return;
  }

  const rows = data.map(p => {
    const d        = p.sheetData;
    const initials = p.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
    const status   = getStatusInfo(d);
    const progress = getProgressPct(d);
    const lingk    = d ? (d.Lingkungan || '-') : '-';
    const lastSave = d ? formatDate(d.Timestamp) : '-';

    return `
    <tr data-id="${p.id}" data-status="${status.key}" data-lingkungan="${lingk}">
      <td>
        <div class="name-cell">
          <div class="table-avatar">${initials}</div>
          <div class="name-info">
            <strong>${p.name}</strong>
            <span><i class="fa-solid fa-location-dot" style="font-size:0.65rem"></i> ${p.city}</span>
          </div>
        </div>
      </td>
      <td><span class="lingkungan-tag">${lingk}</span></td>
      <td>
        <div class="progress-bar-cell">
          <div class="mini-bar"><div class="mini-bar-fill" style="width:${progress}%"></div></div>
          <div class="mini-bar-text">${progress}% terisi</div>
        </div>
      </td>
      <td><span class="status-pill status-${status.key}">${status.label}</span></td>
      <td style="font-size:0.78rem;color:var(--gray-text)">${lastSave}</td>
      <td>
        <button class="btn-detail" onclick="openDetail(${p.id})">
          <i class="fa-solid fa-eye"></i> Detail
        </button>
      </td>
    </tr>`;
  }).join('');

  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Peserta</th>
          <th>Lingkungan</th>
          <th>Progress</th>
          <th>Status</th>
          <th>Terakhir Simpan</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ============================================================
// FILTER
// ============================================================
function applyFilter() {
  const statusFilter   = document.getElementById('filterStatus').value;
  const lingkFilter    = document.getElementById('filterLingkungan').value;
  const searchVal      = document.getElementById('searchInput').value.toLowerCase();

  const merged = ALL_PARTICIPANTS.map(p => {
    const sheetRow = allSheetData.find(r => String(r.ParticipantID) === String(p.id));
    return { ...p, sheetData: sheetRow || null };
  });

  const filtered = merged.filter(p => {
    const status = getStatusInfo(p.sheetData).key;
    const lingk  = p.sheetData ? (p.sheetData.Lingkungan || '') : '';

    if (statusFilter !== 'all' && status !== statusFilter) return false;
    if (lingkFilter !== 'all' && lingk !== lingkFilter) return false;
    if (searchVal && !p.name.toLowerCase().includes(searchVal)) return false;
    return true;
  });

  renderTable(filtered);
}

// ============================================================
// OPEN DETAIL MODAL
// ============================================================
function openDetail(participantId) {
  const p = ALL_PARTICIPANTS.find(x => x.id === participantId);
  const sheetRow = allSheetData.find(r => String(r.ParticipantID) === String(participantId));

  const modal   = document.getElementById('detailModal');
  const content = document.getElementById('detailContent');

  content.innerHTML = buildDetailHTML(p, sheetRow);
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeDetail() {
  document.getElementById('detailModal').classList.add('hidden');
  document.body.style.overflow = '';
}

// ============================================================
// BUILD DETAIL HTML
// ============================================================
function buildDetailHTML(p, d) {
  if (!p) return '<p>Peserta tidak ditemukan.</p>';

  const initials = p.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  const status   = getStatusInfo(d);
  const progress = getProgressPct(d);

  let html = `
    <div class="detail-participant-header">
      <div class="detail-big-avatar">${initials}</div>
      <div>
        <div class="detail-participant-name">${p.name}</div>
        <div class="detail-participant-meta">
          <i class="fa-solid fa-location-dot"></i> ${p.city} &nbsp;|&nbsp;
          Lingkungan: <strong>${d ? (d.Lingkungan || '-') : '-'}</strong> &nbsp;|&nbsp;
          <span class="status-pill status-${status.key}">${status.label}</span> &nbsp;|&nbsp;
          Progress: ${progress}%
        </div>
      </div>
    </div>`;

  if (!d) {
    return html + `<div style="text-align:center;padding:40px;color:var(--gray-text);"><i class="fa-solid fa-inbox fa-2x" style="margin-bottom:12px;display:block"></i>Peserta ini belum mengisi data apapun.</div>`;
  }

  // ---- KAPSEL 1 ----
  html += `<div class="detail-section">
    <div class="detail-section-title"><i class="fa-solid fa-seedling"></i> KAPSEL 1 — Tindakan Nyata</div>`;

  for (let w = 1; w <= 8; w++) {
    const waktu    = d[`K1W${w}_Waktu`];
    const tindakan = d[`K1W${w}_Tindakan`];
    const tujuan   = d[`K1W${w}_Tujuan`];
    const kepada   = d[`K1W${w}_Kepada`];
    const docUrl   = d[`K1W${w}_DocUrl`];

    if (!waktu && !tindakan) continue;

    html += `<div class="week-detail-card">
      <div class="week-detail-header">Minggu ${w}</div>
      <div class="week-detail-grid">
        <div class="detail-field">
          <div class="detail-field-label">Waktu</div>
          <div class="detail-field-value">${formatDate(waktu) || '<span class="empty">—</span>'}</div>
        </div>
        <div class="detail-field">
          <div class="detail-field-label">Ditujukan Kepada</div>
          <div class="detail-field-value">${kepada || '<span class="empty">—</span>'}</div>
        </div>
        <div class="detail-field" style="grid-column:1/-1">
          <div class="detail-field-label">Tindakan Konkret</div>
          <div class="detail-field-value">${tindakan || '<span class="empty">Belum diisi</span>'}</div>
        </div>
        <div class="detail-field" style="grid-column:1/-1">
          <div class="detail-field-label">Tujuan</div>
          <div class="detail-field-value">${tujuan || '<span class="empty">—</span>'}</div>
        </div>
        ${docUrl ? `<div class="detail-field" style="grid-column:1/-1">
          <div class="detail-field-label">Dokumentasi</div>
          <a href="${docUrl}" target="_blank" class="doc-link">
            <i class="fa-solid fa-image"></i> Lihat Dokumentasi
          </a>
        </div>` : ''}
      </div>
    </div>`;
  }

  // Evaluasi 1
  if (d.Eval1_Perkembangan || d.Eval1_Rangkuman) {
    html += `<div style="margin-top:14px">
      <div style="font-family:Montserrat,sans-serif;font-weight:700;font-size:0.82rem;color:var(--orange);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.06em">Evaluasi Kapsel 1</div>
      <div class="eval-grid-admin">
        ${evalItem('Perkembangan', d.Eval1_Perkembangan, '')}
        ${evalItem('Tantangan', d.Eval1_Tantangan, '')}
        ${evalItem('Pembelajaran', d.Eval1_Pembelajaran, '')}
        ${evalItem('Dampak', d.Eval1_Dampak, '')}
      </div>
      ${d.Eval1_Rangkuman ? `<div class="eval-item" style="margin-top:10px">
        <div class="detail-field-label" style="margin-bottom:6px">Rangkuman Kapsel 1</div>
        <div class="detail-field-value">${d.Eval1_Rangkuman}</div>
      </div>` : ''}
    </div>`;
  }

  html += `</div>`;

  // ---- KAPSEL 2 ----
  html += `<div class="detail-section">
    <div class="detail-section-title" style="border-bottom-color:var(--maroon)"><i class="fa-brands fa-instagram"></i> KAPSEL 2 — Penerapan PA</div>`;

  for (let w = 1; w <= 8; w++) {
    const waktu     = d[`K2W${w}_Waktu`];
    const tindakan  = d[`K2W${w}_Tindakan`];
    const hasil     = d[`K2W${w}_Hasil`];
    const docUrl    = d[`K2W${w}_DocUrl`];
    const posterUrl = d[`K2W${w}_PosterUrl`];

    if (!waktu && !tindakan) continue;

    html += `<div class="week-detail-card">
      <div class="week-detail-header" style="color:var(--maroon)">Minggu ${w}</div>
      <div class="week-detail-grid">
        <div class="detail-field">
          <div class="detail-field-label">Waktu</div>
          <div class="detail-field-value">${formatDate(waktu) || '—'}</div>
        </div>
        <div class="detail-field" style="grid-column:1/-1">
          <div class="detail-field-label">Tindakan (Penerapan PA)</div>
          <div class="detail-field-value">${tindakan || '<span class="empty">Belum diisi</span>'}</div>
        </div>
        <div class="detail-field" style="grid-column:1/-1">
          <div class="detail-field-label">Hasil</div>
          <div class="detail-field-value">${hasil || '<span class="empty">—</span>'}</div>
        </div>
        <div class="detail-field" style="display:flex;gap:16px;flex-direction:row;grid-column:1/-1">
          ${docUrl ? `<a href="${docUrl}" target="_blank" class="doc-link"><i class="fa-solid fa-image"></i> Dokumentasi</a>` : ''}
          ${posterUrl ? `<a href="${posterUrl}" target="_blank" class="doc-link" style="color:var(--maroon)"><i class="fa-brands fa-instagram"></i> Poster IG</a>` : ''}
        </div>
      </div>
    </div>`;
  }

  // Evaluasi 2
  if (d.Eval2_Perkembangan || d.Eval2_Rangkuman) {
    html += `<div style="margin-top:14px">
      <div style="font-family:Montserrat,sans-serif;font-weight:700;font-size:0.82rem;color:var(--maroon);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.06em">Evaluasi Kapsel 2</div>
      <div class="eval-grid-admin">
        ${evalItem('Perkembangan', d.Eval2_Perkembangan, 'k2')}
        ${evalItem('Tantangan', d.Eval2_Tantangan, 'k2')}
        ${evalItem('Pembelajaran', d.Eval2_Pembelajaran, 'k2')}
        ${evalItem('Dampak', d.Eval2_Dampak, 'k2')}
      </div>
      ${d.Eval2_Rangkuman ? `<div class="eval-item k2" style="margin-top:10px">
        <div class="detail-field-label" style="margin-bottom:6px">Rangkuman Kapsel 2</div>
        <div class="detail-field-value">${d.Eval2_Rangkuman}</div>
      </div>` : ''}
    </div>`;
  }

  html += `</div>`;

  return html;
}

function evalItem(label, value, cls) {
  return `<div class="eval-item ${cls}">
    <div class="detail-field-label" style="margin-bottom:4px">${label}</div>
    <div class="detail-field-value">${value || '<span class="empty">Belum diisi</span>'}</div>
  </div>`;
}

// ============================================================
// HELPERS
// ============================================================
function getStatusInfo(d) {
  if (!d) return { key: 'not-started', label: 'Belum Mengisi' };
  const k1 = d['K1W1_Tindakan'] || d['K1W2_Tindakan'] || d['K1W3_Tindakan'];
  const k2 = d['K2W1_Tindakan'] || d['K2W2_Tindakan'] || d['K2W3_Tindakan'];
  if (k1 && k2) return { key: 'completed', label: 'Lengkap' };
  if (k1 || k2) return { key: 'in-progress', label: 'Dalam Proses' };
  return { key: 'not-started', label: 'Belum Mengisi' };
}

function getProgressPct(d) {
  if (!d) return 0;
  let filled = 0, total = 0;
  for (let w = 1; w <= 4; w++) {
    total++;
    if (d[`K1W${w}_Tindakan`]) filled++;
    total++;
    if (d[`K2W${w}_Tindakan`]) filled++;
  }
  return Math.round((filled / total) * 100);
}

function formatDate(ts) {
  if (!ts) return null;
  try {
    const d = new Date(ts);
    return d.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
  } catch { return ts; }
}
