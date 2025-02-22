export interface IElectronAPI {
    getAppVersion: () => Promise<string>;

    getServerList: () => Promise<ServerEntry[]>;
    getOnlineStatus: (id: string) => Promise<boolean>;
    removeServer: (id: string) => Promise<boolean>;
    addServer: (ip: string, port: number, name: string, hidden: boolean) => Promise<boolean>;
    getServerMods: (id: string) => Promise<ModEntry[]>;
    setServerMods: (id: string, mods: ModEntry[]) => Promise<boolean>;

    getModList: () => Promise<ModEntry[]>;
    downloadMod: (id: string) => Promise<[boolean, string]>;
    openModFolder: () => Promise<boolean>;

    getClientPath: () => Promise<string>;
    openClientDialog: () => Promise<string | null>;
    openClientFolder: () => Promise<boolean>;

    launchClient: (id: string) => Promise<[boolean, string]>;
    installClient: () => Promise<[boolean, string]>;
    isClientPatched: () => Promise<boolean>;
    patchClient: () => Promise<[boolean, string]>;
    patchXML: () => Promise<[boolean, string]>;
    getPatchProgress: () => Promise<number>;
    getDownloadProgress: () => Promise<number>;
    getDownloadFile: () => Promise<string>;
    getDownloadEta: () => Promise<number>;

    loadTranslation: (lng: string, ns: string) => Promise<Record<string, string>>;
    getAppLanguage: () => Promise<string>;
    setAppLanguage: (lng: string) => Promise<void>;
}

declare global {
    interface Window {
        electron: IElectronAPI;
    }
}
