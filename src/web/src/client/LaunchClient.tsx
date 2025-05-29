import { useState } from "react";
import { Button } from "../../components/ui/button";
import { useAppState } from "../AppState";
import { t } from "i18next";
import { toast } from "sonner";
import { Spinner } from "../../components/Spinner";

export const LaunchClient = () => {
    const { selectedServer } = useAppState();
    const [loading, setLoading] = useState(false);

    const launchClient = async () => {
        if (!selectedServer) {
            toast("Please select a server to launch the client.");
            return;
        }

        setLoading(true);

        const [preLaunchResponse, preLaunchMessage] =
            await window.electron.preLaunchChecks(selectedServer.id);
        if (!preLaunchResponse) {
            toast.error(preLaunchMessage || "Pre-launch checks failed.");
            setLoading(false);
            return;
        }

        const [res, message] = await window.electron.launchClient(
            selectedServer.id,
        );
        setLoading(false);
        if (!res) {
            toast.error(message || "Failed to launch the client.");
            return;
        }
    };

    return (
        <div>
            <Button
                variant="maplestory_primary"
                size="maplestory"
                className="w-full"
                disabled={!selectedServer}
                onClick={launchClient}
            >
                {t("client.launch", "Launch")}

                {loading && <Spinner />}
            </Button>
        </div>
    );
};
