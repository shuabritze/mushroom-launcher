const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
    getAppVersion: () => ipcRenderer.invoke("get-app-version"),

    getServerList: () => ipcRenderer.invoke("get-server-list"),
    getOnlineStatus: (id: string) =>
        ipcRenderer.invoke("get-online-status", id),
    removeServer: (id: string) => ipcRenderer.invoke("remove-server", id),
    addServer: (ip: string, port: number, name: string) =>
        ipcRenderer.invoke("add-server", ip, port, name),

    getClientPath: () => ipcRenderer.invoke("get-client-path"),
    openClientDialog: () => ipcRenderer.invoke("set-client-path"),

    launchClient: (id: string) => ipcRenderer.invoke("launch-client", id),
    installClient: () => ipcRenderer.invoke("install-client"),
    patchClient: () => ipcRenderer.invoke("patch-client"),
    patchXML: () => ipcRenderer.invoke("patch-xml"),
    getPatchProgress: () => ipcRenderer.invoke("get-patch-progress"),
    getDownloadProgress: () => ipcRenderer.invoke("get-download-progress"),
    getDownloadFile: () => ipcRenderer.invoke("get-download-file"),
    getDownloadEta: () => ipcRenderer.invoke("get-download-eta"),
});
