import { Eye, EyeOff, Folder, Pencil, Plus } from "lucide-react";
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
import type { ServerEntry } from "@/app/config";
import { Label } from "@/web/components/ui/label";
import { Input } from "@/web/components/ui/input";
import { useState } from "react";

export const ServerSheet = (props: {
    refresh: () => void;
    existing?: ServerEntry;
}) => {
    const [open, setOpen] = useState(false);

    const [ip, setIp] = useState("");
    const [port, setPort] = useState("20001");
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);

    const handleAdd = async () => {
        const formatted = {
            ip: ip.trim().toLocaleLowerCase(),
            port: parseInt(port.trim()),
            name: name.trim(),
            username: username.trim(),
            password: password.trim(),
        };

        if (
            formatted.ip === "" ||
            isNaN(formatted.port) ||
            formatted.name === "" ||
            formatted.port < 1 ||
            formatted.port > 65535
        ) {
            return;
        }

        const added = await window.electron.addServer({
            ip: formatted.ip,
            port: formatted.port,
            name: formatted.name,
            hidden: false,
            auth: {
                username: formatted.username,
                password: formatted.password,
            },
        });

        if (added) {
            props.refresh();
        }
        window.electron.saveAppConfig();
        setIp("");
        setPort("20001");
        setName("");
        setUsername("");
        setPassword("");
        setOpen(false);
    };

    const handleEdit = async () => {
        const formatted = {
            ip: ip.trim().toLocaleLowerCase(),
            port: parseInt(port.trim()),
            name: name.trim(),
            username: username.trim(),
            password: password.trim(),
        };

        if (
            formatted.ip === "" ||
            isNaN(formatted.port) ||
            formatted.name === "" ||
            formatted.port < 1 ||
            formatted.port > 65535
        ) {
            return;
        }

        const edited = await window.electron.editServer({
            id: props.existing?.id,
            ip: formatted.ip,
            port: formatted.port,
            name: formatted.name,
            hidden: false,
            auth: {
                username: formatted.username,
                password: formatted.password,
            },
        });

        if (edited) {
            props.refresh();
        }
        setOpen(false);
    };

    return (
        <>
            <Sheet
                open={open}
                onOpenChange={(o) => {
                    setOpen(o);
                    if (!o) {
                        window.electron.saveAppConfig();
                        setIp("");
                        setPort("20001");
                        setName("");
                        setUsername("");
                        setPassword("");
                    } else if (props.existing) {
                        setIp(props.existing.ip);
                        setPort(props.existing.port.toString());
                        setName(props.existing.name);
                        setUsername(props.existing.auth?.username || "");
                        setPassword(props.existing.auth?.password || "");
                    }
                }}
            >
                <SheetTrigger asChild>
                    {props.existing ? (
                        <Button
                            variant="maplestory_secondary"
                            className="h-8 w-8"
                        >
                            <Pencil />
                        </Button>
                    ) : (
                        <Button
                            variant="maplestory_secondary"
                            className="h-7 w-6"
                        >
                            <Plus />
                        </Button>
                    )}
                </SheetTrigger>

                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>
                            {props.existing
                                ? t("server.add.title.edit", "Edit Server")
                                : t("server.add.title.add", "Add Server")}
                        </SheetTitle>
                        <SheetDescription className="flex w-10/12 flex-col gap-2">
                            <Separator />
                            <div className="flex flex-col gap-2">
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label
                                            htmlFor="name"
                                            className="text-right"
                                        >
                                            {t("server.add.name", "Name")}
                                        </Label>
                                        <Input
                                            id="name"
                                            placeholder="MapleStory 2"
                                            value={name}
                                            onChange={(e) =>
                                                setName(e.target.value)
                                            }
                                            className="col-span-3"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label
                                            htmlFor="ip"
                                            className="text-right"
                                        >
                                            {t("server.add.ip", "IP")}
                                        </Label>
                                        <Input
                                            id="ip"
                                            placeholder="127.0.0.1"
                                            value={ip}
                                            onChange={(e) =>
                                                setIp(e.target.value)
                                            }
                                            className="col-span-3"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label
                                            htmlFor="port"
                                            className="text-right"
                                        >
                                            {t("server.add.port", "Port")}
                                        </Label>
                                        <Input
                                            id="port"
                                            placeholder="20001"
                                            type="number"
                                            min={1}
                                            max={65535}
                                            value={port}
                                            onChange={(e) =>
                                                setPort(e.target.value)
                                            }
                                            className="col-span-3"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label
                                            htmlFor="username"
                                            className="text-right"
                                        >
                                            {t(
                                                "server.add.username",
                                                "Login Username",
                                            )}
                                        </Label>
                                        <Input
                                            id="username"
                                            placeholder="optional"
                                            value={username}
                                            onChange={(e) =>
                                                setUsername(e.target.value)
                                            }
                                            className="col-span-3"
                                        />
                                    </div>
                                    <div className="relative grid grid-cols-4 items-center gap-4">
                                        <Label
                                            htmlFor="password"
                                            className="text-right"
                                        >
                                            {t(
                                                "server.add.password",
                                                "Login Password",
                                            )}
                                        </Label>
                                        <Input
                                            id="password"
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            placeholder="optional"
                                            value={password}
                                            onChange={(e) =>
                                                setPassword(e.target.value)
                                            }
                                            className="col-span-3"
                                        />
                                        {!showPassword ? (
                                            <EyeOff
                                                className="absolute top-1.5 right-4 z-10 w-4 cursor-pointer hover:text-gray-300"
                                                onClick={() => {
                                                    setShowPassword(
                                                        !showPassword,
                                                    );
                                                }}
                                            />
                                        ) : (
                                            <Eye
                                                className="absolute top-1.5 right-4 z-10 w-4 cursor-pointer hover:text-gray-300"
                                                onClick={() =>
                                                    setShowPassword(
                                                        !showPassword,
                                                    )
                                                }
                                            />
                                        )}
                                    </div>

                                    {props.existing ? (
                                        <Button
                                            variant="outline"
                                            type="submit"
                                            onClick={handleEdit}
                                        >
                                            {t("server.add.save", "Save")}
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            type="submit"
                                            onClick={handleAdd}
                                        >
                                            {t("server.add.add", "Add")}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </SheetDescription>
                    </SheetHeader>
                </SheetContent>
            </Sheet>
        </>
    );
};
