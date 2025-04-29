import { config } from "dotenv";
import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        root: "./test/e2e",
        hookTimeout: 60000,
        reporters: ["default"],
        fileParallelism: false,
        globalSetup: ["./setup/global-setup/setup-postgresql-testcontainer.ts"],
        setupFiles: ["./setup/setup/reflect-metadata.ts", "./setup/setup/data-source.ts"],
        env: {
            ...config({ path: "./test/e2e/.env.e2e" }).parsed
        },
        disableConsoleIntercept: true
    },
    plugins: [
        swc.vite({
            module: {
                type: "es6"
            }
        })
    ]
});
