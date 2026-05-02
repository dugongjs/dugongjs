import {
    IConsumedMessageRepository,
    IDomainEventRepository,
    IMessageProducer,
    IOutboundMessageMapper,
    ISnapshotRepository,
    ITransactionManager
} from "@dugongjs/core";
import "reflect-metadata";
import { EventSourcingModule } from "./event-sourcing.module.js";

class TestTransactionManager {}
class TestDomainEventRepository {}
class TestSnapshotRepository {}
class TestConsumedMessageRepository {}
class TestMessageProducer {}
class TestOutboundMessageMapper {}
class ExistingProvider {}

describe("EventSourcingModule", () => {
    it("should register providers for configured tokens", () => {
        const module = EventSourcingModule.register({
            transactionManager: { transactionManager: TestTransactionManager as any },
            repository: {
                domainEventRepository: TestDomainEventRepository as any,
                snapshotRepository: TestSnapshotRepository as any,
                consumedMessageRepository: TestConsumedMessageRepository as any
            },
            messageBroker: {
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
                { provide: IMessageProducer, useClass: TestMessageProducer },
                { provide: IOutboundMessageMapper, useClass: TestOutboundMessageMapper }
            ])
        );
    });

    it("should keep module imports and providers from options", () => {
        const imports = [class ImportA {}];
        const providers = [ExistingProvider];

        const module = EventSourcingModule.register({
            module: {
                imports,
                providers
            }
        });

        expect(module.imports).toEqual(imports);
        expect(module.providers).toEqual(expect.arrayContaining([ExistingProvider]));
    });

    it("should not mutate provided imports and providers arrays", () => {
        const imports = [class ImportA {}];
        const providers = [ExistingProvider];

        EventSourcingModule.register({
            module: {
                imports,
                providers
            },
            repository: {
                domainEventRepository: TestDomainEventRepository as any
            }
        });

        expect(imports).toHaveLength(1);
        expect(providers).toHaveLength(1);
        expect(providers).toEqual([ExistingProvider]);
    });

    it("should set global flag when provided", () => {
        const module = EventSourcingModule.register({ global: true });

        expect(module.global).toBe(true);
    });
});
