import { IInboundMessageMapper, IMessageConsumer, IMessageProducer, IOutboundMessageMapper } from "@dugongjs/core";
import { Module, type DynamicModule } from "@nestjs/common";
import { InboundMessageMapperInMemoryService } from "./inbound-message-mapper-in-memory.service.js";
import { MessageBusInMemoryService } from "./message-bus-in-memory.service.js";
import { MessageConsumerInMemoryService } from "./message-consumer-in-memory.service.js";
import { MessageProducerInMemoryService } from "./message-producer-in-memory.service.js";
import { OutboundMessageMapperInMemoryService } from "./outbound-message-mapper-in-memory.service.js";

@Module({
    providers: [
        MessageBusInMemoryService,
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
        MessageBusInMemoryService,
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
