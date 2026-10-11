import { join } from "path";
import { createE2eConfig } from "./test/e2e/setup/create-e2e-config.js";

export default createE2eConfig(__dirname, "postgres", [join("setup", "global-setup", "start-database.ts")]);
