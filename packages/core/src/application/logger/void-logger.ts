import type { ILogger } from "./i-logger.js";

export class VoidLogger implements ILogger {
    public log(): void {}
    public error(): void {}
    public warn(): void {}
    public verbose(): void {}
}
