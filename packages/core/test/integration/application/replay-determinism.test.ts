import fc from "fast-check";
import { DomainEventRepositoryInMemory } from "../../../src/adapters/outbound/repository/domain-event-repository-in-memory.js";
import { SnapshotRepositoryInMemory } from "../../../src/adapters/outbound/repository/snapshot-repository-in-memory.js";
import { TransactionManagerInMemory } from "../../../src/adapters/outbound/transaction-manager/transaction-manager-in-memory.js";
import { AggregateFactory } from "../../../src/application/aggregate-factory/aggregate-factory.js";
import { AggregateManager } from "../../../src/application/aggregate-manager/aggregate-manager.js";
import { aggregateSnapshotTransformer } from "../../../src/application/aggregate-snapshot-transformer/aggregate-snapshot-transformer.js";
import { AbstractAggregateRoot } from "../../../src/domain/abstract-aggregate-root/abstract-aggregate-root.js";
import {
    AbstractDomainEvent,
    Aggregate,
    Apply,
    DomainEvent,
    Process,
    Snapshotable
} from "../../../src/domain/index.js";

const ORIGIN = "ReplayDeterminismOrigin";

abstract class AbstractCounterEvent<
    TPayload extends { by: number } | null = null
> extends AbstractDomainEvent<TPayload> {
    public readonly origin = ORIGIN;
    public readonly aggregateType = "Counter";
    public readonly version = 1;
}

@DomainEvent()
class CounterCreatedEvent extends AbstractCounterEvent<{ by: number }> {
    public readonly type = "CounterCreated";
}

@DomainEvent()
class CounterIncrementedEvent extends AbstractCounterEvent<{ by: number }> {
    public readonly type = "CounterIncremented";
}

@DomainEvent()
class CounterDecrementedEvent extends AbstractCounterEvent<{ by: number }> {
    public readonly type = "CounterDecremented";
}

@DomainEvent()
class CounterClosedEvent extends AbstractCounterEvent {
    public readonly type = "CounterClosed";
}

/**
 * Snapshot interval of 3 keeps the boundary arithmetic cheap to exercise: a handful of
 * commands already crosses it several times.
 */
@Aggregate("Counter")
@Snapshotable({ snapshotInterval: 3 })
class CounterAggregate extends AbstractAggregateRoot {
    private total = 0;
    private applied = 0;

    public getTotal(): number {
        return this.total;
    }

    public getApplied(): number {
        return this.applied;
    }

    @Process({ isCreation: true })
    public create(by: number): void {
        this.stageDomainEvent(this.createDomainEvent(CounterCreatedEvent, { by }));
    }

    @Process()
    public increment(by: number): void {
        this.stageDomainEvent(this.createDomainEvent(CounterIncrementedEvent, { by }));
    }

    @Process()
    public decrement(by: number): void {
        this.stageDomainEvent(this.createDomainEvent(CounterDecrementedEvent, { by }));
    }

    @Process()
    public close(): void {
        this.stageDomainEvent(this.createDomainEvent(CounterClosedEvent));
    }

    @Apply(CounterCreatedEvent)
    public applyCreated(event: CounterCreatedEvent): void {
        this.total = event.getPayload().by;
    }

    @Apply(CounterIncrementedEvent)
    public applyIncremented(event: CounterIncrementedEvent): void {
        this.total += event.getPayload().by;
    }

    @Apply(CounterDecrementedEvent)
    public applyDecremented(event: CounterDecrementedEvent): void {
        this.total -= event.getPayload().by;
    }

    @Apply(CounterClosedEvent)
    public applyClosed(): void {
        this.delete();
    }

    @Apply()
    public countApplied(): void {
        this.applied += 1;
    }
}

type Command = { kind: "increment" | "decrement"; by: number } | { kind: "close" };

