import { useEffect, useState } from "react";

import { characters } from "../assets/characters";
import { backgrounds } from "../assets/backgrounds";
import { Slide } from "react-awesome-reveal";
import { ServerEntry, ServerList } from "./ServerList";
import { ClientPath } from "./ClientPath";
import { Actions } from "./Actions";
import { Toaster } from "../components/ui/toaster";
import { ModList } from "./ModList";
import { toast } from "../hooks/use-toast";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import { t } from "i18next";
import i18n from "../lib/i18n";

function App() {
    const [appVersion, setAppVersion] = useState<string>("1.0.0");
    const [appLanguage, setAppLanguage] = useState<string>("en");
    const [languages, setLanguages] = useState<{ code: string; text: string; }[]>([
        {
            code: "en",
            text: "English",
        },
        {
            code: "zhcn",
            text: "简体中文",
        },
        {
            code: "zhtw",
            text: "繁體中文",
        },
        {
            code: "jp",
            text: "日本語",
        },
        {
            code: "ptbr",
            text: "Português",
        },
        {
            code: "kr",
            text: "한국어",
        },
    ]);

    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
    const [randCharacter, setRandCharacter] = useState<number>(-1);
    const [randBackground, setRandBackground] = useState<number>(-1);

    useEffect(() => {
        setRandCharacter(Math.floor(Math.random() * characters.length));
        setRandBackground(Math.floor(Math.random() * backgrounds.length));

        (async () => {
            const version = await window.electron.getAppVersion();
            setAppVersion(version);

            const language = await window.electron.getAppLanguage();
            setAppLanguage(language);
            i18n.changeLanguage(language);
        })();

        const handleMouseMove = (event: MouseEvent) => {
            setCursorPosition({ x: event.clientX, y: event.clientY });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);

    const [selectedServer, setSelectedServer] = useState<ServerEntry | null>(
        null,
    );

    const handleServerSelected = (server: ServerEntry) => {
        setSelectedServer(server);
    };

    const [expandedModList, setExpandedModList] = useState(false);
    const toggleExpandedModList = (open: boolean) => {
        setExpandedModList(open);
    };

    const [modDownload, setModDownload] = useState(false);
    const handleModDownload = async (modId: string) => {
        setModDownload(true);
        const [downloaded, message] = await window.electron.downloadMod(modId);
        if (!downloaded) {
            toast({
                title: t("actions.download.failed", "Failed to download"),
                description: message,
            });
        } else {
            toast({
                title: t("actions.download.downloaded", "Downloaded"),
                description: message,
            });
        }
        setModDownload(false);
    };

    return (
        <>
            <div className="relative h-screen w-screen overflow-hidden">
                <div
                    className="h-full w-full bg-cover bg-fixed bg-center"
                    style={{
                        backgroundImage: `url('${backgrounds[randBackground]}')`,
                    }}
                >
                    <Toaster />
                    <div className="flex h-full w-full flex-col gap-2 text-white">
                        <h1 className="z-10 flex w-full justify-between bg-black/50 p-4 text-[1rem] font-bold drop-shadow-md">
                            <a
                                className="w-full"
                                href="https://github.com/shuabritze/mushroom-launcher"
                                target="_blank"
                            >
                                Mushroom Launcher
                            </a>
                            <div className="flex h-6 items-center gap-6">
                                <Select
                                    value={appLanguage}
                                    onValueChange={(v) => {
                                        setAppLanguage(v);
                                        window.electron.setAppLanguage(v);
                                        i18n.changeLanguage(v);
                                    }}
                                >
                                    <SelectTrigger className="w-[7rem] text-xs">
                                        <SelectValue
                                            placeholder={appLanguage}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {languages.map((lng) => (
                                            <SelectItem value={lng.code} key={lng.code}>
                                                {lng.text}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <a
                                    href="#"
                                    onClick={async () => {
                                        // refresh characters
                                        setRandCharacter(-1);
                                        setRandBackground(-1);
                                        await new Promise((resolve) =>
                                            setTimeout(resolve, 100),
                                        );
                                        setRandCharacter(
                                            Math.floor(
                                                Math.random() *
                                                    characters.length,
                                            ),
                                        );
                                        setRandBackground(
                                            Math.floor(
                                                Math.random() *
                                                    backgrounds.length,
                                            ),
                                        );
                                    }}
                                >
                                    v{appVersion}
                                </a>
                            </div>
                        </h1>
                        <div className="flex w-full justify-between gap-4 p-4">
                            <ServerList
                                onServerSelected={handleServerSelected}
                                toggleExpandedModList={toggleExpandedModList}
                            />
                            {expandedModList ? (
                                <ModList
                                    selectedServer={selectedServer}
                                    toggleExpandedModList={
                                        toggleExpandedModList
                                    }
                                    handleModDownload={handleModDownload}
                                    modDownload={modDownload}
                                />
                            ) : (
                                <div className="w-full"></div>
                            )}
                        </div>
                        <Actions
                            selectedServer={selectedServer}
                            modDownload={modDownload}
                        />
                    </div>
                </div>
                {randCharacter !== -1 && (
                    <div className="pointer-events-none absolute left-0 top-0 flex h-screen w-screen items-end justify-end">
                        <Slide direction="right" duration={2500}>
                            <img
                                src={characters[randCharacter]}
                                alt="Character"
                                className="w-[24rem] drop-shadow-md"
                                style={{
                                    transform: `translate(calc(${cursorPosition.x * 0.01}px), calc(${cursorPosition.y * 0.01}px))`,
                                }}
                            />
                        </Slide>
                    </div>
                )}
            </div>
        </>
    );
}

export default App;
