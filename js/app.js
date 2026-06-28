// ============================================================
// APP.JS — REAL ACTION BIBLE CAMP 2026 SG 1
// ============================================================

const PARTICIPANTS = [
  { id: 1, name: 'Claudya', city: 'Kefa' },
  { id: 2, name: 'Inggrid', city: 'Atambua' },
  { id: 3, name: 'Frenti', city: 'Soe' },
  { id: 4, name: 'Any', city: 'Kupang' },
  { id: 5, name: 'Anggi', city: 'Kupang' },
  { id: 6, name: 'Kak Mince', city: 'Waibakul' },
  { id: 7, name: 'Petra', city: 'Sky, Kupang' },
  { id: 8, name: 'Revan', city: 'Waikabubak' },
  { id: 9, name: 'Marsel', city: 'Kupang' },
];

// Track weeks count per kapsel
let kapsel1Weeks = 4;
let kapsel2Weeks = 4;
let currentParticipant = null;
let savedData = {}; // local cache { participantId: formData }

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  renderCards();
  loadAllProgress();
});

// ============================================================
// RENDER PARTICIPANT CARDS
// ============================================================
function renderCards() {
  const grid = document.getElementById('participantGrid');
  grid.innerHTML = '';

  PARTICIPANTS.forEach(p => {
    const data = savedData[p.id] || null;
    const status = getStatus(data);

    const card = document.createElement('div');
    card.className = 'participant-card';
    card.onclick = () => openModal(p);

    const initials = p.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    card.innerHTML = `
      <div class="card-avatar">${initials}</div>
      <div class="card-name">${p.name}</div>
      <div class="card-city"><i class="fa-solid fa-location-dot" style="font-size:0.7rem;color:var(--orange);"></i> ${p.city}</div>
      <div class="card-progress">
        ${renderProgressDots(data)}
      </div>
      <div class="card-status ${status.cls}">${status.label}</div>
    `;
    grid.appendChild(card);
  });
}

function getStatus(data) {
  if (!data) return { cls: 'not-started', label: 'Belum Diisi' };
  const k1filled = data.kapsel1 && data.kapsel1.some(w => w.tindakan || w.waktu);
  const k2filled = data.kapsel2 && data.kapsel2.some(w => w.tindakan || w.waktu);
  if (k1filled && k2filled) return { cls: 'completed', label: 'Lengkap' };
  if (k1filled || k2filled) return { cls: 'in-progress', label: 'Dalam Proses' };
  return { cls: 'not-started', label: 'Belum Diisi' };
}

function renderProgressDots(data) {
  let dots = '';
  for (let i = 0; i < 8; i++) {
    const filled = data && i < getFilledWeeks(data) ? 'filled' : '';
    dots += `<div class="progress-dot ${filled}"></div>`;
  }
  return dots;
}

function getFilledWeeks(data) {
  let count = 0;
  if (data && data.kapsel1) count += data.kapsel1.filter(w => w.tindakan || w.waktu).length;
  if (data && data.kapsel2) count += data.kapsel2.filter(w => w.tindakan || w.waktu).length;
  return count;
}

