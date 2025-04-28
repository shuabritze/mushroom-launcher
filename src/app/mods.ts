import { ipcMain } from "electron";
import { APP_DATA_PATH } from "./app";
import fs from "fs";
import path from "path";
import logger from "electron-log/main";
import { createHash } from "crypto";

export interface Mod {
    id: string;
    name: string;
    updateUrl: string;
    files: {
        path: string;
        hash: string;
    }[];
}

export interface ModEntry {
    mod: Mod; // mod.json
    enabled: boolean; // true if mod.json, false if mod.disabled.json
    files: string[]; // local files found on disk
}

const GetModsPath = () => {
    return path.join(APP_DATA_PATH, "mods");
};

/**
 * Recursively collect all files in a mod directory except mod.json, mod.disabled.json, and .git folders.
 * Returns relative paths from the mod directory.
 */
function collectModFiles(dir: string, base = ""): string[] {
    let files: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (
            entry.name === "mod.json" ||
            entry.name === "mod.disabled.json" ||
            entry.name.startsWith(".git")
        ) {
            continue;
        }
        const fullPath = path.join(dir, entry.name);
        const relPath = path.join(base, entry.name);
        if (entry.isDirectory()) {
            files = files.concat(collectModFiles(fullPath, relPath));
        } else if (entry.isFile()) {
            files.push(relPath.replace(/\\/g, "/"));
        }
    }
    return files;
}

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

            if (!modInfoFile[0]) {
                return null;
            }

            const modInfoJson: Mod = JSON.parse(
                fs.readFileSync(path.join(modPath, modInfoFile[0]), "utf-8"),
            );

            // Use the unified recursive function to collect all mod files
            const modFiles = collectModFiles(modPath);

            logger.info("[IPC] get-client-mods", modPath, modFiles);

            return {
                mod: modInfoJson,
                enabled: modInfoFile[0].toLocaleLowerCase() === "mod.json",
                files: modFiles,
            } as ModEntry;
        })
        .filter((mod) => mod !== null) as ModEntry[];
};

ipcMain.handle("get-client-mods", async () => {
    return GetMods();
});

ipcMain.handle("disable-mod", async (_, id: string) => {
    const mods = GetMods();
    const modEntry = mods.find((modEntry) => modEntry.mod.id === id);
    if (!modEntry) {
        return false;
    }
    const modPath = path.join(GetModsPath(), modEntry.mod.id);
    // rename mod.json to mod.disabled.json
    const modJsonPath = path.join(modPath, "mod.json");
    const modDisabledJsonPath = path.join(modPath, "mod.disabled.json");
    if (fs.existsSync(modJsonPath)) {
        fs.renameSync(modJsonPath, modDisabledJsonPath);
    }
});

ipcMain.handle("enable-mod", async (_, id: string) => {
    const mods = GetMods();
    const modEntry = mods.find((modEntry) => modEntry.mod.id === id);
    if (!modEntry) {
        return false;
    }
    const modPath = path.join(GetModsPath(), modEntry.mod.id);
    // rename mod.disabled.json to mod.json
    const modJsonPath = path.join(modPath, "mod.json");
    const modDisabledJsonPath = path.join(modPath, "mod.disabled.json");
    if (fs.existsSync(modDisabledJsonPath)) {
        fs.renameSync(modDisabledJsonPath, modJsonPath);
    }
});

