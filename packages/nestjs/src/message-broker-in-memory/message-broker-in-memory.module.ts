import { IInboundMessageMapper, IMessageConsumer, IMessageProducer, IOutboundMessageMapper } from "@dugongjs/core";
import { Module, type DynamicModule } from "@nestjs/common";
import { InMemoryMessageBusService } from "./in-memory-message-bus.service.js";
import { InboundMessageMapperInMemoryService } from "./inbound-message-mapper-in-memory.service.js";
import { MessageConsumerInMemoryService } from "./message-consumer-in-memory.service.js";
import { MessageProducerInMemoryService } from "./message-producer-in-memory.service.js";
import { OutboundMessageMapperInMemoryService } from "./outbound-message-mapper-in-memory.service.js";

@Module({
    providers: [
        InMemoryMessageBusService,
        {
            provide: IInboundMessageMapper,
            useClass: InboundMessageMapperInMemoryService
        },
        {
            provide: IOutboundMessageMapper,
            useClass: OutboundMessageMapperInMemoryService
        },
        {
            provide: IMessageConsumer,
            useClass: MessageConsumerInMemoryService
        },
        {
            provide: IMessageProducer,
            useClass: MessageProducerInMemoryService
        }
    ],
    exports: [
        InMemoryMessageBusService,
        IInboundMessageMapper,
        IOutboundMessageMapper,
        IMessageConsumer,
        IMessageProducer
    ]
})
export class MessageBrokerInMemoryModule {
    public static forRoot(): DynamicModule {
        return {
            global: true,
            module: MessageBrokerInMemoryModule
        };
    }
}
