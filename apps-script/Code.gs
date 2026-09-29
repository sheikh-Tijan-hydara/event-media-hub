// Google Apps Script backend. Runs as YOUR Google account, so no credentials ever reach the browser.
// Setup: Services (+) > add "Drive API" (v3). Deploy > Web app > Execute as: Me, Who has access: Anyone.

function doGet(e) {
  var p = e.parameter, out;
  try {
    if (p.action === 'list') out = listFiles(p);
    else if (p.action === 'session') out = uploadSession(p);
    else out = { error: 'Unknown action' };
  } catch (err) { out = { error: String(err.message || err) }; }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function dayFolder(day) {
  if (!/^day[1-4]$/.test(day)) throw new Error('Invalid day');
  var it = DriveApp.getFoldersByName(day);
  if (it.hasNext()) return it.next();
  var f = DriveApp.createFolder(day);
  f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); // lets thumbnails and downloads work
  return f;
}

function listFiles(p) {
  var id = dayFolder(p.day).getId();
  var r = Drive.Files.list({
    q: "'" + id + "' in parents and trashed=false and (mimeType contains 'image/' or mimeType contains 'video/')",
    orderBy: 'createdTime desc', pageSize: 24, pageToken: p.pageToken || undefined,
    fields: 'nextPageToken,files(id,name,mimeType,size,createdTime)'
  });
  return { files: r.files || [], nextPageToken: r.nextPageToken || null };
}

function uploadSession(p) {
  var res = UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
    method: 'post', contentType: 'application/json; charset=UTF-8',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken(), 'X-Upload-Content-Type': p.type, Origin: p.origin },
    payload: JSON.stringify({ name: p.name, parents: [dayFolder(p.day).getId()] })
  });
  return { url: res.getHeaders()['Location'] };
}
