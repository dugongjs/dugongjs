import type { ILogger } from "@dugongjs/core";

export interface ILoggerFactory {
    createLogger(context: string): ILogger;
}

export const ILoggerFactory = "ILoggerFactory" as const;
