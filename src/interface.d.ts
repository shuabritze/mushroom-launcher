export interface IElectronAPI {
    getAppVersion: () => Promise<string>;

    getServerList: () => Promise<ServerEntry[]>;
    getOnlineStatus: (id: string) => Promise<boolean>;
    removeServer: (id: string) => Promise<boolean>;
    addServer: (ip: string, port: number, name: string) => Promise<boolean>;

    getClientPath: () => Promise<string>;
    openClientDialog: () => Promise<string | null>;

    launchClient: (id: string) => Promise<[boolean, string]>;
    installClient: () => Promise<[boolean, string]>;
    patchClient: () => Promise<[boolean, string]>;
    patchXML: () => Promise<[boolean, string]>;
    getPatchProgress: () => Promise<number>;
    getDownloadProgress: () => Promise<number>;
    getDownloadFile: () => Promise<string>;
    getDownloadEta: () => Promise<number>;
}

declare global {
    interface Window {
        electron: IElectronAPI;
    }
}
