import { useEffect, useState } from "react";
import { Fade } from "react-awesome-reveal";
import { useToast } from "../hooks/use-toast";

export type FileEntry = {
    target: string;
    download?: boolean;
    source: string;
};

export type ModEntry = {
    id: string;
    name: string;
    path: string;
    downloaded?: boolean;
    files: FileEntry[];
    iconUrl?: string;
};

import DEFAULT_ICON from "../assets/mushroom-mod.png";
import { ServerEntry } from "./ServerList";

export const ModList = ({
    selectedServer,
    modDownload,
    toggleExpandedModList,
    handleModDownload,
}: {
    selectedServer: ServerEntry;
    modDownload: boolean;
    toggleExpandedModList: (open: boolean) => void;
    handleModDownload: (modId: string) => void;
}) => {
    const [mods, setMods] = useState<ModEntry[]>([]);

    const refresh = async () => {
        const mods = await window.electron.getModList();
        setMods(mods);
    };

    useEffect(() => {
        if (!modDownload) {
            refresh();
        }
    }, [modDownload]);

    const handleModSelected = async (mod: ModEntry) => {
        if (!mod.downloaded) {
            return;
        }

        if (selectedServer.mods?.some((m) => m.id === mod.id)) {
            selectedServer.mods = selectedServer.mods.filter(
                (smod) => smod.id !== mod.id,
            );
        } else {
            selectedServer.mods = [
                selectedServer.mods || [],
                { id: mod.id, priority: 0 },
            ].flat();
        }

        await window.electron.setServerMods(
            selectedServer.id,
            selectedServer.mods,
        );
    };

    const isModEnabled = (mod: ModEntry) => {
        return (
            selectedServer.mods?.some((smod) => smod.id === mod.id) &&
            mod.downloaded
        );
    };

    return (
        <div className="z-50 w-full overflow-hidden">
            <Fade direction="up" duration={500}>
                <div className="flex h-[24rem] flex-col gap-2 overflow-x-hidden rounded-md bg-black/50 drop-shadow-md">
                    <div className="flex w-full justify-between">
                        <button
                            className="w-full bg-blue-400/50 p-3 text-center text-xs text-white hover:text-blue-200"
                            onClick={() => window.electron.openModFolder()}
                        >
                            Open Mod Folder
                        </button>
                        <button
                            className="w-full bg-red-400/50 p-3 text-center text-xs text-white hover:text-red-200"
                            onClick={() => toggleExpandedModList(false)}
                        >
                            Close
                        </button>
                    </div>
                    <div className="overflow-y-auto">
                        {mods
                            .sort((a, b) => {
                                if (a.downloaded && !b.downloaded) {
                                    return -1;
                                }
                                if (!a.downloaded && b.downloaded) {
                                    return 1;
                                }
                                return +isModEnabled(b) - +isModEnabled(a);
                            })
                            .map((mod) => (
                                <div
                                    key={mod.id}
                                    className={`flex cursor-pointer items-center gap-2 rounded-sm p-2 hover:bg-black/25`}
                                    onClick={() => handleModSelected(mod)}
                                >
                                    <div className="flex w-full flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-black/15 drop-shadow-lg">
                                                <img
                                                    src={
                                                        mod.iconUrl ||
                                                        DEFAULT_ICON
                                                    }
                                                    alt="Server Icon"
                                                    className={`h-full w-full object-cover ${isModEnabled(mod) ? "" : "grayscale"}`}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <div className="text-ellipsis text-nowrap text-lg font-bold">
                                                    {mod.name}
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            className={`h-1 w-full rounded-full ${mod.downloaded ? (isModEnabled(mod) ? "bg-green-500" : "bg-red-500") : "bg-gray-400"}`}
                                        ></div>
                                        <div className="flex justify-between">
                                            <div
                                                className={`text-xs ${mod.downloaded ? (isModEnabled(mod) ? "text-green-500" : "text-red-500") : "text-gray-400"}`}
                                            >
                                                {mod.downloaded
                                                    ? isModEnabled(mod)
                                                        ? "Enabled"
                                                        : "Disabled"
                                                    : "Not Downloaded"}
                                            </div>
                                            <div>
                                                <button
                                                    className="text-xs text-blue-400 hover:text-blue-100"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleModDownload(
                                                            mod.id,
                                                        );
                                                    }}
                                                >
                                                    {mod.downloaded
                                                        ? "Update"
                                                        : "Download"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </Fade>
        </div>
    );
};
