import { Constructor } from "@dugongjs/core";
import { QueryModelProjectionConsumerModule, QueryModelProjectionConsumerModuleOptions } from "@dugongjs/nestjs";
import { DynamicModule, Module } from "@nestjs/common";
import { IBankAccountQueryModelWriteRepository } from "../../ports/repository/i-bank-account-query-model-Write-repository.js";
import { BankAccountQueryModelProjectionHandlerService } from "./bank-account-query-model-projection-handler.service.js";

export type BankAccountQueryModelProjectionConsumerModuleOptions = Omit<
    QueryModelProjectionConsumerModuleOptions,
    "queryModelProjectionHandler"
> & {
    repository: Constructor<IBankAccountQueryModelWriteRepository>;
};

@Module({})
export class BankAccountQueryModelProjectionConsumerModule {
    public static register(options: BankAccountQueryModelProjectionConsumerModuleOptions): DynamicModule {
        return QueryModelProjectionConsumerModule.register({
            ...options,
            queryModelProjectionHandler: BankAccountQueryModelProjectionHandlerService,
            module: {
                imports: options.module?.imports,
                providers: [
                    ...(options.module?.providers ?? []),
                    {
                        provide: IBankAccountQueryModelWriteRepository,
                        useClass: options.repository
                    }
                ]
            }
        });
    }
}
