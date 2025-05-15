import { IMessageConsumer, IMessageProducer, IMessageSerdes } from "@dugongjs/core";
import { Module, type DynamicModule } from "@nestjs/common";
import { InMemoryMessageBusService } from "./in-memory-message-bus.service.js";
import { MessageConsumerInMemoryService } from "./message-consumer-in-memory.service.js";
import { MessageProducerInMemoryService } from "./message-producer-in-memory.service.js";
import { MessageSerdesInMemoryService } from "./message-serdes-in-memory.service.js";

@Module({
    providers: [
        InMemoryMessageBusService,
        {
            provide: IMessageSerdes,
            useClass: MessageSerdesInMemoryService
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
    exports: [InMemoryMessageBusService, IMessageSerdes, IMessageConsumer, IMessageProducer]
})
export class MessageBrokerInMemoryModule {
    public static forRoot(): DynamicModule {
        return {
            global: true,
            module: MessageBrokerInMemoryModule
        };
    }
}
