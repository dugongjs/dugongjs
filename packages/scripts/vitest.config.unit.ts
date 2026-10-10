import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        root: __dirname,
        include: ["src/**/*.test.ts"],
        reporters: ["verbose"]
    }
});
