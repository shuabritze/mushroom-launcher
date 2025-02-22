import { t } from "i18next";
import { useEffect, useState } from "react";
import { Trans } from "react-i18next";

export function ClientPath() {
    const [clientUrl, setClientUrl] = useState<string | null>(null);

    const handleClientPath = async () => {
        const result = await window.electron.openClientDialog();
        if (result) {
            setClientUrl(result);
        }
    };

    useEffect(() => {
        (async () => {
            const clientPath = await window.electron.getClientPath();
            setClientUrl(clientPath);
        })();
    }, []);

    return (
        <div
            className="w-full cursor-pointer text-xs"
            onClick={handleClientPath}
        >
            <div className="rounded-md bg-black/50 p-2">
                <div className="no-scrollbar overflow-y-auto text-nowrap text-white">
                    {clientUrl ||
                        t("client.install.location", "No Install Location Set")}
                </div>
                <div className="flex w-full justify-between text-blue-400 underline">
                    <Trans i18nKey="client.change.install.location">
                        Change Install Location
                    </Trans>
                    {clientUrl && (
                        <div
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                window.electron.openClientFolder();
                            }}
                        >
                            <Trans i18nKey="client.open.folder">
                                Open Client Folder
                            </Trans>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
