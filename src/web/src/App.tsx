import { useEffect, useState } from "react";

import { backgrounds } from "../assets/backgrounds.mjs";
import { characters } from "../assets/characters.mjs";
import { SettingsSheet } from "./SettingsSheet";
import { GithubIcon } from "lucide-react";
import { useAppState } from "./AppState";
import { ServerList } from "./serverlist/ServerList";
import { DownloadSheet } from "./download/DownloadSheet";
import { DiscordWidget } from "./Discord";
import { MusicPlayer } from "./MusicPlayer";
import { ModsSheet } from "./mods/ModsSheet";
import { DownloadProgress } from "./download/DownloadProgress";

function App() {
    const { appVersion } = useAppState();

    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
    const [randCharacter, setRandCharacter] = useState<number>(-1);
    const [randBackground, setRandBackground] = useState<number>(-1);

    useEffect(() => {
        setRandCharacter(Math.floor(Math.random() * characters.length));
        setRandBackground(Math.floor(Math.random() * backgrounds.length));

        const handleMouseMove = (event: MouseEvent) => {
            setCursorPosition({ x: event.clientX, y: event.clientY });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);

    return (
        <>
            <div className={`relative h-screen w-screen overflow-hidden`}>
                <div
                    className="h-full w-full bg-cover bg-fixed bg-center"
                    style={{
                        backgroundImage: `url('${backgrounds[randBackground]}')`,
                    }}
                >
                    <div className="flex h-full w-full flex-col gap-2 text-white">
                        <h1 className="z-10 flex w-full items-center justify-between bg-black/50 p-4 text-[1rem] font-bold">
                            <div className="flex gap-1">
                                Mushroom Launcher 2
                            </div>
                            <div className="flex h-6 items-center gap-2">
                                <DownloadSheet />
                                <ModsSheet />
                                <SettingsSheet />
                                <a
                                    href="https://github.com/shuabritze/mushroom-launcher"
                                    target="_blank"
                                    className="rounded-md p-2 hover:bg-gray-200/15"
                                >
                                    <GithubIcon />
                                </a>
                                <a
                                    href="#"
                                    className="rounded-md p-2 hover:bg-gray-200/15"
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
                        <div className="flex h-full flex-col bg-gradient-to-t from-black/80 via-black/25 via-5% to-transparent p-2">
                            <div className="flex h-full gap-2">
                                <div className="flex h-full w-full flex-col justify-between">
                                    <ServerList />
                                </div>
                                <div className="w-[32rem]">
                                    <DiscordWidget guildId="1233581457470128209" />
                                </div>
                            </div>
                        </div>
                        <DownloadProgress />
                    </div>
                </div>
                {randCharacter !== -1 && (
                    <div className="pointer-events-none absolute top-0 left-0 flex h-screen w-screen items-end justify-end">
                        <div className="animate-in slide-in-from-right-50 flex h-full w-full items-end justify-end overflow-hidden duration-[2500ms] ease-in-out">
                            <img
                                src={characters[randCharacter]}
                                alt="Character"
                                className="w-[22rem] drop-shadow-md"
                                style={{
                                    transform: `translate(calc(${
                                        cursorPosition.x * 0.01
                                    }px), calc(${cursorPosition.y * 0.01}px))`,
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
            <MusicPlayer />
        </>
    );
}

export default App;
