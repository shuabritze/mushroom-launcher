import { useEffect, useState } from "react";

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
                    {clientUrl || `No Install Location Set`}
                </div>
                <div className="text-blue-400 underline">
                    Change Install Location
                </div>
            </div>
        </div>
    );
}
