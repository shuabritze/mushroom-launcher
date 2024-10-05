import SteamUser from "steam-user";
//@ts-expect-error
import SteamCrypto from "@doctormckay/steam-crypto";
import genericPool from "generic-pool";
import crypto from "crypto";

import { app } from "electron";

import logger from "electron-log/main";

//@ts-expect-error
import ContentManifest from "steam-user/components/content_manifest";

import path from "path";
import fs from "fs";
import { setDownloadEta, setDownloadFile, setDownloadProgress } from "./events";
import axios, { Axios } from "axios";
import { decompressFile } from "./lib";

const Manifest = app.isPackaged
    ? path.join(process.resourcesPath, "./560381_3190888022545443868.manifest")
    : path.join(
          __dirname,
          "../../src/patcher/560381_3190888022545443868.manifest",
      );

const APP_ID = 560380;
const DEPOT_ID = 560381;
const MANIFEST = "3190888022545443868";
const KEY = Buffer.from(
    "9bdb5693b8cbe239bd87eb147abacb8ae4aa446744d1ca4a323bac611174bc8c",
    "hex",
);
const IGNORE_FILES = [".asar"];

interface Chunk {
    sha: string;
    crc: number;
    offset: string;
    cb_original: number;
    cb_compressed: number;
    retries?: number;
}

interface FileEntry {
    chunks: Chunk[];
    filename: string;
    size: string;
    flags: number;
    sha_filename: string;
    sha_content: string;
    downloaded?: boolean;
}

interface CDNServer {
    type: string;
    sourceid: string;
    cell: string;
    load: string;
    preferred_server: string;
    weightedload: string;
    NumEntriesInClientList: number;
    Host: string;
    vhost: string;
    https_support: string;
}

let cdnPool: genericPool.Pool<CDNServer>;

const AsyncFetchChunk = async (
    cdn: CDNServer,
    chunk: Chunk,
): Promise<Buffer> => {
    try {
        const downloadUrl = `${cdn.https_support === "mandatory" ? "https" : "http"}://${cdn.vhost || cdn.Host}/depot/${DEPOT_ID}/chunk/`;
        const res = await axios.get(`${downloadUrl}${chunk.sha}`, {
            responseType: "arraybuffer",
            headers: {
                "Content-Type": "application/octet-stream;charset=UTF-8",
                "Accept-Encoding": "gzip, deflate",
                "User-Agent": "Valve/Steam HTTP Client 1.0",
            },
        });

        return SteamCrypto.symmetricDecrypt(res.data, KEY);
    } catch (err) {
        chunk.retries = chunk.retries ? chunk.retries + 1 : 1;
        if (chunk.retries < 5) {
            const newCdn = await cdnPool.acquire();
            const fetched = await AsyncFetchChunk(newCdn, chunk);
            cdnPool.release(newCdn);
            return fetched;
        } else {
            logger.error("Failed to download chunk", chunk.sha, err);
        }
    }
};

const AsyncDownloadChunks = async (
    cdn: CDNServer,
    file: FileEntry,
    clientPath: string,
    progressCb: (downloaded: number) => void,
) => {
    const chunks = file.chunks;
    const filePath = path.join(clientPath, file.filename);

    const chunkQueue = [];

    for (const chunk of chunks) {
        if (chunkQueue.length >= 6) {
            await Promise.all(chunkQueue);
            chunkQueue.length = 0;
        }

        try {
            const chunkData = await AsyncFetchChunk(cdn, chunk);

            const fileStream = fs.createWriteStream(filePath, {
                start: parseInt(chunk.offset, 10),
                flags: "r+",
            });

            chunkQueue.push(
                new Promise<void>((resolve) =>
                    decompressFile(chunkData, fileStream).then(() => {
                        progressCb(chunk.cb_original);
                        fileStream.close();
                        resolve();
                    }),
                ),
            );
        } catch (err) {
            logger.error("Failed to decrypt chunk", chunk.sha, err);
        }
    }
};

const VerifyFile = async (filePath: string, file: FileEntry) => {
    if (!fs.existsSync(filePath)) {
        return false;
    }

    // SHA1 hash of the file
    const fileHash = crypto.createHash("sha1");
    setDownloadProgress(30);

    const rs = fs.createReadStream(filePath);
    rs.on("data", (chunk) => {
        fileHash.update(chunk);
    });

    await new Promise((resolve, reject) => {
        rs.on("end", resolve);
        rs.on("error", reject);
    });

    setDownloadProgress(50);

    const hash = fileHash.digest("hex");
    if (hash !== file.sha_content) {
        logger.error(
            "File hash mismatch",
            file.filename,
            file.sha_content,
            hash,
        );
        return false;
    }
    return true;
};

