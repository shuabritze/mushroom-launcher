import { useEffect, useState } from "react";

import { characters } from "../assets/characters";
import { backgrounds } from "../assets/backgrounds";
import { Slide } from "react-awesome-reveal";
import { ServerEntry, ServerList } from "./ServerList";
import { ClientPath } from "./ClientPath";
import { Actions } from "./Actions";
import { Toaster } from "../components/ui/toaster";

function App() {
    const [appVersion, setAppVersion] = useState<string>("1.0.0");

    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
    const [randCharacter, setRandCharacter] = useState<number>(-1);
    const [randBackground, setRandBackground] = useState<number>(-1);

    useEffect(() => {
        setRandCharacter(Math.floor(Math.random() * characters.length));
        setRandBackground(Math.floor(Math.random() * backgrounds.length));

        (async () => {
            const version = await window.electron.getAppVersion();
            setAppVersion(version);
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
                                href="https://github.com/shuabritze/mushroom-launcher"
                                target="_blank"
                            >
                                Mushroom Launcher
                            </a>
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
                                            Math.random() * characters.length,
                                        ),
                                    );
                                    setRandBackground(
                                        Math.floor(
                                            Math.random() * backgrounds.length,
                                        ),
                                    );
                                }}
                            >
                                v{appVersion}
                            </a>
                        </h1>
                        <ServerList onServerSelected={handleServerSelected} />
                        <ClientPath />
                        <Actions selectedServer={selectedServer} />
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
