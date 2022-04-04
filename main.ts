const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  autoUpdater,
} = require("electron");
const { remove } = require("fs-jetpack");

const server =
  "https://randomerizer-update-repo-8rbypobkf-domerzezy.vercel.app";
const url = `${server}/update/${process.platform}/${app.getVersion()}`;

autoUpdater.setFeedURL({ url });

setInterval(() => {
  autoUpdater.checkForUpdates();
}, 300000);

const createWindow = () => {
  const win = new BrowserWindow({
    width: 390,
    height: 630,
    backgroundColor: "#333333",
    frame: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile("index.html");
  // win.webContents.openDevTools({ mode: "detach" });
  app.on("ready", () => {
    win.show();
  });

  ipcMain.on("min", () => {
    win.minimize();
  });

  ipcMain.on("close", () => {
    win.close();
  });

  ipcMain.on("quitAndInstall", () => {
    autoUpdater.quitAndInstall();
  });

  ipcMain.handle("openSetupFile", async () => {
    const file = await dialog.showOpenDialog(win, {
      properties: ["openFile"],
      filters: [{ name: "JSON files", extensions: ["json"] }],
    });
    return file;
  });

  ipcMain.handle("saveSetupFile", async () => {
    const date = new Date();
    const file = await dialog.showSaveDialog(win, {
      defaultPath: `/setups/setup-${date.getDate()}-${
        date.getMonth() + 1
      }-${date.getFullYear()}.json`,
      filters: [{ name: "JSON file", extensions: ["json"] }],
    });
    return file;
  });

  ipcMain.handle("saveResultsFile", async () => {
    const date = new Date();
    const file = await dialog.showSaveDialog(win, {
      defaultPath: `/results/results-${date.getDate()}-${
        date.getMonth() + 1
      }-${date.getFullYear()}.json`,
      filters: [{ name: "JSON file", extensions: ["json"] }],
    });
    return file;
  });

  ipcMain.handle("openResultsFile", async () => {
    const file = await dialog.showOpenDialog(win, {
      properties: ["openFile"],
      filters: [{ name: "JSON files", extensions: ["json"] }],
    });
    return file;
  });

  autoUpdater.on("update-downloaded", (e, rno, rna) => {
    win.webContents.send("updateReady");
  });
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
