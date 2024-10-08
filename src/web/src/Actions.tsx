import { useState } from "react";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { ServerEntry } from "./ServerList";
import { useToast } from "../hooks/use-toast";

const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secondsLeft = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${secondsLeft.toString().padStart(2, "0")}`;
};

export function Actions({ selectedServer }: { selectedServer: ServerEntry }) {
    const { toast } = useToast();

    const [progress, setProgress] = useState(-1);
    const [file, setFile] = useState("");
    const [eta, setEta] = useState(-1);

    const [installing, setInstalling] = useState(false);
    const [launching, setLaunching] = useState(false);
    const [patching, setPatching] = useState(false);

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
        const etas: number[] = [];
        const ticker = setInterval(async () => {
            const progress = await window.electron.getDownloadProgress();
            const file = await window.electron.getDownloadFile();
            const eta = await window.electron.getDownloadEta();

            // Add to average of last 100 ETA values
            const etaAverage = etas.reduce((acc, value, i) => {
                if (i < 100) {
                    return acc + value / etas.length;
                }
                return acc + value / 100;
            }, 0);
            setEta(etaAverage);

            etas.push(eta);
            if (etas.length > 100) {
                etas.shift();
            }

            setFile(file);
            setProgress(progress);
            setEta(eta);
        }, 100);

        const [installed, message] = await window.electron.installClient();
        clearInterval(ticker);
        if (!installed) {
            toast({
                title: "Failed to install",
                description: message,
            });
        } else {
            toast({
                title: "Client Installed",
                description: message,
            });
        }
        setInstalling(false);
        setProgress(-1);
        setFile("");
        setEta(-1);
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
        setFile("Xml.m2d");
        setPatching(true);

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
        setFile("");
        setPatching(false);
    };

    return (
        <div className="absolute bottom-0 z-20 w-full">
            <div className="w-1/2 pl-4">
                {progress !== -1 && (
                    <div className="rounded-md bg-black/50 p-2">
                        <div className="flex w-full justify-between">
                            <span className="text-sm shadow-lg">{file}</span>
                            {eta !== -1 && (
                                <span className="text-sm shadow-lg">
                                    {formatTime(eta)}
                                </span>
                            )}
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>
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
                        disabled={patching}
                        showSpinner={patching}
                    >
                        Patch XML
                    </Button>
                </span>
            </div>
        </div>
    );
}
