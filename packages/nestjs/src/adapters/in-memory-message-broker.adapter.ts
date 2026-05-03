import type { DugongAdapters } from "../dugong/dugong-adapter.js";
import { InMemoryInboundMessageMapperService } from "../message-broker-in-memory/in-memory-inbound-message-mapper.service.js";
import { InMemoryMessageBusService } from "../message-broker-in-memory/in-memory-message-bus.service.js";
import { InMemoryMessageConsumerService } from "../message-broker-in-memory/in-memory-message-consumer.service.js";
import { InMemoryMessageProducerService } from "../message-broker-in-memory/in-memory-message-producer.service.js";
import { InMemoryOutboundMessageMapperService } from "../message-broker-in-memory/in-memory-outbound-message-mapper.service.js";

export const inMemoryMessageBrokerAdapter = {
    providers: [InMemoryMessageBusService],
    messageConsumer: InMemoryMessageConsumerService,
    inboundMessageMapper: InMemoryInboundMessageMapperService,
    messageProducer: InMemoryMessageProducerService,
    outboundMessageMapper: InMemoryOutboundMessageMapperService
} satisfies DugongAdapters;
