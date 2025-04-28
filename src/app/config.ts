import { app, dialog, ipcMain } from "electron";
import fs from "fs";
import path from "path";
import { t } from "i18next";

import logger from "electron-log/main";
import { changeLanguage } from "./lib/electron-i18n";
import { APP_DATA_PATH } from "./app";

export interface ServerEntry {
    id: string;
    name: string;
    ip: string;
    port: number;
    lastPlayed: number;
    hidden: boolean;
    online: boolean;
    auth?: {
        username?: string;
        password?: string;
        token?: string;
    };
}

export const APP_CONFIG = {
    language: "en",
    clientPath: "",
    servers: [] as ServerEntry[],

    enableConsole: false,
    autoLogin: false,

    audioEnabled: false,
    audioVolume: 25,
};

export type AppConfig = typeof APP_CONFIG;

export const InitConfig = () => {
    if (!fs.existsSync(path.join(APP_DATA_PATH, "app-config.json"))) {
        fs.writeFileSync(
            path.join(APP_DATA_PATH, "app-config.json"),
            JSON.stringify({}),
        );
    }

    const config = fs.readFileSync(
        path.join(APP_DATA_PATH, "app-config.json"),
        "utf-8",
    );
    try {
        const parsedConfig = JSON.parse(config);
        Object.assign(APP_CONFIG, parsedConfig);

        logger.info(
            "[APP.CONFIG] Loaded config file",
            path.join(APP_DATA_PATH, "app-config.json"),
        );
    } catch (e) {
        logger.error("[APP.CONFIG] Failed to parse config file", e);
        dialog.showMessageBox({
            title: "Mushroom Launcher",
            type: "warning",
            message:
                "Could not load APP_CONFIG, your config may be corrupted.\r\n",
        });
        return;
    }

    // Load Language
    changeLanguage(APP_CONFIG.language);
};

export function SaveConfig() {
    const appDataPath = app.getPath("userData");
    fs.writeFileSync(
        path.join(appDataPath, "app-config.json"),
        JSON.stringify({ ...APP_CONFIG }),
    );
    logger.info(
        "APP_CONFIG saved to disk",
        path.join(appDataPath, "app-config.json"),
    );
}

ipcMain.handle("get-app-config", () => {
    logger.info("[IPC] get-app-config");
    return APP_CONFIG;
});

ipcMain.handle("save-app-config", () => {
    logger.info("[IPC] save-app-config");
    SaveConfig();
});

ipcMain.handle("get-app-data-path", () => {
    logger.info("[IPC] get-app-data-path");
    return APP_DATA_PATH;
});

ipcMain.handle("set-language", (event, lang: string) => {
    logger.info("[IPC] set-language", lang);
    APP_CONFIG.language = lang;
    changeLanguage(lang);
});

ipcMain.handle("set-client-path", (event, path: string) => {
    logger.info("[IPC] set-client-path", path);
    APP_CONFIG.clientPath = path;
});

ipcMain.handle("set-enable-console", (event, enable: boolean) => {
    logger.info("[IPC] set-enable-console", enable);
    APP_CONFIG.enableConsole = enable;
});

ipcMain.handle("set-auto-login", (event, enable: boolean) => {
    logger.info("[IPC] set-auto-login", enable);
    APP_CONFIG.autoLogin = enable;
});

ipcMain.handle("set-audio-enabled", (event, enable: boolean) => {
    logger.info("[IPC] set-audio-enabled", enable);
    APP_CONFIG.audioEnabled = enable;
});

ipcMain.handle("set-audio-volume", (event, volume: number) => {
    logger.info("[IPC] set-audio-volume", volume);
    APP_CONFIG.audioVolume = volume;
});
