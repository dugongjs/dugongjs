import { IMessageProducer, IOutboundMessageMapper } from "@dugongjs/core";
import { Module, type DynamicModule } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import type { TypeOrmEntities, TypeOrmFeatureModule } from "../../types/index.js";
import { OutboxMessageMapperTypeOrmService } from "./outbox-message-mapper-typeorm.service.js";
import { OutboxMessageProducerTypeOrmService } from "./outbox-message-producer-typeorm.service.js";

export function createOutboxMessageProducerTypeOrmModule(entities: TypeOrmEntities): TypeOrmFeatureModule {
    @Module({
        imports: [TypeOrmModule.forFeature([entities.outbox])],
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
    class OutboxMessageProducerTypeOrmModule {
        public static forRoot(): DynamicModule {
            return {
                module: OutboxMessageProducerTypeOrmModule,
                global: true
            };
        }
    }

    return OutboxMessageProducerTypeOrmModule;
}
