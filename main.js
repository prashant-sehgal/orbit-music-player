const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  globalShortcut,
} = require("electron");
const fs = require("node:fs");
const { getMusicData } = require("./getMusicData");
const Menu = require("./Menu");
const { writeFile } = require("node:fs/promises");

const database = JSON.parse(
  fs.readFileSync(`${__dirname}/database.json`, "utf-8")
);

let mainWindow;
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
    icon: `${__dirname}/img/icon.png`,
  });

  // win.setMenu(null);
  mainWindow.setMenu(Menu(() => createMusicFolderWindow()));
  mainWindow.loadFile(`${__dirname}/index.html`);
};

function createMusicFolderWindow() {
  mainWindow.setIgnoreMouseEvents(true);
  mainWindow.setResizable(false);
  const win = new BrowserWindow({
    width: 600,
    height: 300,
    minimizable: false,
    maximizable: false,
    alwaysOnTop: true,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
    icon: `${__dirname}/img/icon.png`,
  });

  win.setMenu(null);
  // win.setMenu(Menu(() => console.log("i")));
  win.loadFile(`${__dirname}/musicfolder.html`);

  win.on("close", function () {
    mainWindow.setIgnoreMouseEvents(false);
    mainWindow.setResizable(true);
    mainWindow.reload();
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

// ipc communucation and response
ipcMain.on("get-music-files", async (event, _) => {
  const musicData = await getMusicData(database.dirs);
  event.sender.send("get-music-files", musicData);
});

ipcMain.on("get-music-dirs", function (event) {
  event.sender.send("get-music-dirs", database.dirs);
});

ipcMain.on("delete-location", async function (event, location) {
  const newDirs = database.dirs.filter((loc) => loc !== location);
  database.dirs = newDirs;
  await writeFile(`${__dirname}/database.json`, JSON.stringify(database));
  event.sender.send("location-deleted");
});

// Function to open folder dialog
function openFolderDialog() {
  return dialog
    .showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
    })
    .then((result) => {
      if (!result.canceled) {
        const folderPath = result.filePaths[0];
        // Return folder path

        return folderPath;
      }
    })
    .catch((err) => {
      mainWindow.setIgnoreMouseEvents(false);
      mainWindow.setResizable(true);
      return null;
    });
}
ipcMain.on("add-new-location", async function (event) {
  const newLocation = await openFolderDialog();
  if (newLocation) {
    database.dirs.push(newLocation);
    await writeFile(`${__dirname}/database.json`, JSON.stringify(database));
    event.sender.send("location-added", newLocation);
  }
});
