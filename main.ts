const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const { remove } = require("fs-jetpack");

const isDuplicatedInstance = app.requestSingleInstanceLock();

let win;

const createWindow = () => {
  win = new BrowserWindow({
    width: 390,
    height: 630,
    backgroundColor: "#000",
    frame: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: isDev(),
    },
  });

  win.loadFile("mainMenu.html");
  if(isDev()) win.webContents.openDevTools({ mode: "detach" });

  app.on("ready", () => {
    win.show();
  });

  ipcMain.on("min", () => {
    win.minimize();
  });

  ipcMain.on("close", () => {
    const allWindows = BrowserWindow.getAllWindows();
    allWindows.forEach((window) => window.close());
  });

  ipcMain.on("openCreator", () => {
    const creatorWin = new BrowserWindow({
      width: 400,
      height: 430,
      backgroundColor: "#000",
      frame: false,
      resizable: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        devTools: isDev(),
      },
    });
    creatorWin.loadFile("./setupCreator/index.html");
    creatorWin.show();
    ipcMain.on("minAdditional", () => {
      creatorWin.minimize();
    });

    ipcMain.on("closeAdditional", () => {
      creatorWin.close();
    });
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
};

// for v1.0.0-global
// if (!isDuplicatedInstance) {
//   app.quit();
// } else {
//   app.on("second-instance", () => {
//     if (win) {
//       if (win.isMinimized()) win.restore();
//       win.focus();
//     }
//   });
// }

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

const isDev = () => {
  return process.argv[2] === "--dev";
};
