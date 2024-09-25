import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";
import "dotenv/config";

import * as fs from "fs";
import * as path from "path";

const patcherDir = path.join(__dirname, "./src/patcher");
const patcherFiles = fs.readdirSync(patcherDir);

const config: ForgeConfig = {
    packagerConfig: {
        asar: true,
        icon: "./images/icon.ico",
        extraResource: patcherFiles.map(file => path.join(patcherDir, file)),
    },
    rebuildConfig: {},
    makers: [
        new MakerSquirrel({
            copyright: "MIT License Copyright © 2024 shuabritze",
            iconUrl:
                "https://raw.githubusercontent.com/shuabritze/mushroom-launcher/refs/heads/main/images/icon.ico",
            setupIcon: "./images/installericon.ico",
        }),
        new MakerZIP({}, ["darwin"]),
    ],
    plugins: [
        new VitePlugin({
            // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
            // If you are familiar with Vite configuration, it will look really familiar.
            build: [
                {
                    // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
                    entry: "src/main.ts",
                    config: "vite.main.config.ts",
                    target: "main",
                },
                {
                    entry: "src/preload.ts",
                    config: "vite.preload.config.ts",
                    target: "preload",
                },
                {
                    entry: "src/worker.ts",
                    config: "vite.worker.config.ts",
                    target: "main",
                },
            ],
            renderer: [
                {
                    name: "main_window",
                    config: "vite.renderer.config.ts",
                },
            ],
        }),
        // Fuses are used to enable/disable various Electron functionality
        // at package time, before code signing the application
        new FusesPlugin({
            version: FuseVersion.V1,
            [FuseV1Options.RunAsNode]: false,
            [FuseV1Options.EnableCookieEncryption]: true,
            [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
            [FuseV1Options.EnableNodeCliInspectArguments]: false,
            [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
            [FuseV1Options.OnlyLoadAppFromAsar]: true,
        }),
    ],
    publishers: [
        {
            name: "@electron-forge/publisher-github",
            config: {
                repository: {
                    owner: "shuabritze",
                    name: "mushroom-launcher",
                },
                prerelease: true,
            },
        },
    ],
};

export default config;
