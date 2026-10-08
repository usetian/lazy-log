/**
 * Google Apps Script for lazy-log (Dynamic Header Mapping & 21 Kolom Kantor)
 * 
 * Keunggulan Versi Ini:
 * 1. DYNAMIC HEADER MAPPING: Script membaca nama header di Baris 2 secara langsung!
 *    Tidak akan pernah salah kolom lagi meskipun susunan kolom diubah-ubah.
 * 2. Menggunakan 21 Kolom Presisi Dokumen Kantor.
 * 3. Rumus otomatis dinamis (Selesai - Mulai) & Performance (Late / Earlier).
 * 4. Fungsi 'resetSheetHeaders()' untuk mereset tampilan sheet ke format 21 kolom rapi dengan 1 klik.
 */

const MONTH_NAMES_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];
const MONTH_NAMES_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// 21 Kolom Standar Kantor Presisi
const EXACT_OFFICE_HEADERS = [
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

const TOTAL_COLS = EXACT_OFFICE_HEADERS.length; // 21

function columnToLetter(column) {
  let temp, letter = '';
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = Math.floor((column - temp - 1) / 26);
  }
  return letter;
}

/**
 * Fungsi untuk membangun / mereset 3 baris header kantor ke 21 kolom presisi
 */
function setupOfficeHeader(sheet) {
  // Hapus semua baris lama agar bersih
  sheet.clear();

  // Baris 1: Group Header (21 Kolom)
  const row1 = new Array(TOTAL_COLS).fill("");
  row1[0] = "Task detail and Action"; // Col A - F (1 - 6)
  row1[6] = "Prep Work";             // Col G - J (7 - 10)
  row1[10] = "Estimasi Penyelesaian"; // Col K - L (11 - 12)
  row1[12] = "Aktual Selesai";        // Col M - O (13 - 15)
  row1[15] = "Performance";           // Col P - R (16 - 18)
  row1[18] = "Problem Occur";         // Col S - U (19 - 21)
  sheet.appendRow(row1);

  sheet.getRange(1, 1, 1, 6).merge().setBackground("#d9e1f2").setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange(1, 7, 1, 4).merge().setBackground("#b4c6e7").setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange(1, 11, 1, 2).merge().setBackground("#8ea9db").setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange(1, 13, 1, 3).merge().setBackground("#fce4d6").setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange(1, 16, 1, 3).merge().setBackground("#f8cbad").setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange(1, 19, 1, 3).merge().setBackground("#f4b084").setFontWeight("bold").setHorizontalAlignment("center");

  // Baris 2: Column Titles
  sheet.appendRow(EXACT_OFFICE_HEADERS);
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

/**
 * Jalankan fungsi ini langsung dari editor Apps Script jika ingin mereset sheet aktif ke 21 kolom rapi!
 */
function resetSheetHeaders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  setupOfficeHeader(sheet);
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
        if (sheet.getLastRow() < 3) setupOfficeHeader(sheet);
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
  setupOfficeHeader(targetSheet);
  return { sheet: targetSheet, isNew: true };
}

