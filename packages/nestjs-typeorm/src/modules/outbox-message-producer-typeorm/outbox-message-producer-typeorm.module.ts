import { IMessageProducer } from "@dugongjs/core";
import { OutboxEntity } from "@dugongjs/typeorm";
import { Module, type DynamicModule } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OutboxMessageProducerTypeOrmService } from "./outbox-message-producer-typeorm.service.js";

@Module({
    imports: [TypeOrmModule.forFeature([OutboxEntity])],
    providers: [
        {
            provide: IMessageProducer,
            useClass: OutboxMessageProducerTypeOrmService
        }
    ],
    exports: [IMessageProducer]
})
export class OutboxMessageProducerTypeOrmModule {
    public static forRoot(): DynamicModule {
        return {
            module: OutboxMessageProducerTypeOrmModule,
            global: true
        };
    }
}
