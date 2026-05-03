import { DugongAdapterBuilder, DugongModule, loggerAdapter } from "@dugongjs/nestjs";
import { KafkaModule, messageConsumerKafkaJsAdapter } from "@dugongjs/nestjs-kafkajs";
import {
    outboxMessageProducerTypeOrmAdapter,
    repositoryTypeOrmAdapter,
    transactionManagerTypeOrmAdapter
} from "@dugongjs/nestjs-typeorm";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BankAccountQueryModelReadRepositoryTypeOrmService } from "./bank-account/adapters/repository/bank-account-query-model-read-repository-typeorm.service.js";
import { BankAccountQueryModelWriteRepositoryTypeOrmService } from "./bank-account/adapters/repository/bank-account-query-model-write-repository-typeorm.service.js";
import { BankAccountQueryModelEntity } from "./bank-account/adapters/repository/bank-account-query-model.entity.js";
import { BankAccountCommandModule } from "./bank-account/application/command/bank-account.command.module.js";
import { BankAccountQueryModelProjectionConsumerModule } from "./bank-account/application/consumer/bank-account-query-model-projection-consumer.module.js";
import { BankAccountQueryModule } from "./bank-account/application/query/bank-account.query.module.js";
import { dataSourceOptions } from "./db/data-source-options.js";

@Module({
    imports: [
        TypeOrmModule.forRoot(dataSourceOptions),
        KafkaModule.forRoot({ brokers: process.env.KAFKA_BROKERS!.split(",") }),
        DugongModule.forRoot({
            currentOrigin: "BankingContext-AccountService",
            adapters: new DugongAdapterBuilder()
                .register(loggerAdapter)
                .register(repositoryTypeOrmAdapter)
                .register(transactionManagerTypeOrmAdapter)
                .register(outboxMessageProducerTypeOrmAdapter)
                .register(messageConsumerKafkaJsAdapter)
                .build()
        }),
        BankAccountCommandModule,
        BankAccountQueryModelProjectionConsumerModule.register({
            repository: BankAccountQueryModelWriteRepositoryTypeOrmService
        }),
        BankAccountQueryModule.register({
            module: { imports: [TypeOrmModule.forFeature([BankAccountQueryModelEntity])] },
            repository: BankAccountQueryModelReadRepositoryTypeOrmService
        })
    ]
})
export class AppModule {}
