import type { AbstractDomainEvent } from "../../domain/abstract-domain-event/abstract-domain-event.js";
import type { EventSourcedAggregateRoot } from "../../domain/abstract-event-sourced-aggregate-root/event-sourced-aggregate-root.js";
import { domainEventDeserializer } from "../../domain/domain-event-deserializer/domain-event-deserializer.js";
import type { IMessageConsumer } from "../../ports/inbound/message-broker/i-message-consumer.js";
import type { IInboundMessageMapper } from "../../ports/index.js";
import type { IConsumedMessageRepository } from "../../ports/outbound/repository/i-consumed-message-repository.js";
import type { IDomainEventRepository } from "../../ports/outbound/repository/i-domain-event-repository.js";
import type { TransactionContext } from "../../ports/outbound/transaction-manager/i-transaction-manager.js";
import {
    AbstractAggregateHandler,
    type AbstractAggregateHandlerOptions
} from "../abstract-aggregate-handler/abstract-aggregate-handler.js";

export type AggregateMessageConsumerOptions<TAggregateRootClass extends EventSourcedAggregateRoot, TMessage> = Omit<
    AbstractAggregateHandlerOptions<TAggregateRootClass>,
    "tenantId"
> & {
    domainEventRepository: IDomainEventRepository;
    consumedMessageRepository: IConsumedMessageRepository;
    messageConsumer: IMessageConsumer<TMessage>;
    inboundMessageMapper: IInboundMessageMapper<TMessage>;
};

export type HandleMessageOptions = {
    skipPersistence?: boolean;
    processConsumedMessages?: boolean;
    maximumRetries?: number;
    retryInterval?: number;
};

export type HandleMessageContext<
    TDomainEvent extends InstanceType<typeof AbstractDomainEvent> = any,
    TMessage = any
> = {
    transactionContext: TransactionContext;
    domainEvent: TDomainEvent;
    message: TMessage;
};

export type HandleMessage = <TDomainEvent extends InstanceType<typeof AbstractDomainEvent> = any, TMessage = any>(
    context: HandleMessageContext<TDomainEvent, TMessage>
) => Promise<void>;

export class AggregateMessageConsumer<
    TAggregateRootClass extends EventSourcedAggregateRoot,
    TMessage
