import type { DugongAdapters } from "../dugong/dugong-adapter.js";
import { InboundMessageMapperInMemoryService } from "../message-broker-in-memory/inbound-message-mapper-in-memory.service.js";
import { MessageBusInMemoryService } from "../message-broker-in-memory/message-bus-in-memory.service.js";
import { MessageConsumerInMemoryService } from "../message-broker-in-memory/message-consumer-in-memory.service.js";
import { MessageProducerInMemoryService } from "../message-broker-in-memory/message-producer-in-memory.service.js";
import { OutboundMessageMapperInMemoryService } from "../message-broker-in-memory/outbound-message-mapper-in-memory.service.js";

export const messageBrokerInMemoryAdapter = {
    providers: [MessageBusInMemoryService],
    messageConsumer: MessageConsumerInMemoryService,
    inboundMessageMapper: InboundMessageMapperInMemoryService,
    messageProducer: MessageProducerInMemoryService,
    outboundMessageMapper: OutboundMessageMapperInMemoryService
} satisfies DugongAdapters;
