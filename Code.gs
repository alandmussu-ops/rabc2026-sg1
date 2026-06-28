// =============================================
// RABC 2026 SG1 — Google Apps Script Backend
// File ini di-paste ke Google Apps Script (Code.gs)
// =============================================

// ⚠️ GANTI DUA BARIS INI SEBELUM DEPLOY:
const SHEET_ID   = 'GANTI_ID_SPREADSHEET_KAMU';   // dari URL Google Sheet
const FOLDER_ID  = 'GANTI_ID_FOLDER_DRIVE_KAMU';  // dari URL Google Drive folder
const SHEET_NAME = 'DataPeserta';

// =============================================
// ENTRY POINT: POST (simpan data & upload file)
// =============================================
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    if (body.action === 'uploadFile') {
      return uploadToDrive(body);
    }
    if (body.action === 'saveData') {
      return saveToSheet(body.data);
    }
    return respond({ success: false, message: 'Unknown action' });

  } catch (err) {
    return respond({ success: false, message: err.toString() });
  }
}

// =============================================
// ENTRY POINT: GET (ambil data)
// =============================================
function doGet(e) {
  const action = e.parameter.action;

  if (action === 'getData') {
    return getParticipantData(e.parameter.participantId);
  }
  if (action === 'getAllData') {
    return getAllData();
  }
  return respond({ success: false, message: 'Unknown GET action' });
}

// =============================================
// SIMPAN DATA KE GOOGLE SHEET
// =============================================
function saveToSheet(data) {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);

  // Cari apakah peserta sudah pernah simpan (cek ParticipantID di kolom B)
  const allValues = sheet.getDataRange().getValues();
  let targetRow   = -1;

  for (let i = 1; i < allValues.length; i++) {
    if (String(allValues[i][1]) === String(data.participantId)) {
      targetRow = i + 1; // index sheet mulai dari 1, bukan 0
      break;
    }
  }

  // Jika belum ada, buat baris baru
  if (targetRow === -1) {
    targetRow = sheet.getLastRow() + 1;
  }

  // Flatten kapsel 1 (maks 8 minggu, 5 field per minggu)
  const k1 = flattenWeeks(data.kapsel1, ['waktu', 'tindakan', 'tujuan', 'kepada', 'docUrl'], 8);
  // Flatten kapsel 2 (maks 8 minggu, 5 field per minggu)
  const k2 = flattenWeeks(data.kapsel2, ['waktu', 'tindakan', 'hasil', 'docUrl', 'posterUrl'], 8);

  const e1 = data.evaluasi1 || {};
  const e2 = data.evaluasi2 || {};

  const row = [
    new Date().toISOString(),       // A: Timestamp
    data.participantId,             // B: ParticipantID
    data.nama,                      // C: Nama
    data.kota,                      // D: Kota
    data.lingkungan,                // E: Lingkungan
    ...k1,                          // F dst: Kapsel 1 weeks
    e1.perkembangan  || '',
    e1.tantangan     || '',
    e1.pembelajaran  || '',
    e1.dampak        || '',
    e1.rangkuman     || '',
    ...k2,                          // Kapsel 2 weeks
    e2.perkembangan  || '',
    e2.tantangan     || '',
    e2.pembelajaran  || '',
    e2.dampak        || '',
    e2.rangkuman     || '',
  ];

  sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);

  return respond({
    success : true,
    message : 'Data peserta ' + data.nama + ' berhasil disimpan!',
    row     : targetRow,
  });
}

// =============================================
// AMBIL DATA SATU PESERTA
// =============================================
function getParticipantData(participantId) {
  const ss     = SpreadsheetApp.openById(SHEET_ID);
  const sheet  = ss.getSheetByName(SHEET_NAME);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][1]) === String(participantId)) {
      const obj = {};
      headers.forEach(function(h, idx) { obj[h] = values[i][idx]; });
      return respond({ success: true, data: parseRowToData(obj) });
    }
  }
  return respond({ success: false, message: 'Data tidak ditemukan' });
}

