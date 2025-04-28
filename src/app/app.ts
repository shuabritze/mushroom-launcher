import { app, BrowserWindow } from "electron";
import { InitConfig } from "./config";

import "./events";
import "./download-client";
import "./server-list";
import "./launch-client";
import "./mods";
import { createI18n } from "./lib/electron-i18n";

export let MAIN_WINDOW: BrowserWindow = null;

export const APP_DATA_PATH = app.getPath("userData");

export const InitApp = (window: BrowserWindow) => {
    MAIN_WINDOW = window;

    createI18n();

    InitConfig();
};
