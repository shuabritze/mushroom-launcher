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
import { Button } from "../../components/ui/button";
import { useAppState } from "../AppState";

import ModListEntry from "../mods/ModEntry";
import CreateModDialog from "../mods/CreateModDialog";
import { ModEntry } from "../../../app/mods";

export const ModsSheet = () => {
    const [mods, setMods] = useState<ModEntry[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const { modDeveloper } = useAppState();

    const [updatingModId, setUpdatingModId] = useState<string | null>(null);

    const fetchMods = async () => {
        const mods = await window.electron.getClientMods();
        setMods(mods);
    };

    useEffect(() => {
        fetchMods();
    }, []);

    // Helper to handle mod update with loading state
    const handleUpdateMod = async (modId: string) => {
        setUpdatingModId(modId);
        try {
            await window.electron.updateMod(modId);
            fetchMods();
        } finally {
            setUpdatingModId(null);
        }
    };

    return (
        <>
            <Sheet
                onOpenChange={(open) => {
                    if (!open) {
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
                        <SheetTitle className="flex w-[85%] flex-row items-center justify-between gap-2">
                            {t("mods.title", "Mods")}
                            {modDeveloper && (
                                <Button
                                    variant="outline"
                                    onClick={() => setShowCreateModal(true)}
                                >
                                    {t("mods.create", "Create Mod")}
                                </Button>
                            )}
                        </SheetTitle>
                        <SheetDescription className="flex w-10/12 flex-col gap-2">
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
                            {mods.map((modEntry) => (
                                <ModListEntry
                                    key={modEntry.mod.id}
                                    modDeveloper={modDeveloper}
                                    updatingModId={updatingModId}
                                    fetchMods={fetchMods}
                                    handleUpdateMod={handleUpdateMod}
                                    modEntry={modEntry}
                                />
                            ))}
                        </SheetDescription>
                    </SheetHeader>
                </SheetContent>
            </Sheet>
            {modDeveloper && (
                <CreateModDialog
                    showCreateModal={showCreateModal}
                    setShowCreateModal={setShowCreateModal}
                    fetchMods={fetchMods}
                />
            )}
        </>
    );
};
