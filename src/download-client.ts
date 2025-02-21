import { app, shell } from "electron";

import logger from "electron-log/main";

import path from "path";
import { setDownloadEta, setDownloadFile, setDownloadProgress } from "./events";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";

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
          "../../src/patcher/560381_3190888022545443868.manifest",
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
        logger.error("Download process already running");
        return;
    }

    try {
        await hasDotnet();
    } catch (err) {
        cb(new Error(".NET 9.0+ is not installed"));
        shell.openExternal("https://dotnet.microsoft.com/en-us/download/dotnet/9.0/runtime?cid=getdotnetcore");
        return;
    }

    const args = [
        `${DOWNLOADER_EXE}`,
        `-app`, APP_ID.toString(),
        `-depot`, DEPOT_ID.toString(),
        `-depotkeys`, DEPOT_KEY,
        `-manifest`, MANIFEST_ID,
        `-manifestfile`, MANIFEST_INFO,
        `-dir`, clientPath,
        `-validate`,
    ];

    // Download the client
    ActiveDownloadProcess = spawn(`dotnet`, args, {});

    let startTime = Date.now();
    let lastPercent = 0;
    let last10PPS = [] as number[];

    const etaInterval = setInterval(() => {
        if (last10PPS.length < 1) {
            // 20~ minutes
            setDownloadEta(1200);
            return;
        }

        // Take the last 10 and calculate the average
        const average = last10PPS.reduce((a, b) => a + b, 0) / last10PPS.length;
        const elapsedTime = (Date.now() - startTime) / 1000;
        const expectedTime = 100 / (average * 100);

        if (elapsedTime > expectedTime) {
            // If the elapsed time is greater than the expected time, we are scuffed
            setDownloadEta(1);
            return;
        }

        setDownloadEta(Math.floor(expectedTime - elapsedTime));
    }, 1000);

    const p = new Promise<void>((resolve, reject) => {
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

                    // Calculate ETA
                    const now = Date.now();
                    let percentDiff = percent - lastPercent;
                    lastPercent = percent;

                    const elapsedTime = (now - startTime) / 1000;
                    const percentPerSecond = percentDiff / elapsedTime;

                    last10PPS.push(percentPerSecond);
                    while (last10PPS.length > 10) {
                        last10PPS.shift();
                    }
                } else if (line.trim() !== "") {
                    setDownloadFile(line.replace(clientPath, ""));
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
