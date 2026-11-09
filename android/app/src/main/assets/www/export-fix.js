// Export + optional Google Drive upload (loads after app.js)
(function () {
  "use strict";

  var STORAGE_DRIVE = "daka_drive_upload_url_v1";

  function toast(text) {
    var el = document.getElementById("toast");
    if (!el) return;
    el.textContent = text;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.classList.remove("show");
    }, 2600);
  }

  function loadProfile() {
    try {
      return JSON.parse(localStorage.getItem("daka_profile_v2") || "null") || {};
    } catch (e) {
      return {};
    }
  }

  function getRecords() {
    try {
      var arr = JSON.parse(localStorage.getItem("daka_records_v2") || "[]");
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function fileTag() {
    var t = localStorage.getItem("daka_file_tag_v2");
    if (t) return t;
    var d = new Date();
    var p = function (n) {
      return String(n).padStart(2, "0");
    };
    t =
      d.getFullYear() +
      p(d.getMonth() + 1) +
      p(d.getDate()) +
      "-" +
      p(d.getHours()) +
      p(d.getMinutes());
    localStorage.setItem("daka_file_tag_v2", t);
    return t;
  }

  function getDriveUrl() {
    var el = document.getElementById("driveUrl");
    if (el && el.value.trim()) return el.value.trim();
    return localStorage.getItem(STORAGE_DRIVE) || "";
  }

  function saveDriveUrlFromForm() {
    var el = document.getElementById("driveUrl");
    if (!el) return;
    var v = el.value.trim();
    if (v) localStorage.setItem(STORAGE_DRIVE, v);
    else localStorage.removeItem(STORAGE_DRIVE);
  }

  function buildRows() {
    var p = loadProfile();
    return getRecords().map(function (r) {
      return {
        "کد ملی": r.nid,
        "کد تأیید": r.code,
        استان: r.ostan || p.ostan || "",
        شهرستان: r.shahrestan || p.shahrestan || "",
        بخش: r.bakhsh || p.bakhsh || "",
        روستا: r.roosta || p.roosta || "",
        "شرکت تعاونی": r.taavoni || p.taavoni || "",
        "نام کاربر": r.username || p.username || "",
        "زمان ثبت": r.updatedAt || "",
      };
    });
  }

  function profileMeta() {
    var p = loadProfile();
    return {
      username: p.username || "",
      ostan: p.ostan || "",
      shahrestan: p.shahrestan || "",
      bakhsh: p.bakhsh || "",
      roosta: p.roosta || "",
      taavoni: p.taavoni || "",
    };
  }

  function uploadToDrive(filename, mime, base64) {
    var url = getDriveUrl();
    if (!url) {
      return Promise.resolve({ skipped: true });
    }
    toast("در حال ارسال به گوگل‌درایو…");
    return fetch(url, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        filename: filename,
        mime: mime,
        base64: base64,
        meta: profileMeta(),
      }),
    })
      .then(function (res) {
        return res.text().then(function (txt) {
          try {
            return JSON.parse(txt);
          } catch (e) {
            return { ok: res.ok, raw: txt };
          }
        });
      })
      .then(function (data) {
        if (data && data.ok) {
          toast("در گوگل‌درایو ذخیره شد");
          return data;
        }
        toast("ذخیره محلی شد؛ ارسال درایو ناموفق");
        return data;
      })
      .catch(function () {
        toast("ذخیره محلی شد؛ اینترنت/درایو در دسترس نیست");
        return { ok: false };
      });
  }

  function saveLocalAndroid(filename, mime, base64) {
    if (window.Android && typeof window.Android.saveFile === "function") {
      try {
        window.Android.saveFile(filename, mime, base64);
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  function downloadBlob(filename, mime, dataU8orString, isBase64) {
    if (isBase64 && saveLocalAndroid(filename, mime, dataU8orString)) {
      return true;
    }
    try {
      var bytes;
      if (isBase64) {
        var bin = atob(dataU8orString);
        bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      } else if (typeof dataU8orString === "string") {
        bytes = new TextEncoder().encode(dataU8orString);
      } else {
        bytes = dataU8orString;
      }
      var blob = new Blob([bytes], { type: mime });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 500);
      return true;
    } catch (e) {
      return false;
    }
  }

  function exportCsv(rows, name) {
    var headers = Object.keys(rows[0]);
    var lines = [headers.join(",")];
    rows.forEach(function (row) {
      lines.push(
        headers
          .map(function (h) {
            var v = String(row[h] == null ? "" : row[h]);
            if (/[",\n]/.test(v)) v = '"' + v.replace(/"/g, '""') + '"';
            return v;
          })
          .join(",")
      );
    });
    var csv = "\ufeff" + lines.join("\n");
    var csvName = name.replace(/\.xlsx$/i, ".csv");
    var b64 = btoa(unescape(encodeURIComponent(csv)));
    downloadBlob(csvName, "text/csv;charset=utf-8", b64, true);
    uploadToDrive(csvName, "text/csv;charset=utf-8", b64);
  }

  function doExport() {
    var records = getRecords();
    if (!records.length) {
      toast("موردی برای خروجی نیست");
      return;
    }
    var rows = buildRows();
    var p = loadProfile();
    var tag = fileTag();
    var who = (p.username || p.roosta || p.taavoni || "export").replace(/\s+/g, "-");
    var name = "DK-" + who + "-" + tag + ".xlsx";

    function withXlsx() {
      try {
        var ws = XLSX.utils.json_to_sheet(rows);
        var wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "ثبت");
        var range = XLSX.utils.decode_range(ws["!ref"] || "A1");
        for (var R = 1; R <= range.e.r; R++) {
          var cell = ws[XLSX.utils.encode_cell({ r: R, c: 0 })];
          if (cell) {
            cell.t = "s";
            cell.v = String(cell.v);
            cell.z = "@";
          }
        }
        var b64 = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
        var mime =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        if (saveLocalAndroid(name, mime, b64)) {
          toast("فایل روی گوشی ذخیره شد");
        } else if (typeof XLSX.writeFile === "function") {
          try {
            XLSX.writeFile(wb, name);
            toast("فایل اکسل ذخیره شد");
          } catch (e1) {
            downloadBlob(name, mime, b64, true);
            toast("فایل اکسل ذخیره شد");
          }
        } else {
          downloadBlob(name, mime, b64, true);
          toast("فایل اکسل ذخیره شد");
        }
        uploadToDrive(name, mime, b64);
      } catch (e) {
        exportCsv(rows, name);
      }
    }

    if (typeof XLSX !== "undefined") {
      withXlsx();
      return;
    }
    var tries = 0;
    var t = setInterval(function () {
      tries++;
      if (typeof XLSX !== "undefined") {
        clearInterval(t);
        withXlsx();
      } else if (tries > 12) {
        clearInterval(t);
        exportCsv(rows, name);
      }
    }, 200);
  }

  function hook() {
    var el = document.getElementById("driveUrl");
    if (el) {
      el.value = localStorage.getItem(STORAGE_DRIVE) || "";
    }

    var btnGo = document.getElementById("btnGo");
    if (btnGo) {
      btnGo.addEventListener(
        "click",
        function () {
          saveDriveUrlFromForm();
        },
        true
      );
    }

    var btn = document.getElementById("btnExport");
    if (!btn) return;
    btn.addEventListener(
      "click",
      function (e) {
        e.stopImmediatePropagation();
        e.preventDefault();
        doExport();
      },
      true
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", hook);
  } else {
    hook();
  }
})();
