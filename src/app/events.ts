import { app, dialog, ipcMain, shell } from "electron";

import logger from "electron-log/main";
import { APP_CONFIG } from "./config";
import { loadTranslation } from "./lib/electron-i18n";
import { t } from "i18next";

ipcMain.handle("get-app-version", () => {
    logger.info("[IPC] get-app-version");
    return app.getVersion();
});

ipcMain.handle("load-translation", async (_, lng, ns) => {
    return loadTranslation(lng, ns);
});

ipcMain.handle("open-folder", async (_, path) => {
    logger.info("[IPC] open-folder", path);
    try {
        await shell.openPath(path);
    } catch (e) {
        logger.error("[IPC] open-folder", e);
    }
    return true;
});

ipcMain.handle("open-client-dialog", async () => {
    logger.info("[IPC] open-client-dialog");
    const result = dialog.showOpenDialogSync({
        properties: ["openDirectory"],
        title: t(
            "main.set.client.path.title",
            "Select Install Folder or Existing Folder",
        ),
    });
    if (!result || result.length === 0) {
        logger.info("[IPC] open-client-dialog", "No path selected");
        return null;
    }
    const clientPath = result[0];
    return clientPath;
});
