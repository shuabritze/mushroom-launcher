import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { useAppState } from "../AppState";

export const ClientPath = () => {
    const { clientPath } = useAppState();

    const path = clientPath.split("\\");
    const pathPartsLength = path.length;

    return (
        <>
            <Breadcrumb>
                <BreadcrumbList>
                    {path.map((part, index) => {
                        const isLast = index === pathPartsLength - 1;
                        return (
                            <BreadcrumbItem key={index}>
                                <BreadcrumbLink
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        window.electron.openFolder(
                                            path.slice(0, index + 1).join("/"),
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
