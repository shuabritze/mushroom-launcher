import { defineConfig } from "vite";
import copy from "rollup-plugin-copy";

// https://vitejs.dev/config
export default defineConfig({
    resolve: {
        // Some libs that can run in both Web and Node.js, such as `axios`, we need to tell Vite to build them in Node.js.
        mainFields: ["module", "jsnext:main", "jsnext"],
    },
    build: {
        commonjsOptions: {
            ignoreDynamicRequires: true,
        },
        rollupOptions: {
            plugins: [
                copy({
                    targets: [
                        {
                            src: "node_modules/lzma/src/lzma_worker.js",
                            dest: ".vite/build/src",
                        },
                        {
                            src: "node_modules/@doctormckay/steam-crypto/system.pem",
                            dest: ".vite/build",
                        },
                    ],
                }),
            ],
        },
    },
});
