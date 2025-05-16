import type { AbstractEventSourcedAggregateRoot } from "../../domain/abstract-event-sourced-aggregate-root/abstract-event-sourced-aggregate-root.js";
import type { AbstractDomainEvent } from "../../domain/index.js";
import type { IMessageProducer, IOutboundMessageMapper } from "../../ports/index.js";
import type { RemoveAbstract } from "../../types/remove-abstract.type.js";
import {
    AbstractAggregateHandler,
    type AbstractAggregateHandlerOptions
} from "../abstract-aggregate-handler/abstract-aggregate-handler.js";

export type AggregateMessageProducerOptions<
    TAggregateRootClass extends RemoveAbstract<typeof AbstractEventSourcedAggregateRoot>,
    TMessage
> = AbstractAggregateHandlerOptions<TAggregateRootClass> & {
    messageProducer: IMessageProducer<TMessage>;
    outboundMessageMapper: IOutboundMessageMapper<TMessage>;
};

export class AggregateMessageProducer<
    TAggregateRootClass extends RemoveAbstract<typeof AbstractEventSourcedAggregateRoot>,
    TMessage
> extends AbstractAggregateHandler<TAggregateRootClass> {
    private readonly messageProducer: IMessageProducer<TMessage>;
    private readonly outboundMessageMapper: IOutboundMessageMapper<TMessage>;
    private readonly messageChannelId: string;

    constructor(options: AggregateMessageProducerOptions<TAggregateRootClass, TMessage>) {
        super(options);
        this.messageProducer = options.messageProducer;
        this.outboundMessageMapper = options.outboundMessageMapper;

        this.messageChannelId = this.messageProducer.generateMessageChannelIdForAggregate(
            this.aggregateOrigin,
            this.aggregateType
        );
    }

    public async publishDomainEventsAsMessages(domainEvents: AbstractDomainEvent<any>[]): Promise<void> {
        const logPrefix = "[Message producer]: ";

        const serializedDomainEvents = domainEvents.map((domainEvent) =>
            this.outboundMessageMapper.map(domainEvent.serialize())
        );

        this.logger.log(
            this.logContext,
            logPrefix +
                `Publishing ${serializedDomainEvents.length} domain events as messages to ${this.messageChannelId}`
        );

        await this.messageProducer.publishMessages(null, this.messageChannelId, serializedDomainEvents);
    }
}
