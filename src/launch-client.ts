import child_process from "child_process";
import fs from "fs";
import path from "path";
import { APP_STATE, SaveConfig } from "./main";
import { ModEntry } from "./web/src/ModList";

export const LaunchClient = async (id: string) => {
    const server = APP_STATE.servers.find((server) => server.id === id);
    if (!server) {
        return [false, "Server not found"];
    }
    const clientPath = APP_STATE.clientPath;
    if (!clientPath) {
        return [false, "No Install Location Set"];
    }
    const exePath = path.join(clientPath, "x64", "MapleStory2.exe");
    if (!fs.existsSync(exePath)) {
        return [false, "Client not found"];
    }
    const maple2Path = path.join(clientPath, "x64", "maple2.dll");
    if (!fs.existsSync(maple2Path)) {
        return [false, "Maple2.dll not found (Did you run the patcher?)"];
    }
    const mods = server.mods
        .map((smod) => ({
            mod: APP_STATE.mods.find((mod) => mod.id === smod.id),
            priority: smod.priority,
        }))
        .filter((mod) => mod.mod)
        .sort((a, b) => a.priority - b.priority);

    // Write to Maple2.ini file with server information
    const iniPath = path.join(clientPath, "x64", "maple2.ini");
    fs.writeFileSync(
        iniPath,
        `[default]
    name=${server?.name}
    host=${server.ip}
    port=${server.port}
    banword=true
    multiclient=true
    visualizer=false
    log_exceptions=false
    hook_outpacket=false
    hook_inpacket=false
    patch_input_text=true
    patch_ugc_music=true`,
    );

    // Remove old mod files
    const appliedMods = path.join(clientPath, "Data", "applied-mods.json");
    if (fs.existsSync(appliedMods)) {
        // Remove old mod files that don't exist in the new mods
        let oldMods = JSON.parse(fs.readFileSync(appliedMods).toString());

        oldMods = oldMods.filter((oldMod: { mod: ModEntry }) => {
            return !mods.find((mod) => mod.mod.id === oldMod.mod.id);
        });

        for (const oldMod of oldMods) {
            for (const oldModFile of oldMod.mod.files) {
                const oldModPath = path.join(
                    clientPath,
                    "Data",
                    oldModFile.target,
                );
                if (fs.existsSync(oldModPath + ".bak")) {
                    fs.copyFileSync(oldModPath + ".bak", oldModPath);
                }
            }
        }
    }

    // Copy mod files
    for (const mod of mods.map((m) => m.mod)) {
        for (const modFile of mod.files) {
            const modSource = modFile.download
                ? modFile.target
                : modFile.source;
            const modPath = path.join(mod.path, modSource);
            console.log(modPath);
            if (fs.existsSync(modPath)) {
                const targetFilePath = path.join(
                    clientPath,
                    "Data",
                    modFile.target,
                );
                if (
                    !fs.existsSync(targetFilePath + ".bak") &&
                    fs.existsSync(targetFilePath)
                ) {
                    fs.copyFileSync(targetFilePath, targetFilePath + ".bak");
                }

                fs.copyFileSync(modPath, targetFilePath);
            }
        }
    }
    fs.writeFileSync(appliedMods, JSON.stringify(mods));

    const clientProcess = child_process.spawn(exePath, [], {
        detached: true,
    });

    // Minimize the client window
    clientProcess.unref();

    // Set the last played time
    server.lastPlayed = Date.now();
    SaveConfig();

    return [true, "Launched"];
};
