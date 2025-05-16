import type { AbstractDomainEvent, IOutboundMessageMapper } from "@dugongjs/core";
import { v4 as uuid } from "uuid";

export type MessageBuilderOptions<TMessage> = {
    outboundMessageMapper: IOutboundMessageMapper<TMessage>;
    initialSequenceNumber?: number;
    autoIncrementSequenceNumber?: boolean;
};

export type BuildResult<TMessage> = {
    messages: TMessage[];
    domainEvents: AbstractDomainEvent[];
    domainEventIds: string[];
};

export class MessageBuilder<TMessage> {
    private readonly outboundMessageMapper: IOutboundMessageMapper<TMessage>;
    private readonly domainEvents: AbstractDomainEvent[] = [];
    private initialSequenceNumber: number;
    private autoIncrementSequenceNumber: boolean;

    constructor(options: MessageBuilderOptions<TMessage>) {
        this.outboundMessageMapper = options.outboundMessageMapper;
        this.initialSequenceNumber = options?.initialSequenceNumber ?? 1;
        this.autoIncrementSequenceNumber = options?.autoIncrementSequenceNumber ?? true;
    }

    public setInitialSequenceNumber(initialSequenceNumber: number): this {
        this.initialSequenceNumber = initialSequenceNumber;

        return this;
    }

    public addDomainEvent(...domainEvents: AbstractDomainEvent<any>[]): this {
        this.domainEvents.push(...domainEvents);

        return this;
    }

    public build(): BuildResult<TMessage> {
        const domainEvents = this.domainEvents.map((domainEvent) => {
            if (!domainEvent.getId()) {
                domainEvent.setId(uuid());
            }
            if (!domainEvent.getTimestamp()) {
                domainEvent.setTimestamp(new Date());
            }

            return domainEvent;
        });

        if (this.autoIncrementSequenceNumber) {
            domainEvents.forEach((event, index) => {
                event.setSequenceNumber(this.initialSequenceNumber + index);
            });
        }

        return {
            messages: domainEvents.map((event) => this.outboundMessageMapper.map(event.serialize())),
            domainEvents,
            domainEventIds: domainEvents.map((event) => event.getId() as string)
        };
    }
}
