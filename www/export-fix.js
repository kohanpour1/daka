// Android Excel export override (loads after app.js)
(function () {
  "use strict";
  function toast(text) {
    var el = document.getElementById("toast");
    if (!el) return;
    el.textContent = text;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove("show"); }, 2200);
  }

  function loadProfile() {
    try { return JSON.parse(localStorage.getItem("daka_profile_v2") || "null") || {}; }
    catch (e) { return {}; }
  }

  function getRecords() {
    try {
      var arr = JSON.parse(localStorage.getItem("daka_records_v2") || "[]");
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function fileTag() {
    var t = localStorage.getItem("daka_file_tag_v2");
    if (t) return t;
    var d = new Date();
    var p = function (n) { return String(n).padStart(2, "0"); };
    t = d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "-" + p(d.getHours()) + p(d.getMinutes());
    localStorage.setItem("daka_file_tag_v2", t);
    return t;
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
        "زمان ثبت": r.updatedAt || ""
      };
    });
  }

  function downloadCsv(rows, name) {
    var headers = Object.keys(rows[0]);
    var lines = [headers.join(",")];
    rows.forEach(function (row) {
      lines.push(headers.map(function (h) {
        var v = String(row[h] == null ? "" : row[h]);
        if (/[",\n]/.test(v)) v = '"' + v.replace(/"/g, '""') + '"';
        return v;
      }).join(","));
    });
    var csv = "\ufeff" + lines.join("\n");
    if (window.Android && window.Android.saveFile) {
      window.Android.saveFile(name.replace(/\.xlsx$/i, ".csv"), "text/csv;charset=utf-8",
        btoa(unescape(encodeURIComponent(csv))));
      toast("فایل CSV ذخیره شد");
      return;
    }
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = name.replace(/\.xlsx$/i, ".csv");
    document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 400);
    toast("فایل CSV ذخیره شد");
  }

  function doExport() {
    var records = getRecords();
    if (!records.length) { toast("موردی برای خروجی نیست"); return; }
    var rows = buildRows();
    var name = "DK-کد-تأیید-" + fileTag() + ".xlsx";

    function withXlsx() {
      try {
        var ws = XLSX.utils.json_to_sheet(rows);
        var wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "ثبت");
        if (window.Android && window.Android.saveFile) {
          var b64 = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
          window.Android.saveFile(name, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", b64);
          toast("فایل اکسل ذخیره شد");
        } else {
          XLSX.writeFile(wb, name);
          toast("فایل اکسل ذخیره شد");
        }
      } catch (e) {
        downloadCsv(rows, name);
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
        downloadCsv(rows, name);
      }
    }, 200);
  }

  function hook() {
    var btn = document.getElementById("btnExport");
    if (!btn) return;
    btn.addEventListener("click", function (e) {
      e.stopImmediatePropagation();
      e.preventDefault();
      doExport();
    }, true);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hook);
  else hook();
})();
