import { app, ipcMain } from "electron";
import * as child_process from "child_process";
import fs from "fs";
import path from "path";

import { APP_CONFIG, SaveConfig } from "./config";
import { t } from "i18next";
import { APP_DATA_PATH } from "./app";

const AgarciumClient = app.isPackaged
    ? path.join(process.resourcesPath, "./AgarciumClient.dll")
    : path.join(__dirname, "../../src/patcher/AgarciumClient.dll");

const NxCharacterProxy = app.isPackaged
    ? path.join(process.resourcesPath, "./NxCharacter64.dll")
    : path.join(__dirname, "../../src/patcher/NxCharacter64.dll");

ipcMain.handle("launch-client", async (_, serverId) => {
    const server = APP_CONFIG.servers.find((server) => server.id === serverId);
    if (!server) {
        return [false, "Server not found"];
    }
    if (!APP_CONFIG.clientPath) {
        return [false, "Client path not set"];
    }
    const clientPath = APP_CONFIG.clientPath;
    const modsPath = path.join(APP_DATA_PATH, "mods");

    const exePath = path.join(clientPath, "x64", "MapleStory2.exe");
    if (!fs.existsSync(exePath)) {
        return [false, t("main.launch.client.not.found", "Client not found")];
    }

    // Backup NxCharacter64.dll to NxCharacter64.dll.bak
    const backupPath = path.join(clientPath, "x64", "NxCharacter64.dll.bak");
    if (!fs.existsSync(backupPath)) {
        fs.copyFileSync(
            path.join(clientPath, "x64", "NxCharacter64.dll"),
            backupPath,
        );
    }

    fs.copyFileSync(
        AgarciumClient,
        path.join(clientPath, "x64", "AgarciumClient.dll"),
    );
    fs.copyFileSync(
        NxCharacterProxy,
        path.join(clientPath, "x64", "NxCharacter64.dll"),
    );

    const args = [
        "--nxapp=nxl",
        server.auth && server.auth.username
            ? `--username=${server.auth.username}`
            : "",
        server.auth && server.auth.password
            ? `--password=${server.auth.password}`
            : "",
        server.auth && server.auth.token ? `--token=${server.auth.token}` : "",
        server.name ? `--title=${server.name}` : "",
        server.ip ? `--ip=${server.ip}` : "",
        server.port ? `--port=${server.port}` : "",
        APP_CONFIG.autoLogin ? "--autologin" : "",
        APP_CONFIG.enableConsole ? "--console" : "",
        `--mods=${modsPath}`,
    ];

    const clientProcess = child_process.spawn(exePath, args, {
        detached: true,
    });

    // Minimize the client window
    clientProcess.unref();

    // Set the last played time
    server.lastPlayed = Date.now();
    SaveConfig();

    return [true, t("main.launch.client.launched", "Launched")];
});
