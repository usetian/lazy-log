/**
 * Google Apps Script for lazy-log (Format Kantor)
 * 
 * Fitur Lengkap:
 * 1. Otomatis mencari Tab Sheet berdasarkan Bulan & Tahun berjalan (misal: "Oktober 2026").
 * 2. AUTO-DUPLICATE TEMPLATE: Jika ganti bulan, otomatis menduplikasi tab sebelumnya / Template.
 * 3. AUTO-SETUP BARIS HEADER: Jika sheet masih kosong melompong (sheet baru), otomatis membangun
 *    3 baris header (grup header, judul kolom, dan baris catatan hijau kantor) persis seperti template.
 * 4. BARIS PEMISAH HARIAN: Otomatis membuat baris tanggal merah/maroon (seperti baris 4 pada gambar).
 * 5. AUTO-FILL 24 KOLOM: Memetakan 24 kolom data kerja developer secara otomatis dan rapi.
 */

const MONTH_NAMES_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];
const MONTH_NAMES_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const COLUMN_TITLES = [
  "Task ID", "Status", "Project", "Platform", "Task Type", "Role", "Menu", "Submenu", 
  "Task Title", "Breakdown Task", "Yang akan Dilakukan dan Perlu Dilakukan", "Ask to", 
  "Question", "Lama Pengerjaan", "Hari, Tanggal dan Pukul", "Mulai", "Selesai", 
  "Lama Pengerjaan", "Late", "Earlier", "Why", "Technical", "Collaboration", "Other"
];

/**
 * Membangun 3 baris header kantor jika sheet masih kosong
 */
function setupOfficeHeaderIfEmpty(sheet) {
  if (sheet.getLastRow() >= 3) return;

  // Baris 1: Group Header
  const row1 = new Array(24).fill("");
  row1[0] = "Task detail and Action"; // Col A - J
  row1[10] = "Prep Work";             // Col K - M
  row1[13] = "Estimasi Penyelesaian"; // Col N - O
  row1[15] = "Aktual Selesai";        // Col P - R
  row1[18] = "Performance";           // Col S - U
  row1[21] = "Problem Occur";         // Col V - X
  sheet.appendRow(row1);

  // Merge dan Styling Row 1
  sheet.getRange(1, 1, 1, 10).merge().setBackground("#d9e1f2").setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange(1, 11, 1, 3).merge().setBackground("#b4c6e7").setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange(1, 14, 1, 2).merge().setBackground("#8ea9db").setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange(1, 16, 1, 3).merge().setBackground("#fce4d6").setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange(1, 19, 1, 3).merge().setBackground("#f8cbad").setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange(1, 22, 1, 3).merge().setBackground("#f4b084").setFontWeight("bold").setHorizontalAlignment("center");

  // Baris 2: Column Titles
  sheet.appendRow(COLUMN_TITLES);
  const row2Range = sheet.getRange(2, 1, 1, 24);
  row2Range.setFontWeight("bold").setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.getRange(2, 1, 1, 10).setBackground("#d9e1f2");
  sheet.getRange(2, 11, 1, 3).setBackground("#b4c6e7");
  sheet.getRange(2, 14, 1, 2).setBackground("#8ea9db");
  sheet.getRange(2, 16, 1, 3).setBackground("#fce4d6");
  sheet.getRange(2, 19, 1, 3).setBackground("#f8cbad");
  sheet.getRange(2, 22, 1, 3).setBackground("#f4b084");

  // Baris 3: Catatan Panduan Hijau (Sesuai Gambar)
  const row3 = new Array(24).fill("");
  row3[0] = "* Apabila tidak memiliki Task ID, Task ID nya di isi \"Non Task\"";
  row3[9] = "* Diisikan ketika prepared task / breakdown task";
  row3[10] = "* Diisikan ketika prepared task / breakdown task , dapat disesuaikan ketika brief pagi";
  row3[14] = "* Diisikan ketika prepared task / breakdown task. Format penulisan date-time ikuti yang sudah ada biar seragam dan gampang hitungnya";
  row3[15] = "* diisi ketika mulai task";
  row3[16] = "* diisi ketika selesai task";
  row3[18] = "--- Automatic ---";
  row3[19] = "--- Automatic ---";
  row3[21] = "* Penjelasan kenapa molor atau lebih cepat";
  row3[22] = "* Tuliskan masalah - masalah yang timbul ketika melaksanakan task";
  sheet.appendRow(row3);

  const row3Range = sheet.getRange(3, 1, 1, 24);
  row3Range.setBackground("#c6efce").setFontColor("#006100").setFontSize(9).setVerticalAlignment("middle");

  // Border & Freeze
  sheet.getRange(1, 1, 3, 24).setBorder(true, true, true, true, true, true, "#808080", SpreadsheetApp.BorderStyle.SOLID);
  sheet.setFrozenRows(3);
}

function getTargetSheet(ss) {
  const now = new Date();
  const monthIdx = now.getMonth();
  const year = now.getFullYear();
  const standardName = `${MONTH_NAMES_ID[monthIdx]} ${year}`;

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

  // 1. Cek tab yang sudah cocok
  for (const sheet of sheets) {
    const sName = sheet.getName().trim();
    for (const pat of patterns) {
      if (pat.test(sName)) {
        setupOfficeHeaderIfEmpty(sheet);
        return { sheet: sheet, isNew: false };
      }
    }
  }

  // 2. Jika belum ada tab bulan ini -> Duplikasi Template atau buat tab baru
  let sourceSheet = null;
  for (const sheet of sheets) {
    const name = sheet.getName().toLowerCase();
    if (name.includes("template") || name.includes("master")) {
      sourceSheet = sheet;
      break;
    }
  }

  // Jika tidak ada template, pakai sheet terakhir yang sudah punya header
  if (!sourceSheet && sheets.length > 0) {
    for (let i = sheets.length - 1; i >= 0; i--) {
      if (sheets[i].getLastRow() >= 3) {
        sourceSheet = sheets[i];
        break;
      }
    }
  }

  if (sourceSheet) {
    const newSheet = sourceSheet.copyTo(ss);
    newSheet.setName(standardName);
    ss.setActiveSheet(newSheet);
    ss.moveActiveSheet(ss.getSheets().length);

    // Bersihkan baris data 4 ke bawah
    const lastRow = newSheet.getLastRow();
    if (lastRow >= 4) {
      newSheet.deleteRows(4, lastRow - 3);
    }
    return { sheet: newSheet, isNew: true };
  }

  // Jika spreadsheet benar-benar baru kosong
  let targetSheet = sheets[0];
  if (targetSheet.getName().toLowerCase().startsWith("sheet1") || targetSheet.getName().toLowerCase().startsWith("halaman1")) {
    targetSheet.setName(standardName);
  } else {
    targetSheet = ss.insertSheet(standardName);
  }
  setupOfficeHeaderIfEmpty(targetSheet);
  return { sheet: targetSheet, isNew: true };
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
      if (lastRow >= 4) {
        const prevRowRange = sheet.getRange(lastRow, 1, 1, 24);
        prevRowRange.setBorder(null, null, true, null, null, null, "#000000", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
      }

      sheet.appendRow([todayStr]);
      lastRow = sheet.getLastRow();
      
      const dateRange = sheet.getRange(lastRow, 1, 1, 24);
      dateRange.setBackground("#8b0000"); // Dark Red / Maroon
      dateRange.setFontColor("#ffffff");
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
      message: "Log berhasil dicatat ke spreadsheet",
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
    message: "lazy-log Webhook siap menerima log!"
  })).setMimeType(ContentService.MimeType.JSON);
}
