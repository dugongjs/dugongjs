import { describe, expect, it } from "vitest";
import { NestJSLoggerAdapter } from "./nestjs-logger.adapter.js";

describe("NestJSLoggerAdapter", () => {
    it("should implement ILogger interface", () => {
        const adapter = new NestJSLoggerAdapter("TestContext");

        expect(adapter).toHaveProperty("log");
        expect(adapter).toHaveProperty("error");
        expect(adapter).toHaveProperty("warn");
        expect(adapter).toHaveProperty("verbose");
        expect(typeof adapter.log).toBe("function");
        expect(typeof adapter.error).toBe("function");
        expect(typeof adapter.warn).toBe("function");
        expect(typeof adapter.verbose).toBe("function");
    });

    it("should log with object context", () => {
        const adapter = new NestJSLoggerAdapter("TestContext");
        const context = {
            origin: "BankingContext-AccountService",
            aggregateType: "BankAccount"
        };

        expect(() => adapter.log(context)).not.toThrow();
    });

    it("should log with context and additional args", () => {
        const adapter = new NestJSLoggerAdapter("TestContext");
        const context = { origin: "TestOrigin", aggregateType: "TestAggregate" };

        expect(() => adapter.log(context, "additional message")).not.toThrow();
    });

    it("should handle error method with context", () => {
        const adapter = new NestJSLoggerAdapter("TestContext");
        const context = { origin: "ErrorOrigin", aggregateType: "ErrorAggregate" };

        expect(() => adapter.error(context)).not.toThrow();
    });

    it("should handle warn method with context", () => {
        const adapter = new NestJSLoggerAdapter("TestContext");
        const context = { origin: "WarningOrigin", aggregateType: "WarningAggregate" };

        expect(() => adapter.warn(context)).not.toThrow();
    });

    it("should handle verbose method converting to debug level", () => {
        const adapter = new NestJSLoggerAdapter("TestContext");
        const context = { origin: "DebugOrigin", aggregateType: "DebugAggregate" };

        expect(() => adapter.verbose(context)).not.toThrow();
    });

    it("should handle string context values", () => {
        const adapter = new NestJSLoggerAdapter("TestContext");

        expect(() => adapter.log("simple string context")).not.toThrow();
    });

    it("should handle all methods with multiple arguments", () => {
        const adapter = new NestJSLoggerAdapter("TestContext");
        const context = { origin: "TestOrigin", aggregateType: "TestAggregate" };

        expect(() => adapter.log(context, "arg1", "arg2")).not.toThrow();
        expect(() => adapter.error(context, "arg1", "arg2")).not.toThrow();
        expect(() => adapter.warn(context, "arg1")).not.toThrow();
        expect(() => adapter.verbose(context, "arg3")).not.toThrow();
    });
});
