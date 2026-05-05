import { ITransactionManager } from "@dugongjs/core";
import { Module, type DynamicModule } from "@nestjs/common";
import { TransactionManagerInMemoryService } from "./transaction-manager-in-memory.service.js";

@Module({
    providers: [
        {
            provide: ITransactionManager,
            useClass: TransactionManagerInMemoryService
        }
    ],
    exports: [ITransactionManager]
})
export class TransactionManagerInMemoryModule {
    public static forRoot(): DynamicModule {
        return {
            module: TransactionManagerInMemoryModule,
            global: true
        };
    }
}
