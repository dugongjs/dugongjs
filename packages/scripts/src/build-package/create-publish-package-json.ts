const SOURCE_PREFIX = "./src/";

const DEVELOPMENT_ONLY_FIELDS = ["scripts", "devDependencies", "publishConfig"];

type PublishExport = {
    import: string;
    types: string;
};

function toDistPath(sourcePath: string, extension: string): string {
    if (!sourcePath.startsWith(SOURCE_PREFIX) || !sourcePath.endsWith(".ts")) {
        throw new Error(
            `Unsupported export path "${sourcePath}". Export paths must point at a TypeScript file under "${SOURCE_PREFIX}", because the published package is the compiled output of that directory.`
        );
    }

    return `./${sourcePath.slice(SOURCE_PREFIX.length).replace(/\.ts$/, extension)}`;
}

export function createPublishExports(exportsField: unknown): Record<string, PublishExport> {
    if (!exportsField || typeof exportsField !== "object" || Array.isArray(exportsField)) {
        throw new Error(`Expected an "exports" object in the package.json, but found ${JSON.stringify(exportsField)}.`);
    }

    const entries = Object.entries(exportsField as Record<string, unknown>);

    if (!entries.some(([subpath]) => subpath === ".")) {
        throw new Error(`The "exports" map must declare a "." entry, which becomes the package entry point.`);
    }

    return Object.fromEntries(
        entries.map(([subpath, sourcePath]) => {
            if (typeof sourcePath !== "string") {
                throw new Error(
                    `The "exports" entry for "${subpath}" must be a string path. Conditional export objects are not supported.`
                );
            }

            return [
                subpath,
                {
                    import: toDistPath(sourcePath, ".js"),
                    types: toDistPath(sourcePath, ".d.ts")
                }
            ];
        })
    );
}

export function createPublishPackageJson(pkg: any): any {
    const exports = createPublishExports(pkg.exports);
    const retainedFields = Object.entries(pkg).filter(([field]) => !DEVELOPMENT_ONLY_FIELDS.includes(field));

    return {
        ...Object.fromEntries(retainedFields),
        main: exports["."].import.replace(/^\.\//, ""),
        types: exports["."].types.replace(/^\.\//, ""),
        exports
    };
}
