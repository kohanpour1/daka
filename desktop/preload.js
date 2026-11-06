const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("dakaDesktop", {
  isDesktop: true,
  platform: process.platform,
});
