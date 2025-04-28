import type { ILogger } from "@dugongjs/core";
import { pino, type Logger as PinoLogger } from "pino";

export class Logger implements ILogger {
    private readonly logger: PinoLogger;

    constructor() {
        this.logger = pino({ level: "debug" });
    }

    public log(context: any, ...args: any[]): void {
        this.logger.info(context, ...args);
    }

    public error(context: any, ...args: any[]): void {
        this.logger.error(context, ...args);
    }

    public warn(context: any, ...args: any[]): void {
        this.logger.warn(context, ...args);
    }

    public verbose(context: any, ...args: any[]): void {
        this.logger.debug(context, ...args);
    }
}
