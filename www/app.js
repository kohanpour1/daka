(() => {
  "use strict";

  const STORAGE_PROFILE = "daka_profile_v2";
  const STORAGE_RECORDS = "daka_records_v2";
  const STORAGE_FILE_TAG = "daka_file_tag_v2";

  const $ = (id) => document.getElementById(id);

  const page1 = $("page1");
  const page2 = $("page2");
  const fields = {
    ostan: $("ostan"),
    shahrestan: $("shahrestan"),
    bakhsh: $("bakhsh"),
    roosta: $("roosta"),
    taavoni: $("taavoni"),
    username: $("username"),
  };

  let records = [];
  let fileTag = "";

  function toast(text) {
    const el = $("toast");
    el.textContent = text;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 2200);
  }

  function setMsg(el, text, type) {
    el.textContent = text || "";
    el.className = "msg" + (type ? " " + type : "");
  }

  function loadProfile() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_PROFILE) || "null") || null;
    } catch (e) {
      return null;
    }
  }

  function saveProfile(p) {
    localStorage.setItem(STORAGE_PROFILE, JSON.stringify(p));
  }

  function loadRecords() {
    try {
      const arr = JSON.parse(localStorage.getItem(STORAGE_RECORDS) || "[]");
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function saveRecords() {
    localStorage.setItem(STORAGE_RECORDS, JSON.stringify(records));
    $("countNum").textContent = String(records.length);
    renderList();
  }

  function loadFileTag() {
    fileTag = localStorage.getItem(STORAGE_FILE_TAG) || "";
    if (!fileTag) {
      fileTag = newFileTag();
      localStorage.setItem(STORAGE_FILE_TAG, fileTag);
    }
  }

  function newFileTag() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "-" + pad(d.getHours()) + pad(d.getMinutes());
  }

  function onlyDigits(s) {
    return String(s || "").replace(/\D/g, "");
  }

  function isValidNid(nid) {
    if (!/^\d{10}$/.test(nid)) return false;
    if (/^(\d)\1{9}$/.test(nid)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(nid[i], 10) * (10 - i);
    const r = sum % 11;
    const check = parseInt(nid[9], 10);
    return (r < 2 && check === r) || (r >= 2 && check === 11 - r);
  }

  function profileFromForm() {
    return {
      ostan: fields.ostan.value.trim(),
      shahrestan: fields.shahrestan.value.trim(),
      bakhsh: fields.bakhsh.value.trim(),
      roosta: fields.roosta.value.trim(),
      taavoni: fields.taavoni.value.trim(),
      username: fields.username.value.trim(),
    };
  }

  function fillForm(p) {
    if (!p) return;
    fields.ostan.value = p.ostan || "";
    fields.shahrestan.value = p.shahrestan || "";
    fields.bakhsh.value = p.bakhsh || "";
    fields.roosta.value = p.roosta || "";
    fields.taavoni.value = p.taavoni || "";
    fields.username.value = p.username || "";
  }

  function profileLine(p) {
    const parts = [p.ostan, p.shahrestan, p.bakhsh, p.roosta, p.taavoni, p.username].filter(Boolean);
    return parts.join(" · ");
  }

  function showPage1() {
    page1.classList.remove("hidden");
    page2.classList.add("hidden");
  }

  function showPage2() {
    const p = loadProfile();
    $("placeLine").textContent = p ? profileLine(p) : "";
    page1.classList.add("hidden");
    page2.classList.remove("hidden");
    $("nid").focus();
  }

  function goNext() {
    const p = profileFromForm();
    if (!p.ostan && !p.shahrestan && !p.roosta && !p.username) {
      setMsg($("p1msg"), "حداقل استان یا شهرستان یا روستا یا نام کاربر را وارد کنید.", "err");
      return;
    }
    saveProfile(p);
    setMsg($("p1msg"), "");
    showPage2();
  }

  function saveEntry() {
    const nid = onlyDigits($("nid").value);
    const code = String($("code").value || "").trim();
    if (!isValidNid(nid)) {
      setMsg($("p2msg"), "کد ملی معتبر ۱۰ رقمی وارد کنید.", "err");
      $("nid").focus();
      return;
    }
    if (!code) {
      setMsg($("p2msg"), "کد تأیید را وارد کنید.", "err");
      $("code").focus();
      return;
    }

    const p = loadProfile() || {};
    const now = new Date().toISOString();
    const idx = records.findIndex((r) => r.nid === nid);
    const row = {
      nid: nid,
      code: code,
      ostan: p.ostan || "",
      shahrestan: p.shahrestan || "",
      bakhsh: p.bakhsh || "",
      roosta: p.roosta || "",
      taavoni: p.taavoni || "",
      username: p.username || "",
      updatedAt: now,
    };

    if (idx >= 0) {
      records[idx] = Object.assign({}, records[idx], row);
      setMsg($("p2msg"), "کد تأیید برای این کد ملی به‌روز شد.", "ok");
      toast("جایگزین شد");
    } else {
      records.unshift(row);
      setMsg($("p2msg"), "ثبت موفق بود.", "ok");
      toast("ثبت شد");
    }

    saveRecords();
    $("nid").value = "";
    $("code").value = "";
    $("nid").focus();
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderList() {
    const body = $("listBody");
    if (!records.length) {
      body.innerHTML = '<div style="padding:16px;text-align:center;color:#6b645a">موردی ثبت نشده است.</div>';
      return;
    }
    body.innerHTML = records
      .map(function (r, i) {
        return (
          '<div class="row-item">' +
          '<div class="row-main">' +
          "<div><b>کد ملی:</b> " + escapeHtml(r.nid) + "</div>" +
          "<div><b>کد تأیید:</b> " + escapeHtml(r.code) + "</div>" +
          "</div>" +
          '<div class="row-actions">' +
          '<button type="button" data-edit="' + i + '">ویرایش</button>' +
          '<button type="button" class="del" data-del="' + i + '">حذف</button>' +
          "</div></div>"
        );
      })
      .join("");
  }

  function exportExcel() {
    if (typeof XLSX === "undefined") {
      toast("کتابخانه اکسل بارگذاری نشده است");
      return;
    }
    if (!records.length) {
      toast("موردی برای خروجی نیست");
      return;
    }
    const p = loadProfile() || {};
    const rows = records.map(function (r) {
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
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ثبت");
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
    for (let R = 1; R <= range.e.r; R++) {
      const cell = ws[XLSX.utils.encode_cell({ r: R, c: 0 })];
      if (cell) {
        cell.t = "s";
        cell.v = String(cell.v);
        cell.z = "@";
      }
    }
    const name = "DAKA-کد-تأیید-" + (fileTag || newFileTag()) + ".xlsx";
    XLSX.writeFile(wb, name);
    toast("فایل اکسل ذخیره شد");
  }

  function clearAll() {
    if (!records.length) {
      toast("لیست خالی است");
      return;
    }
    if (!confirm("همه موارد ثبت‌شده پاک شوند؟")) return;
    records = [];
    saveRecords();
    setMsg($("p2msg"), "همه موارد پاک شد.", "ok");
    toast("پاکسازی انجام شد");
  }

  function createNewFile() {
    if (records.length && !confirm("فایل جدید ساخته شود؟ موارد فعلی از صفحه پاک می‌شود (در خروجی قبلی ذخیره کنید).")) {
      return;
    }
    records = [];
    saveRecords();
    fileTag = newFileTag();
    localStorage.setItem(STORAGE_FILE_TAG, fileTag);
    setMsg($("p2msg"), "فایل جدید آماده است. ثبت‌ها از صفر شروع می‌شود.", "ok");
    toast("فایل جدید");
  }

  function bind() {
    $("btnGo").addEventListener("click", goNext);
    $("btnEditPlace").addEventListener("click", showPage1);
    $("btnSave").addEventListener("click", saveEntry);
    $("btnExport").addEventListener("click", exportExcel);
    $("btnClear").addEventListener("click", clearAll);
    $("btnNewFile").addEventListener("click", createNewFile);

    $("btnToggleList").addEventListener("click", function () {
      $("listPanel").classList.toggle("hidden");
      renderList();
    });

    $("listBody").addEventListener("click", function (e) {
      const t = e.target;
      if (!t || !t.dataset) return;
      if (t.dataset.edit != null) {
        const r = records[Number(t.dataset.edit)];
        if (!r) return;
        $("nid").value = r.nid;
        $("code").value = r.code;
        $("nid").focus();
        toast("برای ویرایش، کد را تغییر دهید و ثبت کنید");
      }
      if (t.dataset.del != null) {
        const i = Number(t.dataset.del);
        if (!confirm("این مورد حذف شود؟")) return;
        records.splice(i, 1);
        saveRecords();
        toast("حذف شد");
      }
    });

    ["nid", "code"].forEach(function (id) {
      $(id).addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          if (id === "nid") $("code").focus();
          else saveEntry();
        }
      });
    });

    Object.keys(fields).forEach(function (k) {
      fields[k].addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          goNext();
        }
      });
    });
  }

  function init() {
    bind();
    loadFileTag();
    records = loadRecords();
    $("countNum").textContent = String(records.length);
    renderList();

    const p = loadProfile();
    if (p && (p.ostan || p.shahrestan || p.roosta || p.username || p.taavoni || p.bakhsh)) {
      fillForm(p);
      showPage2();
    } else {
      showPage1();
    }
  }

  init();
})();
