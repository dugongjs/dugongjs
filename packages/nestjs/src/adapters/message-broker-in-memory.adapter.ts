import type { DugongAdapters } from "../dugong/dugong-adapter.js";
import { InMemoryMessageBusService } from "../message-broker-in-memory/in-memory-message-bus.service.js";
import { InboundMessageMapperInMemoryService } from "../message-broker-in-memory/inbound-message-mapper-in-memory.service.js";
import { MessageConsumerInMemoryService } from "../message-broker-in-memory/message-consumer-in-memory.service.js";
import { MessageProducerInMemoryService } from "../message-broker-in-memory/message-producer-in-memory.service.js";
import { OutboundMessageMapperInMemoryService } from "../message-broker-in-memory/outbound-message-mapper-in-memory.service.js";

export const messageBrokerInMemoryAdapter = {
    providers: [InMemoryMessageBusService],
    messageConsumer: MessageConsumerInMemoryService,
    inboundMessageMapper: InboundMessageMapperInMemoryService,
    messageProducer: MessageProducerInMemoryService,
    outboundMessageMapper: OutboundMessageMapperInMemoryService
} satisfies DugongAdapters;
