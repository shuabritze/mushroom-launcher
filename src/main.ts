import { app, BrowserWindow, dialog, shell } from "electron";
import path from "path";
import fs from "fs";
import "dotenv/config";

import logger from "electron-log/main";

app.commandLine.appendSwitch("js-flags", "--max-old-space-size=8192");

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
import "./events";
import { KillDownloadClient } from "./download-client";
import type { ModEntry } from "./web/src/ModList";
import type { ServerEntry } from "./web/src/ServerList";
import { GetModDirectory, ReadMods } from "./mod-download";
import { changeLanguage, createI18n } from "./electron-i18n";
import { t } from "i18next";

// #region Main Window
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

const createWindow = () => {
    createI18n();

    // Create the browser window.
    const mainWindow = new BrowserWindow({
        resizable: true,
        width: 1024,
        height: 680,
        minWidth: 1024,
        minHeight: 680,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegrationInWorker: true,
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


    const appDataPath = app.getPath('userData')
    // Migrate old config
    if (fs.existsSync(path.join(path.dirname(process.execPath), "../app-config.json"))) {
        fs.copyFileSync(path.join(path.dirname(process.execPath), "../app-config.json"), path.join(appDataPath, "app-config.json"));
        fs.rmSync(path.join(path.dirname(process.execPath), "../app-config.json"));
        logger.info("Migrated old config to new location: ", path.join(appDataPath, "app-config.json"));
    }

    // Load APP_CONFIG & Mods
    if (
        fs.existsSync(
            path.join(appDataPath, "app-config.json"),
        )
    ) {
        fs.readFile(
            path.join(appDataPath, "app-config.json"),
            (err, data) => {
                if (err) {
                    dialog.showMessageBox({
                        title: "Mushroom Launcher",
                        type: "warning",
                        message: t(
                            "main.load.config.failed",
                            "Could not load APP_CONFIG, your config may be corrupted.\r\n",
                        ),
                    });
                    return;
                }
                APP_STATE = JSON.parse(data.toString());

                for (const server of APP_STATE.servers) {
                    checkPort(server.ip, server.port).then((available) => {
                        logger.info(
                            `Server ${server.name} is ${available ? "online" : "offline"}`,
                        );
                        server.online = available;
                    });
                }

                // Load Language
                APP_STATE.language ??= "en";
                changeLanguage(APP_STATE.language);

                // Load Mods
                APP_STATE.mods = [];

                setImmediate(async () => {
                    const modDir = GetModDirectory();
                    await ReadMods(modDir);
                    logger.info(
                        "Loaded Mods: ",
                        APP_STATE.mods.map((mod) => mod.name).join(", "),
                    );
                });
            },
        );
    }
};

app.on("ready", createWindow);

app.on("window-all-closed", () => {
    // Save APP_CONFIG to disk
    SaveConfig();
    KillDownloadClient();

    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
// #endregion

// #region State
export let APP_STATE = {
    language: "en",
    servers: [],
    clientPath: "",
    mods: [],
    enableConsole: true,
} as {
    language: string;
    clientPath: string;
    servers: ServerEntry[];
    mods: ModEntry[];
    enableConsole?: boolean;
};

export function SaveConfig() {
    const appDataPath = app.getPath('userData')
    fs.writeFileSync(
        path.join(appDataPath, "app-config.json"),
        JSON.stringify({ ...APP_STATE, mods: undefined }),
    );
    logger.info(
        "APP_CONFIG saved to disk",
        path.join(appDataPath, "app-config.json"),
    );
}

// #endregion
