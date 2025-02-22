const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
    getAppVersion: () => ipcRenderer.invoke("get-app-version"),

    getServerList: () => ipcRenderer.invoke("get-server-list"),
    getOnlineStatus: (id: string) =>
        ipcRenderer.invoke("get-online-status", id),
    removeServer: (id: string) => ipcRenderer.invoke("remove-server", id),
    addServer: (ip: string, port: number, name: string, hidden: boolean) =>
        ipcRenderer.invoke("add-server", ip, port, name, hidden),
    getServerMods: (id: string) => ipcRenderer.invoke("get-server-mods", id),
    setServerMods: (id: string, mods: string[]) =>
        ipcRenderer.invoke("set-server-mods", id, mods),

    getModList: () => ipcRenderer.invoke("get-mod-list"),
    downloadMod: (id: string) => ipcRenderer.invoke("download-mod", id),
    openModFolder: () => ipcRenderer.invoke("open-mod-folder"),

    getClientPath: () => ipcRenderer.invoke("get-client-path"),
    openClientDialog: () => ipcRenderer.invoke("set-client-path"),
    openClientFolder: () => ipcRenderer.invoke("open-client-folder"),

    launchClient: (id: string) => ipcRenderer.invoke("launch-client", id),
    installClient: () => ipcRenderer.invoke("install-client"),
    isClientPatched: () => ipcRenderer.invoke("is-client-patched"),
    patchClient: () => ipcRenderer.invoke("patch-client"),
    getDownloadProgress: () => ipcRenderer.invoke("get-download-progress"),
    getDownloadFile: () => ipcRenderer.invoke("get-download-file"),
    getDownloadEta: () => ipcRenderer.invoke("get-download-eta"),

    loadTranslation: (lng: string, ns: string) =>
        ipcRenderer.invoke("load-translation", lng, ns),
    
    getAppLanguage: () => ipcRenderer.invoke("get-app-language"),
    setAppLanguage: (lng: string) => ipcRenderer.invoke("set-app-language", lng),
});
