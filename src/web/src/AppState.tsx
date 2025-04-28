import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

import i18n from "../lib/i18n";
import type { ServerEntry } from "@/app/config";

export interface AppStateType {
    appVersion: string;
    language: string;
    clientPath: string;
    setAppVersion: (version: string) => void;
    setLanguage: (language: string) => void;
    setClientPath: (path: string) => void;

    enableConsole?: boolean;
    autoLogin?: boolean;
    audioEnabled?: boolean;
    audioVolume?: number;
    setEnableConsole?: (enable: boolean) => void;
    setAutoLogin?: (enable: boolean) => void;
    setAudioEnabled?: (enable: boolean) => void;
    setAudioVolume?: (volume: number) => void;

    downloadInProgress?: boolean;
    setDownloadInProgress?: (inProgress: boolean) => void;

    selectedServer?: ServerEntry | null;
    setSelectedServer?: (server: ServerEntry | null) => void;

    modDeveloper?: boolean;
    setModDeveloper?: (enable: boolean) => void;
}

// Create the context
const AppState = createContext<AppStateType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const [appVersion, setAppVersion] = useState<string>("1.6.9");
    const [language, _setLanguage] = useState<string>("en");
    const [clientPath, _setClientPath] = useState<string>("");

    const setLanguage = useCallback((lang: string) => {
        _setLanguage(lang);
        i18n.changeLanguage(lang);
        window.electron.setLanguage(lang);
    }, []);

    const setClientPath = useCallback((path: string) => {
        _setClientPath(path);
        window.electron.setClientPath(path);
    }, []);

    const [enableConsole, _setEnableConsole] = useState<boolean>(false);
    const [autoLogin, _setAutoLogin] = useState<boolean>(false);
    const [audioEnabled, _setAudioEnabled] = useState<boolean>(false);
    const [audioVolume, _setAudioVolume] = useState<number>(25);

    const setEnableConsole = useCallback((enable: boolean) => {
        _setEnableConsole(enable);
        window.electron.setEnableConsole(enable);
    }, []);

    const setAutoLogin = useCallback((enable: boolean) => {
        _setAutoLogin(enable);
        window.electron.setAutoLogin(enable);
    }, []);

    const setAudioEnabled = useCallback((enable: boolean) => {
        _setAudioEnabled(enable);
        window.electron.setAudioEnabled(enable);
    }, []);
    const setAudioVolume = useCallback((volume: number) => {
        _setAudioVolume(volume);
        window.electron.setAudioVolume(volume);
    }, []);

    const [modDeveloper, _setModDeveloper] = useState<boolean>(false);

    const setModDeveloper = useCallback((enable: boolean) => {
        _setModDeveloper(enable);
        window.electron.setModDeveloper(enable);
    }, []);

    useEffect(() => {
        (async () => {
            const appVersion = await window.electron.getAppVersion();
            setAppVersion(appVersion);

            const appConfig = await window.electron.getAppConfig();
            _setLanguage(appConfig.language);
            _setClientPath(appConfig.clientPath);
            _setEnableConsole(appConfig.enableConsole);
            _setAutoLogin(appConfig.autoLogin);
            i18n.changeLanguage(appConfig.language);
            _setAudioEnabled(appConfig.audioEnabled);
            _setAudioVolume(appConfig.audioVolume);
            _setModDeveloper(appConfig.modDeveloper ?? false);
        })();
    }, []);

    const [downloadInProgress, setDownloadInProgress] =
        useState<boolean>(false);

    const [selectedServer, setSelectedServer] = useState<ServerEntry | null>(
        null,
    );

    return (
        <AppState.Provider
            value={{
                appVersion,
                language,
                clientPath,

                setAppVersion,
                setLanguage,
                setClientPath,

                enableConsole,
                autoLogin,
                audioEnabled,
                audioVolume,
                setEnableConsole,
                setAutoLogin,
                setAudioEnabled,
                setAudioVolume,

                downloadInProgress,
                setDownloadInProgress,

                selectedServer,
                setSelectedServer,

                modDeveloper,
                setModDeveloper,
            }}
        >
            {children}
        </AppState.Provider>
    );
};

export const useAppState = (): AppStateType => {
    const context = useContext(AppState);
    if (!context) {
        throw new Error("useAppState must be used within an AppProvider");
    }
    return context;
};
