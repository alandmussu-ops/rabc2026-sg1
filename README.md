# REAL ACTION BIBLE CAMP 2026 SG 1
## Panduan Setup Lengkap

---

## STRUKTUR FOLDER

```
rabc2026/
├── index.html          ← Website utama (peserta)
├── admin.html          ← Dashboard admin PKTB
├── Code.gs             ← Kode Google Apps Script (copy ke GAS)
├── css/
│   ├── style.css       ← Styling website peserta
│   └── admin.css       ← Styling dashboard admin
└── js/
    ├── config.js       ← ⚠️ ISI URL DI SINI setelah deploy GAS
    ├── app.js          ← Logic website peserta
    └── admin.js        ← Logic dashboard admin
```

---

## LANGKAH SETUP (Ringkasan)

### LANGKAH 1 — Google Sheet
1. Buka sheets.google.com → buat spreadsheet baru
2. Beri nama: `RABC 2026 SG1 Database`
3. Buat 2 tab sheet: `DataPeserta` dan `FileUpload`
4. Di sheet `DataPeserta`, isi header di baris 1 (lihat panduan interaktif)
5. Catat **ID Spreadsheet** dari URL

### LANGKAH 2 — Google Drive
1. Buka drive.google.com → buat folder baru
2. Nama folder: `RABC2026_Dokumentasi`
3. Set sharing: "Anyone with the link - Viewer"
4. Catat **ID Folder** dari URL

### LANGKAH 3 — Google Apps Script
1. Di Google Sheet → Extensions → Apps Script
2. Hapus semua kode, paste isi file `Code.gs`
3. Ganti `SHEET_ID` dan `FOLDER_ID` di baris atas
4. Save (Ctrl+S)

### LANGKAH 4 — Deploy Apps Script
1. Klik Deploy → New deployment
2. Pilih type: Web app
3. Execute as: Me
4. Who has access: Anyone
5. Klik Deploy → Authorize access → Allow
6. Salin **Web App URL**

### LANGKAH 5 — Isi config.js
Buka `js/config.js` dan isi:
```javascript
const CONFIG = {
  GAS_URL: 'https://script.google.com/macros/s/XXXXXX/exec',
  DRIVE_FOLDER_ID: '1XYZabcFolderID',
};
```

### LANGKAH 6 — Upload ke Hosting
**Opsi A — GitHub Pages (Gratis):**
1. Buat akun di github.com
2. New repository → nama: `rabc2026-sg1` → Public
3. Upload semua file → Settings → Pages → Deploy from branch main
4. URL: `https://[username].github.io/rabc2026-sg1/`

**Opsi B — Netlify Drop (Lebih Mudah):**
1. Buka app.netlify.com → daftar
2. Drag & drop seluruh folder ke Netlify
3. URL langsung aktif, bisa diganti nama di Settings

---

## CARA PAKAI

### Untuk Peserta:
- Buka URL website
- Klik kartu nama → isi form → klik Simpan
- Data otomatis masuk ke Google Sheet

### Untuk Admin PKTB:
- Buka `admin.html` (tambahkan /admin.html di URL)
- Klik Refresh Data untuk memuat data terbaru
- Klik Detail untuk melihat semua isian peserta
- Filter berdasarkan status atau lingkungan

---

## TROUBLESHOOTING

| Masalah | Solusi |
|---------|--------|
| Data tidak tersimpan | Cek GAS_URL di config.js sudah benar |
| Upload foto gagal | Cek DRIVE_FOLDER_ID di config.js |
| Error CORS | Pastikan GAS di-deploy dengan "Who has access: Anyone" |
| Data tidak muncul di admin | Klik Refresh Data; cek apakah GAS_URL sudah diisi |
| File terlalu besar | Limit upload adalah ±5MB per file |

---

## TIPS

- Setiap kali edit kode Apps Script → harus deploy ulang
- Peserta bisa isi data berkali-kali; data lama akan diganti (bukan duplikat)
- Folder Google Drive bisa diakses langsung untuk lihat semua foto
- Sheet `FileUpload` berisi log semua file yang diupload

---

*Dibuat untuk RABC 2026 SG 1 — Tuhan memberkati setiap langkah nyata!*
