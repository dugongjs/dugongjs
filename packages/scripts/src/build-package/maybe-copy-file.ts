import fs from "fs-extra";
import path from "path";

export async function maybeCopyFile(file: string, fromDir: string, toDir: string) {
    const from = path.join(fromDir, file);
    if (await fs.pathExists(from)) {
        await fs.copy(from, path.join(toDir, file));
    }
}
