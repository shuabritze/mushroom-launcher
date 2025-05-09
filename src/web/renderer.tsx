import React from "react";
import ReactDOM from "react-dom/client";
import App from "./src/App";
import "./index.css";
import { I18nextProvider } from "react-i18next";
import i18n from "@/web/lib/i18n";
import { AppProvider } from "./src/AppState";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <I18nextProvider i18n={i18n}>
            <AppProvider>
                <App />
            </AppProvider>
        </I18nextProvider>
    </React.StrictMode>,
);
