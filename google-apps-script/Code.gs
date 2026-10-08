/**
 * Google Apps Script for lazy-log (Format Kantor Presisi 21 Kolom & Rumus Otomatis)
 * 
 * Aturan Khusus Format Kantor:
 * 1. Estimasi Lama Pengerjaan (Kolom K): Format durasi "04:00:00"
 * 2. Hari, Tanggal, Pukul Estimasi (Kolom L): Format "dd/MM/yyyy HH:mm:ss"
 * 3. Mulai Aktual (Kolom M) & Selesai Aktual (Kolom N): Format "dd/MM/yyyy HH:mm:ss"
 * 4. Lama Pengerjaan Aktual (Kolom O): Otomatis rumus (=N{row}-M{row})
 * 5. Performance Late (Kolom P) & Earlier (Kolom Q): Otomatis rumus selisih antara Estimasi (K) & Aktual (O)
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
  "Task ID", 
  "Status", 
  "Project", 
  "Menu", 
  "Task Title", 
  "Task Type", 
  "Breakdown Task", 
  "Yang akan Dilakukan dan Perlu Dilakukan", 
  "Ask to", 
  "Question", 
  "Lama Pengerjaan", 
  "Hari, Tanggal dan Pukul", 
  "Mulai", 
  "Selesai", 
  "Lama Pengerjaan", 
  "Late", 
  "Earlier", 
  "Why", 
  "Technical", 
  "Collaboration", 
  "Other"
];

const TOTAL_COLS = 21;

/**
 * Membangun 3 baris header kantor jika sheet masih kosong
 */
function setupOfficeHeaderIfEmpty(sheet) {
  if (sheet.getLastRow() >= 3) return;

  // Baris 1: Group Header (Total 21 Kolom)
  const row1 = new Array(TOTAL_COLS).fill("");
  row1[0] = "Task detail and Action"; // Col 1 - 6
  row1[6] = "Prep Work";             // Col 7 - 10
  row1[10] = "Estimasi Penyelesaian"; // Col 11 - 12
  row1[12] = "Aktual Selesai";        // Col 13 - 15
  row1[15] = "Performance";           // Col 16 - 18
  row1[18] = "Problem Occur";         // Col 19 - 21
  sheet.appendRow(row1);

  // Merge dan Styling Row 1
  sheet.getRange(1, 1, 1, 6).merge().setBackground("#d9e1f2").setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange(1, 7, 1, 4).merge().setBackground("#b4c6e7").setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange(1, 11, 1, 2).merge().setBackground("#8ea9db").setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange(1, 13, 1, 3).merge().setBackground("#fce4d6").setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange(1, 16, 1, 3).merge().setBackground("#f8cbad").setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange(1, 19, 1, 3).merge().setBackground("#f4b084").setFontWeight("bold").setHorizontalAlignment("center");

  // Baris 2: Column Titles
  sheet.appendRow(COLUMN_TITLES);
  const row2Range = sheet.getRange(2, 1, 1, TOTAL_COLS);
  row2Range.setFontWeight("bold").setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.getRange(2, 1, 1, 6).setBackground("#d9e1f2");
  sheet.getRange(2, 7, 1, 4).setBackground("#b4c6e7");
  sheet.getRange(2, 11, 1, 2).setBackground("#8ea9db");
  sheet.getRange(2, 13, 1, 3).setBackground("#fce4d6");
  sheet.getRange(2, 16, 1, 3).setBackground("#f8cbad");
  sheet.getRange(2, 19, 1, 3).setBackground("#f4b084");

  // Baris 3: Catatan Panduan Hijau
  const row3 = new Array(TOTAL_COLS).fill("");
  row3[0] = "* Apabila tidak memiliki Task ID, Task ID nya di isi \"Non Task\"";
  row3[6] = "* Diisikan ketika prepared task / breakdown task";
  row3[7] = "* Diisikan ketika prepared task / breakdown task , dapat disesuaikan ketika brief pagi";
  row3[10] = "Format 4:00:00";
  row3[11] = "* Diisikan ketika prepared task / breakdown task. Format penulisan date-time ikuti yang sudah ada biar seragam dan gampang hitungnya";
  row3[12] = "* diisi ketika mulai task";
  row3[13] = "* diisi ketika selesai task";
  row3[14] = "--- Automatic ---";
  row3[15] = "--- Automatic ---";
  row3[16] = "--- Automatic ---";
  row3[17] = "* Penjelasan kenapa molor atau lebih cepat";
  row3[18] = "* Tuliskan masalah - masalah yang timbul ketika melaksanakan task";
  sheet.appendRow(row3);

  const row3Range = sheet.getRange(3, 1, 1, TOTAL_COLS);
  row3Range.setBackground("#c6efce").setFontColor("#006100").setFontSize(9).setVerticalAlignment("middle");

  sheet.getRange(1, 1, 3, TOTAL_COLS).setBorder(true, true, true, true, true, true, "#808080", SpreadsheetApp.BorderStyle.SOLID);
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

  for (const sheet of sheets) {
    const sName = sheet.getName().trim();
    for (const pat of patterns) {
      if (pat.test(sName)) {
        setupOfficeHeaderIfEmpty(sheet);
        return { sheet: sheet, isNew: false };
      }
    }
  }

  let sourceSheet = null;
  for (const sheet of sheets) {
    const name = sheet.getName().toLowerCase();
    if (name.includes("template") || name.includes("master")) {
      sourceSheet = sheet;
      break;
    }
  }

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

    const lastRow = newSheet.getLastRow();
    if (lastRow >= 4) {
      newSheet.deleteRows(4, lastRow - 3);
    }
    return { sheet: newSheet, isNew: true };
  }

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

