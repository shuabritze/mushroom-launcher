import { contextBridge, ipcRenderer } from "electron";
import type { ServerEntry } from "./config";

contextBridge.exposeInMainWorld("electron", {
    getAppVersion: () => ipcRenderer.invoke("get-app-version"),
    getAppConfig: () => ipcRenderer.invoke("get-app-config"),
    saveAppConfig: () => ipcRenderer.invoke("save-app-config"),
    getAppDataPath: () => ipcRenderer.invoke("get-app-data-path"),

    setLanguage: (lang: string) => ipcRenderer.invoke("set-language", lang),
    setClientPath: (path: string) =>
        ipcRenderer.invoke("set-client-path", path),
    setEnableConsole: (enable: boolean) =>
        ipcRenderer.invoke("set-enable-console", enable),
    setAutoLogin: (enable: boolean) =>
        ipcRenderer.invoke("set-auto-login", enable),
    setAudioEnabled: (enable: boolean) =>
        ipcRenderer.invoke("set-audio-enabled", enable),
    setAudioVolume: (volume: number) =>
        ipcRenderer.invoke("set-audio-volume", volume),

    loadTranslation: (lng: string, ns: string) =>
        ipcRenderer.invoke("load-translation", lng, ns),

    openFolder: (path: string) => ipcRenderer.invoke("open-folder", path),
    openClientDialog: () => ipcRenderer.invoke("open-client-dialog"),

    getDownloadProgress: () => ipcRenderer.invoke("get-download-progress"),
    getDownloadFile: () => ipcRenderer.invoke("get-download-file"),
    getDownloadEta: () => ipcRenderer.invoke("get-download-eta"),
    downloadClient: (provider: string) =>
        ipcRenderer.invoke("download-client", provider),

    getServerList: () => ipcRenderer.invoke("get-server-list"),
    getOnlineStatus: (serverId: string) =>
        ipcRenderer.invoke("get-online-status", serverId),
    removeServer: (id: string) => ipcRenderer.invoke("remove-server", id),
    addServer: (entry: Partial<ServerEntry>) =>
        ipcRenderer.invoke("add-server", entry),
    editServer: (entry: Partial<ServerEntry>) =>
        ipcRenderer.invoke("edit-server", entry),

    launchClient: (serverId: string) =>
        ipcRenderer.invoke("launch-client", serverId),

    getClientMods: () => ipcRenderer.invoke("get-client-mods"),
    disableMod: (id: string) => ipcRenderer.invoke("disable-mod", id),
    enableMod: (id: string) => ipcRenderer.invoke("enable-mod", id),

    /**
     * Event handlers
     */
    send: (channel: string, data: any) => {
        const validSendChannels = [
            "window-focused",
            "window-blurred",
            "download-complete",
        ] as string[];
        if (validSendChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    on: (channel: string, func: (...args: any[]) => any): (() => void) => {
        // Whitelist channels for receiving messages
        const validReceiveChannels = [
            "window-focused",
            "window-blurred",
            "download-complete",
        ]; // Add your allowed receive channels
        if (validReceiveChannels.includes(channel)) {
            // Deliberately strip event object to only pass data
            const subscription = (event: any, ...args: any[]) => func(...args);
            ipcRenderer.on(channel, subscription);

            return () => {
                ipcRenderer.removeListener(channel, subscription);
            };
        }
    },
});
