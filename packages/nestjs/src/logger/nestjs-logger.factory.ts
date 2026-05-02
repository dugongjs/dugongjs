import type { ILogger } from "@dugongjs/core";
import { Injectable } from "@nestjs/common";
import type { ILoggerFactory } from "./i-logger-factory.js";
import { NestJSLoggerAdapter } from "./nestjs-logger.adapter.js";

@Injectable()
export class NestJSLoggerFactory implements ILoggerFactory {
    public createLogger(context: string): ILogger {
        return new NestJSLoggerAdapter(context);
    }
}
