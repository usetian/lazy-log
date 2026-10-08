/**
 * Google Apps Script for lazy-log
 * 
 * Cara Setup:
 * 1. Buat Google Spreadsheet baru di https://sheets.new
 * 2. Buka menu Extensions > Apps Script
 * 3. Hapus kode default, lalu tempel (paste) kode ini
 * 4. Klik "Save" (ikon disket)
 * 5. Klik "Deploy" > "New deployment"
 * 6. Pilih tipe: "Web app"
 * 7. Isi:
 *    - Description: "lazy-log Webhook"
 *    - Execute as: "Me (<email-anda>)"
 *    - Who has access: "Anyone" (PENTING: agar script curl/python bisa mengirim tanpa login browser)
 * 8. Klik "Deploy", izinkan hak akses (Authorize access), lalu salin "Web app URL"
 * 9. Masukkan Web app URL tersebut ke config.json di lazy-log!
 */

const SHEET_NAME = "DevLogs";

const HEADERS = [
  "Timestamp",
  "Developer",
  "Project",
  "Task / Feature",
  "Technical Details",
  "Files Changed",
  "Git Branch",
  "Commit",
  "Status"
];

function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    // Buat sheet jika belum ada
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }

    // Jika sheet masih baru/kosong, pasang header dan styling
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#1a73e8");
      headerRange.setFontColor("#ffffff");
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }

    const timestamp = payload.timestamp || Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");
    const developer = payload.developer || "Developer";
    const project = payload.project || "-";
    const task = payload.task || "-";
    const details = payload.details || "-";
    const filesChanged = Array.isArray(payload.files_changed) 
      ? payload.files_changed.join(", ") 
      : (payload.files_changed || "-");
    const branch = payload.branch || "-";
    const commit = payload.commit || "-";
    const status = payload.status || "Completed";

    sheet.appendRow([
      timestamp,
      developer,
      project,
      task,
      details,
      filesChanged,
      branch,
      commit,
      status
    ]);

    // Format row baru agar rapi (vertical align top, wrap text)
    const lastRow = sheet.getLastRow();
    const rowRange = sheet.getRange(lastRow, 1, 1, HEADERS.length);
    rowRange.setVerticalAlignment("top");
    rowRange.setWrap(true);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Log successfully written to Google Sheets",
      row: lastRow
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    message: "lazy-log Webhook is active and ready to receive logs!"
  })).setMimeType(ContentService.MimeType.JSON);
}
