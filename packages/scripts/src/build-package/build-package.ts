import { execa } from "execa";
import fs from "fs-extra";
import ora from "ora";
import path from "path";
import { createPublishPackageJson } from "./create-publish-package-json.js";
import { maybeCopyFile } from "./maybe-copy-file.js";

export async function buildPackage(packageRoot: string) {
    const spinner = ora(`Building package at ${packageRoot}`).start();
    spinner.color = "cyan";

    const distDir = path.join(packageRoot, "dist");
    const srcPackageJsonPath = path.join(packageRoot, "package.json");
    const buildTsconfigPath = path.join(packageRoot, "tsconfig.build.json");
    const licensePath = path.join(packageRoot, "..", "..", "LICENSE");

    if (!fs.existsSync(buildTsconfigPath)) {
        spinner.fail(`No build tsconfig found at ${buildTsconfigPath}`);
        return;
    }

    if (!fs.existsSync(srcPackageJsonPath)) {
        spinner.fail(`No package.json found at ${srcPackageJsonPath}`);
        return;
    }

    if (!fs.existsSync(licensePath)) {
        spinner.fail(`No LICENSE found at ${licensePath}`);
        throw new Error(
            `Refusing to build ${packageRoot} without a LICENSE: every published package declares a license and must ship its text.`
        );
    }

    spinner.text = `Cleaning up dist directory at ${distDir}`;
    await fs.remove(distDir);

    spinner.text = `Building package with tsc`;
    await execa("tsc", ["--project", buildTsconfigPath], {
        cwd: packageRoot,
        stdio: "inherit"
    });

    spinner.text = `Creating publish package.json`;
    const originalPkg = await fs.readJson(srcPackageJsonPath);
    const cleanedPkg = createPublishPackageJson(originalPkg);

    const distPackageJsonPath = path.join(distDir, "package.json");
    await fs.outputJson(distPackageJsonPath, cleanedPkg, { spaces: 4 });

    spinner.text = `Copying files to dist directory`;
    await maybeCopyFile("README.md", packageRoot, distDir);
    await maybeCopyFile(".npmrc", packageRoot, distDir);
    await fs.copy(licensePath, path.join(distDir, "LICENSE"));

    spinner.succeed(`Package built successfully at ${distDir}`);
}
