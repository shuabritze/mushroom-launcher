import { LucideFileBox } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "../../components/ui/sheet";

import { t } from "i18next";
import { Separator } from "../../components/ui/separator";
import { ModsPath } from "./ModPath";
import { useEffect, useState } from "react";
import { Button } from "@/web/components/ui/button";
import type { ModEntry } from "@/app/mods";

export const ModsSheet = () => {
    const [mods, setMods] = useState<ModEntry[]>([]);

    const fetchMods = async () => {
        const mods = await window.electron.getClientMods();
        setMods(mods);
    };

    useEffect(() => {
        fetchMods();
    }, []);

    return (
        <>
            <Sheet
                onOpenChange={(o) => {
                    if (!o) {
                        window.electron.saveAppConfig();
                    } else {
                        fetchMods();
                    }
                }}
            >
                <SheetTrigger className="cursor-pointer rounded-md p-2 hover:bg-gray-200/15">
                    <LucideFileBox />
                </SheetTrigger>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>{t("mods.title", "Mods")}</SheetTitle>
                        <SheetDescription className="flex w-10/12 flex-col gap-2">
                            <Separator />
                            <div className="flex w-full flex-col gap-2">
                                <Separator />
                                <div className="flex flex-col gap-2">
                                    <small>
                                        {t("mods.path.info", "Mods Folder")}
                                    </small>
                                    <ModsPath />
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                onClick={async () => {
                                    const appDataPath =
                                        await window.electron.getAppDataPath();
                                    window.electron.openFolder(
                                        `${appDataPath}\\mods`,
                                    );
                                }}
                            >
                                {t("mods.path.open", "Open Mods Folder")}
                            </Button>
                            <Separator />
                            {mods.map((mod) => (
                                <div
                                    key={mod.id}
                                    className="flex w-full flex-col gap-2"
                                >
                                    <Separator />
                                    <div className="flex flex-col gap-2">
                                        <div className="font-bold text-white">
                                            {mod.name}
                                        </div>
                                        <div className="flex w-full flex-row items-center justify-between">
                                            <div className="flex flex-col gap-2">
                                                <p className="text-sm text-gray-500">
                                                    {mod.files.length}
                                                    {t(
                                                        "mods.files.count",
                                                        "files",
                                                    )}
                                                </p>
                                                <small>{mod.id}</small>
                                            </div>
                                            <div className="flex flex-row gap-2">
                                                {mod.enabled ? (
                                                    <Button
                                                        variant="destructive"
                                                        onClick={async () => {
                                                            await window.electron.disableMod(
                                                                mod.id,
                                                            );
                                                            fetchMods();
                                                        }}
                                                    >
                                                        {t(
                                                            "mods.disable",
                                                            "Disable",
                                                        )}
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="default"
                                                        onClick={async () => {
                                                            await window.electron.enableMod(
                                                                mod.id,
                                                            );
                                                            fetchMods();
                                                        }}
                                                    >
                                                        {t(
                                                            "mods.enable",
                                                            "Enable",
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <Separator />
                                </div>
                            ))}
                        </SheetDescription>
                    </SheetHeader>
                </SheetContent>
            </Sheet>
        </>
    );
};
