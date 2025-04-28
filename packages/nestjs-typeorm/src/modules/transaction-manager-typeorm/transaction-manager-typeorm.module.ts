import { ITransactionManager } from "@dugongjs/core";
import { Module, type DynamicModule } from "@nestjs/common";
import { TransactionManagerTypeOrmService } from "./transaction-manager-typeorm.service.js";

@Module({
    providers: [
        {
            provide: ITransactionManager,
            useClass: TransactionManagerTypeOrmService
        }
    ],
    exports: [ITransactionManager]
})
export class TransactionManagerTypeOrmModule {
    public static forRoot(): DynamicModule {
        return {
            module: TransactionManagerTypeOrmModule,
            global: true
        };
    }
}
