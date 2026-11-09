/**
 * DAKA — دریافت فایل اکسل/CSV و ذخیره در پوشه مشخص گوگل‌درایو
 *
 * راه‌اندازی (یک‌بار):
 * 1) بروید به https://script.google.com
 * 2) پروژه جدید بسازید و همین کد را جایگزین Code.gs کنید
 * 3) Deploy → New deployment → Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4) لینک Web app را کپی کنید و در اپ (صفحه مشخصات) در باکس «لینک آپلود درایو» بچسبانید
 *
 * پوشه هدف:
 * https://drive.google.com/drive/folders/1VBfT7p5bnJUqxQj2Z6_xbfrguo6MFVLE
 */

var FOLDER_ID = '1VBfT7p5bnJUqxQj2Z6_xbfrguo6MFVLE';

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return json_({ ok: false, error: 'empty body' });
    }
    var data = JSON.parse(e.postData.contents);
    var filename = String(data.filename || 'upload.bin');
    var mime = String(data.mime || 'application/octet-stream');
    var b64 = String(data.base64 || '');
    var meta = data.meta || {};

    if (!b64) {
      return json_({ ok: false, error: 'missing base64' });
    }

    filename = filename.replace(/[\\\/:*?"<>|]/g, '-').substring(0, 180);
    if (!/\.(xlsx|csv)$/i.test(filename)) {
      filename += '.xlsx';
    }

    var folder = DriveApp.getFolderById(FOLDER_ID);
    var bytes = Utilities.base64Decode(b64);
    var blob = Utilities.newBlob(bytes, mime, filename);
    var file = folder.createFile(blob);

    var note = [];
    if (meta.username) note.push('کاربر: ' + meta.username);
    if (meta.ostan) note.push('استان: ' + meta.ostan);
    if (meta.shahrestan) note.push('شهرستان: ' + meta.shahrestan);
    if (meta.roosta) note.push('روستا: ' + meta.roosta);
    if (meta.taavoni) note.push('تعاونی: ' + meta.taavoni);
    if (note.length) {
      try { file.setDescription(note.join(' | ')); } catch (err) {}
    }

    return json_({
      ok: true,
      id: file.getId(),
      name: file.getName(),
      url: file.getUrl()
    });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({
      ok: true,
      service: 'DAKA Drive Upload',
      folder: FOLDER_ID
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
