import { IInboundMessageMapper, IMessageConsumer } from "@dugongjs/core";
import { InboundMessageMapperKafkaJS } from "@dugongjs/kafkajs";
import { Module, type DynamicModule } from "@nestjs/common";
import { MessageConsumerKafkaJSService } from "./message-consumer-kafkajs.service.js";

@Module({
    providers: [
        {
            provide: IMessageConsumer,
            useClass: MessageConsumerKafkaJSService
        },
        {
            provide: IInboundMessageMapper,
            useClass: InboundMessageMapperKafkaJS
        }
    ],
    exports: [IMessageConsumer, IInboundMessageMapper]
})
export class MessageConsumerKafkaJSModule {
    public static forRoot(): DynamicModule {
        return {
            module: MessageConsumerKafkaJSModule,
            global: true
        };
    }
}
