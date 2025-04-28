import { Settings } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "../components/ui/sheet";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";

import { t } from "i18next";
import { useState } from "react";
import { Separator } from "../components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import { useAppState } from "./AppState";
import i18n from "../lib/i18n";
import { Switch } from "../components/ui/switch";
import { Slider } from "../components/ui/slider";

export const SettingsSheet = () => {
    const {
        language,
        setLanguage,
        autoLogin,
        setAutoLogin,
        enableConsole,
        setEnableConsole,
        audioEnabled,
        setAudioEnabled,
        audioVolume,
        setAudioVolume,
    } = useAppState();

    const [languages, setLanguages] = useState<
        { code: string; text: string }[]
    >([
        {
            code: "en",
            text: "English",
        },
        {
            code: "zhcn",
            text: "简体中文",
        },
        {
            code: "zhtw",
            text: "繁體中文",
        },
        {
            code: "jp",
            text: "日本語",
        },
        {
            code: "ptbr",
            text: "Português",
        },
        {
            code: "kr",
            text: "한국어",
        },
    ]);

    return (
        <>
            <Sheet
                onOpenChange={(o) => {
                    if (!o) {
                        window.electron.saveAppConfig();
                    }
                }}
            >
                <SheetTrigger className="cursor-pointer rounded-md p-2 hover:bg-gray-200/15">
                    <Settings />
                </SheetTrigger>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>
                            {t("client.settings.title", "Settings")}
                        </SheetTitle>
                        <SheetDescription className="flex w-10/12 flex-col gap-2">
                            <Separator />
                            <div className="flex w-full flex-col gap-2">
                                <Label htmlFor="appLanguage">
                                    {t(
                                        "client.settings.appLanguage",
                                        "Language",
                                    )}
                                </Label>
                                <Select
                                    value={language}
                                    onValueChange={(v) => {
                                        setLanguage(v);
                                        i18n.changeLanguage(v);
                                    }}
                                >
                                    <SelectTrigger
                                        id="appLanguage"
                                        className="w-full"
                                    >
                                        <SelectValue placeholder={language} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {languages.map((lng) => (
                                            <SelectItem
                                                value={lng.code}
                                                key={lng.code}
                                            >
                                                {lng.text}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Separator />
                            <div className="flex gap-2">
                                <Switch
                                    id="showConsole"
                                    checked={enableConsole}
                                    onCheckedChange={(v) => {
                                        setEnableConsole(!!v);
                                    }}
                                />
                                <Label htmlFor="showConsole">
                                    {t("client.settings.console", "Console")}
                                </Label>
                            </div>
                            <small>
                                {t(
                                    "client.settings.console.info",
                                    "Enables a console for logging errors and debug messages.",
                                )}
                            </small>
                            <div className="flex gap-2">
                                <Switch
                                    id="autoLogin"
                                    checked={autoLogin}
                                    onCheckedChange={(v) => {
                                        setAutoLogin(!!v);
                                    }}
                                />
                                <Label htmlFor="autoLogin">
                                    {t(
                                        "client.settings.autologin",
                                        "Auto Login",
                                    )}
                                </Label>
                            </div>
                            <small>
                                {t(
                                    "client.settings.autologin.info",
                                    "Uses the server credentials to log in automatically on client start",
                                )}
                            </small>
                            <Separator />
                            <div className="flex gap-2">
                                <Switch
                                    id="audioEnabled"
                                    checked={audioEnabled}
                                    onCheckedChange={(v) => {
                                        setAudioEnabled(!!v);
                                    }}
                                />
                                <Label htmlFor="audioEnabled">
                                    {t(
                                        "client.settings.audioEnabled",
                                        "Enable BGM",
                                    )}
                                </Label>
                            </div>
                            <small>
                                {t(
                                    "client.settings.audioEnabled.info",
                                    "Enables background music.",
                                )}
                            </small>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="audioVolume">
                                    {t("client.settings.audioVolume", "Volume")}
                                </Label>
                                <Slider
                                    defaultValue={[audioVolume]}
                                    max={100}
                                    step={1}
                                    onValueCommit={(v) => {
                                        setAudioVolume(v[0]);
                                    }}
                                />
                            </div>
                            <small>
                                {t(
                                    "client.settings.audioVolume.info",
                                    "Adjusts the volume of the background music.",
                                )}
                            </small>
                        </SheetDescription>
                    </SheetHeader>
                </SheetContent>
            </Sheet>
        </>
    );
};
