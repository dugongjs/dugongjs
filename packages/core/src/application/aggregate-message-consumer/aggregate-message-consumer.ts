import type { AbstractDomainEvent } from "../../domain/abstract-domain-event/abstract-domain-event.js";
import type { AbstractEventSourcedAggregateRoot } from "../../domain/abstract-event-sourced-aggregate-root/abstract-event-sourced-aggregate-root.js";
import { domainEventDeserializer } from "../../domain/domain-event-deserializer/domain-event-deserializer.js";
import type { IMessageSerdes } from "../../ports/common/message-broker/i-message-serdes.js";
import type { IMessageConsumer } from "../../ports/inbound/message-broker/i-message-consumer.js";
import type { IConsumedMessageRepository } from "../../ports/outbound/repository/i-consumed-message-repository.js";
import type { IDomainEventRepository } from "../../ports/outbound/repository/i-domain-event-repository.js";
import type {
    ITransactionManager,
    RunInTransaction,
    TransactionContext
} from "../../ports/outbound/transaction-manager/i-transaction-manager.js";
import type { RemoveAbstract } from "../../types/remove-abstract.type.js";
import {
    AbstractAggregateHandler,
    type AbstractAggregateHandlerOptions
} from "../abstract-aggregate-handler/abstract-aggregate-handler.js";

export type AggregateMessageConsumerOptions<
    TAggregateRootClass extends RemoveAbstract<typeof AbstractEventSourcedAggregateRoot>,
    TMessage
> = AbstractAggregateHandlerOptions<TAggregateRootClass> & {
    transactionManager: ITransactionManager;
    domainEventRepository: IDomainEventRepository;
    consumedMessageRepository: IConsumedMessageRepository;
    messageConsumer: IMessageConsumer<TMessage>;
    messageSerdes: IMessageSerdes<TMessage, any>;
};

export type HandleMessageOptions = {
    skipPersistence?: boolean;
    processConsumedMessages?: boolean;
    maximumRetries?: number;
    retryInterval?: number;
};

export type HandleMessageContext<TMessage = any> = {
    transactionContext: TransactionContext;
    domainEvent: InstanceType<typeof AbstractDomainEvent>;
    message: TMessage;
};

export type HandleMessage = <TMessage>(context: HandleMessageContext<TMessage>) => Promise<void>;

export class AggregateMessageConsumer<
    TAggregateRootClass extends RemoveAbstract<typeof AbstractEventSourcedAggregateRoot>,
    TMessage
> extends AbstractAggregateHandler<TAggregateRootClass> {
    private readonly transactionManager: ITransactionManager;
    private readonly domainEventRepository: IDomainEventRepository;
    private readonly consumedMessageRepository: IConsumedMessageRepository;
    private readonly messageConsumer: IMessageConsumer<TMessage>;
    private readonly messageSerdes: IMessageSerdes<TMessage>;

    constructor(options: AggregateMessageConsumerOptions<TAggregateRootClass, TMessage>) {
        super(options);
        this.transactionManager = options.transactionManager;
        this.domainEventRepository = options.domainEventRepository;
        this.consumedMessageRepository = options.consumedMessageRepository;
        this.messageSerdes = options.messageSerdes;
        this.messageConsumer = options.messageConsumer;
    }

    public async registerMessageConsumerForAggregate(
        consumerName: string,
        handleMessage?: HandleMessage,
        options?: HandleMessageOptions
    ): Promise<void> {
        const logPrefix = "[Message consumer]: ";

        const messageChannelId = this.messageConsumer.generateMessageChannelIdForAggregate(
            this.aggregateOrigin,
            this.aggregateType
        );

        const messageConsumerId = this.messageConsumer.generateMessageConsumerIdForAggregate(
            this.currentOrigin,
            this.aggregateType,
            consumerName
        );

        this.logger.verbose(
            this.logContext,
            logPrefix + `Registering message consumer ${messageConsumerId} for ${messageChannelId}`
        );

        await this.retryOnFailure(
            async () =>
                await this.messageConsumer.registerDomainEventMessageConsumer(
                    messageChannelId,
                    messageConsumerId,
                    async (message, transactionContext) => {
                        const serializedDomainEvent = this.messageSerdes.unwrapMessage(message);
                        const domainEvent = domainEventDeserializer.deserializeDomainEvents(serializedDomainEvent)[0];

                        if (!domainEvent) {
                            this.logger.warn(
                                this.logContext,
                                logPrefix + `Message received but domain event could not be determined: ${message}`
                            );
                            return;
                        }

                        const messageLogContext = {
                            messageChannelId,
                            messageConsumerId,
                            event: {
                                id: domainEvent.getId(),
                                origin: domainEvent.getOrigin(),
                                aggregateType: domainEvent.getAggregateType(),
                                aggregateId: domainEvent.getAggregateId(),
                                type: domainEvent.getType(),
                                version: domainEvent.getVersion()
                            }
                        };

                        const transaction: RunInTransaction<any> = transactionContext
                            ? async (fn: (ctx: TransactionContext) => Promise<void>) => fn(transactionContext)
                            : this.transactionManager.transaction.bind(this.transactionManager);

                        await transaction(async (transactionContext: TransactionContext) => {
                            this.logger.log(messageLogContext, logPrefix + "Message received");

                            const isConsumed = await this.consumedMessageRepository.checkIfMessageIsConsumed(
                                transactionContext,
                                domainEvent.getId(),
                                messageConsumerId
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
                                messageConsumerId
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
                    }
                ),
            options?.maximumRetries,
            options?.retryInterval
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
                    this.logger.error({ ...this.logContext, error }, "Message processing failed permanently");
                    return;
                }

                attempt++;
                this.logger.error(
                    { ...this.logContext, error },
                    `[Retry] Message processing failed (attempt ${attempt}/${maximumRetries}), retrying in ${retryInterval}ms,$`
                );
                await new Promise((resolve) => setTimeout(resolve, retryInterval));
            }
        }
    }
}
