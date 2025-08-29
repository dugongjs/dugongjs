import { AbstractAggregateRoot } from "../../domain/abstract-aggregate-root/abstract-aggregate-root.js";
import type { AggregateRoot } from "../../domain/abstract-aggregate-root/aggregate-root.js";
import type { EventSourcedAggregateRoot } from "../../domain/abstract-event-sourced-aggregate-root/event-sourced-aggregate-root.js";
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

export type AggregateContextOptions<TAggregateRootClass extends EventSourcedAggregateRoot> =
    TAggregateRootClass extends AggregateRoot
        ? AggregateFactoryOptions<TAggregateRootClass> & AggregateManagerOptions<TAggregateRootClass>
        : AggregateFactoryOptions<TAggregateRootClass>;

/**
 * Context for managing aggregates in the application layer, providing a common interface for executing operations
 * on the `AggregateFactory` and `AggregateManager`.
 *
 * When used with a class extending `AbstractAggregateRoot`, it provides access to both the factory and manager.
 * When used with a class extending `EventSourcedAggregateRoot`, it provides access to the factory only.
 */
export class AggregateContext<TAggregateRootClass extends EventSourcedAggregateRoot> {
    private readonly options: AggregateContextOptions<TAggregateRootClass>;
    private readonly factory: AggregateFactory<TAggregateRootClass>;
    private readonly manager: TAggregateRootClass extends AggregateRoot ? AggregateManager<TAggregateRootClass> : null;

    constructor(options: AggregateContextOptions<TAggregateRootClass>) {
        this.options = options;
        this.factory = new AggregateFactory(options as AggregateFactoryOptions<TAggregateRootClass>);
        this.manager = (
            this.isAggregateRootClass(options) ? new AggregateManager(options) : null
        ) as TAggregateRootClass extends AggregateRoot ? AggregateManager<TAggregateRootClass> : null;
    }

    /**
     * Returns the AggregateFactory instance for the context.
     * @returns The AggregateFactory instance.
     */
    public getFactory(): AggregateFactory<TAggregateRootClass> {
        return this.factory;
    }

    /**
     * Returns the AggregateManager instance for the context.
     * If the `AggregateRootClass` is not an instance of `AbstractAggregateRoot`, this method will throw an error.
     * @returns The AggregateManager instance.
     */
    public getManager(): TAggregateRootClass extends AggregateRoot ? AggregateManager<TAggregateRootClass> : never {
        this.validateManagerExists();
        return this.manager as TAggregateRootClass extends AggregateRoot
            ? AggregateManager<TAggregateRootClass>
            : never;
    }

    /**
     * Sets the tenant ID for the context.
     * This can be used in multi-tenant applications to scope operations to a specific tenant.
     * @param tenantId The tenant ID to set for the context.
     * @returns A new instance of `AggregateContext` with the updated tenant ID.
     */
    public withTenantId(tenantId: string): AggregateContext<TAggregateRootClass> {
        return new AggregateContext<TAggregateRootClass>({ ...this.options, tenantId });
    }

    /**
     * Builds an aggregate instance with the given aggregate ID and options.
     * This method uses the `AggregateFactory` to create an instance of the aggregate root class.
     * @param aggregateId The ID of the aggregate to build.
     * @param options The options to use when building the aggregate instance.
     * @returns A promise that resolves to an instance of the aggregate root class or null if not found.
     */
    public async build(
        aggregateId: string,
        options: BuildOptions = {}
    ): Promise<InstanceType<TAggregateRootClass> | null> {
        return this.factory.build(aggregateId, options);
    }

    /**
     * Applies staged domain events to the given aggregate instance.
     * @param aggregate The aggregate instance to which the staged domain events will be applied.
     */
    public applyStagedDomainEvents(aggregate: InstanceType<TAggregateRootClass>): void {
        this.validateManagerExists();

        return this.manager.applyStagedDomainEvents(aggregate);
    }

    /**
     * Commits the staged domain events for the given aggregate instance.
     * @param aggregate The aggregate instance for which the staged domain events will be committed.
     * @param options The options for committing the domain events.
     */
    public async commitStagedDomainEvents(
        aggregate: InstanceType<TAggregateRootClass>,
        options: CommitOptions = {}
    ): Promise<void> {
        this.validateManagerExists();
        return this.manager.commitStagedDomainEvents(aggregate, options);
    }

    /**
     * Applies and commits staged domain events for the given aggregate instance.
     * This method combines the application and committing of staged domain events into a single operation.
     * @param aggregate The aggregate instance for which the staged domain events will be applied and committed.
     * @param options The options for committing the domain events.
     */
    public async applyAndCommitStagedDomainEvents(
        aggregate: InstanceType<TAggregateRootClass>,
        options: CommitOptions = {}
    ): Promise<void> {
        this.validateManagerExists();
        return this.manager.applyAndCommitStagedDomainEvents(aggregate, options);
    }

    private isAggregateRootClass(
        options: AggregateContextOptions<TAggregateRootClass>
    ): options is AggregateContextOptions<TAggregateRootClass & AggregateRoot> {
        return options.aggregateClass.prototype instanceof AbstractAggregateRoot;
    }

    private validateManagerExists(): asserts this is AggregateContext<AggregateRoot> {
        if (!this.manager) {
            throw new AggregateManagerNotAvailableError();
        }
    }
}