// ============================================================
// OPEN / CLOSE MODAL
// ============================================================
function openModal(participant) {
  currentParticipant = participant;

  document.getElementById('f_name').value = `${participant.name} (${participant.city})`;

  // Reset weeks
  kapsel1Weeks = 4;
  kapsel2Weeks = 4;

  renderAllWeeks();
  populateFormFromCache(participant.id);
  loadFromSheet(participant.id);

  document.getElementById('formModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('formModal').classList.add('hidden');
  document.body.style.overflow = '';
  currentParticipant = null;
}

// ============================================================
// RENDER WEEKS
// ============================================================
function renderAllWeeks() {
  renderWeeks(1);
  renderWeeks(2);
}

function renderWeeks(kapsel) {
  const containerId = `kapsel${kapsel}Weeks`;
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  const count = kapsel === 1 ? kapsel1Weeks : kapsel2Weeks;

  for (let w = 1; w <= count; w++) {
    container.appendChild(buildWeekCard(kapsel, w));
  }
}

function buildWeekCard(kapsel, weekNum) {
  const card = document.createElement('div');
  card.className = `week-card ${kapsel === 2 ? 'kapsel2-week' : ''}`;
  card.id = `k${kapsel}w${weekNum}`;

  const color = kapsel === 1 ? 'var(--orange)' : 'var(--maroon)';

  if (kapsel === 1) {
    card.innerHTML = `
      <div class="week-title">
        <div class="week-num" style="background:${color}">${weekNum}</div>
        Minggu ${weekNum} — Kapsel 1
      </div>
      <div class="week-grid">
        <div class="field-group">
          <label>Waktu</label>
          <input type="datetime-local" id="k1w${weekNum}_waktu" />
        </div>
        <div class="field-group">
          <label>Ditujukan Kepada Siapa</label>
          <input type="text" id="k1w${weekNum}_kepada" placeholder="Cth: Adik rohani, anggota KTB..."/>
        </div>
        <div class="field-group full-width">
          <label>Tindakan Konkret</label>
          <div class="field-hint">Tuliskan tindakan nyata yang dilakukan berdasarkan kebutuhan yang ditemukan di lingkungan pilihan.</div>
          <textarea id="k1w${weekNum}_tindakan" rows="3" placeholder="Tindakan yang dilakukan..."></textarea>
        </div>
        <div class="field-group full-width">
          <label>Tujuan</label>
          <div class="field-hint">Tuliskan tujuan atau perubahan yang ingin dicapai.</div>
          <textarea id="k1w${weekNum}_tujuan" rows="2" placeholder="Tujuan dari tindakan ini..."></textarea>
        </div>
        <div class="field-group full-width">
          <label>Dokumentasi</label>
          <div class="field-hint">Upload bukti pelaksanaan kegiatan (foto/video).</div>
          <div class="file-upload-area" onclick="document.getElementById('k1w${weekNum}_doc').click()">
            <label class="file-upload-label">
              <i class="fa-solid fa-camera"></i>
              <span>Klik untuk upload foto/dokumen</span>
            </label>
            <input type="file" id="k1w${weekNum}_doc" accept="image/*,video/*,.pdf" onchange="previewFile(this,'k1w${weekNum}_docPreview')" />
          </div>
          <div class="file-preview" id="k1w${weekNum}_docPreview"></div>
          <input type="hidden" id="k1w${weekNum}_docUrl" />
        </div>
      </div>
    `;
  } else {
    card.innerHTML = `
      <div class="week-title" style="color:${color}">
        <div class="week-num" style="background:${color}">${weekNum}</div>
        Minggu ${weekNum} — Kapsel 2
      </div>
      <div class="week-grid">
        <div class="field-group">
          <label>Waktu</label>
          <input type="datetime-local" id="k2w${weekNum}_waktu" />
        </div>
        <div class="field-group full-width">
          <label>Tindakan</label>
          <div class="field-hint">Tuliskan penerapan metode PA yang dipelajari saat Kapsel.</div>
          <textarea id="k2w${weekNum}_tindakan" rows="3" placeholder="Penerapan metode PA..."></textarea>
        </div>
        <div class="field-group full-width">
          <label>Hasil</label>
          <div class="field-hint">Tuliskan hasil nyata setelah tindakan dilakukan.</div>
          <textarea id="k2w${weekNum}_hasil" rows="2" placeholder="Hasil yang dicapai..."></textarea>
        </div>
        <div class="field-group full-width">
          <label>Dokumentasi</label>
          <div class="field-hint">Upload bukti kegiatan (foto/video).</div>
          <div class="file-upload-area" onclick="document.getElementById('k2w${weekNum}_doc').click()">
            <label class="file-upload-label">
              <i class="fa-solid fa-camera"></i>
              <span>Klik untuk upload foto/dokumen</span>
            </label>
            <input type="file" id="k2w${weekNum}_doc" accept="image/*,video/*,.pdf" onchange="previewFile(this,'k2w${weekNum}_docPreview')" />
          </div>
          <div class="file-preview" id="k2w${weekNum}_docPreview"></div>
          <input type="hidden" id="k2w${weekNum}_docUrl" />
        </div>
        <div class="field-group full-width">
          <label>Poster Instagram</label>
          <div class="field-hint">Upload poster atau postingan Instagram yang dibuat.</div>
          <div class="file-upload-area" onclick="document.getElementById('k2w${weekNum}_poster').click()">
            <label class="file-upload-label">
              <i class="fa-brands fa-instagram"></i>
              <span>Klik untuk upload poster IG</span>
            </label>
            <input type="file" id="k2w${weekNum}_poster" accept="image/*" onchange="previewFile(this,'k2w${weekNum}_posterPreview')" />
          </div>
          <div class="file-preview" id="k2w${weekNum}_posterPreview"></div>
          <input type="hidden" id="k2w${weekNum}_posterUrl" />
        </div>
      </div>
    `;
  }
  return card;
}

// ============================================================
// ADD / REMOVE WEEKS
// ============================================================
function addWeek(kapsel) {
  if (kapsel === 1) {
    kapsel1Weeks++;
    document.getElementById('kapsel1Weeks').appendChild(buildWeekCard(1, kapsel1Weeks));
  } else {
    kapsel2Weeks++;
    document.getElementById('kapsel2Weeks').appendChild(buildWeekCard(2, kapsel2Weeks));
  }
}

function removeWeek(kapsel) {
  if (kapsel === 1 && kapsel1Weeks > 1) {
    const card = document.getElementById(`k1w${kapsel1Weeks}`);
    if (card) card.remove();
    kapsel1Weeks--;
  } else if (kapsel === 2 && kapsel2Weeks > 1) {
    const card = document.getElementById(`k2w${kapsel2Weeks}`);
    if (card) card.remove();
    kapsel2Weeks--;
  }
}

// ============================================================
// FILE PREVIEW
// ============================================================
function previewFile(input, previewId) {
  const preview = document.getElementById(previewId);
  if (input.files && input.files[0]) {
    preview.innerHTML = `<i class="fa-solid fa-check" style="color:var(--orange);"></i> ${input.files[0].name}`;
  }
}

// ============================================================
// COLLECT FORM DATA
// ============================================================
function collectFormData() {
  const lingkungan = document.querySelector('input[name="lingkungan"]:checked');

  const kapsel1 = [];
  for (let w = 1; w <= kapsel1Weeks; w++) {
    kapsel1.push({
      minggu: w,
      waktu: val(`k1w${w}_waktu`),
      tindakan: val(`k1w${w}_tindakan`),
      tujuan: val(`k1w${w}_tujuan`),
      kepada: val(`k1w${w}_kepada`),
      docUrl: val(`k1w${w}_docUrl`),
    });
  }

  const kapsel2 = [];
  for (let w = 1; w <= kapsel2Weeks; w++) {
    kapsel2.push({
      minggu: w,
      waktu: val(`k2w${w}_waktu`),
      tindakan: val(`k2w${w}_tindakan`),
      hasil: val(`k2w${w}_hasil`),
      docUrl: val(`k2w${w}_docUrl`),
      posterUrl: val(`k2w${w}_posterUrl`),
    });
  }

  return {
    timestamp: new Date().toISOString(),
    participantId: currentParticipant.id,
    nama: currentParticipant.name,
    kota: currentParticipant.city,
    lingkungan: lingkungan ? lingkungan.value : '',
    kapsel1,
    evaluasi1: {
      perkembangan: val('eval1_perkembangan'),
      tantangan: val('eval1_tantangan'),
      pembelajaran: val('eval1_pembelajaran'),
      dampak: val('eval1_dampak'),
      rangkuman: val('eval1_rangkuman'),
    },
    kapsel2,
    evaluasi2: {
      perkembangan: val('eval2_perkembangan'),
      tantangan: val('eval2_tantangan'),
      pembelajaran: val('eval2_pembelajaran'),
      dampak: val('eval2_dampak'),
      rangkuman: val('eval2_rangkuman'),
    },
  };
}

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

// ============================================================
// POPULATE FORM FROM CACHED DATA
// ============================================================
function populateFormFromCache(participantId) {
  const data = savedData[participantId];
  if (!data) return;

  // Lingkungan
  if (data.lingkungan) {
    const radio = document.querySelector(`input[name="lingkungan"][value="${data.lingkungan}"]`);
    if (radio) radio.checked = true;
  }

  // Kapsel 1 weeks
  if (data.kapsel1) {
    const needed = data.kapsel1.length;
    while (kapsel1Weeks < needed) addWeek(1);
    data.kapsel1.forEach((w, i) => {
      setVal(`k1w${i+1}_waktu`, w.waktu);
      setVal(`k1w${i+1}_tindakan`, w.tindakan);
      setVal(`k1w${i+1}_tujuan`, w.tujuan);
      setVal(`k1w${i+1}_kepada`, w.kepada);
      if (w.docUrl) { setVal(`k1w${i+1}_docUrl`, w.docUrl); setPreview(`k1w${i+1}_docPreview`, w.docUrl); }
    });
  }

  // Evaluasi 1
  if (data.evaluasi1) {
    setVal('eval1_perkembangan', data.evaluasi1.perkembangan);
    setVal('eval1_tantangan', data.evaluasi1.tantangan);
    setVal('eval1_pembelajaran', data.evaluasi1.pembelajaran);
    setVal('eval1_dampak', data.evaluasi1.dampak);
    setVal('eval1_rangkuman', data.evaluasi1.rangkuman);
  }

  // Kapsel 2 weeks
  if (data.kapsel2) {
    const needed = data.kapsel2.length;
    while (kapsel2Weeks < needed) addWeek(2);
    data.kapsel2.forEach((w, i) => {
      setVal(`k2w${i+1}_waktu`, w.waktu);
      setVal(`k2w${i+1}_tindakan`, w.tindakan);
      setVal(`k2w${i+1}_hasil`, w.hasil);
      if (w.docUrl) { setVal(`k2w${i+1}_docUrl`, w.docUrl); setPreview(`k2w${i+1}_docPreview`, w.docUrl); }
      if (w.posterUrl) { setVal(`k2w${i+1}_posterUrl`, w.posterUrl); setPreview(`k2w${i+1}_posterPreview`, w.posterUrl); }
    });
  }

  // Evaluasi 2
  if (data.evaluasi2) {
    setVal('eval2_perkembangan', data.evaluasi2.perkembangan);
    setVal('eval2_tantangan', data.evaluasi2.tantangan);
    setVal('eval2_pembelajaran', data.evaluasi2.pembelajaran);
    setVal('eval2_dampak', data.evaluasi2.dampak);
    setVal('eval2_rangkuman', data.evaluasi2.rangkuman);
  }
}

function setVal(id, value) {
  const el = document.getElementById(id);
  if (el && value) el.value = value;
}

function setPreview(previewId, url) {
  const el = document.getElementById(previewId);
  if (el && url) el.innerHTML = `<i class="fa-solid fa-link" style="color:var(--orange);"></i> File tersimpan`;
}

// ============================================================
// UPLOAD FILES BEFORE SAVING
// ============================================================
async function uploadPendingFiles() {
  const uploadTasks = [];

  // Kapsel 1
  for (let w = 1; w <= kapsel1Weeks; w++) {
    const docInput = document.getElementById(`k1w${w}_doc`);
    if (docInput && docInput.files[0]) {
      uploadTasks.push(uploadFile(docInput.files[0], `k1w${w}_docUrl`, `K1W${w}_${currentParticipant.name}_doc`));
    }
  }

  // Kapsel 2
  for (let w = 1; w <= kapsel2Weeks; w++) {
    const docInput = document.getElementById(`k2w${w}_doc`);
    if (docInput && docInput.files[0]) {
      uploadTasks.push(uploadFile(docInput.files[0], `k2w${w}_docUrl`, `K2W${w}_${currentParticipant.name}_doc`));
    }
    const posterInput = document.getElementById(`k2w${w}_poster`);
    if (posterInput && posterInput.files[0]) {
      uploadTasks.push(uploadFile(posterInput.files[0], `k2w${w}_posterUrl`, `K2W${w}_${currentParticipant.name}_poster`));
    }
  }

  await Promise.all(uploadTasks);
}

async function uploadFile(file, targetFieldId, fileName) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64 = e.target.result.split(',')[1];
        const response = await fetch(CONFIG.GAS_URL, {
          method: 'POST',
          body: JSON.stringify({
            action: 'uploadFile',
            fileName: fileName + '_' + file.name,
            mimeType: file.type,
            base64Data: base64,
            folderId: CONFIG.DRIVE_FOLDER_ID,
          }),
        });
        const result = await response.json();
        if (result.url) {
          document.getElementById(targetFieldId).value = result.url;
          setPreview(targetFieldId.replace('Url','Preview'), result.url);
        }
        resolve(result);
      } catch (err) {
        console.error('Upload error:', err);
        resolve(null);
      }
    };
    reader.readAsDataURL(file);
  });
}

