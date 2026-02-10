import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        projects: ["packages/*/vitest.config.e2e.ts"],
        fileParallelism: false
    }
});
