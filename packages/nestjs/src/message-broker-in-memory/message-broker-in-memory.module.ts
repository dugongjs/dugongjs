import { IInboundMessageMapper, IMessageConsumer, IMessageProducer, IOutboundMessageMapper } from "@dugongjs/core";
import { Module, type DynamicModule } from "@nestjs/common";
import { InMemoryInboundMessageMapperService } from "./in-memory-inbound-message-mapper.service.js";
import { InMemoryMessageBusService } from "./in-memory-message-bus.service.js";
import { InMemoryMessageConsumerService } from "./in-memory-message-consumer.service.js";
import { InMemoryMessageProducerService } from "./in-memory-message-producer.service.js";
import { InMemoryOutboundMessageMapperService } from "./in-memory-outbound-message-mapper.service.js";

@Module({
    providers: [
        InMemoryMessageBusService,
        {
            provide: IInboundMessageMapper,
            useClass: InMemoryInboundMessageMapperService
        },
        {
            provide: IOutboundMessageMapper,
            useClass: InMemoryOutboundMessageMapperService
        },
        {
            provide: IMessageConsumer,
            useClass: InMemoryMessageConsumerService
        },
        {
            provide: IMessageProducer,
            useClass: InMemoryMessageProducerService
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
