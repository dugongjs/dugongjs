import { IMessageProducer, IOutboundMessageMapper } from "@dugongjs/core";
import { OutboxEntity } from "@dugongjs/typeorm";
import { Module, type DynamicModule } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OutboxMessageMapperTypeOrmService } from "./outbox-message-mapper-typeorm.service.js";
import { OutboxMessageProducerTypeOrmService } from "./outbox-message-producer-typeorm.service.js";

@Module({
    imports: [TypeOrmModule.forFeature([OutboxEntity])],
    providers: [
        {
            provide: IMessageProducer,
            useClass: OutboxMessageProducerTypeOrmService
        },
        {
            provide: IOutboundMessageMapper,
            useClass: OutboxMessageMapperTypeOrmService
        }
    ],
    exports: [IMessageProducer, IOutboundMessageMapper]
})
export class OutboxMessageProducerTypeOrmModule {
    public static forRoot(): DynamicModule {
        return {
            module: OutboxMessageProducerTypeOrmModule,
            global: true
        };
    }
}
