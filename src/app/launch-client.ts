import { app, ipcMain } from "electron";
import * as child_process from "child_process";
import fs from "fs";
import path from "path";
import crypto from "crypto";

import { APP_CONFIG, SaveConfig } from "./config";
import { t } from "i18next";
import { APP_DATA_PATH } from "./app";
import logger from "electron-log/main";

const AgarciumClient = app.isPackaged
    ? path.join(process.resourcesPath, "./AgarciumClient.dll")
    : path.join(__dirname, "../../src/patcher/AgarciumClient.dll");

const NxCharacterProxy = app.isPackaged
    ? path.join(process.resourcesPath, "./NxCharacter64.dll")
    : path.join(__dirname, "../../src/patcher/NxCharacter64.dll");

// https://stackoverflow.com/questions/18658612/obtaining-the-hash-of-a-file-using-the-stream-capabilities-of-crypto-module-ie
function checksumFile(hashName: any, path: string) {
    if (!fs.existsSync(path)) {
        return "00000000000000000000000000000000";
    }

    return new Promise((resolve, reject) => {
        const hash = crypto.createHash(hashName);
        const stream = fs.createReadStream(path);
        stream.on('error', err => reject(err));
        stream.on('data', chunk => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
    });
}

const copyOrUpdateNxCharacter = async () => {
    const existingPath = path.join(APP_CONFIG.clientPath, "x64", "NxCharacter64.dll");
    // Check existing nxcharacter size
    const existingHash = await checksumFile("sha256", existingPath);
    const newHash = await checksumFile("sha256", NxCharacterProxy);

    logger.info("NxCharacter64 Existing hash: " + existingHash);
    logger.info("NxCharacter64 New hash: " + newHash);

    if (existingHash !== newHash) {
        // Copy the new one
        fs.copyFileSync(
            NxCharacterProxy,
            existingPath,
        );
    }
}

const copyOrUpdateAgarciumClient = async () => {
    const existingPath = path.join(APP_CONFIG.clientPath, "x64", "AgarciumClient.dll");
    // Check existing agarciumclient size
    const existingHash = await checksumFile("sha256", existingPath);
    const newHash = await checksumFile("sha256", AgarciumClient);

    logger.info("AgarciumClient Existing hash: " + existingHash);
    logger.info("AgarciumClient New hash: " + newHash);

    if (existingHash !== newHash) {
        // Copy the new one
        fs.copyFileSync(
            AgarciumClient,
            existingPath,
        );
    }
}

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

    await copyOrUpdateAgarciumClient();
    await copyOrUpdateNxCharacter();

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
