import { Constructor } from "@dugongjs/core";
import { ModuleImports, ModuleProviders } from "@dugongjs/nestjs";
import { DynamicModule, Module } from "@nestjs/common";
import { IBankAccountQueryModelReadRepository } from "../../ports/repository/i-bank-account-query-model-read-repository.js";
import { BankAccountQueryController } from "./bank-account.query.controller.js";
import { BankAccountQueryService } from "./bank-account.query.service.js";

export type BankAccountQueryModuleOptions = {
    module?: ModuleImports & ModuleProviders;
    repository: Constructor<IBankAccountQueryModelReadRepository>;
};

@Module({
    imports: [],
    controllers: [BankAccountQueryController],
    providers: [BankAccountQueryService]
})
export class BankAccountQueryModule {
    public static register(options: BankAccountQueryModuleOptions): DynamicModule {
        return {
            module: BankAccountQueryModule,
            imports: options.module?.imports,
            providers: [
                ...(options.module?.providers ?? []),
                {
                    provide: IBankAccountQueryModelReadRepository,
                    useClass: options.repository
                }
            ]
        };
    }
}
