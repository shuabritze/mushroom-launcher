import { downloadFile } from "./lib";
import { APP_STATE } from "./main";
import type { ModEntry } from "./web/src/ModList";

import fs from "fs";
import path from "path";
import logger from "electron-log/main";
import { app } from "electron";
import { setDownloadFile, setDownloadProgress } from "./events";
import { t } from "i18next";

export const GetModDirectory = () => {
    const appDataPath = app.getPath("userData");

    // Migrate old mods
    if (fs.existsSync(path.join(path.dirname(process.execPath), "../mods"))) {
        fs.copyFileSync(
            path.join(path.dirname(process.execPath), "../mods"),
            path.join(appDataPath, "mods"),
        );
        fs.rmdirSync(path.join(path.dirname(process.execPath), "../mods"));

        logger.info("Migrated old mods to new location: ", path.join(appDataPath, "mods"));
    }

    const dir = path.join(appDataPath, "mods");

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);

        fs.mkdirSync(path.join(dir, "kms2-gms2-merged"));
        fs.writeFileSync(
            path.join(dir, "kms2-gms2-merged", "mod.json"),
            JSON.stringify({
                id: "kms2-gms2-merged",
                name: "GMS2 XML Merged (Zin)",
                files: [
                    {
                        target: "Xml.m2d",
                        download: true,
                        source: "aHR0cHM6Ly9naXRodWIuY29tL1ppbnRpeHgvTWFwbGVTdG9yeTItWE1ML3JlbGVhc2VzL2xhdGVzdC9kb3dubG9hZC9YbWwubTJk",
                    },
                    {
                        target: "Xml.m2h",
                        download: true,
                        source: "aHR0cHM6Ly9naXRodWIuY29tL1ppbnRpeHgvTWFwbGVTdG9yeTItWE1ML3JlbGVhc2VzL2xhdGVzdC9kb3dubG9hZC9YbWwubTJo",
                    },
                    {
                        target: "Server.m2d",
                        download: true,
                        source: "aHR0cHM6Ly9naXRodWIuY29tL1ppbnRpeHgvTWFwbGVTdG9yeTItWE1ML3JlbGVhc2VzL2xhdGVzdC9kb3dubG9hZC9TZXJ2ZXIubTJk",
                    },
                    {
                        target: "Server.m2h",
                        download: true,
                        source: "aHR0cHM6Ly9naXRodWIuY29tL1ppbnRpeHgvTWFwbGVTdG9yeTItWE1ML3JlbGVhc2VzL2xhdGVzdC9kb3dubG9hZC9TZXJ2ZXIubTJo",
                    },
                ],
            }),
        );
    }

    return dir;
};

export const ReadMods = (dir: string) => {
    const modFiles = fs.readdirSync(dir);
    for (const file of modFiles) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            ReadMods(filePath);
        } else if (file.toLocaleLowerCase() === "mod.json") {
            const mod = JSON.parse(fs.readFileSync(filePath).toString());
            mod.path = path.dirname(filePath);

            // Check if the mod needs to be downloaded
            if (
                mod.files.length > 0 &&
                !fs.existsSync(path.join(dir, mod.files[0].target))
            ) {
                mod.downloaded = false;
            } else {
                mod.downloaded = true;
            }

            APP_STATE.mods.push(mod);
        }
    }
};

let patchProgress = 0;
export const DownloadMod = async (dir: string, mod: ModEntry) => {
    const filesToGet = mod.files.filter((f) => f.download).map((f) => f.source);

    patchProgress = 0;
    const alterProgress = (progress: number) => {
        patchProgress =
            (patchProgress * (filesToGet.length - 1) + progress) /
            filesToGet.length;
        setDownloadProgress(patchProgress);
    };

    setDownloadFile(
        `${mod.name}: ${mod.files.map((f) => f.target).join(", ")}`,
    );
    const downloads: Promise<boolean>[] = [];
    for (const urlBase64 of filesToGet) {
        const url = Buffer.from(urlBase64, "base64").toString("ascii");
        const name = path.basename(url);
        const p = new Promise<boolean>((resolve, reject) => {
            downloadFile(
                url,
                path.join(dir, name),
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

    setDownloadFile("");
    setDownloadProgress(-1);

    logger.info("[MODS] Downloaded ", mod.name);
    return [
        true,
        t("main.download.mod.downloaded", `{{modName}} has been downloaded`, {
            modName: mod.name,
        }),
    ];
};
