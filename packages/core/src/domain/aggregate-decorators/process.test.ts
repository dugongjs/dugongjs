import {
    AbstractAggregateRoot,
    IsInCreationContext,
    IsInProcessContext
} from "../abstract-aggregate-root/abstract-aggregate-root.js";
import { StateMutatedInProcessContextError } from "../abstract-aggregate-root/errors/state-mutated-in-process-context.error.js";
import { AbstractDomainEvent } from "../abstract-domain-event/abstract-domain-event.js";
import { DomainEvent } from "../domain-event-decorators/domain-event.js";
import { Process } from "./process.js";

@DomainEvent()
class StagingEvent extends AbstractDomainEvent<{ value: string }> {
    public readonly origin = "ProcessDecoratorTestOrigin";
    public readonly aggregateType = "ProcessDecoratorTestAggregate";
    public readonly type = "StagingEvent";
    public readonly version = 1;
}

describe("Process Decorator", () => {
    describe("process context", () => {
        it("should set IsInProcessContext to true during method execution", () => {
            class TestClass {
                [IsInProcessContext] = false;
                [IsInCreationContext] = false;

                @Process()
                testMethod() {
                    expect(this[IsInProcessContext]).toBe(true);
                }
            }

            const instance = new TestClass();
            instance.testMethod();
            expect(instance[IsInProcessContext]).toBe(false);
        });

        it("should set IsInCreationContext to true if isCreation is true", () => {
            class TestClass {
                [IsInProcessContext] = false;
                [IsInCreationContext] = false;

                @Process({ isCreation: true })
                testMethod() {
                    expect(this[IsInCreationContext]).toBe(true);
                }
            }

            const instance = new TestClass();
            instance.testMethod();
            expect(instance[IsInCreationContext]).toBe(false);
        });

        it("should set IsInCreationContext to false if isCreation is false", () => {
            class TestClass {
                [IsInProcessContext] = false;
                [IsInCreationContext] = false;

                @Process({ isCreation: false })
                testMethod() {
                    expect(this[IsInCreationContext]).toBe(false);
                }
            }

            const instance = new TestClass();
            instance.testMethod();
            expect(instance[IsInCreationContext]).toBe(false);
        });
    });

    describe("method invocation", () => {
        it("should call the original method", () => {
            const mockMethod = vi.fn();

            class TestClass {
                [IsInProcessContext] = false;
                [IsInCreationContext] = false;

                @Process()
                testMethod() {
                    mockMethod();
                }
            }

            const instance = new TestClass();
            instance.testMethod();
            expect(mockMethod).toHaveBeenCalled();
        });
    });

    describe("direct state mutation", () => {
        class MutatingAggregate extends AbstractAggregateRoot {
            public total = 0;
            public label = "initial";

            @Process()
            public mutateDirectly(): void {
                this.total += 1;
            }

            @Process()
            public mutateSeveralProperties(): void {
                this.total += 1;
                this.label = "changed";
            }

            @Process({ allowStateMutation: true })
            public mutateDeliberately(): void {
                this.total += 1;
            }

            @Process()
            public doNotMutate(): void {
                // Staging without mutating is the supported pattern.
            }

            @Process()
            public async mutateDirectlyAsync(): Promise<void> {
                await Promise.resolve();

                this.total += 1;
            }

            @Process()
            public async doNotMutateAsync(): Promise<void> {
                await Promise.resolve();
            }

            @Process()
            public throwBeforeMutating(): void {
                throw new Error("command rejected");
            }
        }

        it("should throw when a process method mutates state directly", () => {
            const aggregate = new MutatingAggregate();

            expect(() => aggregate.mutateDirectly()).toThrow(StateMutatedInProcessContextError);
        });

        it("should name the mutated properties", () => {
            const aggregate = new MutatingAggregate();

            expect(() => aggregate.mutateSeveralProperties()).toThrow(/total, label|label, total/);
            expect(() => aggregate.mutateSeveralProperties()).toThrow(/mutateSeveralProperties/);
        });

        it("should allow mutation when allowStateMutation is set", () => {
            const aggregate = new MutatingAggregate();

            expect(() => aggregate.mutateDeliberately()).not.toThrow();
            expect(aggregate.total).toBe(1);
        });

        it("should not throw when a process method leaves state untouched", () => {
            const aggregate = new MutatingAggregate();

            expect(() => aggregate.doNotMutate()).not.toThrow();
        });

        it("should throw for an async process method that mutates state", async () => {
            const aggregate = new MutatingAggregate();

            await expect(aggregate.mutateDirectlyAsync()).rejects.toThrow(StateMutatedInProcessContextError);
        });

        it("should not throw for an async process method that leaves state untouched", async () => {
            const aggregate = new MutatingAggregate();

            await expect(aggregate.doNotMutateAsync()).resolves.toBeUndefined();
        });

        it("should surface the original error rather than a mutation error when the method throws", () => {
            const aggregate = new MutatingAggregate();

            expect(() => aggregate.throwBeforeMutating()).toThrow("command rejected");
        });

        it("should reset the process context even when the mutation check throws", () => {
            const aggregate = new MutatingAggregate();

            expect(() => aggregate.mutateDirectly()).toThrow(StateMutatedInProcessContextError);
            expect(aggregate[IsInProcessContext]).toBe(false);
            expect(aggregate[IsInCreationContext]).toBe(false);
        });
    });

    describe("legitimate changes during a process method", () => {
        class StagingAggregate extends AbstractAggregateRoot {
            @Process({ isCreation: true })
            public create(): void {
                this.stageDomainEvent(this.createDomainEvent(StagingEvent, { value: "a" }));
            }

            @Process()
            public stageAnother(): void {
                this.stageDomainEvent(this.createDomainEvent(StagingEvent, { value: "b" }));
            }
        }

        it("should allow assigning the aggregate id while creating the first event", () => {
            const aggregate = new StagingAggregate();

            expect(() => aggregate.create()).not.toThrow();
            expect(aggregate.getId()).toBeTruthy();
        });

        it("should allow staging events on an existing aggregate", () => {
            const aggregate = new StagingAggregate();
            aggregate.create();

            expect(() => aggregate.stageAnother()).not.toThrow();
            expect(aggregate.getStagedDomainEvents()).toHaveLength(2);
        });
    });
});
