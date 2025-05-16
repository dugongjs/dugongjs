import { IMessageProducer, IOutboundMessageMapper } from "@dugongjs/core";
import { OutboundMessageMapperKafkaJS } from "@dugongjs/kafkajs";
import { Module, type DynamicModule } from "@nestjs/common";
import { MessageProducerKafkaJSService } from "./message-producer-kafkajs.service.js";

@Module({
    providers: [
        {
            provide: IMessageProducer,
            useClass: MessageProducerKafkaJSService
        },
        {
            provide: IOutboundMessageMapper,
            useClass: OutboundMessageMapperKafkaJS
        }
    ],
    exports: [IMessageProducer, IOutboundMessageMapper]
})
export class MessageProducerKafkaJSModule {
    public static forRoot(): DynamicModule {
        return {
            module: MessageProducerKafkaJSModule,
            global: true
        };
    }
}