// ============================================================
// SAVE DATA
// ============================================================
async function saveData() {
  if (!currentParticipant) return;

  const statusEl = document.getElementById('saveStatus');
  statusEl.className = 'save-status loading';
  statusEl.textContent = '⏳ Mengupload file dan menyimpan data...';
  statusEl.classList.remove('hidden');

  try {
    // Upload files first
    await uploadPendingFiles();

    const data = collectFormData();

    // Cache locally
    savedData[currentParticipant.id] = data;

    // Send to Google Sheets
    if (CONFIG.GAS_URL && CONFIG.GAS_URL !== 'GANTI_DENGAN_URL_GOOGLE_APPS_SCRIPT_KAMU') {
      const response = await fetch(CONFIG.GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'saveData', data }),
      });
      const result = await response.json();

      if (result.success) {
        statusEl.className = 'save-status success';
        statusEl.textContent = '✅ Data berhasil disimpan ke Google Sheet!';
      } else {
        throw new Error(result.message || 'Gagal menyimpan');
      }
    } else {
      // Save to localStorage as fallback
      localStorage.setItem(`rabc2026_${currentParticipant.id}`, JSON.stringify(data));
      statusEl.className = 'save-status success';
      statusEl.textContent = '✅ Data tersimpan lokal. (Hubungkan Google Sheet untuk cloud.)';
    }

    renderCards();
  } catch (err) {
    statusEl.className = 'save-status error';
    statusEl.textContent = '❌ Gagal menyimpan: ' + err.message;
    console.error(err);
  }
}

// ============================================================
// LOAD ALL PROGRESS (from localStorage fallback)
// ============================================================
function loadAllProgress() {
  PARTICIPANTS.forEach(p => {
    const stored = localStorage.getItem(`rabc2026_${p.id}`);
    if (stored) {
      try { savedData[p.id] = JSON.parse(stored); } catch (e) {}
    }
  });
  renderCards();
}

// ============================================================
// LOAD FROM SHEET (on open modal)
// ============================================================
async function loadFromSheet(participantId) {
  if (!CONFIG.GAS_URL || CONFIG.GAS_URL === 'GANTI_DENGAN_URL_GOOGLE_APPS_SCRIPT_KAMU') return;

  try {
    const url = `${CONFIG.GAS_URL}?action=getData&participantId=${participantId}`;
    const response = await fetch(url);
    const result = await response.json();

    if (result.success && result.data) {
      savedData[participantId] = result.data;
      populateFormFromCache(participantId);
    }
  } catch (err) {
    console.warn('Could not load from sheet:', err);
  }
}