function formatDateIndo(date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

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

function parseDateTime(val, defaultTime) {
  const now = new Date();
  const todayStr = formatDateIndo(now);
  if (!val || val === "-") {
    return `${todayStr} ${defaultTime || Utilities.formatDate(now, "GMT+7", "HH:mm:ss")}`;
  }
  val = String(val).trim();
  if (val.length <= 8 && val.includes(":")) {
    const timePart = val.length === 5 ? val + ":00" : val;
    return `${todayStr} ${timePart}`;
  }
  return val;
}

/**
 * DYNAMIC HEADER MAPPER:
 * Membaca nama kolom dari Baris 2 sheet secara dinamis.
 * Menjamin nilai masuk ke kolom yang BENAR 100% tanpa bergantung pada posisi indeks!
 */
function mapPayloadToRow(headers, payload, rowNum) {
  let estDurationColLetter = null;
  let actualDurationColLetter = null;
  let startColLetter = null;
  let endColLetter = null;
  let lamaPengerjaanCount = 0;

  const row = [];

  for (let i = 0; i < headers.length; i++) {
    const colLetter = columnToLetter(i + 1);
    const h = String(headers[i] || "").trim().toLowerCase().replace(/\r?\n|\r/g, " ");

    if (h.includes("task id")) {
      row.push(payload.task_id || "Non Task");
    } else if (h.includes("status")) {
      row.push(payload.status || "Done");
    } else if (h.includes("project")) {
      row.push(payload.project || "-");
    } else if (h === "menu" || (h.includes("menu") && !h.includes("submenu"))) {
      row.push(payload.menu || "-");
    } else if (h.includes("task title")) {
      row.push(payload.task || payload.task_title || "-");
    } else if (h.includes("task type")) {
      row.push(payload.task_type || "Feature");
    } else if (h.includes("breakdown")) {
      row.push(payload.breakdown_task || payload.details || "-");
    } else if (h.includes("yang akan dilakukan")) {
      row.push(payload.prep_work || payload.details || "-");
    } else if (h.includes("ask to")) {
      row.push(payload.ask_to || "-");
    } else if (h.includes("question")) {
      row.push(payload.question || "-");
    } else if (h.includes("hari, tanggal")) {
      row.push(parseDateTime(payload.est_datetime, "17:00:00"));
    } else if (h.includes("mulai")) {
      startColLetter = colLetter;
      row.push(parseDateTime(payload.start_time, "09:00:00"));
    } else if (h.includes("selesai")) {
      endColLetter = colLetter;
      row.push(parseDateTime(payload.end_time, "17:00:00"));
    } else if (h.includes("lama pengerjaan")) {
      lamaPengerjaanCount++;
      if (lamaPengerjaanCount === 1) {
        // Kolom 11: Estimasi Lama Pengerjaan
        estDurationColLetter = colLetter;
        row.push(parseDuration(payload.est_duration));
      } else {
        // Kolom 15: Aktual Lama Pengerjaan -> Rumus =Selesai - Mulai
        actualDurationColLetter = colLetter;
        row.push(`=${endColLetter || 'N'}${rowNum}-${startColLetter || 'M'}${rowNum}`);
      }
    } else if (h.includes("late")) {
      const act = actualDurationColLetter || 'O';
      const est = estDurationColLetter || 'K';
      row.push(`=IF(${act}${rowNum}>${est}${rowNum}, ${act}${rowNum}-${est}${rowNum}, "-")`);
    } else if (h.includes("earlier")) {
      const act = actualDurationColLetter || 'O';
      const est = estDurationColLetter || 'K';
      row.push(`=IF(AND(ISNUMBER(${act}${rowNum}), ${act}${rowNum}<${est}${rowNum}, ${act}${rowNum}>0), ${est}${rowNum}-${act}${rowNum}, "-")`);
    } else if (h.includes("why")) {
      row.push(payload.why || "-");
    } else if (h.includes("technical")) {
      row.push(payload.problem_technical || "-");
    } else if (h.includes("collaboration")) {
      row.push(payload.problem_collab || "-");
    } else if (h.includes("other")) {
      row.push(payload.problem_other || "-");
    } else if (h.includes("platform")) {
      row.push(payload.platform || "Mobile");
    } else if (h.includes("role")) {
      row.push(payload.role || "Developer");
    } else if (h.includes("submenu")) {
      row.push(payload.submenu || "-");
    } else {
      row.push("-");
    }
  }

  return {
    rowValues: row,
    estCol: estDurationColLetter,
    startCol: startColLetter,
    endCol: endColLetter,
    actCol: actualDurationColLetter
  };
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
    const totalColsInSheet = sheet.getLastColumn() || TOTAL_COLS;

    // Cek apakah baris pembatas tanggal hari ini sudah ada
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

    // Jika belum ada tanggal hari ini, buat baris pemisah merah/maroon
    if (!dateHeaderExists) {
      if (lastRow >= 4) {
        const prevRowRange = sheet.getRange(lastRow, 1, 1, totalColsInSheet);
        prevRowRange.setBorder(null, null, true, null, null, null, "#000000", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
      }

      sheet.appendRow([todayStr]);
      lastRow = sheet.getLastRow();
      
      const dateRange = sheet.getRange(lastRow, 1, 1, totalColsInSheet);
      dateRange.setBackground("#8b0000"); // Dark Red / Maroon
      dateRange.setFontColor("#ffffff");
      dateRange.setFontWeight("bold");
      dateRange.setVerticalAlignment("middle");
    }

    const nextRowNum = lastRow + 1;

    // BACA HEADER DARI BARIS 2 SECARA DINAMIS
    const currentHeaders = sheet.getRange(2, 1, 1, totalColsInSheet).getValues()[0];
    const mapped = mapPayloadToRow(currentHeaders, payload, nextRowNum);

    // Masukkan baris data baru persis ke kolom masing-masing
    sheet.appendRow(mapped.rowValues);

    const newRow = sheet.getLastRow();
    const rowRange = sheet.getRange(newRow, 1, 1, totalColsInSheet);
    rowRange.setVerticalAlignment("middle");
    rowRange.setWrap(true);
    rowRange.setBorder(true, true, true, true, true, true, "#d0d0d0", SpreadsheetApp.BorderStyle.SOLID);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Log berhasil dicatat dengan Dynamic Header Mapping",
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
    message: "lazy-log Webhook (Dynamic Header Mapping) aktif dan siap!"
  })).setMimeType(ContentService.MimeType.JSON);
}
