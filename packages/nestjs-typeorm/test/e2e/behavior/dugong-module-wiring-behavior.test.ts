import {
    IConsumedMessageRepository,
    IDomainEventRepository,
    IMessageProducer,
    IOutboundMessageMapper,
    ISnapshotRepository,
    ITransactionManager
} from "@dugongjs/core";
import { DugongAdapterBuilder, DugongModule } from "@dugongjs/nestjs";
import { Test, type TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { randomUUID } from "node:crypto";
import { DataSource } from "typeorm";
import { transactionManagerTypeOrmAdapter } from "../../../src/index.js";
import { activeDriver } from "../setup/drivers/active-driver.js";

describe("DugongModule wiring", () => {
    let app: TestingModule;
    let dataSource: DataSource;

    beforeAll(async () => {
        app = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot(activeDriver.createDataSourceOptions()),
                DugongModule.forRoot({
                    currentOrigin: "IAM-UserService",
                    adapters: new DugongAdapterBuilder()
                        .registerMany(
                            activeDriver.adapters.repository,
                            activeDriver.adapters.outboxMessageProducer,
                            transactionManagerTypeOrmAdapter
                        )
                        .build()
                })
            ]
        }).compile();

        await app.init();

        dataSource = app.get(DataSource);
    });

    afterAll(async () => {
        await app?.close();
    });

    describe("when registering the TypeORM adapters", () => {
        it("should resolve every port the adapters provide", () => {
            expect(app.get(IDomainEventRepository)).toBeDefined();
            expect(app.get(ISnapshotRepository)).toBeDefined();
            expect(app.get(IConsumedMessageRepository)).toBeDefined();
            expect(app.get(ITransactionManager)).toBeDefined();
            expect(app.get(IMessageProducer)).toBeDefined();
            expect(app.get(IOutboundMessageMapper)).toBeDefined();
        });

        it("should persist and read back a domain event through the wired repository", async () => {
            const repository = app.get<IDomainEventRepository>(IDomainEventRepository);
            const aggregateId = randomUUID();

            await repository.saveDomainEvents(null, [
                {
                    id: randomUUID(),
                    origin: "IAM-UserService",
                    aggregateType: "User",
                    type: "UserCreated",
                    version: 1,
                    aggregateId,
                    payload: { email: "wiring@example.com" },
                    sequenceNumber: 1,
                    timestamp: new Date()
                }
            ]);

            const events = await repository.getAggregateDomainEvents(null, "IAM-UserService", "User", aggregateId);

            expect(events).toHaveLength(1);
            expect(events[0].type).toBe("UserCreated");
            expect(events[0].payload).toEqual({ email: "wiring@example.com" });
        });

        it("should roll back a transaction coordinated by the wired transaction manager", async () => {
            const transactionManager = app.get<ITransactionManager>(ITransactionManager);
            const repository = app.get<IDomainEventRepository>(IDomainEventRepository);
            const aggregateId = randomUUID();

            await expect(
                transactionManager.transaction(async (context) => {
                    await repository.saveDomainEvents(context, [
                        {
                            id: randomUUID(),
                            origin: "IAM-UserService",
                            aggregateType: "User",
                            type: "UserCreated",
                            version: 1,
                            aggregateId,
                            payload: null,
                            sequenceNumber: 1,
                            timestamp: new Date()
                        }
                    ]);

                    throw new Error("Force rollback");
                })
            ).rejects.toThrow("Force rollback");

            const events = await repository.getAggregateDomainEvents(null, "IAM-UserService", "User", aggregateId);

            expect(events).toHaveLength(0);
        });

        it("should write to the outbox through the wired message producer", async () => {
            const producer = app.get<IMessageProducer<any>>(IMessageProducer);
            const mapper = app.get<IOutboundMessageMapper<any>>(IOutboundMessageMapper);
            const channelId = producer.generateMessageChannelIdForAggregate("IAM-UserService", "User");

            const message = mapper.map({
                id: randomUUID(),
                origin: "IAM-UserService",
                aggregateType: "User",
                type: "UserCreated",
                version: 1,
                aggregateId: randomUUID(),
                payload: null,
                sequenceNumber: 1,
                timestamp: new Date()
            });

            await producer.publishMessage(null, channelId, message);

            const outbox = await dataSource.getRepository(activeDriver.entities.outbox).find({});

            expect(outbox).toHaveLength(1);
            expect((outbox[0] as any).channelId).toBe(channelId);
        });
    });
});
