import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";
import "dotenv/config";

import * as fs from "fs";
import * as path from "path";

const patcherDir = path.join(__dirname, "./src/patcher");
const patcherFiles = fs.readdirSync(patcherDir);

const downloaderDir = path.join(__dirname, "./src/downloader");
const downloaderFiles = fs.readdirSync(downloaderDir);

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: "./images/icon.ico",
    extraResource: [
        patcherFiles.map((file) => path.join(patcherDir, file)),
        downloaderFiles.map((file) => path.join(downloaderDir, file)),
        "./src/locales",
    ].flat(),
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      loadingGif: "./images/installer.gif",
      copyright: "MIT License Copyright © 2025 shuabritze",
      iconUrl:
        "https://raw.githubusercontent.com/shuabritze/mushroom-launcher/refs/heads/main/images/icon.ico",
      setupIcon: "./images/installericon.ico",
    }),
    new MakerZIP({}, ["darwin"]),
    new MakerRpm({}),
    new MakerDeb({}),
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {},
    },
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: "src/main.ts",
          config: "vite.main.config.mts",
          target: "main",
        },
        {
          entry: "src/app/preload.ts",
          config: "vite.preload.config.mts",
          target: "preload",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.mts",
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
