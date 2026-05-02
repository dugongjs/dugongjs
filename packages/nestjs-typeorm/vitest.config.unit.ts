import { join } from "path";
import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        root: __dirname,
        include: ["src/**/*.test.ts"],
        reporters: ["verbose"],
        setupFiles: [join(__dirname, "test", "setup", "reflect-metadata.ts")]
    },
    plugins: [swc.vite()]
});
