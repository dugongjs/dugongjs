import { config } from "dotenv";
import { join } from "path";
import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";
import type { DriverName } from "./drivers/driver.js";

export function createE2eConfig(packageRoot: string, driver: DriverName, globalSetup: string[] = []) {
    return defineConfig({
        test: {
            name: `@dugongjs/nestjs-typeorm:${driver}`,
            globals: true,
            root: join(packageRoot, "test", "e2e"),
            hookTimeout: 60000,
            reporters: ["default"],
            globalSetup,
            setupFiles: [join("setup", "setup", "reflect-metadata.ts")],
            fileParallelism: false,
            disableConsoleIntercept: true,
            env: {
                ...config({ path: join(packageRoot, ".env.e2e") }).parsed,
                DB_DRIVER: driver
            }
        },
        plugins: [
            swc.vite({
                module: {
                    type: "es6"
                }
            })
        ]
    });
}
