import React from "react";
import ReactDOM from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import { Toaster } from "sonner";
import i18n from "../web/lib/i18n";
import "./index.css";
import App from "./src/App";
import { AppProvider } from "./src/AppState";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <I18nextProvider i18n={i18n}>
            <AppProvider>
                <App />
                <Toaster />
            </AppProvider>
        </I18nextProvider>
    </React.StrictMode>,
);
