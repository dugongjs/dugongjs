import { Module, type DynamicModule } from "@nestjs/common";
import { MessageConsumerKafkaJsModule } from "../message-consumer-kafkajs/message-consumer-kafkajs.module.js";
import { MessageProducerKafkaJsModule } from "../message-producer-kafkajs/message-producer-kafkajs.module.js";

@Module({
    imports: [MessageConsumerKafkaJsModule, MessageProducerKafkaJsModule],
    exports: [MessageConsumerKafkaJsModule, MessageProducerKafkaJsModule]
})
export class MessageBrokerKafkaJsModule {
    public static forRoot(): DynamicModule {
        return {
            module: MessageBrokerKafkaJsModule,
            global: true
        };
    }
}
