/**
 * Google Apps Script for lazy-log (Format Kantor)
 * 
 * Fitur:
 * 1. Otomatis mencari Tab Sheet berdasarkan Bulan & Tahun berjalan (misal: "Oktober 2026", "October 2026", "10-2026", atau tab aktif).
 * 2. Otomatis membuat baris pembatas tanggal merah/maroon (seperti baris 4) jika hari ini belum tercatat.
 * 3. Memetakan 24 kolom format kantor (Task ID, Status, Project, Platform, Task Type, Role, Menu, Submenu, Task Title, Breakdown, dll).
 * 4. Kolom otomatis (Late, Earlier) dibiarkan atau diisi formula sesuai template kantor.
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

function getTargetSheet(ss) {
  const now = new Date();
  const monthIdx = now.getMonth();
  const year = now.getFullYear();

  const possibleNames = [
    `${MONTH_NAMES_ID[monthIdx]} ${year}`,
    `${MONTH_NAMES_EN[monthIdx]} ${year}`,
    `${MONTH_NAMES_ID[monthIdx]}`,
    `${MONTH_NAMES_EN[monthIdx]}`,
    `${String(monthIdx + 1).padStart(2, '0')}-${year}`,
    `${year}-${String(monthIdx + 1).padStart(2, '0')}`
  ];

  // Cari sheet yang cocok
  for (const name of possibleNames) {
    const sheet = ss.getSheetByName(name);
    if (sheet) return sheet;
  }

  // Jika tidak ditemukan, gunakan active sheet atau buat baru dengan format "Bulan Tahun"
  const active = ss.getActiveSheet();
  if (active) return active;

  return ss.insertSheet(`${MONTH_NAMES_ID[monthIdx]} ${year}`);
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
    const sheet = getTargetSheet(ss);

    const now = new Date();
    const todayStr = payload.date_str || formatDateIndo(now);

    // Cek baris terakhir
    let lastRow = sheet.getLastRow();

    // Cek apakah baris pembatas hari ini (seperti baris merah tanggal) sudah ada
    let dateHeaderExists = false;
    if (lastRow >= 4) {
      // Periksa kolom A dari baris 4 sampai lastRow apakah tanggal hari ini sudah pernah ditulis sebagai header tanggal
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
      // Jika baris sebelumnya adalah data kemarin, beri border bawah tebal pada baris kemarin
      if (lastRow >= 4) {
        const prevRowRange = sheet.getRange(lastRow, 1, 1, 24);
        prevRowRange.setBorder(null, null, true, null, null, null, "#000000", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
      }

      sheet.appendRow([todayStr]);
      lastRow = sheet.getLastRow();
      
      // Styling baris pemisah tanggal (Merah gelap/Maroon seperti di gambar)
      const dateRange = sheet.getRange(lastRow, 1, 1, 24);
      dateRange.setBackground("#8b0000"); // Dark Red / Maroon
      dateRange.setFontColor("#ffffff"); // White font
      dateRange.setFontWeight("bold");
      dateRange.setVerticalAlignment("middle");
    }

    // Pemetaan 24 Kolom sesuai Format Kantor:
    // 1. Task ID (jika kosong isi "Non Task")
    const taskId = payload.task_id || "Non Task";
    
    // 2. Status
    const status = payload.status || "Done";

    // 3. Project
    const project = payload.project || "-";

    // 4. Platform (Web, Mobile, Backend, dsb)
    const platform = payload.platform || "Web";

    // 5. Task Type (Feature, Bugfix, Refactor, Maintenance, dsb)
    const taskType = payload.task_type || "Feature";

    // 6. Role (Frontend, Backend, Fullstack, Mobile Developer, dll)
    const role = payload.role || "Developer";

    // 7. Menu
    const menu = payload.menu || "-";

    // 8. Submenu
    const submenu = payload.submenu || "-";

    // 9. Task Title
    const taskTitle = payload.task || payload.task_title || "-";

    // 10. Breakdown Task
    const breakdownTask = payload.breakdown_task || payload.details || "-";

    // 11. Yang akan Dilakukan dan Perlu Dilakukan
    const prepWork = payload.prep_work || payload.details || "-";

    // 12. Ask to
    const askTo = payload.ask_to || "-";

    // 13. Question
    const question = payload.question || "-";

    // 14. Estimasi Lama Pengerjaan
    const estDuration = payload.est_duration || "-";

    // 15. Estimasi Hari, Tanggal dan Pukul
    const estDateTime = payload.est_datetime || "-";

    // 16. Aktual Mulai (Jam mulai)
    const actualStart = payload.start_time || Utilities.formatDate(now, "GMT+7", "HH:mm");

    // 17. Aktual Selesai (Jam selesai)
    const actualEnd = payload.end_time || Utilities.formatDate(now, "GMT+7", "HH:mm");

    // 18. Aktual Lama Pengerjaan
    const actualDuration = payload.actual_duration || "-";

    // 19. Performance: Late (Automatic / biarkan kosong jika ada formula)
    const late = payload.late || "";

    // 20. Performance: Earlier (Automatic / biarkan kosong jika ada formula)
    const earlier = payload.earlier || "";

    // 21. Performance: Why (Alasan molor / lebih cepat)
    const why = payload.why || "-";

    // 22. Problem Occur: Technical
    const probTech = payload.problem_technical || "-";

    // 23. Problem Occur: Collaboration
    const probCollab = payload.problem_collab || "-";

    // 24. Problem Occur: Other
    const probOther = payload.problem_other || "-";

    // Masukkan baris data
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
    // Beri border tipis standar tabel
    rowRange.setBorder(true, true, true, true, true, true, "#d0d0d0", SpreadsheetApp.BorderStyle.SOLID);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Berhasil menambahkan baris log ke sheet format kantor",
      sheet_name: sheet.getName(),
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
    message: "lazy-log Webhook (Format Kantor) siap menerima log!"
  })).setMimeType(ContentService.MimeType.JSON);
}