describe("replay determinism", () => {
    let domainEventRepository: DomainEventRepositoryInMemory;
    let snapshotRepository: SnapshotRepositoryInMemory;
    let factory: AggregateFactory<typeof CounterAggregate>;
    let manager: AggregateManager<typeof CounterAggregate>;

    beforeEach(() => {
        domainEventRepository = new DomainEventRepositoryInMemory();
        snapshotRepository = new SnapshotRepositoryInMemory();

        const options = {
            aggregateClass: CounterAggregate,
            currentOrigin: ORIGIN,
            transactionManager: new TransactionManagerInMemory(),
            domainEventRepository,
            snapshotRepository
        };

        factory = new AggregateFactory(options);
        manager = new AggregateManager(options);
    });

    async function applyCommands(commands: Command[]): Promise<string> {
        const aggregate = new CounterAggregate();
        aggregate.create(1);
        await manager.applyAndCommitStagedDomainEvents(aggregate);

        for (const command of commands) {
            if (command.kind === "close") {
                aggregate.close();
            } else if (command.kind === "increment") {
                aggregate.increment(command.by);
            } else {
                aggregate.decrement(command.by);
            }

            await manager.applyAndCommitStagedDomainEvents(aggregate);
        }

        return aggregate.getId();
    }

    /**
     * `build` consults the latest snapshot and replays only the events after it, whereas
     * `skipSnapshot` replays the entire event log. Both must produce the same aggregate.
     */
    async function assertBothPathsAgree(aggregateId: string): Promise<void> {
        const viaSnapshot = await factory.build(aggregateId, { returnDeleted: true });
        const viaFullReplay = await factory.build(aggregateId, { returnDeleted: true, skipSnapshot: true });

        expect(viaSnapshot).not.toBeNull();
        expect(viaFullReplay).not.toBeNull();
        expect(viaSnapshot!.getTotal()).toBe(viaFullReplay!.getTotal());
        expect(viaSnapshot!.getApplied()).toBe(viaFullReplay!.getApplied());
        expect(viaSnapshot!.getCurrentDomainEventSequenceNumber()).toBe(
            viaFullReplay!.getCurrentDomainEventSequenceNumber()
        );
        expect(viaSnapshot!.isDeleted()).toBe(viaFullReplay!.isDeleted());
        expect(viaSnapshot!.getId()).toBe(viaFullReplay!.getId());
        expect(viaSnapshot).toEqual(viaFullReplay);
    }

    function increments(count: number): Command[] {
        return Array.from({ length: count }, () => ({ kind: "increment" as const, by: 1 }));
    }

    describe("snapshot interval boundaries", () => {
        // The aggregate is created with one event, so N commands means N+1 events. The
        // interval is 3, making these the sequence numbers either side of each boundary.
        it.each([1, 2, 3, 4, 5, 6, 7, 11])("should agree after %i mutating commands", async (count) => {
            const aggregateId = await applyCommands(increments(count));

            await assertBothPathsAgree(aggregateId);
        });
    });

    describe("superseding snapshots", () => {
        it("should agree when later snapshots replace earlier ones", async () => {
            const aggregateId = await applyCommands(increments(12));

            const snapshot = await snapshotRepository.getLatestSnapshot(null, ORIGIN, "Counter", aggregateId);

            expect(snapshot).not.toBeNull();
            expect(snapshot!.domainEventSequenceNumber).toBeGreaterThan(3);

            await assertBothPathsAgree(aggregateId);
        });

        it("should not write a snapshot when one already covers the current sequence number", async () => {
            const aggregateId = await applyCommands(increments(5));

            const before = await snapshotRepository.getLatestSnapshot(null, ORIGIN, "Counter", aggregateId);
            await factory.build(aggregateId);
            const after = await snapshotRepository.getLatestSnapshot(null, ORIGIN, "Counter", aggregateId);

            expect(after!.domainEventSequenceNumber).toBe(before!.domainEventSequenceNumber);
        });
    });

    describe("deletion", () => {
        it("should agree on the deleted flag across a snapshot boundary", async () => {
            const aggregateId = await applyCommands([...increments(4), { kind: "close" }, ...increments(4)]);

            await assertBothPathsAgree(aggregateId);

            const rebuilt = await factory.build(aggregateId, { returnDeleted: true });

            expect(rebuilt!.isDeleted()).toBe(true);
        });

        it("should return null from both paths for a deleted aggregate by default", async () => {
            const aggregateId = await applyCommands([...increments(4), { kind: "close" }]);

            expect(await factory.build(aggregateId)).toBeNull();
            expect(await factory.build(aggregateId, { skipSnapshot: true })).toBeNull();
        });
    });

    describe("arbitrary command sequences", () => {
        const command: fc.Arbitrary<Command> = fc.oneof(
            fc.record({ kind: fc.constant("increment" as const), by: fc.integer({ min: 1, max: 50 }) }),
            fc.record({ kind: fc.constant("decrement" as const), by: fc.integer({ min: 1, max: 50 }) }),
            fc.constant({ kind: "close" as const })
        );

        it("should agree for any sequence of commands", async () => {
            await fc.assert(
                fc.asyncProperty(fc.array(command, { minLength: 1, maxLength: 20 }), async (commands) => {
                    domainEventRepository = new DomainEventRepositoryInMemory();
                    snapshotRepository = new SnapshotRepositoryInMemory();

                    const options = {
                        aggregateClass: CounterAggregate,
                        currentOrigin: ORIGIN,
                        transactionManager: new TransactionManagerInMemory(),
                        domainEventRepository,
                        snapshotRepository
                    };

                    factory = new AggregateFactory(options);
                    manager = new AggregateManager(options);

                    const aggregateId = await applyCommands(commands);

                    await assertBothPathsAgree(aggregateId);
                }),
                { numRuns: 50 }
            );
        });
    });

    describe("snapshot restorability", () => {
        it("should be fully restorable, so snapshotting is not silently skipped", async () => {
            const aggregateId = await applyCommands(increments(5));
            const aggregate = await factory.build(aggregateId, { skipSnapshot: true });

            const { isEqual } = aggregateSnapshotTransformer.canBeRestoredFromSnapshot(CounterAggregate, aggregate!);

            expect(isEqual).toBe(true);
        });

        it("should have written a snapshot, proving the coordinator was not skipping it", async () => {
            const aggregateId = await applyCommands(increments(5));

            const snapshot = await snapshotRepository.getLatestSnapshot(null, ORIGIN, "Counter", aggregateId);

            expect(snapshot).not.toBeNull();
        });
    });

    it("should isolate aggregates across runs", async () => {
        const first = await applyCommands(increments(1));
        const second = await applyCommands(increments(2));

        expect(first).not.toBe(second);

        const firstAggregate = await factory.build(first);
        const secondAggregate = await factory.build(second);

        expect(firstAggregate!.getApplied()).toBe(2);
        expect(secondAggregate!.getApplied()).toBe(3);
    });
});
