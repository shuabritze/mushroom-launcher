import i18n from "i18next";
import path from "path";
import fs from "fs";
import logger from "electron-log/main";
import { app } from "electron";

export const loadTranslation = (lng: string, ns: string) => {
    const filePath = app.isPackaged
        ? path.join(process.resourcesPath, `./locales/${lng}/${ns}.json`)
        : path.join(__dirname, `../../src/locales/${lng}/${ns}.json`);

    const data = fs.readFileSync(filePath, "utf8");

    return JSON.parse(data);
};

const customBackend = {
    read: (lng: any, ns: any, callback: (arg0: any, arg1: any) => any) => {
        return callback(null, loadTranslation(lng, ns));
    },
};

export const createI18n = () => {
    i18n.use({ type: "backend", ...customBackend }).init({
        lng: "en",
        fallbackLng: "en",
        interpolation: { escapeValue: false },
        ns: ["translation"],
        defaultNS: "translation",
        debug: true,
    });

    i18n.on("missingKey", (lng, ns, key, fallbackValue) => {
        logger.error(`Missing key: ${key} in ${lng}/${ns}`);
    });
};

export const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
};
