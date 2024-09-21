import { useState } from "react";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { ServerEntry } from "./ServerList";
import { useToast } from "../hooks/use-toast";

export function Actions({ selectedServer }: { selectedServer: ServerEntry }) {
    const { toast } = useToast();

    const [progress, setProgress] = useState(-1);

    const [installing, setInstalling] = useState(false);
    const [launching, setLaunching] = useState(false);

    const handleLaunch = async () => {
        if (!selectedServer) {
            toast({
                title: "No Server Selected",
                description: "Please select a server to launch",
            });
            return;
        }
        setLaunching(true);
        const [launched, message] = await window.electron.launchClient(
            selectedServer.id,
        );
        if (!launched) {
            toast({
                title: "Failed to launch",
                description: message,
            });
        }
        setLaunching(false);
    };

    const handleInstall = async () => {
        setInstalling(true);
        const [installed, message] = await window.electron.installClient();
        if (!installed) {
            toast({
                title: "Failed to install",
                description: message,
            });
        }
        setInstalling(false);
    };

    const handlePatch = async () => {
        const [patched, message] = await window.electron.patchClient();
        if (!patched) {
            toast({
                title: "Failed to patch",
                description: message,
            });
        } else {
            toast({
                title: "Patched",
                description: "Added Maple2.dll to client!",
            });
        }
    };

    const handleXmlDownload = async () => {
        setProgress(0);

        const ticker = setInterval(async () => {
            const progress = await window.electron.getPatchProgress();
            setProgress(progress);
        }, 100);

        const [patched, message] = await window.electron.patchXML();
        clearInterval(ticker);
        if (!patched) {
            toast({
                title: "Failed to patch",
                description: message,
            });
        } else {
            toast({
                title: "Patched",
                description: "Custom XML files added to client!",
            });
        }
        setProgress(-1);
    };

    return (
        <div className="absolute bottom-0 z-20 w-full">
            <div className="w-1/2 pl-4">
                {progress !== -1 && (
                    <Progress value={progress} className="h-2" />
                )}
            </div>
            <div className="flex h-20 w-full items-center justify-between bg-gradient-to-t from-black via-black/75 to-transparent text-white">
                <span className="w-1/2 pl-4">
                    <Button
                        variant="ghost"
                        className="w-full"
                        disabled={launching}
                        showSpinner={launching}
                        onClick={handleLaunch}
                    >
                        Launch
                    </Button>
                </span>

                <span className="flex w-1/2 items-center justify-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={handleInstall}
                        disabled={installing}
                        showSpinner={installing}
                    >
                        Install Client
                    </Button>
                    <Button variant="ghost" onClick={handlePatch}>
                        Patch
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={handleXmlDownload}
                        disabled={progress !== -1}
                        showSpinner={progress !== -1}
                    >
                        Patch XML
                    </Button>
                </span>
            </div>
        </div>
    );
}
