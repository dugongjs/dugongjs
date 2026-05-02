import { Inject } from "@nestjs/common";
import { ILoggerFactory } from "../logger/i-logger-factory.js";

export const InjectLoggerFactory = () => Inject(ILoggerFactory);