// Helper konversi format durasi ke "HH:mm:ss"
function parseDuration(val) {
  if (!val || val === "-") return "04:00:00";
  val = String(val).trim();
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(val)) {
    return val.length === 7 ? "0" + val : val;
  }
  if (/^\d{1,2}:\d{2}$/.test(val)) {
    return (val.length === 4 ? "0" + val : val) + ":00";
  }
  const match = val.match(/^(\d+(\.\d+)?)/);
  if (match) {
    const hours = parseFloat(match[1]);
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
  }
  return val;
}

// Helper format datetime ke "DD/MM/YYYY HH:mm:ss"
function parseDateTime(val, defaultTime) {
  const now = new Date();
  const todayStr = formatDateIndo(now);
  if (!val || val === "-") {
    return `${todayStr} ${defaultTime || Utilities.formatDate(now, "GMT+7", "HH:mm:ss")}`;
  }
  val = String(val).trim();
  // Jika formatnya hanya jam (misal 13:04 atau 13:04:26)
  if (val.length <= 8 && val.includes(":")) {
    const timePart = val.length === 5 ? val + ":00" : val;
    return `${todayStr} ${timePart}`;
  }
  return val;
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

    // Jika belum ada header tanggal hari ini, buat baris pemisah merah/maroon
    if (!dateHeaderExists) {
      if (lastRow >= 4) {
        const prevRowRange = sheet.getRange(lastRow, 1, 1, TOTAL_COLS);
        prevRowRange.setBorder(null, null, true, null, null, null, "#000000", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
      }

      sheet.appendRow([todayStr]);
      lastRow = sheet.getLastRow();
      
      const dateRange = sheet.getRange(lastRow, 1, 1, TOTAL_COLS);
      dateRange.setBackground("#8b0000"); // Dark Red / Maroon
      dateRange.setFontColor("#ffffff");
      dateRange.setFontWeight("bold");
      dateRange.setVerticalAlignment("middle");
    }

    const nextRowNum = lastRow + 1;

    // Nilai Kolom 1 - 10
    const taskId = payload.task_id || "Non Task";
    const status = payload.status || "Done";
    const project = payload.project || "-";
    const menu = payload.menu || "-";
    const taskTitle = payload.task || payload.task_title || "-";
    const taskType = payload.task_type || "Feature";
    const breakdownTask = payload.breakdown_task || payload.details || "-";
    const prepWork = payload.prep_work || payload.details || "-";
    const askTo = payload.ask_to || "-";
    const question = payload.question || "-";

    // Kolom 11: Estimasi Lama Pengerjaan (format 4:00:00)
    const estDuration = parseDuration(payload.est_duration);

    // Kolom 12: Estimasi Hari, Tanggal dan Pukul (dd/MM/yyyy HH:mm:ss)
    const estDateTime = parseDateTime(payload.est_datetime, "17:00:00");

    // Kolom 13 & 14: Aktual Mulai & Selesai (dd/MM/yyyy HH:mm:ss)
    const actualStart = parseDateTime(payload.start_time, Utilities.formatDate(now, "GMT+7", "HH:mm:ss"));
    const actualEnd = parseDateTime(payload.end_time, Utilities.formatDate(now, "GMT+7", "HH:mm:ss"));

    // Kolom 15: Lama Pengerjaan Aktual -> RUMUS OTOMATIS: =N{row}-M{row}
    const formulaActualDuration = `=N${nextRowNum}-M${nextRowNum}`;

    // Kolom 16 & 17: Performance Late & Earlier -> RUMUS OTOMATIS dari Estimasi (K) dan Aktual (O)
    // Late: Jika Aktual (O) > Estimasi (K), hitung selisihnya, jika tidak beri "-"
    const formulaLate = `=IF(O${nextRowNum}>K${nextRowNum}, O${nextRowNum}-K${nextRowNum}, "-")`;
    // Earlier: Jika Aktual (O) < Estimasi (K), hitung selisihnya, jika tidak beri "-"
    const formulaEarlier = `=IF(AND(ISNUMBER(O${nextRowNum}), O${nextRowNum}<K${nextRowNum}, O${nextRowNum}>0), K${nextRowNum}-O${nextRowNum}, "-")`;

    // Kolom 18 - 21
    const why = payload.why || "-";
    const probTech = payload.problem_technical || "-";
    const probCollab = payload.problem_collab || "-";
    const probOther = payload.problem_other || "-";

    // Masukkan baris data
    sheet.appendRow([
      taskId,
      status,
      project,
      menu,
      taskTitle,
      taskType,
      breakdownTask,
      prepWork,
      askTo,
      question,
      estDuration,             // Kolom 11 (K)
      estDateTime,             // Kolom 12 (L)
      actualStart,             // Kolom 13 (M)
      actualEnd,               // Kolom 14 (N)
      formulaActualDuration,   // Kolom 15 (O) -> Rumus
      formulaLate,             // Kolom 16 (P) -> Rumus
      formulaEarlier,          // Kolom 17 (Q) -> Rumus
      why,
      probTech,
      probCollab,
      probOther
    ]);

    const newRow = sheet.getLastRow();
    const rowRange = sheet.getRange(newRow, 1, 1, TOTAL_COLS);
    rowRange.setVerticalAlignment("middle");
    rowRange.setWrap(true);
    rowRange.setBorder(true, true, true, true, true, true, "#d0d0d0", SpreadsheetApp.BorderStyle.SOLID);

    // Format kolom waktu & tanggal agar tampil persis format kantor
    sheet.getRange(newRow, 11).setNumberFormat("[h]:mm:ss");      // Kolom K
    sheet.getRange(newRow, 12, 1, 3).setNumberFormat("dd/MM/yyyy HH:mm:ss"); // Kolom L, M, N
    sheet.getRange(newRow, 15, 1, 3).setNumberFormat("[h]:mm:ss"); // Kolom O, P, Q (Durasi selisih)

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Log berhasil dicatat dengan rumus otomatis aktual & performance",
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
    message: "lazy-log Webhook (Format Kantor Presisi + Rumus Otomatis) siap!"
  })).setMimeType(ContentService.MimeType.JSON);
}
