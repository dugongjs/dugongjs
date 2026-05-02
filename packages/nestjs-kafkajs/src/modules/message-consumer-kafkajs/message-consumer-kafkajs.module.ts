import { IInboundMessageMapper, IMessageConsumer } from "@dugongjs/core";
import { InboundMessageMapperKafkaJs } from "@dugongjs/kafkajs";
import { Module, type DynamicModule } from "@nestjs/common";
import { MessageConsumerKafkaJsService } from "./message-consumer-kafkajs.service.js";

@Module({
    providers: [
        {
            provide: IMessageConsumer,
            useClass: MessageConsumerKafkaJsService
        },
        {
            provide: IInboundMessageMapper,
            useClass: InboundMessageMapperKafkaJs
        }
    ],
    exports: [IMessageConsumer, IInboundMessageMapper]
})
export class MessageConsumerKafkaJsModule {
    public static forRoot(): DynamicModule {
        return {
            module: MessageConsumerKafkaJsModule,
            global: true
        };
    }
}
