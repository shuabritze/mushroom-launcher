import { useEffect, useState } from "react";
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { useAppState } from "../AppState";

export const ModsPath = () => {
    // const { clientPath } = useAppState();

    const [modsPath, setModsPath] = useState<string[]>([]);

    useEffect(() => {
        (async () => {
            const path = await window.electron.getAppDataPath();

            const modPath = `${path}\\mods`;

            setModsPath(modPath.split("\\"));
        })();
    }, []);

    return (
        <>
            <Breadcrumb>
                <BreadcrumbList>
                    {modsPath.map((part, index) => {
                        const isLast = index === modsPath.length - 1;
                        return (
                            <BreadcrumbItem key={index}>
                                <BreadcrumbLink
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        window.electron.openFolder(
                                            modsPath
                                                .slice(0, index + 1)
                                                .join("/"),
                                        );
                                    }}
                                >
                                    {part}
                                </BreadcrumbLink>
                                {!isLast && (
                                    <BreadcrumbSeparator>/</BreadcrumbSeparator>
                                )}
                            </BreadcrumbItem>
                        );
                    })}
                </BreadcrumbList>
            </Breadcrumb>
        </>
    );
};
