import type { IMessageConsumer } from "@dugongjs/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

export interface MessageConsumerFixture<TPublishedMessage, TConsumedMessage = TPublishedMessage> {
    consumer: IMessageConsumer<TConsumedMessage>;
    cleanup: () => Promise<void>;
    prepareMessageChannel?: (messageChannelId: string) => Promise<void>;
    createMessage: (overrides?: Partial<TPublishedMessage>) => TPublishedMessage;
    publishMessage: (messageChannelId: string, message: TPublishedMessage) => Promise<void>;
    normalizeConsumedMessageForComparison?: (message: TConsumedMessage) => unknown;
    normalizeExpectedMessageForComparison?: (message: TPublishedMessage) => unknown;
}

function createUniqueScope(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function runMessageConsumerContractTests<TPublishedMessage, TConsumedMessage = TPublishedMessage>(
    setup: () => Promise<MessageConsumerFixture<TPublishedMessage, TConsumedMessage>>
): void {
    let fixture: MessageConsumerFixture<TPublishedMessage, TConsumedMessage>;

    describe("IMessageConsumer contract", () => {
        beforeEach(async () => {
            fixture = await setup();
        });

        afterEach(async () => {
            await fixture.cleanup();
        });

        describe("generateMessageConsumerIdForAggregate", () => {
            it("should generate a stable consumer id for the same origin, aggregate type, and consumer name", () => {
                const consumerIdA = fixture.consumer.generateMessageConsumerIdForAggregate(
                    "TestOrigin",
                    "TestAggregate",
                    "TestConsumer"
                );
                const consumerIdB = fixture.consumer.generateMessageConsumerIdForAggregate(
                    "TestOrigin",
                    "TestAggregate",
                    "TestConsumer"
                );

                expect(consumerIdA).toBe(consumerIdB);
                expect(consumerIdA).not.toHaveLength(0);
            });

            it("should generate different consumer ids when the origin changes", () => {
                const consumerIdA = fixture.consumer.generateMessageConsumerIdForAggregate(
                    "TestOriginA",
                    "TestAggregate",
                    "TestConsumer"
                );
                const consumerIdB = fixture.consumer.generateMessageConsumerIdForAggregate(
                    "TestOriginB",
                    "TestAggregate",
                    "TestConsumer"
                );

                expect(consumerIdA).not.toBe(consumerIdB);
            });

            it("should generate different consumer ids when the aggregate type changes", () => {
                const consumerIdA = fixture.consumer.generateMessageConsumerIdForAggregate(
                    "TestOrigin",
                    "TestAggregateA",
                    "TestConsumer"
                );
                const consumerIdB = fixture.consumer.generateMessageConsumerIdForAggregate(
                    "TestOrigin",
                    "TestAggregateB",
                    "TestConsumer"
                );

                expect(consumerIdA).not.toBe(consumerIdB);
            });

            it("should generate different consumer ids when the consumer name changes", () => {
                const consumerIdA = fixture.consumer.generateMessageConsumerIdForAggregate(
                    "TestOrigin",
                    "TestAggregate",
                    "TestConsumerA"
                );
                const consumerIdB = fixture.consumer.generateMessageConsumerIdForAggregate(
                    "TestOrigin",
                    "TestAggregate",
                    "TestConsumerB"
                );

                expect(consumerIdA).not.toBe(consumerIdB);
            });
        });

        describe("registerDomainEventMessageConsumer", () => {
            it("should invoke the handler when a message is published on the subscribed channel", async () => {
                const scope = createUniqueScope();
                const messageChannelId = fixture.consumer.generateMessageChannelIdForAggregate(
                    `TestOrigin-${scope}`,
                    `TestAggregate-${scope}`
                );
                const consumerId = fixture.consumer.generateMessageConsumerIdForAggregate(
                    `TestOrigin-${scope}`,
                    `TestAggregate-${scope}`,
                    `TestConsumer-${scope}`
                );
                const message = fixture.createMessage();
                let resolveConsumedMessage: ((value: TConsumedMessage) => void) | undefined;

                const consumedMessage = new Promise<TConsumedMessage>((resolve) => {
                    resolveConsumedMessage = resolve;
                });

                await fixture.prepareMessageChannel?.(messageChannelId);

                await fixture.consumer.registerDomainEventMessageConsumer(
                    messageChannelId,
                    consumerId,
                    async (value) => {
                        resolveConsumedMessage?.(value);
                    }
                );

                await fixture.publishMessage(messageChannelId, message);

                const received = await consumedMessage;
                const normalizeConsumed =
                    fixture.normalizeConsumedMessageForComparison ?? ((value: TConsumedMessage) => value);
                const normalizeExpected =
                    fixture.normalizeExpectedMessageForComparison ?? ((value: TPublishedMessage) => value);

                expect(normalizeConsumed(received)).toEqual(normalizeExpected(message));
            });
        });
    });
}