> extends AbstractAggregateHandler<TAggregateRootClass> {
    private readonly domainEventRepository: IDomainEventRepository;
    private readonly consumedMessageRepository: IConsumedMessageRepository;
    private readonly messageConsumer: IMessageConsumer<TMessage>;
    private readonly inboundMessageMapper: IInboundMessageMapper<TMessage>;

    constructor(options: AggregateMessageConsumerOptions<TAggregateRootClass, TMessage>) {
        super(options);
        this.domainEventRepository = options.domainEventRepository;
        this.consumedMessageRepository = options.consumedMessageRepository;
        this.inboundMessageMapper = options.inboundMessageMapper;
        this.messageConsumer = options.messageConsumer;
    }

    public getMessageChannelId(): string {
        return this.messageConsumer.generateMessageChannelIdForAggregate(this.aggregateOrigin, this.aggregateType);
    }

    public getMessageConsumerId(consumerName: string): string {
        return this.messageConsumer.generateMessageConsumerIdForAggregate(
            this.currentOrigin,
            this.aggregateType,
            consumerName
        );
    }

    public getLogPrefix(): string {
        return "[Message consumer]: ";
    }

    public getMessageLogContext(consumerName: string, domainEvent: AbstractDomainEvent<any>): Record<string, any> {
        const messageChannelId = this.getMessageChannelId();
        const messageConsumerId = this.getMessageConsumerId(consumerName);

        return {
            messageChannelId,
            messageConsumerId,
            event: {
                id: domainEvent.getId(),
                origin: domainEvent.getOrigin(),
                aggregateType: domainEvent.getAggregateType(),
                aggregateId: domainEvent.getAggregateId(),
                tenantId: domainEvent.getTenantId(),
                type: domainEvent.getType(),
                version: domainEvent.getVersion()
            }
        };
    }

    public async registerMessageConsumerForAggregate(
        consumerName: string,
        handleMessage?: HandleMessage,
        options?: HandleMessageOptions
    ): Promise<void> {
        const logPrefix = this.getLogPrefix();

        const messageChannelId = this.getMessageChannelId();
        const messageConsumerId = this.getMessageConsumerId(consumerName);

        this.logger.verbose(
            this.logContext,
            logPrefix + `Registering message consumer ${messageConsumerId} for ${messageChannelId}`
        );

        await this.messageConsumer.registerDomainEventMessageConsumer(
            messageChannelId,
            messageConsumerId,
            async (message, transactionContext) => {
                // If the consumer receives a transaction, retries should be skipped
                const maximumRetries = transactionContext ? 0 : options?.maximumRetries;

                return this.retryOnFailure(
                    async () => {
                        const serializedDomainEvent = this.inboundMessageMapper.map(message);
                        const domainEvent = domainEventDeserializer.deserializeDomainEvents(serializedDomainEvent)[0];

                        if (!domainEvent) {
                            this.logger.warn(
                                this.logContext,
                                logPrefix + `Could not extract domain event from message: ${message}`
                            );
                            return;
                        }

                        const messageLogContext = this.getMessageLogContext(consumerName, domainEvent);

                        if (transactionContext) {
                            this.setTransactionContext(transactionContext);
                        }

                        await this.transaction(async (transactionContext: TransactionContext) => {
                            this.logger.verbose(messageLogContext, logPrefix + "Message received");

                            const isConsumed = await this.consumedMessageRepository.checkIfMessageIsConsumed(
                                transactionContext,
                                domainEvent.getId(),
                                messageConsumerId,
                                domainEvent.getTenantId()
                            );

                            if (isConsumed && !options?.processConsumedMessages) {
                                this.logger.warn(
                                    messageLogContext,
                                    logPrefix + "Message already consumed, processing skipped"
                                );
                                return;
                            }

                            const shouldPersistDomainEvent = !this.isInternalAggregate && !options?.skipPersistence;

                            if (shouldPersistDomainEvent) {
                                this.logger.verbose(
                                    messageLogContext,
                                    logPrefix + "Persisting domain event to repository"
                                );
                                await this.domainEventRepository.saveDomainEvents(transactionContext, [
                                    serializedDomainEvent
                                ]);
                            } else {
                                this.logger.verbose(messageLogContext, logPrefix + "Domain event persistence skipped");
                            }

                            await this.consumedMessageRepository.markMessageAsConsumed(
                                transactionContext,
                                domainEvent.getId(),
                                messageConsumerId,
                                domainEvent.getTenantId()
                            );

                            try {
                                if (handleMessage) {
                                    await handleMessage({ transactionContext, domainEvent, message });
                                }
                            } catch (error) {
                                this.logger.error(messageLogContext, logPrefix + `Message processing failed: ${error}`);
                                throw error;
                            } finally {
                                this.logger.log(messageLogContext, logPrefix + "Message processing completed");
                            }
                        });
                    },
                    maximumRetries,
                    options?.retryInterval
                );
            }
        );
    }

    private async retryOnFailure(
        fn: () => Promise<any>,
        maximumRetries: number = 3,
        retryInterval: number = 1000
    ): Promise<any> {
        let attempt = 0;

        while (true) {
            try {
                return await fn();
            } catch (error: any) {
                if (attempt >= maximumRetries) {
                    // TODO: Implement dead-letter queue or other error handling strategy
                    this.logger.error("Message processing failed permanently");
                    this.logger.error(error);
                    return;
                }

                attempt++;
                this.logger.error(
                    error,
                    `[Retry] Message processing failed (attempt ${attempt}/${maximumRetries}), retrying in ${retryInterval}ms`
                );
                await new Promise((resolve) => setTimeout(resolve, retryInterval));
            }
        }
    }
}
