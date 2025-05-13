import { EventIssuerModule } from "@dugongjs/nestjs";
import { AggregateQueryMicroserviceModule } from "@dugongjs/nestjs-microservice-query";
import { RepositoryTypeOrmModule, TransactionManagerTypeOrmModule } from "@dugongjs/nestjs-typeorm";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BankAccountCommandModule } from "./bank-account/application/command/bank-account.command.module.js";
import { dataSourceOptions } from "./db/data-source-options.js";

@Module({
    imports: [
        TypeOrmModule.forRoot(dataSourceOptions),
        RepositoryTypeOrmModule.forRoot(),
        TransactionManagerTypeOrmModule.forRoot(),
        EventIssuerModule.forRoot({ currentOrigin: "BankingContext-AccountService" }),
        AggregateQueryMicroserviceModule,
        BankAccountCommandModule
    ]
})
export class AppModule {}