const AsyncDepotDownload = async (
    user: SteamUser,
    files: FileEntry[],
    clientPath: string,
    progressCb: (downloaded: number, totalDownload: number) => void,
) => {
    // @ts-expect-error
    const { servers }: { servers: CDNServer[] } = await user.getContentServers([
        APP_ID,
    ]);

    // Verify integrity of files if already present
    const clientExe = path.join(clientPath, "x64", "MapleStory2.exe");
    if (fs.existsSync(clientExe)) {
        let i = 0;
        const total = files.filter((file) => !!file.chunks.length).length;
        for (const file of files) {
            if (
                !file.chunks.length ||
                IGNORE_FILES.some((ignoreFile) =>
                    file.filename.includes(ignoreFile),
                )
            ) {
                continue;
            }

            setDownloadFile(`(${++i} / ${total}) Verifying ${file.filename}`);
            setDownloadProgress(25);
            const filePath = path.join(clientPath, file.filename);
            if (!(await VerifyFile(filePath, file))) {
                logger.error("File integrity check failed, redownloading " + file.filename);
                file.downloaded = false;
            } else {
                file.downloaded = true;
            }
            setDownloadProgress(100);
        }

        files = files.filter((file) => !file.downloaded);

        logger.info(
            `Verified game files, ${files.length} need to be reacquired`,
        );
    }

    logger.info("Pre-allocating files....");

    const chunkSize = 1024 * 1024; // 1MB
    const chunk = Buffer.alloc(chunkSize);

    for (const file of files) {
        const filePath = path.join(clientPath, file.filename);
        if (!file.chunks.length) {
            if (!fs.existsSync(filePath)) {
                fs.mkdirSync(filePath, { recursive: true });
            }
            continue;
        }

        if (
            IGNORE_FILES.some((ignoreFile) =>
                file.filename.includes(ignoreFile),
            )
        ) {
            continue;
        }
        if (!fs.existsSync(filePath)) {
            setDownloadFile("Allocating file " + file.filename);
            // Write the file and any missing directories
            if (!fs.existsSync(path.dirname(filePath))) {
                fs.mkdirSync(path.dirname(filePath), { recursive: true });
            }
            const writeStream = fs.createWriteStream(filePath);
            const totalSize = +file.size;

            const promises = [];
            for (let i = 0; i < totalSize; i += chunkSize) {
                let writeBuffer = chunk;
                if (i + chunkSize > totalSize) {
                    writeBuffer = chunk.slice(0, totalSize - i);
                }

                promises.push(
                    new Promise<void>((resolve) => {
                        writeStream.write(writeBuffer, () => {
                            resolve();
                            setDownloadProgress(
                                Math.floor((i / totalSize) * 100),
                            );
                        });
                    }),
                );

                if (promises.length > 100) {
                    await Promise.all(promises);
                    promises.length = 0;
                }
            }
            // Wait for writes to finish
            await Promise.all(promises);
            writeStream.end();
            writeStream.close();
        }
    }
    
    setDownloadProgress(0);
    logger.info("Pre-allocation complete");

    // Wait for garbage collection :(
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const inUse = new Set<string>();

    const maxConcurrentDownloads = Math.min(servers.length, 6);

    const cdnFactory = {
        create: async () => {
            const server = servers.filter(
                (server) => !inUse.has(server.Host),
            )[0];
            inUse.add(server.Host);
            return server;
        },
        destroy: async (client: CDNServer) => {
            inUse.delete(client.Host);
        },
    };

    cdnPool = genericPool.createPool(cdnFactory, {
        max: maxConcurrentDownloads,
        min: 2,
        acquireTimeoutMillis: 600000,
    });

    const downloadingChunks: Promise<void>[] = [];

    const total_files = files.filter((file) => !!file.chunks.length).length;
    const totalDownload = files.reduce(
        (acc, file) => acc + +file.size,
        0,
    );
    let i = 0;
    for (const file of files) {
        if (
            !file.chunks.length ||
            IGNORE_FILES.some((ignoreFile) =>
                file.filename.includes(ignoreFile),
            )
        ) {
            continue;
        }

        logger.info("Downloading file", file.filename);
        setDownloadFile(`(${++i} / ${total_files}) ${file.filename}`);
        const cdn = await cdnPool.acquire();
        logger.info("Acquired cdn", cdn.Host);
        try {
            downloadingChunks.push(
                AsyncDownloadChunks(cdn, file, clientPath, (downloaded: number) => progressCb(downloaded, totalDownload)).then(
                    () => {
                        cdnPool.release(cdn);
                    },
                ),
            );
        } catch (err) {
            logger.error(`Error downloading file ${file.filename}`, err);
            cdnPool.release(cdn);
        }
    }

    logger.info("Chunk processing complete... waiting for downloads to finish");

    // Wait for all chunks to finish downloading
    await Promise.all(downloadingChunks);
};

export const DownloadClient = async (
    clientPath: string,
    cb: (err: Error) => void,
) => {
    logger.info("Creating steam user");

    let user = new SteamUser({
        machineIdType: SteamUser.EMachineIDType.PersistentRandom,
        dataDirectory: app.isPackaged
            ? path.join(process.resourcesPath, "./steam")
            : path.join(__dirname, "../../src/patcher/steam"),
    });

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
            const manifest = fs.readFileSync(Manifest);
            const parsed = ContentManifest.parse(manifest) as {
                files: FileEntry[];
            };

            let totalDownloaded = 0;

            const startTime = Date.now();

            await AsyncDepotDownload(
                user,
                parsed.files,
                clientPath,
                (downloaded, totalDownload) => {
                    if (isNaN(downloaded)) return;
                    totalDownloaded += downloaded;
                    setDownloadProgress(
                        Math.floor((totalDownloaded / totalDownload) * 100),
                    );
                    const elapsedTime = (Date.now() - startTime) / 1000;
                    const bps = totalDownloaded / elapsedTime;
                    setDownloadEta(Math.floor(totalDownload / bps));
                },
            );

            user.logOff();
            resolve();
        });
    });

    user.logOn({
        anonymous: true,
    });

    await p;
};
