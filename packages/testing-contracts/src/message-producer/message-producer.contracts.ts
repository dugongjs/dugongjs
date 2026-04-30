import type { IMessageProducer, TransactionContext } from "@dugongjs/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

export interface MessageProducerFixture<TInputMessage, TPublishedMessage = TInputMessage> {
    producer: IMessageProducer<TInputMessage>;
    cleanup: () => Promise<void>;
    prepareMessageChannel?: (messageChannelId: string) => Promise<void>;
    createMessage: (overrides?: Partial<TInputMessage>) => TInputMessage;
    getPublishedMessages: (messageChannelId: string) => Promise<TPublishedMessage[]>;
    mapExpectedPublishedMessage: (message: TInputMessage, messageChannelId: string) => TPublishedMessage;
    normalizePublishedMessageForComparison?: (message: TPublishedMessage) => unknown;
    normalizeExpectedPublishedMessageForComparison?: (message: TPublishedMessage) => unknown;
}

function createUniqueScope(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function runMessageProducerContractTests<TInputMessage, TPublishedMessage = TInputMessage>(
    setup: () => Promise<MessageProducerFixture<TInputMessage, TPublishedMessage>>
): void {
    let fixture: MessageProducerFixture<TInputMessage, TPublishedMessage>;
    const ctx: TransactionContext | null = null;

    describe("IMessageProducer contract", () => {
        beforeEach(async () => {
            fixture = await setup();
        });

        afterEach(async () => {
            await fixture.cleanup();
        });

        describe("generateMessageChannelIdForAggregate", () => {
            it("should generate a stable channel id for the same origin and aggregate type", () => {
                const channelIdA = fixture.producer.generateMessageChannelIdForAggregate("TestOrigin", "TestAggregate");
                const channelIdB = fixture.producer.generateMessageChannelIdForAggregate("TestOrigin", "TestAggregate");

                expect(channelIdA).toBe(channelIdB);
                expect(channelIdA).not.toHaveLength(0);
            });

            it("should generate different channel ids when the origin changes", () => {
                const channelIdA = fixture.producer.generateMessageChannelIdForAggregate(
                    "TestOriginA",
                    "TestAggregate"
                );
                const channelIdB = fixture.producer.generateMessageChannelIdForAggregate(
                    "TestOriginB",
                    "TestAggregate"
                );

                expect(channelIdA).not.toBe(channelIdB);
            });

            it("should generate different channel ids when the aggregate type changes", () => {
                const channelIdA = fixture.producer.generateMessageChannelIdForAggregate(
                    "TestOrigin",
                    "TestAggregateA"
                );
                const channelIdB = fixture.producer.generateMessageChannelIdForAggregate(
                    "TestOrigin",
                    "TestAggregateB"
                );

                expect(channelIdA).not.toBe(channelIdB);
            });
        });

        describe("publishMessage", () => {
            it("should publish a single message to the specified channel", async () => {
                const scope = createUniqueScope();
                const messageChannelId = fixture.producer.generateMessageChannelIdForAggregate(
                    `TestOrigin-${scope}`,
                    `TestAggregate-${scope}`
                );
                const message = fixture.createMessage();

                await fixture.prepareMessageChannel?.(messageChannelId);

                await fixture.producer.publishMessage(ctx, messageChannelId, message);

                const publishedMessages = await fixture.getPublishedMessages(messageChannelId);
                const expectedMessages = [fixture.mapExpectedPublishedMessage(message, messageChannelId)];

                const normalizePublished =
                    fixture.normalizePublishedMessageForComparison ?? ((value: TPublishedMessage) => value);
                const normalizeExpected =
                    fixture.normalizeExpectedPublishedMessageForComparison ?? ((value: TPublishedMessage) => value);

                expect(publishedMessages.map(normalizePublished)).toEqual(expectedMessages.map(normalizeExpected));
            });
        });

        describe("publishMessages", () => {
            it("should publish multiple messages to the specified channel", async () => {
                const scope = createUniqueScope();
                const messageChannelId = fixture.producer.generateMessageChannelIdForAggregate(
                    `TestOrigin-${scope}`,
                    `TestAggregate-${scope}`
                );
                const messageA = fixture.createMessage();
                const messageB = fixture.createMessage();

                await fixture.prepareMessageChannel?.(messageChannelId);

                await fixture.producer.publishMessages(ctx, messageChannelId, [messageA, messageB]);

                const publishedMessages = await fixture.getPublishedMessages(messageChannelId);
                const expectedMessages = [
                    fixture.mapExpectedPublishedMessage(messageA, messageChannelId),
                    fixture.mapExpectedPublishedMessage(messageB, messageChannelId)
                ];

                const normalizePublished =
                    fixture.normalizePublishedMessageForComparison ?? ((value: TPublishedMessage) => value);
                const normalizeExpected =
                    fixture.normalizeExpectedPublishedMessageForComparison ?? ((value: TPublishedMessage) => value);

                const normalizedPublishedMessages = publishedMessages.map(normalizePublished);
                const normalizedExpectedMessages = expectedMessages.map(normalizeExpected);

                expect(normalizedPublishedMessages).toHaveLength(normalizedExpectedMessages.length);

                for (const normalizedExpectedMessage of normalizedExpectedMessages) {
                    expect(normalizedPublishedMessages).toContainEqual(normalizedExpectedMessage);
                }
            });

            it("should do nothing when asked to publish an empty message list", async () => {
                const scope = createUniqueScope();
                const messageChannelId = fixture.producer.generateMessageChannelIdForAggregate(
                    `TestOrigin-${scope}`,
                    `TestAggregate-${scope}`
                );

                await fixture.prepareMessageChannel?.(messageChannelId);

                await fixture.producer.publishMessages(ctx, messageChannelId, []);

                const publishedMessages = await fixture.getPublishedMessages(messageChannelId);

                expect(publishedMessages).toEqual([]);
            });
        });
    });
}
