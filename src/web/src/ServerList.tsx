import { useEffect, useState } from "react";
import { Fade } from "react-awesome-reveal";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Spinner } from "../components/ui/spinner";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { useToast } from "../hooks/use-toast";
import { Checkbox } from "../components/ui/checkbox";

export type ServerModEntry = {
    id: string;
    priority?: number;
};

export type ServerEntry = {
    id: string;
    ip: string;
    port: number;
    online: boolean;
    name: string;
    mods?: ServerModEntry[];
    lastPlayed?: number;
    hidden?: boolean;
    iconUrl?: string;
};

import DEFAULT_ICON from "../assets/mushroom.png";
import { ClientPath } from "./ClientPath";
import { t } from "i18next";

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
        console.log(deleted);
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
                <div className="text-xs text-red-400 hover:text-red-100">
                    {t("server.remove.remove", "Remove")}
                </div>
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
                        showSpinner={loading}
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

export function AddServerDialog({ refresh }: { refresh: () => void }) {
    const [open, setOpen] = useState(false);

    const [loading, setLoading] = useState(false);

    const [ip, setIp] = useState("");
    const [port, setPort] = useState("");
    const [name, setName] = useState("");
    const [hidden, setHidden] = useState(false);

    const handleAdd = async () => {
        setLoading(true);
        const formatted = {
            ip: ip.trim().toLocaleLowerCase(),
            port: parseInt(port.trim()),
            name: name.trim(),
            hidden: hidden || false,
        };

        if (
            formatted.ip === "" ||
            isNaN(formatted.port) ||
            formatted.name === "" ||
            formatted.port < 1 ||
            formatted.port > 65535
        ) {
            setLoading(false);
            return;
        }

        const added = await window.electron.addServer(
            formatted.ip,
            formatted.port,
            formatted.name,
            formatted.hidden,
        );
        if (added) {
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
                setIp("");
                setPort("");
                setName("");
                setHidden(false);
            }}
        >
            <DialogTrigger asChild>
                <div className="cursor-pointer p-2 hover:bg-black/25">
                    {t("server.add.add", "+ Add Server")}
                </div>
            </DialogTrigger>
            <DialogContent className="flex w-[24rem] flex-col items-center">
                <DialogHeader>
                    <DialogTitle>
                        {t("server.add.title", "Add server")}
                    </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            {t("server.add.name", "Name")}
                        </Label>
                        <Input
                            id="name"
                            placeholder="MapleStory 2"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="ip" className="text-right">
                            {t("server.add.ip", "IP")}
                        </Label>
                        <Input
                            id="ip"
                            placeholder="127.0.0.1"
                            value={ip}
                            onChange={(e) => setIp(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="port" className="text-right">
                            {t("server.add.port", "Port")}
                        </Label>
                        <Input
                            id="port"
                            placeholder="20001"
                            type="number"
                            min={1}
                            max={65535}
                            value={port}
                            onChange={(e) => setPort(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="hidden" className="text-right">
                            {t("server.add.hide.ip", "Hide IP")}
                        </Label>
                        <Checkbox
                            id="hidden"
                            checked={hidden}
                            onCheckedChange={(v) =>
                                setHidden(typeof v === "boolean" ? v : false)
                            }
                            className="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        {t("server.add.cancel", "Cancel")}
                    </Button>
                    <Button
                        type="submit"
                        onClick={handleAdd}
                        disabled={loading}
                        showSpinner={loading}
                    >
                        {t("server.add.add.confirm", "Add")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export const ServerList = ({
    onServerSelected,
    toggleExpandedModList,
}: {
    onServerSelected: (server: ServerEntry) => void;
    toggleExpandedModList: (open: boolean) => void;
}) => {
    const { toast } = useToast();

    const [servers, setServers] = useState<ServerEntry[]>([]);
    const [selectedServer, setSelectedServer] = useState<ServerEntry | null>(
        null,
    );

    const refresh = async () => {
        const servers = await window.electron.getServerList();

        // Sort servers by last played
        servers.sort((a, b) => {
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

        setServers(servers);
        setSelectedServer(servers[0]);
        onServerSelected(servers[0]);
    };

    const handleServerSelected = (server: ServerEntry) => {
        setSelectedServer(server);
        onServerSelected(server);
    };

    const handleServerLaunched = async (server: ServerEntry) => {
        setSelectedServer(server);
        const [launched, message] = await window.electron.launchClient(
            server.id,
        );
        if (!launched) {
            toast({
                title: t("server.launch.failed", "Failed to launch"),
                description: message,
            });
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    useEffect(() => {
        const tick = setInterval(async () => {
            for (const server of servers) {
                const online = await window.electron.getOnlineStatus(server.id);
                if (online !== server.online) {
                    server.online = online;
                    setServers([...servers]);
                }
            }
        }, 30000);
        return () => {
            clearInterval(tick);
        };
    }, [servers]);

    return (
        <div className="flex w-full flex-col gap-1 overflow-hidden">
            <Fade direction="up" duration={500}>
                <div>
                    <div className="flex h-full flex-col gap-2 overflow-y-auto rounded-tl-md rounded-tr-md bg-black/50 text-center">
                        <AddServerDialog refresh={refresh} />
                    </div>
                    <div className="flex h-[21.5rem] flex-col gap-2 overflow-y-auto overflow-x-hidden rounded-bl-md rounded-br-md bg-black/50 drop-shadow-md">
                        {servers.map((server) => (
                            <div
                                key={server.id}
                                onClick={() => handleServerSelected(server)}
                                onDoubleClick={() =>
                                    handleServerLaunched(server)
                                }
                                className={`flex cursor-pointer items-center gap-2 rounded-sm p-2 ${selectedServer?.id === server.id ? "bg-blue-400/15 ring-2 ring-inset ring-primary/50 hover:bg-blue-400/25" : "hover:bg-black/25"}`}
                            >
                                <div className="flex w-full flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-black/15 drop-shadow-lg">
                                            <img
                                                src={
                                                    server.iconUrl ||
                                                    DEFAULT_ICON
                                                }
                                                alt="Server Icon"
                                                className={`h-full w-full object-cover ${server.online ? "" : "grayscale"}`}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <div className="text-ellipsis text-nowrap text-lg font-bold">
                                                {server.name}
                                            </div>
                                            <div className="text-sm text-gray-400">
                                                {server.hidden
                                                    ? t(
                                                          "server.hidden.server",
                                                          "Hidden Server",
                                                      )
                                                    : `${server.ip}:${server.port}`}
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        className={`h-1 w-full rounded-full ${server.online ? "bg-green-500" : "bg-red-500"}`}
                                    ></div>
                                    <div className="flex justify-between">
                                        <div
                                            className={`text-xs ${server.online ? "text-green-500" : "text-red-500"}`}
                                        >
                                            {server.online
                                                ? t("server.online", "Online")
                                                : t(
                                                      "server.offline",
                                                      "Offline",
                                                  )}
                                        </div>
                                        <div className="flex select-none gap-3">
                                            <div
                                                className="text-xs text-blue-400 hover:text-blue-100"
                                                onDoubleClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                }}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleServerSelected(
                                                        server,
                                                    );
                                                    toggleExpandedModList(true);
                                                }}
                                            >
                                                {t(
                                                    "server.edit.mods",
                                                    "Edit Mods",
                                                )}
                                            </div>
                                            <RemoveServerDialog
                                                server={server}
                                                refresh={refresh}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <ClientPath />
            </Fade>
        </div>
    );
};
