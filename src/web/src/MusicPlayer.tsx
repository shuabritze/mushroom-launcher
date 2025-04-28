import { useEffect, useRef, useState } from "react";
import { useAppState } from "./AppState";
import { BGM } from "../assets/sounds.mjs";

export const MusicPlayer = () => {
    const { audioEnabled, audioVolume } = useAppState();

    const [audioSrc, setAudioSrc] = useState<string | null>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const handleFocus = () => {
            if (audioRef.current && !audioRef.current.paused) {
                audioRef.current.volume = audioVolume / 400;
            }
        };

        const handleBlur = () => {
            if (audioRef.current) {
                audioRef.current.volume = 0;
            }
        };

        const cleanFocus = window.electron.on("window-focused", handleFocus);
        const cleanBlur = window.electron.on("window-blurred", handleBlur);

        return () => {
            cleanFocus();
            cleanBlur();
            if (audioRef.current) {
                audioRef.current.volume = 0;
            }
        };
    }, [audioVolume]);

    useEffect(() => {
        if (!audioEnabled) {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            setAudioSrc(null);
            return;
        }

        // Pick a random audio file from the list
        const bg = BGM[Math.floor(Math.random() * BGM.length)];
        setAudioSrc(bg);
    }, [audioEnabled]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = audioVolume / 400;
            console.log("setting volume to", audioVolume / 400);
        }
    }, [audioVolume]);

    useEffect(() => {
        if (audioRef.current && audioSrc) {
            audioRef.current.src = audioSrc || "";
            audioRef.current.load();

            if (audioRef.current.paused) {
                audioRef.current.currentTime = 0; // Reset to the beginning
            }

            audioRef.current.play().catch((error) => {
                console.error("Error playing audio:", error);
            });
        }
    }, [audioSrc]);

    const handleAudioEnded = () => {
        if (audioRef.current) {
            const bg = BGM[Math.floor(Math.random() * BGM.length)];
            setAudioSrc(bg);
        }
    };

    return (
        <>
            <audio ref={audioRef} onEnded={handleAudioEnded} />
        </>
    );
};
