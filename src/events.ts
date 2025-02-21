import { app, dialog, ipcMain } from "electron";
import { APP_STATE, SaveConfig } from "./main";
import { checkPort, downloadFile } from "./lib";
import { PatchDLL } from "./patch-dll";
import { DownloadClient } from "./download-client";

import logger from "electron-log/main";

import path from "path";
import fs from "fs";
import child_process from "child_process";

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
        title: "Select Install Folder or Existing Folder",
    });
    if (result && result.length > 0) {
        APP_STATE.clientPath = result[0];
        SaveConfig();
        return APP_STATE.clientPath;
    }
    return null;
});

ipcMain.handle("launch-client", async (_, id) => {
    const server = APP_STATE.servers.find((server) => server.id === id);
    if (!server) {
        return [false, "Server not found"];
    }
    const clientPath = APP_STATE.clientPath;
    if (!clientPath) {
        return [false, "No Install Location Set"];
    }
    const exePath = path.join(clientPath, "x64", "MapleStory2.exe");
    if (!fs.existsSync(exePath)) {
        return [false, "Client not found"];
    }
    const maple2Path = path.join(clientPath, "x64", "maple2.dll");
    if (!fs.existsSync(maple2Path)) {
        return [false, "Maple2.dll not found (Did you run the patcher?)"];
    }

    // Write to Maple2.ini file with server information
    const iniPath = path.join(clientPath, "x64", "maple2.ini");
    fs.writeFileSync(
        iniPath,
        `[default]
    name=${server?.name}
    host=${server.ip}
    port=${server.port}
    banword=true
    multiclient=true
    visualizer=false
    log_exceptions=false
    hook_outpacket=false
    hook_inpacket=false
    patch_input_text=true
    patch_ugc_music=true`,
    );

    const clientProcess = child_process.spawn(exePath, [], {
        detached: true,
    });

    // Minimize the client window
    clientProcess.unref();

    // Set the last played time
    server.lastPlayed = Date.now();
    SaveConfig();

    return [true, "Launched"];
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
        return [false, "No Install Location Set"];
    }
    const exePath = path.join(clientPath, "x64", "MapleStory2.exe");
    if (!fs.existsSync(exePath)) {
        return [false, "Client not found"];
    }

    const nxCharacter = path.join(clientPath, "x64", "NxCharacter64.dll");
    if (!fs.existsSync(nxCharacter)) {
        return [false, "NxCharacter64.dll not found"];
    }

    // Copy Maple2.dll to client/x64/Maple2.dll
    fs.copyFileSync(Maple2, path.join(clientPath, "x64", "Maple2.dll"));

    // Update NxCharacter64.dll to include Maple2.dll in the imports
    await PatchDLL(nxCharacter);

    return [true, "Patched"];
});

let patchProgress = -1;

ipcMain.handle("get-patch-progress", async () => {
    return patchProgress;
});

let downloadProgress = -1;
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

ipcMain.handle("patch-xml", async () => {
    const clientPath = APP_STATE.clientPath;
    if (!clientPath) {
        return [false, "No Install Location Set"];
    }
    const exePath = path.join(clientPath, "x64", "MapleStory2.exe");
    if (!fs.existsSync(exePath)) {
        return [false, "Client not found"];
    }

    // Copy Xml.m2d and Xml.m2h
    if (
        fs.existsSync(path.join(clientPath, "Data", "Xml.m2d")) &&
        !fs.existsSync(path.join(clientPath, "Data", "Xml.m2d.bak"))
    ) {
        fs.copyFileSync(
            path.join(clientPath, "Data", "Xml.m2d"),
            path.join(clientPath, "Data", "Xml.m2d.bak"),
        );
        fs.copyFileSync(
            path.join(clientPath, "Data", "Xml.m2h"),
            path.join(clientPath, "Data", "Xml.m2h.bak"),
        );
    }

    const filesToGet = [
        "aHR0cHM6Ly9naXRodWIuY29tL1ppbnRpeHgvTWFwbGVTdG9yeTItWE1ML3JlbGVhc2VzL2xhdGVzdC9kb3dubG9hZC9YbWwubTJk",
        "aHR0cHM6Ly9naXRodWIuY29tL1ppbnRpeHgvTWFwbGVTdG9yeTItWE1ML3JlbGVhc2VzL2xhdGVzdC9kb3dubG9hZC9YbWwubTJo",
        "aHR0cHM6Ly9naXRodWIuY29tL1ppbnRpeHgvTWFwbGVTdG9yeTItWE1ML3JlbGVhc2VzL2xhdGVzdC9kb3dubG9hZC9TZXJ2ZXIubTJk",
        "aHR0cHM6Ly9naXRodWIuY29tL1ppbnRpeHgvTWFwbGVTdG9yeTItWE1ML3JlbGVhc2VzL2xhdGVzdC9kb3dubG9hZC9TZXJ2ZXIubTJo",
    ];

    const alterProgress = (progress: number) => {
        patchProgress = (patchProgress * 3 + progress) / 4;
    };

    patchProgress = 0;
    const downloads: Promise<boolean>[] = [];
    for (const file of filesToGet) {
        const url = Buffer.from(file, "base64").toString("ascii");
        const name = path.basename(url);
        const p = new Promise<boolean>((resolve, reject) => {
            downloadFile(
                url,
                path.join(clientPath, "Data", name),
                (err) => {
                    if (err) {
                        logger.info(err);
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                },
                alterProgress,
            );
        });

        downloads.push(p);
    }

    const results = await Promise.all(downloads);

    patchProgress = -1;

    if (!results.every((result) => result)) {
        return [
            false,
            `One or more downloads failed, please try again ${results.map((result, i) => (result ? "" : "(Download " + i + 1 + " Failed)")).join(", ")}`,
        ];
    }

    return [true, "Patched"];
});

ipcMain.handle("install-client", async () => {
    const clientPath = APP_STATE.clientPath;
    if (!clientPath) {
        return [false, "No Install Location Set"];
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

    return [true, `Installed at ${clientPath}`];
});
