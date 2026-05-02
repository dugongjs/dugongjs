import {
    IConsumedMessageRepository,
    IDomainEventRepository,
    IExternalOriginMap,
    IInboundMessageMapper,
    IMessageConsumer,
    IMessageProducer,
    IOutboundMessageMapper,
    ISnapshotRepository,
    ITransactionManager
} from "@dugongjs/core";
import "reflect-metadata";
import { AggregateDomainEventConsumerModule } from "../aggregate-domain-event-consumer/aggregate-domain-event-consumer.module.js";
import { EventIssuerModule } from "../event-issuer/event-issuer.module.js";
import { ExternalOriginModule } from "../external-origin/external-origin.module.js";
import { ILoggerFactory } from "../logger/i-logger-factory.js";
import { DugongModule } from "./dugong.module.js";

class TestTransactionManager {}
class TestDomainEventRepository {}
class TestSnapshotRepository {}
class TestConsumedMessageRepository {}
class TestMessageConsumer {}
class TestInboundMessageMapper {}
class TestMessageProducer {}
class TestOutboundMessageMapper {}
class TestLoggerFactory {
    public createLogger() {
        return {
            log() {},
            error() {},
            warn() {},
            verbose() {}
        };
    }
}

describe("DugongModule", () => {
    it("should register adapter providers for mapped tokens", () => {
        const module = DugongModule.register({
            currentOrigin: "TestOrigin",
            adapters: {
                transactionManager: TestTransactionManager as any,
                domainEventRepository: TestDomainEventRepository as any,
                snapshotRepository: TestSnapshotRepository as any,
                consumedMessageRepository: TestConsumedMessageRepository as any,
                messageConsumer: TestMessageConsumer as any,
                inboundMessageMapper: TestInboundMessageMapper as any,
                messageProducer: TestMessageProducer as any,
                outboundMessageMapper: TestOutboundMessageMapper as any
            }
        });

        expect(module.providers).toEqual(
            expect.arrayContaining([
                { provide: ITransactionManager, useClass: TestTransactionManager },
                { provide: IDomainEventRepository, useClass: TestDomainEventRepository },
                { provide: ISnapshotRepository, useClass: TestSnapshotRepository },
                { provide: IConsumedMessageRepository, useClass: TestConsumedMessageRepository },
                { provide: IMessageConsumer, useClass: TestMessageConsumer },
                { provide: IInboundMessageMapper, useClass: TestInboundMessageMapper },
                { provide: IMessageProducer, useClass: TestMessageProducer },
                { provide: IOutboundMessageMapper, useClass: TestOutboundMessageMapper }
            ])
        );
    });

    it("should not register a logger factory by default", () => {
        const module = DugongModule.register({
            currentOrigin: "TestOrigin",
            adapters: {}
        });

        expect(module.providers).not.toEqual(
            expect.arrayContaining([{ provide: ILoggerFactory, useClass: expect.anything() }])
        );
    });

    it("should register custom logger factory when provided", () => {
        const module = DugongModule.register({
            currentOrigin: "TestOrigin",
            adapters: {
                loggerFactory: TestLoggerFactory as any
            }
        });

        expect(module.providers).toEqual(
            expect.arrayContaining([{ provide: ILoggerFactory, useClass: TestLoggerFactory }])
        );
    });

    it("should auto-include aggregate consumer module when required adapters are present", () => {
        const module = DugongModule.register({
            currentOrigin: "TestOrigin",
            adapters: {
                transactionManager: TestTransactionManager as any,
                domainEventRepository: TestDomainEventRepository as any,
                consumedMessageRepository: TestConsumedMessageRepository as any,
                messageConsumer: TestMessageConsumer as any,
                inboundMessageMapper: TestInboundMessageMapper as any
            }
        });

        expect(module.imports).toContain(AggregateDomainEventConsumerModule);
    });

    it("should not include aggregate consumer module when required adapters are missing", () => {
        const module = DugongModule.register({
            currentOrigin: "TestOrigin",
            adapters: {
                transactionManager: TestTransactionManager as any,
                domainEventRepository: TestDomainEventRepository as any
            }
        });

        expect(module.imports).not.toContain(AggregateDomainEventConsumerModule);
    });

    it("should respect explicit aggregate consumer override", () => {
        const module = DugongModule.register({
            currentOrigin: "TestOrigin",
            aggregateDomainEventConsumers: false,
            adapters: {
                transactionManager: TestTransactionManager as any,
                domainEventRepository: TestDomainEventRepository as any,
                consumedMessageRepository: TestConsumedMessageRepository as any,
                messageConsumer: TestMessageConsumer as any,
                inboundMessageMapper: TestInboundMessageMapper as any
            }
        });

        expect(module.imports).not.toContain(AggregateDomainEventConsumerModule);
    });

    it("should register external origin module when provided", () => {
        const externalOriginMap = new Map<string, any>([["TestOrigin", {}]]);

        const module = DugongModule.register({
            currentOrigin: "TestOrigin",
            externalOrigins: {
                externalOriginMap: {
                    useValue: externalOriginMap
                }
            },
            adapters: {}
        });

        const externalOriginImport = (module.imports as any[]).find((entry) => entry?.module === ExternalOriginModule);

        expect(externalOriginImport).toBeDefined();
        expect(externalOriginImport.providers).toEqual(
            expect.arrayContaining([
                {
                    provide: IExternalOriginMap,
                    useValue: externalOriginMap
                }
            ])
        );
    });

    it("should always include EventIssuerModule with current origin", () => {
        const module = DugongModule.register({
            currentOrigin: "CurrentOrigin",
            adapters: {}
        });

        const eventIssuerImport = (module.imports as any[]).find((entry) => entry?.module === EventIssuerModule);

        expect(eventIssuerImport).toBeDefined();
    });

    it("should mark module as global when using forRoot", () => {
        const module = DugongModule.forRoot({
            currentOrigin: "CurrentOrigin",
            adapters: {}
        });

        expect(module.global).toBe(true);
    });
});
