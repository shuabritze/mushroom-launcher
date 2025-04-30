import { useEffect, useRef, useState } from "react";

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
    const [randBackground, setRandBackground] = useState<number>(0);
    const characterRef = useRef<HTMLImageElement>(null);

    const [transitioning, setTransitioning] = useState(false);

    const getUniqueRandomBackground = () => {
        const newBg = 1 + Math.floor(Math.random() * (backgrounds.length - 2));
        const nextBg = (randBackground + newBg) % backgrounds.length;

        if (nextBg === randBackground) {
            return getUniqueRandomBackground();
        }
        
        return nextBg;
    };

    const resetBackgroundAndCharacter = () => {
        if (transitioning) {
            return;
        }

        setRandBackground(getUniqueRandomBackground());
        if (randCharacter === -1) {
            setRandCharacter(Math.floor(Math.random() * characters.length));
            characterRef.current.src = characters[randCharacter];
            return;
        }

        setRandCharacter(-1);
        setTransitioning(true);

        characterRef.current.classList.remove("animate-in");

        setTimeout(() => {
            setRandCharacter(Math.floor(Math.random() * characters.length));
            characterRef.current.src = characters[randCharacter];
            setTransitioning(false);
        }, 500);

        characterRef.current.onload = () => {
            characterRef.current.classList.add("animate-in");
        };
    };

    useEffect(() => {
        resetBackgroundAndCharacter();

        const handleMouseMove = (event: MouseEvent) => {
            setCursorPosition({ x: event.clientX, y: event.clientY });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, [characterRef.current]);

    return (
        <>
            <div className={`relative h-screen w-screen overflow-hidden`}>
                {backgrounds.map((bg, i) => (
                    <div
                        key={i}
                        className="absolute pointer-events-none -z-10 h-full w-full bg-cover bg-fixed bg-center transition-opacity duration-1000 ease-in-out"
                        style={{
                            backgroundImage: `url('${bg}')`,
                            opacity: randBackground === i ? "100%" : "0%",
                        }}
                    />
                ))}
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
                                className={`rounded-md p-2 hover:bg-gray-200/15 ${transitioning ? "animate-pulse" : ""}`}
                                onClick={async () => {
                                    // refresh characters
                                    resetBackgroundAndCharacter();
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
                <div className="pointer-events-none absolute top-0 left-0 flex h-screen w-screen items-end justify-end overflow-hidden">
                    <div className="flex h-full w-full items-end justify-end overflow-hidden duration-[2500ms] ease-in-out">
                        <img
                            ref={characterRef}
                            alt="Character"
                            className="slide-in-from-right-100 w-[22rem] drop-shadow-md transition-opacity duration-500 ease-in-out"
                            style={{
                                opacity: randCharacter === -1 ? "0%" : "100%",
                                transform: `translate(calc(${cursorPosition.x * 0.01
                                    }px), calc(${cursorPosition.y * 0.01}px))`,
                            }}
                        />
                    </div>
                </div>
                <MusicPlayer />
            </div>
        </>
    );
}

export default App;
