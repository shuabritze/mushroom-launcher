import {
    Download,
    DownloadCloud,
    DownloadCloudIcon,
    DownloadIcon,
    Folder,
    GithubIcon,
    Link,
} from "lucide-react";
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
import { Button } from "../../components/ui/button";
import { ClientPath } from "../client/ClientPath";
import { useAppState } from "../AppState";
import { useState } from "react";

export const DownloadSheet = () => {
    const { downloadInProgress, setDownloadInProgress, setClientPath } =
        useAppState();

    const [pathError, setPathError] = useState("");

    const startDownload = (provider: string) => {
        if (downloadInProgress) {
            return;
        }

        window.electron.downloadClient(provider);

        setDownloadInProgress(true);
    };

    return (
        <>
            <Sheet
                onOpenChange={(o) => {
                    if (!o) {
                        window.electron.saveAppConfig();
                        setPathError("");
                    }
                }}
            >
                <SheetTrigger className="cursor-pointer rounded-md p-2 hover:bg-gray-200/15">
                    <DownloadIcon />
                </SheetTrigger>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>
                            {t("download.title", "Client Install")}
                        </SheetTitle>
                        <SheetDescription className="flex w-10/12 flex-col gap-2">
                            <Separator />
                            <div className="flex flex-col gap-2">
                                <ClientPath />
                                <Button
                                    variant="outline"
                                    disabled={downloadInProgress}
                                    onClick={async () => {
                                        const newPath =
                                            await window.electron.openClientDialog();

                                        if (!newPath) {
                                            setPathError(
                                                t(
                                                    "download.install.path.missing",
                                                    "Invalid path selected.",
                                                ),
                                            );
                                            return;
                                        }

                                        // Match protected windows folders
                                        const protectedDrive = "C:\\";
                                        const protectedFolders = [
                                            "Program Files",
                                            "Program Files (x86)",
                                            "Windows",
                                            "ProgramData",
                                        ];
                                        const isProtected =
                                            protectedFolders.some(
                                                (folder) =>
                                                    newPath.startsWith(
                                                        protectedDrive,
                                                    ) &&
                                                    newPath.includes(folder),
                                            );
                                        if (isProtected) {
                                            setPathError(
                                                t(
                                                    "download.install.path.protected",
                                                    "Cannot select a protected folder.",
                                                ),
                                            );
                                            return;
                                        }

                                        setPathError("");
                                        setClientPath(newPath);
                                    }}
                                >
                                    {t(
                                        "download.install.directory",
                                        "Select Client Install Location",
                                    )}{" "}
                                    <Folder />
                                </Button>
                                <div className="text-xs text-red-400">
                                    {pathError}
                                </div>
                                <small>
                                    {t(
                                        "download.install.info",
                                        "Install directory for your MapleStory 2 client.",
                                    )}
                                </small>
                                <div
                                    className="cursor-pointer text-xs text-blue-500 underline"
                                    onClick={async () => {
                                        const appDataPath =
                                            await window.electron.getAppDataPath();
                                        setPathError("");
                                        setClientPath(
                                            `${appDataPath}\\appdata`,
                                        );
                                    }}
                                >
                                    {t(
                                        "download.install.path.recommended",
                                        "Use recommended directory",
                                    )}
                                </div>
                            </div>
                            <Separator />
                            <div className="flex flex-col gap-2">
                                <Button
                                    variant="outline"
                                    disabled={downloadInProgress}
                                    onClick={() => startDownload("steam")}
                                >
                                    {t(
                                        "download.install.steam",
                                        "Download via Steam",
                                    )}{" "}
                                    <Download />
                                </Button>
                                <small>
                                    {t(
                                        "download.install.steam.info",
                                        "Uses DepotDownloader to download from Steam.",
                                    )}
                                </small>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Button
                                    variant="outline"
                                    disabled={downloadInProgress}
                                    onClick={() => startDownload("github")}
                                >
                                    {t(
                                        "download.install.github",
                                        "Download via GitHub",
                                    )}{" "}
                                    <GithubIcon />
                                </Button>
                                <small>
                                    {t(
                                        "download.install.github.info",
                                        "Downloads from Github releases. May be taken down.",
                                    )}
                                </small>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => startDownload("direct")}
                                >
                                    {t(
                                        "download.install.direct",
                                        "Direct Link",
                                    )}{" "}
                                    <Link />
                                </Button>
                                <small>
                                    {t(
                                        "download.install.direct.info",
                                        "Direct link to the client. May be taken down.",
                                    )}
                                </small>
                            </div>
                        </SheetDescription>
                    </SheetHeader>
                </SheetContent>
            </Sheet>
        </>
    );
};
