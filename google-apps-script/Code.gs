/**
 * Google Apps Script for lazy-log (Format Kantor)
 * 
 * Fitur:
 * 1. Otomatis mencari Tab Sheet berdasarkan Bulan & Tahun berjalan (misal: "Oktober 2026", "October 2026", "Okt 2026").
 * 2. AUTO-DUPLICATE TEMPLATE: Jika tab bulan baru belum ada, otomatis menduplikasi tab "Template"
 *    atau tab bulan sebelumnya, merename menjadi bulan baru, dan membersihkan data lama (baris 4+)
 *    sehingga baris 1-3 (header grup, judul kolom, catatan hijau kantor) tetap 100% utuh!
 * 3. Otomatis membuat baris pembatas tanggal merah/maroon (seperti baris 4 pada gambar) jika hari ini belum tercatat.
 * 4. Memetakan 24 kolom format kantor secara otomatis dan presisi.
 */

// Konfigurasi Nama Tab Bulan (Bahasa Indonesia & English)
const MONTH_NAMES_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];
const MONTH_NAMES_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/**
 * Mencari tab bulan ini, atau otomatis menduplikasi tab template jika bulan baru.
 */
function getTargetSheet(ss) {
  const now = new Date();
  const monthIdx = now.getMonth();
  const year = now.getFullYear();

  const standardName = `${MONTH_NAMES_ID[monthIdx]} ${year}`; // Contoh: "Oktober 2026"

  const sheets = ss.getSheets();
  const patterns = [
    new RegExp(`^${MONTH_NAMES_ID[monthIdx]}\\s*${year}$`, 'i'),
    new RegExp(`^${MONTH_NAMES_EN[monthIdx]}\\s*${year}$`, 'i'),
    new RegExp(`^${MONTH_NAMES_ID[monthIdx].substring(0, 3)}\\w*\\s*['"]?${String(year).slice(-2)}$`, 'i'),
    new RegExp(`^${MONTH_NAMES_EN[monthIdx].substring(0, 3)}\\w*\\s*['"]?${String(year).slice(-2)}$`, 'i'),
    new RegExp(`^${String(monthIdx + 1).padStart(2, '0')}[-_/]${year}$`, 'i'),
    new RegExp(`^${year}[-_/]${String(monthIdx + 1).padStart(2, '0')}$`, 'i'),
    new RegExp(`^${MONTH_NAMES_ID[monthIdx]}$`, 'i'),
    new RegExp(`^${MONTH_NAMES_EN[monthIdx]}$`, 'i')
  ];

  // 1. Cek apakah tab sheet bulan ini sudah ada
  for (const sheet of sheets) {
    const sName = sheet.getName().trim();
    for (const pat of patterns) {
      if (pat.test(sName)) {
        return { sheet: sheet, isNew: false };
      }
    }
  }

  // 2. JIKA BULAN BARU BELUM ADA: Auto-duplicate tab template atau tab terakhir
  let sourceSheet = null;

  // Cari tab bernama "Template" atau "Master" terlebih dahulu
  for (const sheet of sheets) {
    const name = sheet.getName().toLowerCase();
    if (name.includes("template") || name.includes("master")) {
      sourceSheet = sheet;
      break;
    }
  }

  // Jika tidak ada tab Template, pakai sheet terakhir yang ada (biasanya bulan sebelumnya)
  if (!sourceSheet && sheets.length > 0) {
    sourceSheet = sheets[sheets.length - 1];
  }

  if (sourceSheet) {
    // Gandakan sheet sumber dengan semua formula, header 1-3, lebar kolom, dan styling
    const newSheet = sourceSheet.copyTo(ss);
    newSheet.setName(standardName);

    // Pindahkan tab baru ke urutan paling belakang
    ss.setActiveSheet(newSheet);
    ss.moveActiveSheet(ss.getSheets().length);

    // Bersihkan isi data bulan lalu (hapus dari baris 4 ke bawah agar bersih)
    const lastRow = newSheet.getLastRow();
    if (lastRow >= 4) {
      newSheet.deleteRows(4, lastRow - 3);
    }

    return { sheet: newSheet, isNew: true };
  }

  // Fallback darurat jika spreadsheet benar-benar kosong
  const fallbackSheet = ss.insertSheet(standardName);
  return { sheet: fallbackSheet, isNew: true };
}

