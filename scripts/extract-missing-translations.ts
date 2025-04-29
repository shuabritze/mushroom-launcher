import * as fs from "fs";
import * as path from "path";

// Recursively get all files in a directory
function getAllFiles(
    dir: string,
    ext: string[],
    files: string[] = [],
): string[] {
    for (const entry of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, entry);
        if (fs.statSync(fullPath).isDirectory()) {
            getAllFiles(fullPath, ext, files);
        } else if (ext.some((e) => entry.endsWith(e))) {
            files.push(fullPath);
        }
    }
    return files;
}

// Extract translation keys from code
function extractTranslationKeys(fileContent: string): [string, string][] {
    // This regex matches t("key", "default") even if arguments are on multiple lines
    const regex =
        /t\(\s*["'`]([^"'`]+)["'`]\s*,\s*["'`]([^"'`]+)["'`][\s,)]/gms;
    const keys: [string, string][] = [];
    let match;
    while ((match = regex.exec(fileContent))) {
        keys.push([match[1], match[2]]);
    }
    return keys;
}

// Find all translation JSON files
function findTranslationFiles(localesDir: string): string[] {
    return fs
        .readdirSync(localesDir, {
            withFileTypes: true,
            recursive: true,
            encoding: "utf8",
        })
        .filter((f) => f.isFile())
        .filter((f) => f.name.endsWith(".json"))
        .map((f) => path.join(f.parentPath, f.name));
}

function main() {
    const projectRoot = path.resolve(__dirname, "..");
    const srcDir = path.join(projectRoot, "src");
    const localesDir = path.join(srcDir, "locales");

    // 1. Collect all translation keys from codebase
    const codeFiles = getAllFiles(srcDir, [".ts", ".tsx", ".js", ".jsx"]);
    const foundKeys = new Map<string, string>();
    for (const file of codeFiles) {
        const content = fs.readFileSync(file, "utf8");
        for (const [key, def] of extractTranslationKeys(content)) {
            if (!foundKeys.has(key)) foundKeys.set(key, def);
        }
    }

    // 2. For each translation file, add missing keys
    const translationFiles = findTranslationFiles(localesDir);
    for (const file of translationFiles) {
        const json = JSON.parse(fs.readFileSync(file, "utf8"));
        let changed = false;
        for (const [key, def] of foundKeys.entries()) {
            if (!(key in json)) {
                json[key] = def;
                changed = true;
            }
        }
        if (changed) {
            fs.writeFileSync(
                file,
                JSON.stringify(json, null, 4) + "\n",
                "utf8",
            );
            console.log(`Updated: ${file}`);
        }
    }
}

main();
