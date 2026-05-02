import type { DugongAdapters } from "../dugong/dugong-adapter.js";
import { NestJSLoggerFactory } from "../logger/nestjs-logger.factory.js";

export const loggerAdapter = {
    loggerFactory: NestJSLoggerFactory
} satisfies DugongAdapters;
