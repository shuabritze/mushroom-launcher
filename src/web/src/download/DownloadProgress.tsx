import { useEffect, useState } from "react";
import { Progress } from "../../components/ui/progress";
import { useAppState } from "../AppState";
import { Container } from "../Container";

export const DownloadProgress = () => {
    const { downloadInProgress, setDownloadInProgress } = useAppState();
    const [progress, setProgress] = useState<number>(0);
    const [file, setFile] = useState<string>("");
    const [eta, setEta] = useState<number>(-1);

    useEffect(() => {
        if (!downloadInProgress) {
            setProgress(0);
            setFile("");
            setEta(-1);
            return;
        }

        const interval = setInterval(() => {
            window.electron.getDownloadProgress().then((p) => {
                setProgress(p);
            });
            window.electron.getDownloadFile().then((f) => {
                setFile(f);
            });
            window.electron.getDownloadEta().then((e) => {
                setEta(e);
            });
        }, 32);

        const cleanDownload = window.electron.on("download-complete", () => {
            setDownloadInProgress(false);
            setProgress(0);
            setFile("");
            setEta(-1);
        });

        return () => {
            clearInterval(interval);
            cleanDownload();
        };
    }, [downloadInProgress]);

    if (!downloadInProgress) {
        return null;
    }

    return (
        <div className="absolute right-0 bottom-0 left-0 z-20 m-auto w-full p-2 drop-shadow-2xl">
            <Container title={<div className="text-sm">{file}</div>}>
                <Progress value={progress} />
            </Container>
        </div>
    );
};
