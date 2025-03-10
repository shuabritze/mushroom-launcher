import { app, dialog, ipcMain, shell } from "electron";
import { APP_STATE, SaveConfig } from "./main";
import { checkPort } from "./lib";
import { PatchDLL } from "./patch-dll";
import { DownloadClient } from "./download-client";

import logger from "electron-log/main";

import path from "path";
import fs from "fs";
import { DownloadMod, GetModDirectory, ReadMods } from "./mod-download";
import { LaunchClient } from "./launch-client";
import { changeLanguage, t } from "i18next";
import { loadTranslation } from "./electron-i18n";

ipcMain.handle("get-app-version", () => {
    return app.getVersion();
});

ipcMain.handle("get-server-list", async () => {
    return APP_STATE.servers;
});

ipcMain.handle("get-online-status", async (_, id) => {
    const server = APP_STATE.servers.find((server) => server.id === id);
    logger.info(server);
    if (!server) {
        return false;
    }
    const online = await checkPort(server.ip, server.port);
    server.online = online;

    return online;
});

ipcMain.handle("remove-server", (_, id) => {
    APP_STATE.servers = APP_STATE.servers.filter((server) => server.id !== id);
    SaveConfig();
    return true;
});

ipcMain.handle("add-server", async (_, ip, port, name, hidden) => {
    const isOnline = await checkPort(ip, port);
    APP_STATE.servers.push({
        id: Math.random().toString(36).substring(2, 15),
        ip,
        port,
        online: isOnline,
        mods: [],
        name,
        hidden: hidden || false,
    });
    SaveConfig();
    return true;
});

ipcMain.handle("get-client-path", () => {
    return APP_STATE.clientPath;
});

ipcMain.handle("set-client-path", (_) => {
    const result = dialog.showOpenDialogSync({
        properties: ["openDirectory"],
        title: t(
            "main.set.client.path.title",
            "Select Install Folder or Existing Folder",
        ),
    });
    if (result && result.length > 0) {
        APP_STATE.clientPath = result[0];
        SaveConfig();
        return APP_STATE.clientPath;
    }
    return null;
});

ipcMain.handle("open-client-folder", async () => {
    shell.openPath(APP_STATE.clientPath);
    return true;
});

ipcMain.handle("launch-client", async (_, id) => {
    return LaunchClient(id);
});

const Maple2 = app.isPackaged
    ? path.join(process.resourcesPath, "./Maple2.dll")
    : path.join(__dirname, "../../src/patcher/Maple2.dll");
const Maple2Edit = app.isPackaged
    ? path.join(process.resourcesPath, "./Maple2Edit.dll")
    : path.join(__dirname, "../../src/patcher/Maple2Edit.dll");

ipcMain.handle("patch-client", async () => {
    const clientPath = APP_STATE.clientPath;
    if (!clientPath) {
        return [
            false,
            t(
                "main.patch.client.no.install.location",
                "No Install Location Set",
            ),
        ];
    }
    const exePath = path.join(clientPath, "x64", "MapleStory2.exe");
    if (!fs.existsSync(exePath)) {
        return [false, t("main.patch.client.not.found", "Client not found")];
    }

    const nxCharacter = path.join(clientPath, "x64", "NxCharacter64.dll");
    if (!fs.existsSync(nxCharacter)) {
        return [
            false,
            t(
                "main.patch.client.nxcharacter.not.found",
                "NxCharacter64.dll not found",
            ),
        ];
    }

    // Copy Maple2.dll to client/x64/Maple2.dll
    fs.copyFileSync(Maple2, path.join(clientPath, "x64", "Maple2.dll"));

    // Update NxCharacter64.dll to include Maple2.dll in the imports
    await PatchDLL(nxCharacter);

    return [true, "Patched"];
});

ipcMain.handle("is-client-patched", async () => {
    return fs.existsSync(path.join(APP_STATE.clientPath, "x64", "Maple2.dll"));
});

let downloadProgress = 0;
let currentFileDownload = "";
let downloadEta = -1;
export const setDownloadProgress = (progress: number) => {
    downloadProgress = progress;
};

export const setDownloadFile = (file: string) => {
    currentFileDownload = file;
};

export const setDownloadEta = (eta: number) => {
    downloadEta = eta;
};

ipcMain.handle("get-download-progress", async () => {
    return downloadProgress;
});

ipcMain.handle("get-download-file", async () => {
    return currentFileDownload;
});

ipcMain.handle("get-download-eta", async () => {
    return downloadEta;
});

ipcMain.handle("install-client", async () => {
    const clientPath = APP_STATE.clientPath;
    if (!clientPath) {
        return [
            false,
            t(
                "main.install.client.no.install.location",
                "No Install Location Set",
            ),
        ];
    }

    logger.info("Downloading client...");

    downloadProgress = 0;
    currentFileDownload = "";

    const errs: Error[] = [];

    await DownloadClient(clientPath, (err) => {
        if (err) {
            logger.info(err);
            errs.push(err);
        }
    });

    downloadProgress = -1;
    currentFileDownload = "";

    if (errs.length) {
        return [false, errs.map((err) => err.message).join("\n")];
    }

    return [
        true,
        t("main.install.client.installed", "Installed at {{clientPath}}", {
            clientPath,
        }),
    ];
});

ipcMain.handle("get-mod-list", async () => {
    APP_STATE.mods = [];
    ReadMods(GetModDirectory());

    return APP_STATE.mods;
});

ipcMain.handle("download-mod", async (_, id) => {
    const mod = APP_STATE.mods.find((mod) => mod.id === id);
    if (!mod) {
        return [false, t("main.download.mod.not.found", "Mod not found")];
    }
    return DownloadMod(mod.path, mod);
});

ipcMain.handle("open-mod-folder", async () => {
    const modDir = GetModDirectory();
    shell.openPath(modDir);
    return true;
});

ipcMain.handle("get-server-mods", async (_, id) => {
    const server = APP_STATE.servers.find((server) => server.id === id);
    if (!server || !server.mods || server.mods.length === 0) {
        return [];
    }

    return APP_STATE.mods.filter((mod) =>
        server.mods?.some((smod) => smod.id === mod.id),
    );
});

ipcMain.handle("set-server-mods", async (_, id, mods) => {
    const server = APP_STATE.servers.find((server) => server.id === id);
    if (!server) {
        return false;
    }
    server.mods = mods;
    return true;
});

ipcMain.handle("load-translation", async (_, lng, ns) => {
    return loadTranslation(lng, ns);
});

ipcMain.handle("get-app-language", async () => {
    return APP_STATE.language;
});

ipcMain.handle("set-app-language", async (_, lng) => {
    APP_STATE.language = lng;
    changeLanguage(lng);
    SaveConfig();
    return true;
});

ipcMain.handle("get-enable-console", async () => {
    return APP_STATE.enableConsole ?? true;
});

ipcMain.handle("set-enable-console", async (_, enable) => {
    APP_STATE.enableConsole = enable;
    return true;
});
