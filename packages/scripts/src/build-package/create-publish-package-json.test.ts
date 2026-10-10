import { createPublishPackageJson } from "./create-publish-package-json.js";

describe("createPublishPackageJson", () => {
    function basePackage(exports: unknown) {
        return {
            name: "@dugongjs/example",
            version: "1.2.3",
            type: "module",
            exports,
            dependencies: { "change-case": "^5.4.4" },
            scripts: { build: "vite-node ./scripts/build.ts" },
            devDependencies: { typescript: "catalog:" },
            publishConfig: { access: "public", directory: "dist" }
        };
    }

    describe("entry point", () => {
        it("should point main and types at the compiled root export", () => {
            const published = createPublishPackageJson(basePackage({ ".": "./src/index.ts" }));

            expect(published.main).toBe("index.js");
            expect(published.types).toBe("index.d.ts");
            expect(published.exports["."]).toEqual({ import: "./index.js", types: "./index.d.ts" });
        });
    });

    describe("subpath exports", () => {
        it("should mirror every declared subpath onto the compiled output", () => {
            const published = createPublishPackageJson(
                basePackage({
                    ".": "./src/index.ts",
                    "./driver/postgres": "./src/driver/postgres/index.ts",
                    "./driver/sqlite": "./src/driver/sqlite/index.ts"
                })
            );

            expect(published.exports).toEqual({
                ".": { import: "./index.js", types: "./index.d.ts" },
                "./driver/postgres": {
                    import: "./driver/postgres/index.js",
                    types: "./driver/postgres/index.d.ts"
                },
                "./driver/sqlite": {
                    import: "./driver/sqlite/index.js",
                    types: "./driver/sqlite/index.d.ts"
                }
            });
        });

        it("should keep main and types on the root export when subpaths are present", () => {
            const published = createPublishPackageJson(
                basePackage({ ".": "./src/index.ts", "./driver/postgres": "./src/driver/postgres/index.ts" })
            );

            expect(published.main).toBe("index.js");
            expect(published.types).toBe("index.d.ts");
        });
    });

    describe("fields carried over and stripped", () => {
        it("should strip scripts, devDependencies and publishConfig", () => {
            const published = createPublishPackageJson(basePackage({ ".": "./src/index.ts" }));

            expect(published.scripts).toBeUndefined();
            expect(published.devDependencies).toBeUndefined();
            expect(published.publishConfig).toBeUndefined();
        });

        it("should carry over the remaining fields untouched", () => {
            const published = createPublishPackageJson(basePackage({ ".": "./src/index.ts" }));

            expect(published.name).toBe("@dugongjs/example");
            expect(published.version).toBe("1.2.3");
            expect(published.type).toBe("module");
            expect(published.dependencies).toEqual({ "change-case": "^5.4.4" });
        });
    });

    describe("rejected inputs", () => {
        it("should throw when the exports field is missing", () => {
            expect(() => createPublishPackageJson(basePackage(undefined))).toThrow(/exports/);
        });

        it("should throw when there is no root export", () => {
            expect(() =>
                createPublishPackageJson(basePackage({ "./driver/postgres": "./src/driver/postgres/index.ts" }))
            ).toThrow(/must declare a "\." entry/);
        });

        it("should throw for an export path outside the source directory", () => {
            expect(() => createPublishPackageJson(basePackage({ ".": "./lib/index.ts" }))).toThrow(
                /Unsupported export path/
            );
        });

        it("should throw for an export path that is not a TypeScript file", () => {
            expect(() => createPublishPackageJson(basePackage({ ".": "./src/index.js" }))).toThrow(
                /Unsupported export path/
            );
        });

        it("should throw for a conditional export object", () => {
            expect(() =>
                createPublishPackageJson(basePackage({ ".": { import: "./src/index.ts" } }))
            ).toThrow(/must be a string path/);
        });
    });
});
