import https from "https";
import fs from "fs";
import net from "net";
import child_process from "child_process";
import { join } from "path";
import { dialog } from "electron";
import { APP_STATE } from "./main";

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
            console.log(err);
            resolve(false);
        });

        socket.connect(port, ip);
    });
}

export function downloadFile(
    url: string,
    dest: string,
    cb?: (err: string | NodeJS.ErrnoException | null) => void,
    progressCb?: (progress: number) => void,
) {
    const file = fs.createWriteStream(dest);
    https
        .get(url, function (response) {
            if (response.statusCode === 302) {
                // Redirect
                file.close();
                return downloadFile(
                    response.headers.location,
                    dest,
                    cb,
                    progressCb,
                );
            }
            const total = parseInt(response.headers["content-length"], 10);
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
                file.close(cb);
            });
        })
        .on("error", function (err) {
            console.log("Error downloading file: " + err.message);
            fs.unlink(dest, function () {});
            if (cb) cb(err.message);
        });
}

// This function will output the lines from the script
// and will return the full combined output
// as well as exit code when it's done (using the callback).
export function run_script(
    command: string,
    args: readonly string[],
    callback: (code?: number) => void,
) {
    var child = child_process.spawn(command, args, {
        detached: true,
        shell: true,
    });

    // You can also use a variable to save the output for when the script closes later
    child.on("error", (error) => {
        dialog.showMessageBox({
            title: "Title",
            type: "warning",
            message: "Error occured.\r\n" + error,
        });
        console.log(error);
    });

    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (data) => {
        //Here is the output
        data = data.toString();
        console.log(data);
    });

    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (data) => {
        // Return some data to the renderer process with the mainprocess-response ID
        // win.webContents.send("mainprocess-response", data);
        //Here is the output from the command
        console.log(data);
    });

    child.on("close", (code) => {
        if (typeof callback === "function") callback(code);
    });
}