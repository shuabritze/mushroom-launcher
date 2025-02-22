import https from "https";
import fs from "fs";
import path from "path";
import net from "net";
import { Worker } from "worker_threads";

import logger from "electron-log/main";

export function checkPort(ip: string, port: number, timeout = 2000) {
    return new Promise<boolean>((resolve) => {
        const socket = new net.Socket();

        // Set a timeout for the connection attempt
        socket.setTimeout(timeout);

        socket.on("connect", () => {
            socket.destroy(); // Close the connection
            resolve(true);
        });

        socket.on("timeout", () => {
            socket.destroy();
            resolve(false);
        });

        socket.on("error", (err) => {
            resolve(false);
        });

        socket.connect(port, ip);
    });
}

export function downloadFile(
    url: string,
    dest: string,
    cb?: (err?: string | NodeJS.ErrnoException | null) => void,
    progressCb?: (progress: number) => void,
) {
    const file = fs.createWriteStream(dest);
    https
        .get(url, function (response) {
            if (response.statusCode === 302) {
                // Redirect
                file.close();

                if (!response.headers.location) {
                    return cb && cb(new Error("No redirect location found"));
                }

                return downloadFile(
                    response.headers.location,
                    dest,
                    cb,
                    progressCb,
                );
            }
            const total = parseInt(
                response.headers["content-length"] ?? "0",
                10,
            );
            let downloaded = 0;

            response.pipe(file);

            response.on("data", (data) => {
                downloaded += data.length;
                const progress = Math.floor((downloaded / total) * 100);
                if (progressCb) {
                    progressCb(progress);
                }
            });

            file.on("finish", function () {
                if (cb) {
                    file.close(cb);
                }
            });
        })
        .on("error", function (err) {
            console.log("Error downloading file: " + err.message);
            fs.unlink(dest, function () {});
            if (cb) cb(err.message);
        });
}
