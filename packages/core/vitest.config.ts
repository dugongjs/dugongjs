import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        root: "./",
        reporters: "verbose",
        setupFiles: ["./src/test/setup/reflect-metadata.ts"]
    },
    plugins: [swc.vite()]
});
