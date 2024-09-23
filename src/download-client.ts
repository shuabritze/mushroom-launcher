import SteamUser from "steam-user";
import { app } from "electron";

import logger from "electron-log/main";

//@ts-expect-error
import ContentManifest from "steam-user/components/content_manifest";

import path from "path";
import fs from "fs";
import { setDownloadEta, setDownloadFile, setDownloadProgress } from "./events";

const DepotKey = app.isPackaged
    ? path.join(process.resourcesPath, "./depot.key")
    : path.join(__dirname, "../../src/patcher/depot.key");

const Manifest = app.isPackaged
    ? path.join(process.resourcesPath, "./560381_3190888022545443868.manifest")
    : path.join(
          __dirname,
          "../../src/patcher/560381_3190888022545443868.manifest",
      );

interface FileEntry {
    chunks: Array<string>;
    filename: string;
    size: string;
    flags: number;
    sha_filename: string;
    sha_content: string;
}

export const DownloadClient = async (
    clientPath: string,
    cb: (err: Error) => void,
) => {
    const APP_ID = 560380;
    const DEPOT_ID = 560381;
    const MANIFEST = "3190888022545443868";
    const KEY =
        "9bdb5693b8cbe239bd87eb147abacb8ae4aa446744d1ca4a323bac611174bc8c";

    logger.info("Creating steam user");

    let user = new SteamUser({
        machineIdType: SteamUser.EMachineIDType.PersistentRandom,
        dataDirectory: app.isPackaged
            ? path.join(process.resourcesPath, "./steam")
            : path.join(__dirname, "../../src/patcher/steam"),
    });

    // Override the default key
    // @ts-expect-error
    user.getDepotDecryptionKey = (appID, depotID, callback) => {
        return new Promise((resolve) =>
            resolve({
                key: Buffer.from(KEY, "hex"),
            }),
        );
    };

    logger.info("Logging into steam...");

    // user.on("error", (err) => {
    //     logger.error(err);
    // });

    // user.on("debug", (msg) => {
    //     logger.info(msg);
    // });

    // //@ts-expect-error
    // user.on("debug-verbose", (msg) => {
    //     logger.info(msg);
    // });

    // //@ts-expect-error
    // user.on("debug-traffic-incoming", (msg, ...details) => {
    //     logger.info(msg);
    //     logger.info(details);
    // });

    // //@ts-expect-error
    // user.on("debug-traffic-outgoing", (msg,...details) => {
    //     logger.info(msg);
    //     logger.info(details);
    // });

    logger.info("Waiting for steam to login...");

    const p = new Promise<void>((resolve) => {
        user.on("loggedOn", async () => {
            logger.info(
                `Logged on to Steam as anonymous (${user.steamID.steam3()})`,
            );
            // Pre-fetch content servers
            // @ts-expect-error
            await user.getContentServers([APP_ID]);

            const manifest = fs.readFileSync(Manifest);
            const parsed = ContentManifest.parse(manifest) as {
                files: FileEntry[];
            };

            // Sort by filesize descending
            parsed.files.sort((a, b) => +b.size - +a.size);

            const totalDownload = parsed.files.reduce(
                (acc, file) => acc + +file.size,
                0,
            );

            let downloaded = new Map<string, number>();

            const updateProgress = (currentBps: number) => {
                const totalDownloaded = [...downloaded.values()].reduce(
                    (acc, value) => acc + value,
                    0,
                );
                const progress = Math.floor(
                    (totalDownloaded / totalDownload) * 100,
                );
                setDownloadProgress(progress);
                const remaining = totalDownload - totalDownloaded;
                const eta = Math.floor(remaining / currentBps);
                setDownloadEta(eta);
            };

            const total_files = parsed.files.filter(
                (file) => !!file.chunks.length,
            ).length;
            let i = 0;
            for (const file of parsed.files) {
                // Check if the file parent directory exists
                const parentDir = path.dirname(
                    path.join(clientPath, file.filename),
                );
                if (!fs.existsSync(parentDir)) {
                    fs.mkdirSync(parentDir, { recursive: true });
                }

                if (!file.chunks.length) {
                    continue;
                }

                logger.info(`Downloading manifest file: ${file.filename}`);
                setDownloadFile(`(${++i} / ${total_files}) ${file.filename}`);

                const startTime = Date.now();
                // @ts-expect-error
                await user.downloadFile(
                    APP_ID,
                    DEPOT_ID,
                    file,
                    path.join(clientPath, file.filename),
                    (
                        err: Error | null,
                        progress: {
                            type: string;
                            bytesDownloaded: number;
                            totalSizeBytes: number;
                            complete: boolean;
                        },
                    ) => {
                        if (err) {
                            cb(err);
                        }
                        if (
                            progress.bytesDownloaded &&
                            !isNaN(progress.bytesDownloaded)
                        ) {
                            downloaded.set(
                                file.filename,
                                progress.bytesDownloaded,
                            );

                            const elapsedTime = (Date.now() - startTime) / 1000;
                            const bps = progress.bytesDownloaded / elapsedTime;

                            updateProgress(bps);
                        }
                    },
                );
            }

            user.logOff();
            resolve();
        });
    });

    user.logOn({
        anonymous: true,
    });

    await p;
};
