import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const customBackend = {
    read: (lng: any, ns: any, callback: (arg0: any, arg1: any) => any) => {
        window.electron
            .loadTranslation(lng, ns)
            .then((data) => callback(null, data))
            .catch((err) => callback(err, null));
    },
};

i18n.use({ type: "backend", ...customBackend })
    .use(initReactI18next)
    .init({
        lng: "en",
        fallbackLng: "en",
        interpolation: { escapeValue: false },
        ns: ["translation"],
        defaultNS: "translation",
    });

i18n.on("missingKey", (lng, ns, key, fallbackValue) => {
    console.error(`Missing key: ${key} in ${lng}/${ns}`);
});

export default i18n;
