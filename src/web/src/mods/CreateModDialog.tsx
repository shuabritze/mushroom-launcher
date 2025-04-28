import { t } from "i18next";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

import { useState } from "react";
import { Button } from "../../components/ui/button";

export default function CreateModDialog({
    fetchMods,
    showCreateModal,
    setShowCreateModal,
}: {
    fetchMods: () => void;
    showCreateModal: boolean;
    setShowCreateModal: (open: boolean) => void;
}) {
    const [newModId, setNewModId] = useState("");
    const [newModName, setNewModName] = useState("");
    const [newModUpdateUrl, setNewModUpdateUrl] = useState("");

    const handleCreateMod = async () => {
        if (!newModId || !newModName || !newModUpdateUrl) {
            return;
        }

        if (newModId.includes(" ")) {
            alert(t("mods.idError", "Mod ID should not contain spaces"));
            return;
        }

        const [success, message] = await window.electron.createMod({
            id: newModId,
            name: newModName,
            updateUrl: newModUpdateUrl,
        });

        if (!success) {
            alert(message);
            return;
        }

        setShowCreateModal(false);
        setNewModId("");
        setNewModName("");
        setNewModUpdateUrl("");
        fetchMods();
    };

    return (
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("mods.create", "Create Mod")}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <div>
                        <Label htmlFor="mod-id">{t("mods.id", "Mod ID")}</Label>
                        <Input
                            id="mod-id"
                            value={newModId}
                            onChange={(e) => setNewModId(e.target.value)}
                            placeholder="unique-mod-id"
                        />
                    </div>
                    <div>
                        <Label htmlFor="mod-name">
                            {t("mods.name", "Mod Name")}
                        </Label>
                        <Input
                            id="mod-name"
                            value={newModName}
                            onChange={(e) => setNewModName(e.target.value)}
                            placeholder="My Mod"
                        />
                    </div>
                    <div>
                        <Label htmlFor="mod-update-url">
                            {t("mods.updateUrl", "Update URL")}
                        </Label>
                        <Input
                            id="mod-update-url"
                            value={newModUpdateUrl}
                            onChange={(e) => setNewModUpdateUrl(e.target.value)}
                            placeholder="https://example.com/ (Use the root URL of the mod repository)"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setShowCreateModal(false)}
                    >
                        {t("common.cancel", "Cancel")}
                    </Button>
                    <Button
                        variant="default"
                        onClick={handleCreateMod}
                        disabled={!newModId || !newModName}
                    >
                        {t("mods.create", "Create")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
