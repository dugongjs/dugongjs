import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import type { Config } from "../types/config.js";
import type { Context } from "../types/context.js";

const CONFIG_DIR = join(homedir(), ".dugong");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

function ensureConfigDir() {
    if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR);
    }
}

function loadConfig(): Config {
    ensureConfigDir();

    if (!existsSync(CONFIG_FILE)) {
        const defaultConfig: Config = {
            currentContext: "default",
            contexts: {}
        };

        return defaultConfig;
    }

    const configRaw = readFileSync(CONFIG_FILE, "utf-8");

    return JSON.parse(configRaw);
}

function saveConfig(config: Config): void {
    ensureConfigDir();

    const configRaw = JSON.stringify(config, null, 2);

    writeFileSync(CONFIG_FILE, configRaw);
}

function setConfig(name: string, context: Context, makeCurrent: boolean = false): void {
    const config = loadConfig();

    config.contexts[name] = context;

    if (makeCurrent) {
        config.currentContext = name;
    }

    saveConfig(config);
}

function getCurrentContext(): Context | null {
    const config = loadConfig();

    return config.contexts[config.currentContext] ?? null;
}

function switchContext(name: string): boolean {
    const config = loadConfig();

    if (!config.contexts[name]) {
        return false;
    }

    config.currentContext = name;
    saveConfig(config);

    return true;
}

function deleteContext(name: string): boolean {
    const config = loadConfig();

    if (!config.contexts[name]) {
        return false;
    }

    delete config.contexts[name];

    if (config.currentContext === name) {
        config.currentContext = Object.keys(config.contexts)[0] ?? null;
    }

    saveConfig(config);

    return true;
}

function listContexts(): string[] {
    const config = loadConfig();

    return Object.keys(config.contexts);
}

export { deleteContext, getCurrentContext, listContexts, loadConfig, setConfig, switchContext };
