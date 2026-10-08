/**
 * Google Apps Script for lazy-log (Dynamic Header Mapping, 21 Kolom, & Fitur OVERWRITE)
 * 
 * Fitur:
 * 1. DYNAMIC HEADER MAPPING: Membaca nama kolom di Baris 2 agar tidak pernah salah kolom.
 * 2. FITUR OVERWRITE / UPDATE: Jika dipanggil dengan mode overwrite, script akan mencari
 *    data pada tanggal/task tersebut dan menimpanya (update in-place) tanpa membuat baris baru.
 * 3. RUMUS PRESISI KANTOR:
 *    - Aktual: =N{row}-M{row}
 *    - Late:    =IF(AND(O{row}>K{row};O{row}>0);O{row}-K{row};"")
 *    - Earlier: =IF(AND(K{row}>O{row};O{row}>0);K{row}-O{row};"")
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

function setupOfficeHeader(sheet) {
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
        estDurationColLetter = colLetter;
        row.push(parseDuration(payload.est_duration));
      } else {
        actualDurationColLetter = colLetter;
        row.push(`=${endColLetter || 'N'}${rowNum}-${startColLetter || 'M'}${rowNum}`);
      }
    } else if (h.includes("late")) {
      const act = actualDurationColLetter || 'O';
      const est = estDurationColLetter || 'K';
      row.push(`=IF(AND(${act}${rowNum}>${est}${rowNum};${act}${rowNum}>0);${act}${rowNum}-${est}${rowNum};"")`);
    } else if (h.includes("earlier")) {
      const act = actualDurationColLetter || 'O';
      const est = estDurationColLetter || 'K';
      row.push(`=IF(AND(${est}${rowNum}>${act}${rowNum};${act}${rowNum}>0);${est}${rowNum}-${act}${rowNum};"")`);
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
    const currentHeaders = sheet.getRange(2, 1, 1, totalColsInSheet).getValues()[0];

    const isOverwrite = (payload.overwrite === true || payload.overwrite === "true");

    // 1. Cari baris tanggal pembatas (Merah/Maroon)
    let dateHeaderRow = null;
    if (lastRow >= 4) {
      const colAValues = sheet.getRange(4, 1, lastRow - 3, 1).getValues();
      for (let i = 0; i < colAValues.length; i++) {
        const val = colAValues[i][0];
        if (val && String(val).trim() === todayStr) {
          dateHeaderRow = 4 + i;
          break;
        }
      }
    }

    // 2. JIKA MODE OVERWRITE: Cari dan timpa task yang ada pada tanggal tersebut
    if (isOverwrite && dateHeaderRow !== null) {
      let nextDateRow = lastRow + 1;
      if (lastRow > dateHeaderRow) {
        const colAAll = sheet.getRange(dateHeaderRow + 1, 1, lastRow - dateHeaderRow, 1).getValues();
        for (let i = 0; i < colAAll.length; i++) {
          const val = String(colAAll[i][0] || "").trim();
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
            nextDateRow = dateHeaderRow + 1 + i;
            break;
          }
        }
      }

      const taskRowsCount = nextDateRow - (dateHeaderRow + 1);
      let targetRowToUpdate = null;

      if (taskRowsCount > 0) {
        const taskData = sheet.getRange(dateHeaderRow + 1, 1, taskRowsCount, totalColsInSheet).getValues();
        const reqTaskId = (payload.task_id || "").trim();
        const reqTaskTitle = (payload.task || payload.task_title || "").trim().toLowerCase();

        let matchedIdx = -1;
        for (let r = 0; r < taskData.length; r++) {
          const rowTaskId = String(taskData[r][0] || "").trim();
          let rowTitle = "";
          for (let c = 0; c < currentHeaders.length; c++) {
            if (String(currentHeaders[c]).toLowerCase().includes("task title")) {
              rowTitle = String(taskData[r][c] || "").trim().toLowerCase();
              break;
            }
          }

          if (reqTaskId !== "Non Task" && reqTaskId !== "" && rowTaskId === reqTaskId) {
            matchedIdx = r;
            break;
          } else if (reqTaskTitle && rowTitle && (rowTitle.includes(reqTaskTitle) || reqTaskTitle.includes(rowTitle))) {
            matchedIdx = r;
            break;
          }
        }

        // Jika hanya ada 1 task di hari itu, langsung timpa baris tersebut
        if (matchedIdx === -1 && taskData.length === 1) {
          matchedIdx = 0;
        }

        if (matchedIdx !== -1) {
          targetRowToUpdate = dateHeaderRow + 1 + matchedIdx;
        }
      }

      // Jika baris target ditemukan, TIMPA DATA (OVERWRITE IN-PLACE)
      if (targetRowToUpdate !== null) {
        const mapped = mapPayloadToRow(currentHeaders, payload, targetRowToUpdate);
        sheet.getRange(targetRowToUpdate, 1, 1, mapped.rowValues.length).setValues([mapped.rowValues]);

        sheet.getRange(targetRowToUpdate, 11).setNumberFormat("[h]:mm:ss");
        sheet.getRange(targetRowToUpdate, 12, 1, 3).setNumberFormat("dd/MM/yyyy HH:mm:ss");
        sheet.getRange(targetRowToUpdate, 15, 1, 3).setNumberFormat("[h]:mm:ss");

        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          action: "overwritten",
          message: "Data log pada tanggal " + todayStr + " berhasil diperbarui (di-timpa) pada baris " + targetRowToUpdate,
          sheet_name: sheet.getName(),
          row: targetRowToUpdate
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // 3. JIKA BUKAN OVERWRITE ATAU TANGGAL BELUM ADA: Tambahkan baris baru (APPEND)
    if (dateHeaderRow === null) {
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
    const mapped = mapPayloadToRow(currentHeaders, payload, nextRowNum);
    sheet.appendRow(mapped.rowValues);

    const newRow = sheet.getLastRow();
    const rowRange = sheet.getRange(newRow, 1, 1, totalColsInSheet);
    rowRange.setVerticalAlignment("middle");
    rowRange.setWrap(true);
    rowRange.setBorder(true, true, true, true, true, true, "#d0d0d0", SpreadsheetApp.BorderStyle.SOLID);

    sheet.getRange(newRow, 11).setNumberFormat("[h]:mm:ss");
    sheet.getRange(newRow, 12, 1, 3).setNumberFormat("dd/MM/yyyy HH:mm:ss");
    sheet.getRange(newRow, 15, 1, 3).setNumberFormat("[h]:mm:ss");

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      action: "appended",
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
    message: "lazy-log Webhook (Dynamic Header + Overwrite Support) siap!"
  })).setMimeType(ContentService.MimeType.JSON);
}
