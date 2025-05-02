export function createPublishPackageJson(pkg: any): any {
    const { scripts, devDependencies, publishConfig, ...rest } = pkg;

    return {
        ...rest,
        main: "index.js",
        types: "index.d.ts",
        exports: {
            ".": {
                import: "./index.js",
                types: "./index.d.ts"
            }
        }
    };
}