// =============================================
// AMBIL SEMUA DATA (untuk Admin Dashboard)
// =============================================
function getAllData() {
  const ss     = SpreadsheetApp.openById(SHEET_ID);
  const sheet  = ss.getSheetByName(SHEET_NAME);
  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    return respond({ success: true, data: [] });
  }

  const headers = values[0];
  const rows    = values.slice(1).map(function(row) {
    const obj = {};
    headers.forEach(function(h, idx) { obj[h] = row[idx]; });
    return obj;
  });

  return respond({ success: true, data: rows });
}

// =============================================
// UPLOAD FILE KE GOOGLE DRIVE
// =============================================
function uploadToDrive(body) {
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);

    // Decode base64 ke bytes
    const bytes = Utilities.base64Decode(body.base64Data);
    const blob  = Utilities.newBlob(bytes, body.mimeType, body.fileName);

    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileId    = file.getId();
    const viewUrl   = 'https://drive.google.com/file/d/' + fileId + '/view';
    const embedUrl  = 'https://drive.google.com/uc?export=view&id=' + fileId;

    // Catat ke sheet FileUpload
    logFileUpload(body.fileName, viewUrl, fileId);

    return respond({
      success   : true,
      url       : viewUrl,
      embedUrl  : embedUrl,
      fileId    : fileId,
    });

  } catch (err) {
    return respond({ success: false, message: 'Upload gagal: ' + err.toString() });
  }
}

// =============================================
// LOG FILE KE SHEET FileUpload
// =============================================
function logFileUpload(fileName, url, fileId) {
  try {
    const ss    = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName('FileUpload');
    if (!sheet) return;

    // Buat header jika baris pertama kosong
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp', 'FileName', 'FileID', 'URL']);
    }
    sheet.appendRow([new Date().toISOString(), fileName, fileId, url]);
  } catch (e) {
    // Log saja, jangan throw
    console.log('logFileUpload error: ' + e.toString());
  }
}

// =============================================
// HELPER: FLATTEN WEEKS
// =============================================
function flattenWeeks(weeksArray, fields, maxWeeks) {
  var result = [];
  for (var i = 0; i < maxWeeks; i++) {
    var w = (weeksArray && weeksArray[i]) ? weeksArray[i] : {};
    fields.forEach(function(f) {
      result.push(w[f] !== undefined ? w[f] : '');
    });
  }
  return result;
}

// =============================================
// HELPER: PARSE FLAT ROW → NESTED OBJECT
// =============================================
function parseRowToData(obj) {
  var data = {
    participantId : obj['ParticipantID'],
    nama          : obj['Nama'],
    kota          : obj['Kota'],
    lingkungan    : obj['Lingkungan'],
    kapsel1       : [],
    evaluasi1     : {},
    kapsel2       : [],
    evaluasi2     : {},
  };

  for (var w = 1; w <= 8; w++) {
    data.kapsel1.push({
      minggu   : w,
      waktu    : obj['K1W' + w + '_Waktu']    || '',
      tindakan : obj['K1W' + w + '_Tindakan'] || '',
      tujuan   : obj['K1W' + w + '_Tujuan']   || '',
      kepada   : obj['K1W' + w + '_Kepada']   || '',
      docUrl   : obj['K1W' + w + '_DocUrl']   || '',
    });
    data.kapsel2.push({
      minggu    : w,
      waktu     : obj['K2W' + w + '_Waktu']    || '',
      tindakan  : obj['K2W' + w + '_Tindakan'] || '',
      hasil     : obj['K2W' + w + '_Hasil']    || '',
      docUrl    : obj['K2W' + w + '_DocUrl']   || '',
      posterUrl : obj['K2W' + w + '_PosterUrl'] || '',
    });
  }

  ['Perkembangan', 'Tantangan', 'Pembelajaran', 'Dampak', 'Rangkuman'].forEach(function(k) {
    data.evaluasi1[k.toLowerCase()] = obj['Eval1_' + k] || '';
    data.evaluasi2[k.toLowerCase()] = obj['Eval2_' + k] || '';
  });

  return data;
}

// =============================================
// HELPER: RESPOND JSON
// =============================================
function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
