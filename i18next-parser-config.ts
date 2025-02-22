module.exports = {
    context: true,
    contextSeparator: "_",
    input: [
        "src/**/*.{js,jsx,ts,tsx}", // Scan all JS/TS files in src
        "!src/**/*.spec.{js,jsx,ts,tsx}", // Exclude test files
    ],
    output: "src/locales/$LOCALE/$NAMESPACE.json", // Output to src/locales/<lang>/<namespace>.json
    locales: ["en"], // Supported locales
    defaultNamespace: "translation", // Matches your setup
    // defaultValue: "{{text}}", // Placeholder for untranslated strings
    keepRemoved: false, // Remove unused keys (optional)
    sort: true, // Sort keys alphabetically
    createOldCatalogs: false,
    lexers: {
        js: ["JsxLexer"],
        ts: ["JavascriptLexer"],
        jsx: ["JsxLexer"],
        tsx: ["JsxLexer"],
    },
    // Key generation options
    keySeparator: false, // Use flat keys (e.g., "welcome" instead of "welcome.message")
    namespaceSeparator: false, // Avoid namespace in keys
};
