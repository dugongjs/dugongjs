import {
    AggregateContext,
    IExternalOriginMap,
    IOutboundMessageMapper,
    type AggregateContextOptions,
    type AggregateRoot,
    type EventSourcedAggregateRoot,
    type IDomainEventRepository,
    type IMessageProducer,
    type ISnapshotRepository,
    type ITransactionManager,
    type RunInTransaction,
    type TransactionContext
} from "@dugongjs/core";
import { Injectable, Logger, Optional } from "@nestjs/common";
import { InjectCurrentOrigin } from "../decorators/inject-current-origin.decorator.js";
import { InjectDomainEventRepository } from "../decorators/inject-domain-event-repository.decorator.js";
import { InjectExternalOriginMap } from "../decorators/inject-external-origin-map.decorator.js";
import { InjectMessageProducer } from "../decorators/inject-message-producer.decorator.js";
import { InjectOutboundMessageMapper } from "../decorators/inject-outbound-message-mapper.decorator.js";
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
        @Optional() @InjectExternalOriginMap() private readonly externalOriginMap?: IExternalOriginMap,
        @Optional() @InjectMessageProducer() private readonly messageProducer?: IMessageProducer<any>,
        @Optional() @InjectOutboundMessageMapper() private readonly outboundMessageMapper?: IOutboundMessageMapper<any>
    ) {}

    public createAggregateContext<TAggregateRootClass extends EventSourcedAggregateRoot>(
        transactionContext: TransactionContext | null,
        aggregateClass: TAggregateRootClass
    ): AggregateContext<TAggregateRootClass> {
        const aggregateContextOptions: AggregateContextOptions<AggregateRoot> = {
            aggregateClass: aggregateClass as unknown as AggregateRoot,
            transactionManager: this.transactionManager,
            domainEventRepository: this.domainEventRepository,
            snapshotRepository: this.snapshotRepository,
            messageProducer: this.messageProducer,
            outboundMessageMapper: this.outboundMessageMapper,
            externalOriginMap: this.externalOriginMap,
            currentOrigin: this.currentOrigin,
            logger: this.logger
        };

        const context = new AggregateContext<TAggregateRootClass>(
            aggregateContextOptions as AggregateContextOptions<TAggregateRootClass>
        );

        const factory = context.getFactory();

        factory.setTransactionContext(transactionContext);

        try {
            const manager = context.getManager();
            manager.setTransactionContext(transactionContext);
        } catch {}

        return context;
    }

    public transaction<TResult>(runInTransaction: RunInTransaction<TResult>): Promise<TResult> {
        return this.transactionManager.transaction(runInTransaction);
    }
}
