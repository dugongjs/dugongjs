import { IMessageProducer, IOutboundMessageMapper } from "@dugongjs/core";
import { OutboundMessageMapperKafkaJs } from "@dugongjs/kafkajs";
import { Module, type DynamicModule } from "@nestjs/common";
import { MessageProducerKafkaJsService } from "./message-producer-kafkajs.service.js";

@Module({
    providers: [
        {
            provide: IMessageProducer,
            useClass: MessageProducerKafkaJsService
        },
        {
            provide: IOutboundMessageMapper,
            useClass: OutboundMessageMapperKafkaJs
        }
    ],
    exports: [IMessageProducer, IOutboundMessageMapper]
})
export class MessageProducerKafkaJsModule {
    public static forRoot(): DynamicModule {
        return {
            module: MessageProducerKafkaJsModule,
            global: true
        };
    }
}
