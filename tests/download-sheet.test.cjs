const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

test("DownloadSheet does not offer the direct-link download provider", () => {
    const source = fs.readFileSync(
        path.resolve(__dirname, "../src/web/src/download/DownloadSheet.tsx"),
        "utf8",
    );

    assert.doesNotMatch(source, /startDownload\("direct"\)/);
    assert.doesNotMatch(source, /"download\.install\.direct"/);
});

test("direct downloader implementation remains available for future use", () => {
    const source = fs.readFileSync(
        path.resolve(__dirname, "../src/app/download-client.ts"),
        "utf8",
    );

    assert.match(source, /provider === "direct"/);
});