ipcMain.handle("update-mod", async (_, id: string) => {
    const mods = GetMods();
    const modEntry = mods.find((mod) => mod.mod.id === id);
    if (!modEntry) {
        return false;
    }

    if (!modEntry.mod.updateUrl) {
        logger.error("No updateUrl specified for mod", id);
        return false;
    }

    const modPath = path.join(GetModsPath(), modEntry.mod.id);
    const localModJsonPath = path.join(modPath, "mod.json");

    // Ensure updateUrl ends with /
    let updateUrl = modEntry.mod.updateUrl;
    if (!updateUrl.endsWith("/")) {
        updateUrl += "/";
    }

    // Fetch latest mod.json from updateUrl
    let remoteModJson: Mod;
    try {
        const resp = await fetch(updateUrl + "mod.json");
        if (!resp.ok) {
            logger.error(
                "Failed to fetch remote mod.json for",
                id,
                resp.statusText,
            );
            return false;
        }
        remoteModJson = await resp.json();
    } catch (e) {
        logger.error("Failed to fetch remote mod.json for", id, e);
        return false;
    }

    logger.info("Fetched remote mod.json for", id, remoteModJson);

    // Download and replace necessary files
    if (Array.isArray(remoteModJson.files)) {
        for (const fileEntry of remoteModJson.files) {
            // fileEntry: { path: string, hash: string }
            const localFilePath = path.join(modPath, fileEntry.path);
            let needDownload = true;
            if (fs.existsSync(localFilePath)) {
                // Compare hash if provided
                const crypto = await import("crypto");
                const fileBuffer = fs.readFileSync(localFilePath);
                const hash = crypto
                    .createHash("sha256")
                    .update(fileBuffer)
                    .digest("hex");
                if (hash === fileEntry.hash) {
                    needDownload = false;
                }
            }

            if (needDownload) {
                // Ensure parent directory exists
                fs.mkdirSync(path.dirname(localFilePath), { recursive: true });
                const url = updateUrl + fileEntry.path;
                try {
                    // Use fetch instead of axios for file download
                    const resp = await fetch(url);
                    if (!resp.ok) {
                        logger.error(
                            "Failed to download file",
                            url,
                            resp.statusText,
                        );
                        return false;
                    }
                    const arrayBuffer = await resp.arrayBuffer();
                    fs.writeFileSync(localFilePath, Buffer.from(arrayBuffer));
                } catch (e) {
                    logger.error("Failed to download file", url, e);
                    return false;
                }
            }
        }
    }

    // Update local mod.json
    fs.writeFileSync(localModJsonPath, JSON.stringify(remoteModJson, null, 2));
    logger.info("Mod updated", id);
    return true;
});

/**
 * Creates a new mod folder with a basic mod.json file.
 * @param mod Mod object with at least id, name, updateUrl
 * @returns true if created, false if already exists or error
 */
export function CreateMod(mod: Pick<Mod, "id" | "name" | "updateUrl">) {
    const modsPath = GetModsPath();
    const modPath = path.join(modsPath, mod.id);
    if (fs.existsSync(modPath)) {
        logger.error("Mod folder already exists:", modPath);
        return [false, "Mod folder already exists"];
    }
    try {
        fs.mkdirSync(modPath, { recursive: true });
        const modJson: Mod = {
            id: mod.id,
            name: mod.name,
            updateUrl: mod.updateUrl,
            files: [],
        };
        fs.writeFileSync(
            path.join(modPath, "mod.json"),
            JSON.stringify(modJson, null, 2),
        );
        logger.info("Created new mod:", mod.id);
        return [true, ""];
    } catch (e) {
        logger.error("Failed to create mod:", mod.id, e);
        return [false, "Failed to create mod folder"];
    }
}

ipcMain.handle(
    "create-mod",
    async (_, mod: Pick<Mod, "id" | "name" | "updateUrl">) => {
        return CreateMod(mod);
    },
);

/**
 * Updates the mod.json file in the given mod folder with the files found in the folder,
 * excluding mod.json, mod.disabled.json, and any files/folders starting with .git.
 * The files array will be updated with { path, url: "", hash: "" } for each file found.
 * @param modFolderPath Absolute path to the mod folder
 */
export function UpdateModJsonWithLocalFiles(modFolderPath: string) {
    const modJsonPath = path.join(modFolderPath, "mod.json");
    if (!fs.existsSync(modJsonPath)) {
        logger.error("mod.json not found in", modFolderPath);
        return false;
    }
    let modJson: Mod;
    try {
        modJson = JSON.parse(fs.readFileSync(modJsonPath, "utf-8"));
    } catch (e) {
        logger.error("Failed to parse mod.json in", modFolderPath, e);
        return false;
    }

    const localFiles = collectModFiles(modFolderPath);

    modJson.files = localFiles.map((filePath) => {
        const fullPath = path.join(modFolderPath, filePath);
        const fileBuffer = fs.readFileSync(fullPath);
        const hash = createHash("sha256").update(fileBuffer).digest("hex");
        return {
            path: filePath,
            hash,
        };
    });

    fs.writeFileSync(modJsonPath, JSON.stringify(modJson, null, 2));
    logger.info("mod.json updated with local files in", modFolderPath);
    return true;
}

ipcMain.handle("update-mod-json-with-local-files", (_, modId: string) => {
    const mods = GetMods();
    const modEntry = mods.find((modEntry) => modEntry.mod.id === modId);
    if (!modEntry) {
        return false;
    }

    const modFolderPath = path.join(GetModsPath(), modId);
    return UpdateModJsonWithLocalFiles(modFolderPath);
});
