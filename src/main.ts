import { app, BrowserWindow, shell } from "electron";
import path from "node:path";

// #region Squirrel Installer
import started from "electron-squirrel-startup";
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
    app.quit();
}
// #endregion

// #region Auto Updater
import { updateElectronApp } from "update-electron-app";
import { InitApp } from "./app/app";
import { SaveConfig } from "./app/config";
import { KillDownloadClient } from "./app/download-client";
updateElectronApp();
// #endregion

// #region Switches
app.commandLine.appendSwitch(
    "disable-features",
    "HardwareMediaKeyHandling,MediaSessionService",
);
// #endregion

const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        resizable: true,
        width: 1024,
        height: 680,
        minWidth: 1024,
        minHeight: 680,
        autoHideMenuBar: true,
        icon: "./images/icon.ico",
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
        },
    });

    // and load the index.html of the app.
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
        mainWindow.loadFile(
            path.join(
                __dirname,
                `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`,
            ),
        );
    }

    if (process.env.NODE_ENV === "development") {
        // Open the DevTools.
        mainWindow.webContents.openDevTools({ mode: "detach" });
    }

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith("https:")) shell.openExternal(url);
        return { action: "deny" };
    });

    // Listen for window focus event
    mainWindow.on("focus", () => {
        mainWindow.webContents.send("window-focused");
    });

    // Listen for window blur event
    mainWindow.on("blur", () => {
        mainWindow.webContents.send("window-blurred");
    });

    InitApp(mainWindow);
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
    SaveConfig();
    KillDownloadClient();

    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
