import { AbstractAggregateRoot } from "../../domain/abstract-aggregate-root/abstract-aggregate-root.js";
import type { AbstractEventSourcedAggregateRoot } from "../../domain/abstract-event-sourced-aggregate-root/abstract-event-sourced-aggregate-root.js";
import type { RemoveAbstract } from "../../types/remove-abstract.type.js";
import {
    AggregateFactory,
    type AggregateFactoryOptions,
    type BuildOptions
} from "../aggregate-factory/aggregate-factory.js";
import {
    AggregateManager,
    type AggregateManagerOptions,
    type CommitOptions
} from "../aggregate-manager/aggregate-manager.js";
import { AggregateManagerNotAvailableError } from "./errors/aggregate-manager-not-available-error.js";

export type AggregateContextOptions<
    TAggregateRootClass extends RemoveAbstract<typeof AbstractEventSourcedAggregateRoot>
> =
    TAggregateRootClass extends RemoveAbstract<typeof AbstractAggregateRoot>
        ? AggregateFactoryOptions<TAggregateRootClass> & AggregateManagerOptions<TAggregateRootClass>
        : AggregateFactoryOptions<TAggregateRootClass>;

export class AggregateContext<TAggregateRootClass extends RemoveAbstract<typeof AbstractEventSourcedAggregateRoot>> {
    private readonly factory: AggregateFactory<TAggregateRootClass>;
    private readonly manager: TAggregateRootClass extends RemoveAbstract<typeof AbstractAggregateRoot>
        ? AggregateManager<TAggregateRootClass>
        : null;

    constructor(options: AggregateContextOptions<TAggregateRootClass>) {
        this.factory = new AggregateFactory(options as AggregateFactoryOptions<TAggregateRootClass>);
        this.manager = (
            this.isAggregateRootClass(options) ? new AggregateManager(options) : null
        ) as TAggregateRootClass extends RemoveAbstract<typeof AbstractAggregateRoot>
            ? AggregateManager<TAggregateRootClass>
            : null;
    }

    public getFactory(): AggregateFactory<TAggregateRootClass> {
        return this.factory;
    }

    public getManager(): TAggregateRootClass extends RemoveAbstract<typeof AbstractAggregateRoot>
        ? AggregateManager<TAggregateRootClass>
        : never {
        this.validateManagerExists();
        return this.manager as TAggregateRootClass extends RemoveAbstract<typeof AbstractAggregateRoot>
            ? AggregateManager<TAggregateRootClass>
            : never;
    }

    public async build(
        aggregateId: string,
        options: BuildOptions = {}
    ): Promise<InstanceType<TAggregateRootClass> | null> {
        return this.factory.build(aggregateId, options);
    }

    public applyStagedDomainEvents(aggregate: InstanceType<TAggregateRootClass>): void {
        this.validateManagerExists();

        return this.manager.applyStagedDomainEvents(aggregate);
    }

    public async commitStagedDomainEvents(
        aggregate: InstanceType<TAggregateRootClass>,
        options: CommitOptions = {}
    ): Promise<void> {
        this.validateManagerExists();
        return this.manager.commitStagedDomainEvents(aggregate, options);
    }

    public async applyAndCommitStagedDomainEvents(
        aggregate: InstanceType<TAggregateRootClass>,
        options: CommitOptions = {}
    ): Promise<void> {
        this.validateManagerExists();
        return this.manager.applyAndCommitStagedDomainEvents(aggregate, options);
    }

    private isAggregateRootClass(
        options: AggregateContextOptions<TAggregateRootClass>
    ): options is AggregateContextOptions<TAggregateRootClass & RemoveAbstract<typeof AbstractAggregateRoot>> {
        return options.aggregateClass.prototype instanceof AbstractAggregateRoot;
    }

    private validateManagerExists(): asserts this is AggregateContext<RemoveAbstract<typeof AbstractAggregateRoot>> {
        if (!this.manager) {
            throw new AggregateManagerNotAvailableError();
        }
    }
}
