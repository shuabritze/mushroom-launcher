import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { ModEntry } from "../../../app/mods";
import { Spinner } from "../../components/Spinner";
import { Button } from "../../components/ui/button";

import { t } from "i18next";
import { Separator } from "../../components/ui/separator";

export default function ModListEntry({
    modEntry,
    modDeveloper,
    updatingModId,
    fetchMods,
    handleUpdateMod,
}: {
    modEntry: ModEntry;
    modDeveloper: boolean;
    updatingModId: string | null;
    fetchMods: () => void;
    handleUpdateMod: (modId: string) => Promise<void>;
}) {
    let actionsMenu = (
        <>
            <Button
                variant="secondary"
                onClick={async () => {
                    await handleUpdateMod(modEntry.mod.id);
                }}
                disabled={!!updatingModId}
            >
                {updatingModId === modEntry.mod.id ? (
                    <>
                        <Spinner />
                        {t("mods.updating", "Updating...")}
                    </>
                ) : (
                    t("mods.update", "Update")
                )}
            </Button>
            {modEntry.enabled && (
                <Button
                    variant="destructive"
                    onClick={async () => {
                        await window.electron.disableMod(modEntry.mod.id);
                        fetchMods();
                    }}
                >
                    {t("mods.disable", "Disable")}
                </Button>
            )}
            {!modEntry.enabled && (
                <Button
                    variant="default"
                    onClick={async () => {
                        await window.electron.enableMod(modEntry.mod.id);
                        fetchMods();
                    }}
                >
                    {t("mods.enable", "Enable")}
                </Button>
            )}
        </>
    );

    if (modDeveloper) {
        actionsMenu = (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="secondary" disabled={!!updatingModId}>
                        {t("mods.actions", "Actions")}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem
                        onClick={async () => {
                            await handleUpdateMod(modEntry.mod.id);
                        }}
                        disabled={!!updatingModId}
                    >
                        {updatingModId === modEntry.mod.id ? (
                            <>
                                <Spinner />
                                {t("mods.updating", "Updating...")}
                            </>
                        ) : (
                            t("mods.update", "Update from remote")
                        )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={async () => {
                            await window.electron.updateModJson(
                                modEntry.mod.id,
                            );
                            fetchMods();
                        }}
                        disabled={!!updatingModId}
                    >
                        {t("mods.updateLocal", "Update Local Files")}
                    </DropdownMenuItem>
                    {modEntry.enabled ? (
                        <DropdownMenuItem
                            onClick={async () => {
                                await window.electron.disableMod(
                                    modEntry.mod.id,
                                );
                                fetchMods();
                            }}
                            disabled={!!updatingModId}
                        >
                            {t("mods.disable", "Disable")}
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem
                            onClick={async () => {
                                await window.electron.enableMod(
                                    modEntry.mod.id,
                                );
                                fetchMods();
                            }}
                            disabled={!!updatingModId}
                        >
                            {t("mods.enable", "Enable")}
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return (
        <div className="flex w-full flex-col gap-2">
            <Separator />
            <div className="flex flex-col gap-2">
                <div
                    className={`font-bold text-white ${
                        !modEntry.enabled ? "text-gray-400 line-through" : ""
                    }`}
                >
                    {modEntry.mod.name}
                </div>
                <div className="flex w-full flex-row items-center justify-between">
                    <div className="flex flex-col gap-2">
                        <p className="text-sm text-gray-500">
                            {modEntry.files.length}{" "}
                            {t("mods.files.count", "files")}
                        </p>
                        <small>{modEntry.mod.id}</small>
                    </div>
                    <div className="flex flex-row gap-2">{actionsMenu}</div>
                </div>
            </div>
        </div>
    );
}
