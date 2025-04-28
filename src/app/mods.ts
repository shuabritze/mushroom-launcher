import { ipcMain } from "electron";
import { APP_DATA_PATH } from "./app";
import fs from "fs";
import path from "path";

import logger from "electron-log/main";

export interface ModEntry {
    id: string;
    name: string;
    files: string[];
    enabled: boolean;
}

const GetModsPath = () => {
    return path.join(APP_DATA_PATH, "mods");
};

export const GetMods = () => {
    return fs
        .readdirSync(GetModsPath())
        .map((mod) => {
            const modPath = path.join(GetModsPath(), mod);
            if (!fs.statSync(modPath).isDirectory()) {
                return null;
            }

            const modInfoFile = fs
                .readdirSync(modPath)
                .filter(
                    (file) =>
                        file.toLocaleLowerCase() === "mod.json" ||
                        file.toLocaleLowerCase() === "mod.disabled.json",
                );

            const modInfoJson: ModEntry = JSON.parse(
                fs.readFileSync(path.join(modPath, modInfoFile[0]), "utf-8"),
            );

            // Read all child files and folders in the mod directory
            const modFiles = fs
                .readdirSync(modPath, {
                    withFileTypes: true,
                    encoding: "utf-8",
                    recursive: true,
                })
                .map((file) => {
                    if (
                        file.isFile() &&
                        file.name !== "mod.json" &&
                        file.name !== "mod.disabled.json" &&
                        !file.name.startsWith(".git")
                    ) {
                        const fullPath = path.join(file.parentPath, file.name);
                        const relativePath = path.relative(modPath, fullPath);
                        return relativePath;
                    }
                    return null;
                })
                .filter((file) => file !== null);

            logger.info("[IPC] get-client-mods", modPath, modFiles);

            return {
                id: modInfoJson.id,
                name: modInfoJson.name,
                files: modFiles,
                enabled: modInfoFile[0].toLocaleLowerCase() === "mod.json",
            };
        })
        .filter((mod) => mod !== null) as ModEntry[];
};

ipcMain.handle("get-client-mods", async () => {
    return GetMods();
});

ipcMain.handle("disable-mod", async (_, id: string) => {
    const mods = GetMods();
    const mod = mods.find((mod) => mod.id === id);
    if (!mod) {
        return false;
    }
    const modPath = path.join(GetModsPath(), mod.id);
    // rename mod.json to mod.disabled.json
    const modJsonPath = path.join(modPath, "mod.json");
    const modDisabledJsonPath = path.join(modPath, "mod.disabled.json");
    if (fs.existsSync(modJsonPath)) {
        fs.renameSync(modJsonPath, modDisabledJsonPath);
    }
});

ipcMain.handle("enable-mod", async (_, id: string) => {
    const mods = GetMods();
    const mod = mods.find((mod) => mod.id === id);
    if (!mod) {
        return false;
    }
    const modPath = path.join(GetModsPath(), mod.id);
    // rename mod.disabled.json to mod.json
    const modJsonPath = path.join(modPath, "mod.json");
    const modDisabledJsonPath = path.join(modPath, "mod.disabled.json");
    if (fs.existsSync(modDisabledJsonPath)) {
        fs.renameSync(modDisabledJsonPath, modJsonPath);
    }
});
