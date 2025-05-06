import { config } from "dotenv";
import { join } from "path";
import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        root: join(__dirname, "test", "e2e"),
        hookTimeout: 60000,
        reporters: ["default"],
        globalSetup: [join("setup", "global-setup", "setup-postgresql-testcontainer.ts")],
        setupFiles: [join("setup", "setup", "reflect-metadata.ts"), join("setup", "setup", "data-source.ts")],
        fileParallelism: false,
        disableConsoleIntercept: true,
        env: { ...config({ path: join(__dirname, ".env.e2e") }).parsed }
    },
    plugins: [
        swc.vite({
            module: {
                type: "es6"
            }
        })
    ]
});
