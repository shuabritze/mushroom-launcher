import { app, BrowserWindow, dialog, HandlerDetails, shell } from "electron";
import path from "path";
import fs from "fs";
import "dotenv/config";

// #region Squirrel Installer
import ess from "electron-squirrel-startup";
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (ess) {
    app.quit();
}
// #endregion

// #region Auto Updater
import { updateElectronApp } from "update-electron-app";
updateElectronApp();
// #endregion

import { checkPort } from "./lib";

// #region Main Window
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        resizable: true,
        width: 1024,
        height: 640,
        minWidth: 1024,
        minHeight: 640,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
        },
        icon: "./images/icon.ico",
    });

    mainWindow.removeMenu();

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
        mainWindow.webContents.openDevTools();
    }

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith("https:")) shell.openExternal(url);
        return { action: "deny" };
    });

    // Load APP_CONFIG
    if (
        fs.existsSync(
            path.join(path.dirname(process.execPath), "../app-config.json"),
        )
    ) {
        fs.readFile(
            path.join(path.dirname(process.execPath), "../app-config.json"),
            (err, data) => {
                if (err) {
                    dialog.showMessageBox({
                        title: "Mushroom Launcher",
                        type: "warning",
                        message:
                            "Could not load APP_CONFIG, your config may be corrupted.\r\n",
                    });
                    return;
                }
                APP_STATE = JSON.parse(data.toString());

                for (const server of APP_STATE.servers) {
                    checkPort(server.ip, server.port).then((available) => {
                        console.log(
                            `Server ${server.name} is ${available ? "online" : "offline"}`,
                        );
                        server.online = available;
                    });
                }
            },
        );
    }
};

app.on("ready", createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
    // Save APP_CONFIG to disk
    SaveConfig();
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
// #endregion

// #region State
import type { ServerEntry } from "./web/src/ServerList";

export let APP_STATE = {
    servers: [],
    clientPath: "",
} as {
    clientPath: string;
    servers: ServerEntry[];
};

export function SaveConfig() {
    fs.writeFileSync(
        path.join(path.dirname(process.execPath), "../app-config.json"),
        JSON.stringify(APP_STATE),
    );
    console.log(
        "APP_CONFIG saved to disk",
        path.join(path.dirname(process.execPath), "../app-config.json"),
    );
}

// #endregion

import "./events";
