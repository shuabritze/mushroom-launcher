import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";

import { t } from "i18next";
import { RefreshCcw, Trash } from "lucide-react";
import type { ServerEntry } from "@/app/config";
import { useAppState } from "../AppState";
import { ServerSheet } from "./ServerSheet";
import { Container } from "../Container";
import { LaunchClient } from "../client/LaunchClient";
import { ScrollArea } from "@/web/components/ui/scroll-area";

import DEFAULT_ICON from "../../assets/mushroom.png";
import SERVERS_ICON from "../../assets/server-icon.png";

export function RemoveServerDialog({
    server,
    refresh,
}: {
    server: ServerEntry;
    refresh: () => void;
}) {
    const [open, setOpen] = useState(false);

    const [loading, setLoading] = useState(false);

    const handleRemove = async () => {
        setLoading(true);
        console.log(server);
        const deleted = await window.electron.removeServer(server.id);

        if (deleted) {
            refresh();
        }
        setLoading(false);
        setOpen(false);
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                setOpen(o);
                setLoading(false);
            }}
        >
            <DialogTrigger asChild>
                <Button variant="maplestory_secondary" className="h-8 w-8">
                    <Trash />
                </Button>
            </DialogTrigger>
            <DialogContent className="flex w-[16rem] flex-col items-center">
                <DialogHeader>
                    <DialogTitle>
                        {t("server.remove.confirm", "Are you sure?")}
                    </DialogTitle>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        {t("server.remove.cancel", "Cancel")}
                    </Button>
                    <Button
                        variant="destructive"
                        disabled={loading}
                        // showSpinner={loading}
                        type="submit"
                        onClick={handleRemove}
                    >
                        {t("server.remove.delete", "Delete")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export const ServerList = () => {
    // const { toast } = useToast();
    const { selectedServer, setSelectedServer } = useAppState();
    const [servers, setServers] = useState<ServerEntry[]>([]);

    const [blanks, setBlanks] = useState<any[]>([]);

    const [fetching, setFetching] = useState(false);

    const fetchOnlineStatus = async () => {
        if (fetching) return;
        setFetching(true);
        const updatedServers = await Promise.all(
            servers.map(async (server) => {
                const online = await window.electron.getOnlineStatus(server.id);
                return { ...server, online };
            }),
        );
        setFetching(false);
        setServers(updatedServers);
    };

    const refresh = async () => {
        const _servers = await window.electron.getServerList();

        // Sort servers by last played
        _servers.sort((a, b) => {
            if (a.lastPlayed && b.lastPlayed) {
                return b.lastPlayed - a.lastPlayed;
            }
            if (a.lastPlayed && !b.lastPlayed) {
                return -1;
            }
            if (!a.lastPlayed && b.lastPlayed) {
                return 1;
            }
            return 0;
        });
        setServers(_servers);

        setBlanks(Array.from({ length: 7 - _servers.length }).fill(0));

        if (
            selectedServer === null ||
            !_servers.find((s) => s.id === selectedServer.id)
        ) {
            setSelectedServer(_servers[0]);
        }

        if (_servers.length === 0) {
            setSelectedServer(null);
        }
    };

    const handleServerSelected = (server: ServerEntry) => {
        setSelectedServer(server);
    };

    useEffect(() => {
        refresh();
    }, []);

    return (
        <div className="flex h-full w-full flex-col gap-1">
            <Container
                title={
                    <div className="relative">
                        <img
                            src={SERVERS_ICON}
                            className="absolute -top-5 left-0 w-12"
                        />
                        <div className="pl-15">
                            {t("server.list.title", "Servers")}
                        </div>
                    </div>
                }
                actions={
                    <>
                        <ServerSheet refresh={refresh} />{" "}
                        <Button
                            variant="maplestory_secondary"
                            className="h-7 w-6"
                            onClick={async () => {
                                fetchOnlineStatus();
                            }}
                            disabled={fetching}
                        >
                            <RefreshCcw />
                        </Button>
                    </>
                }
                footer={
                    <div className="flex w-full flex-col gap-1 rounded-md px-2 pt-2">
                        <LaunchClient />
                    </div>
                }
            >
                <div className="overflow-y-hidden">
                    <div className="flex w-full flex-col overflow-y-auto border border-b border-[#D2D2D2]">
                        <ScrollArea className="h-[21rem]">
                            {servers.map((server, idx) => (
                                <div
                                    key={server.id}
                                    className={`flex h-12 w-full items-center justify-between border pr-1 pl-2 ${
                                        selectedServer?.id === server.id
                                            ? "bg-[#FBD003]/75 text-black"
                                            : idx % 2 === 0
                                              ? "bg-[#EDEDED] text-black/80 hover:bg-white"
                                              : "bg-[#E7E7E7] text-black/80 hover:bg-white"
                                    }`}
                                >
                                    <div
                                        className="flex w-full cursor-pointer items-center gap-2"
                                        onClick={() =>
                                            handleServerSelected(server)
                                        }
                                    >
                                        {server.online ? (
                                            <div className="h-3 w-3 rounded-full bg-green-300"></div>
                                        ) : (
                                            <div className="flex h-3 w-3 items-center justify-center rounded-full bg-gray-300">
                                                <div className="h-1 w-1 rounded-full bg-gray-500"></div>
                                            </div>
                                        )}
                                        <img
                                            className={`h-8 w-8 rounded-sm border border-[#A0A0A0] bg-black/15 p-0.5 ${server.online ? "" : "grayscale"}`}
                                            src={DEFAULT_ICON}
                                        />
                                        <div className="font-bold text-shadow-sm/50 text-shadow-white">
                                            {server.name}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <ServerSheet
                                            refresh={refresh}
                                            existing={server}
                                        />
                                        <RemoveServerDialog
                                            server={server}
                                            refresh={refresh}
                                        />
                                    </div>
                                </div>
                            ))}
                            {blanks.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-12 w-full ${
                                        (blanks.length % 2 == 0
                                            ? idx
                                            : idx + 1) %
                                            2 ===
                                        0
                                            ? "bg-[#EDEDED] hover:bg-white"
                                            : "bg-[#E7E7E7] hover:bg-white"
                                    }`}
                                ></div>
                            ))}
                        </ScrollArea>
                    </div>
                </div>
            </Container>
        </div>
    );
};
