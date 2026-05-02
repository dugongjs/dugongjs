import type { ILogger } from "@dugongjs/core";
import type { DugongAdapters, ILoggerFactoryContract } from "@dugongjs/nestjs";
import { Injectable } from "@nestjs/common";
import { pino, type Logger as PinoLogger } from "pino";

class PinoLoggerAdapter implements ILogger {
    constructor(private readonly logger: PinoLogger) {}

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

@Injectable()
class PinoLoggerFactory implements ILoggerFactoryContract {
    private readonly rootLogger = pino({ level: "trace" });

    public createLogger(context: string): ILogger {
        return new PinoLoggerAdapter(this.rootLogger.child({ context }));
    }
}

export const pinoLoggerAdapter = {
    loggerFactory: PinoLoggerFactory
} satisfies DugongAdapters;
