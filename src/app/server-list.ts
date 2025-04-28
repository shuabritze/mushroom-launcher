import { ipcMain } from "electron";
import { APP_CONFIG, ServerEntry } from "./config";
import net from "net";

export function checkPort(ip: string, port: number, timeout = 10000) {
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

ipcMain.handle("get-server-list", async () => {
    return APP_CONFIG.servers;
});

ipcMain.handle("get-online-status", async (_, serverId: string) => {
    const server = APP_CONFIG.servers.find((s) => s.id === serverId);
    if (!server) {
        return false;
    }
    const online = await checkPort(server.ip, server.port, 5000);
    server.online = online;
    return online;
});

ipcMain.handle("remove-server", (_, id) => {
    APP_CONFIG.servers = APP_CONFIG.servers.filter(
        (server) => server.id !== id,
    );
    return true;
});

ipcMain.handle("add-server", async (_, entry: Partial<ServerEntry>) => {
    APP_CONFIG.servers.push({
        id: Math.random().toString(36).substring(2, 15),
        ip: entry.ip,
        port: entry.port,
        name: entry.name,
        lastPlayed: 0,
        hidden: entry.hidden || false,
        online: false,
        auth: entry.auth,
    });
    return true;
});

ipcMain.handle("edit-server", async (_, entry: Partial<ServerEntry>) => {
    const server = APP_CONFIG.servers.find((s) => s.id === entry.id);
    if (server) {
        server.ip = entry.ip;
        server.port = entry.port;
        server.name = entry.name;
        server.hidden = entry.hidden || false;
        server.auth = entry.auth;
    }
    return true;
});
