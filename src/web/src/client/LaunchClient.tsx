import { Button } from "../../components/ui/button";
import { useAppState } from "../AppState";
import { t } from "i18next";

export const LaunchClient = () => {
    const { selectedServer } = useAppState();

    const launchClient = async () => {
        if (!selectedServer) return;

        const [res, message] = await window.electron.launchClient(
            selectedServer.id,
        );
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
            </Button>
        </div>
    );
};
