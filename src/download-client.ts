import { app, shell } from "electron";

import logger from "electron-log/main";

import path from "path";
import { setDownloadEta, setDownloadFile, setDownloadProgress } from "./events";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { t } from "i18next";

const APP_ID = 560380;
const DEPOT_ID = 560381;
const MANIFEST_ID = "3190888022545443868";

const DOWNLOADER_EXE = app.isPackaged
    ? path.join(process.resourcesPath, "./DepotDownloaderMod.dll")
    : path.join(__dirname, "../../src/downloader/DepotDownloaderMod.dll");

const MANIFEST_INFO = app.isPackaged
    ? path.join(process.resourcesPath, "./560381_3190888022545443868.manifest")
    : path.join(
          __dirname,
          "../../src/downloader/560381_3190888022545443868.manifest",
      );

const DEPOT_KEY = app.isPackaged
    ? path.join(process.resourcesPath, "./depot.key")
    : path.join(__dirname, "../../src/downloader/depot.key");
const KEY = Buffer.from(
    "9bdb5693b8cbe239bd87eb147abacb8ae4aa446744d1ca4a323bac611174bc8c",
    "hex",
);

let ActiveDownloadProcess: ChildProcessWithoutNullStreams | null;

export const KillDownloadClient = () => {
    if (ActiveDownloadProcess) {
        ActiveDownloadProcess.kill();
        ActiveDownloadProcess = null;
    }
};

const hasDotnet = () => {
    return new Promise((resolve, reject) => {
        const dotnetRuntimesProcess = spawn("dotnet", ["--list-runtimes"]);
        let runtimeListOutput = "";

        dotnetRuntimesProcess.stdout.on("data", (data) => {
            runtimeListOutput += data.toString();
        });

        dotnetRuntimesProcess.on("close", (code) => {
            if (code !== 0) {
                reject("Error checking .NET runtimes");
                return;
            }

            // Check if any installed runtimes are 9.0 or higher
            const runtimeLines = runtimeListOutput.trim().split("\n");
            let hasDotnet9OrHigher = false;

            runtimeLines.forEach((line) => {
                const runtimeVersion = line.split(" ")[1];
                if (runtimeVersion) {
                    const [major, minor] = runtimeVersion
                        .split(".")
                        .map(Number);
                    if (major > 9 || (major === 9 && minor >= 0)) {
                        hasDotnet9OrHigher = true;
                    }
                }
            });

            if (hasDotnet9OrHigher) {
                resolve(true);
            } else {
                reject();
            }
        });
    });
};

export const DownloadClient = async (
    clientPath: string,
    cb: (err: Error) => void,
) => {
    if (ActiveDownloadProcess) {
        logger.error(
            t("downloader.already.running", "Download process already running"),
        );
        return;
    }

    try {
        await hasDotnet();
    } catch (err) {
        cb(
            new Error(
                t(
                    "downloader.dotnet.not.installed",
                    ".NET 9.0+ is not installed",
                ),
            ),
        );
        shell.openExternal(
            "https://dotnet.microsoft.com/en-us/download/dotnet/9.0/runtime?cid=getdotnetcore",
        );
        return;
    }

    const args = [
        `${DOWNLOADER_EXE}`,
        `-app`,
        APP_ID.toString(),
        `-depot`,
        DEPOT_ID.toString(),
        `-depotkeys`,
        DEPOT_KEY,
        `-manifest`,
        MANIFEST_ID,
        `-manifestfile`,
        MANIFEST_INFO,
        `-dir`,
        clientPath,
        `-validate`,
    ];

    // Download the client
    ActiveDownloadProcess = spawn(`dotnet`, args, {});

    let startTime = Date.now();
    let lastPercent = 0;
    let percentDiffs = [] as { diff: number; time: number }[];

    const etaInterval = setInterval(() => {
        const timeElapsed = Date.now() - startTime;
        
        // Calculate the average download speed
        const averageSpeed = percentDiffs.reduce((acc, curr) => acc + curr.diff, 0) / percentDiffs.length;

        const timeRemaining = Math.round(100 / averageSpeed);

        setDownloadEta(Math.max(Math.round(timeRemaining - timeElapsed / 1000), 0));
    }, 1000);

    const p = new Promise<void>((resolve, reject) => {
        if (!ActiveDownloadProcess) {
            reject(
                new Error(
                    t(
                        "downloader.download.process.not.found",
                        "Download process not found",
                    ),
                ),
            );
            return;
        }

        ActiveDownloadProcess.stdout.on("data", (data) => {
            let lines = data.toString().split("\n");

            if (lines.length === 0) lines = [data.toString()];

            for (const line of lines) {
                if (line.match(/(\d+)\.(\d+)%/)) {
                    // download progress
                    const match = line.match(/(\d+\.\d+)%/);
                    const percent = parseFloat(match[1]);
                    setDownloadProgress(percent);

                    setDownloadFile(line.replace(clientPath, ""));

                    const diff = percent - lastPercent;
                    lastPercent = percent;
                    percentDiffs.push({
                        diff,
                        time: Date.now(),
                    });
                } else if (line.trim() !== "") {
                    // setDoiwnl(line.replace(clientPath, ""));
                    logger.info(line);
                }
            }
        });

        ActiveDownloadProcess.stderr.on("data", (data) => {
            console.error(`stderr: ${data}`);
            reject(new Error(data.toString()));
        });

        ActiveDownloadProcess.on("close", (code) => {
            console.log(`Child process exited with code ${code}`);

            clearInterval(etaInterval);
            if (code === 0) {
                resolve();
                return;
            }

            cb(new Error("Download process exited with code " + code));
            resolve();
        });
    });

    await p;

    ActiveDownloadProcess = null;
};