function formatDateIndo(date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetResult = getTargetSheet(ss);
    const sheet = sheetResult.sheet;
    const isNewMonthTab = sheetResult.isNew;

    const now = new Date();
    const todayStr = payload.date_str || formatDateIndo(now);

    let lastRow = sheet.getLastRow();

    // Cek apakah baris pembatas hari ini (baris merah) sudah ada
    let dateHeaderExists = false;
    if (lastRow >= 4) {
      const colAValues = sheet.getRange(4, 1, lastRow - 3, 1).getValues();
      for (let i = colAValues.length - 1; i >= 0; i--) {
        const val = colAValues[i][0];
        if (val && String(val).trim() === todayStr) {
          dateHeaderExists = true;
          break;
        }
      }
    }

    // Jika belum ada header tanggal untuk hari ini, buat baris pembatas tanggal merah/maroon
    if (!dateHeaderExists) {
      // Jika baris sebelumnya adalah data kemarin, beri garis bawah tebal pada data hari kemarin
      if (lastRow >= 4) {
        const prevRowRange = sheet.getRange(lastRow, 1, 1, 24);
        prevRowRange.setBorder(null, null, true, null, null, null, "#000000", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
      }

      sheet.appendRow([todayStr]);
      lastRow = sheet.getLastRow();
      
      // Styling baris pemisah tanggal (Merah gelap/Maroon persis seperti di gambar)
      const dateRange = sheet.getRange(lastRow, 1, 1, 24);
      dateRange.setBackground("#8b0000"); // Dark Red / Maroon
      dateRange.setFontColor("#ffffff"); // Font putih
      dateRange.setFontWeight("bold");
      dateRange.setVerticalAlignment("middle");
    }

    // Pemetaan 24 Kolom Format Kantor:
    const taskId = payload.task_id || "Non Task";
    const status = payload.status || "Done";
    const project = payload.project || "-";
    const platform = payload.platform || "Web";
    const taskType = payload.task_type || "Feature";
    const role = payload.role || "Developer";
    const menu = payload.menu || "-";
    const submenu = payload.submenu || "-";
    const taskTitle = payload.task || payload.task_title || "-";
    const breakdownTask = payload.breakdown_task || payload.details || "-";
    const prepWork = payload.prep_work || payload.details || "-";
    const askTo = payload.ask_to || "-";
    const question = payload.question || "-";
    const estDuration = payload.est_duration || "-";
    const estDateTime = payload.est_datetime || "-";
    const actualStart = payload.start_time || Utilities.formatDate(now, "GMT+7", "HH:mm");
    const actualEnd = payload.end_time || Utilities.formatDate(now, "GMT+7", "HH:mm");
    const actualDuration = payload.actual_duration || "-";
    const late = payload.late || "";
    const earlier = payload.earlier || "";
    const why = payload.why || "-";
    const probTech = payload.problem_technical || "-";
    const probCollab = payload.problem_collab || "-";
    const probOther = payload.problem_other || "-";

    // Masukkan baris data baru
    sheet.appendRow([
      taskId,
      status,
      project,
      platform,
      taskType,
      role,
      menu,
      submenu,
      taskTitle,
      breakdownTask,
      prepWork,
      askTo,
      question,
      estDuration,
      estDateTime,
      actualStart,
      actualEnd,
      actualDuration,
      late,
      earlier,
      why,
      probTech,
      probCollab,
      probOther
    ]);

    const newRow = sheet.getLastRow();
    const rowRange = sheet.getRange(newRow, 1, 1, 24);
    rowRange.setVerticalAlignment("middle");
    rowRange.setWrap(true);
    rowRange.setBorder(true, true, true, true, true, true, "#d0d0d0", SpreadsheetApp.BorderStyle.SOLID);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Log berhasil dicatat ke spreadsheet kantor",
      sheet_name: sheet.getName(),
      new_tab_created: isNewMonthTab,
      row: newRow
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    message: "lazy-log Webhook (Format Kantor) siap menerima log dengan auto-duplicate tab bulanan!"
  })).setMimeType(ContentService.MimeType.JSON);
}
