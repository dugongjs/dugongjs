import {
    AbstractAggregateRoot,
    AggregateContext,
    type AbstractEventSourcedAggregateRoot,
    type AggregateContextOptions,
    type IDomainEventRepository,
    type IMessageProducer,
    type ISnapshotRepository,
    type ITransactionManager,
    type RemoveAbstract,
    type RunInTransaction,
    type TransactionContext
} from "@dugongjs/core";
import { Injectable, Logger, Optional } from "@nestjs/common";
import { InjectCurrentOrigin } from "../decorators/inject-current-origin.decorator.js";
import { InjectDomainEventRepository } from "../decorators/inject-domain-event-repository.decorator.js";
import { InjectMessageProducer } from "../decorators/inject-message-producer.decorator.js";
import { InjectSnapshotRepository } from "../decorators/inject-snapshot-repository.decorator.js";
import { InjectTransactionManager } from "../decorators/inject-transaction-manager.decorator.js";

@Injectable()
export class EventSourcingService {
    private readonly logger = new Logger(AggregateContext.name);

    constructor(
        @InjectCurrentOrigin() private readonly currentOrigin: string,
        @InjectTransactionManager() private readonly transactionManager: ITransactionManager,
        @InjectDomainEventRepository() private readonly domainEventRepository: IDomainEventRepository,
        @InjectSnapshotRepository() private readonly snapshotRepository: ISnapshotRepository,
        @Optional() @InjectMessageProducer() private readonly messageProducer?: IMessageProducer
    ) {}

    public createAggregateContext<TAggregateRootClass extends RemoveAbstract<typeof AbstractEventSourcedAggregateRoot>>(
        transactionContext: TransactionContext | null,
        aggregateClass: TAggregateRootClass
    ): AggregateContext<TAggregateRootClass> {
        const aggregateContextOptions: AggregateContextOptions<RemoveAbstract<typeof AbstractAggregateRoot>> = {
            aggregateClass: aggregateClass as unknown as RemoveAbstract<typeof AbstractAggregateRoot>,
            transactionContext,
            domainEventRepository: this.domainEventRepository,
            snapshotRepository: this.snapshotRepository,
            messageProducer: this.messageProducer,
            currentOrigin: this.currentOrigin,
            logger: this.logger
        };

        return new AggregateContext<TAggregateRootClass>(
            aggregateContextOptions as AggregateContextOptions<TAggregateRootClass>
        );
    }

    public transaction<TResult>(runInTransaction: RunInTransaction<TResult>): Promise<TResult> {
        return this.transactionManager.transaction(runInTransaction);
    }
}
