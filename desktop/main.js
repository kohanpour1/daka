const { app, BrowserWindow, shell, Menu, nativeImage } = require("electron");
const path = require("path");
const fs = require("fs");

/** Resolve www folder in dev (repo) and packaged (resources) layouts. */
function resolveWww() {
  const candidates = [
    path.join(process.resourcesPath || "", "www"),
    path.join(__dirname, "..", "www"),
    path.join(__dirname, "www"),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "index.html"))) return dir;
  }
  return path.join(__dirname, "..", "www");
}

function resolveIcon() {
  const candidates = [
    path.join(__dirname, "build", "icon.png"),
    path.join(__dirname, "assets", "icon.png"),
    path.join(process.resourcesPath || "", "www", "logo-daka.png"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

let mainWindow = null;

function createWindow() {
  const iconPath = resolveIcon();
  const winOpts = {
    width: 980,
    height: 860,
    minWidth: 720,
    minHeight: 640,
    backgroundColor: "#f3efe6",
    show: false,
    autoHideMenuBar: true,
    title: "DAKA — ثبت کد تأیید مرحله ۲",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  };
  if (iconPath) {
    winOpts.icon = nativeImage.createFromPath(iconPath);
  }

  mainWindow = new BrowserWindow(winOpts);

  const menu = Menu.buildFromTemplate([
    {
      label: "فایل",
      submenu: [
        { role: "reload", label: "بازخوانی" },
        { role: "toggleDevTools", label: "ابزار توسعه", visible: !app.isPackaged },
        { type: "separator" },
        { role: "quit", label: "خروج" },
      ],
    },
  ]);
  Menu.setApplicationMenu(menu);

  const www = resolveWww();
  mainWindow.loadFile(path.join(www, "index.html"));

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
