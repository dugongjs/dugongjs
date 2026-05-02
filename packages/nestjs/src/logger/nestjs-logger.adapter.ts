import type { ILogger } from "@dugongjs/core";
import { Logger } from "@nestjs/common";

/**
 * Adapts the NestJS Logger to the ILogger interface used by the core package.
 * The first argument is treated as structured context and rendered as a single-line message.
 */
export class NestJSLoggerAdapter implements ILogger {
    private readonly logger: Logger;

    constructor(context: string) {
        this.logger = new Logger(context);
    }

    public log(context: any, ...args: any[]): void {
        this.logMessage("log", context, args);
    }

    public error(context: any, ...args: any[]): void {
        this.logMessage("error", context, args);
    }

    public warn(context: any, ...args: any[]): void {
        this.logMessage("warn", context, args);
    }

    public verbose(context: any, ...args: any[]): void {
        this.logMessage("debug", context, args);
    }

    private logMessage(level: "log" | "error" | "warn" | "debug", context: any, args: any[]): void {
        // If context is a plain object, format it as single-line JSON
        if (context && typeof context === "object" && !Array.isArray(context)) {
            const contextStr = JSON.stringify(context);
            const message = args.length > 0 ? `${contextStr} ${args.join(" ")}` : contextStr;
            this.logger[level](message);
        } else {
            // Otherwise just log as-is
            const message = [context, ...args].join(" ");
            this.logger[level](message);
        }
    }
}
