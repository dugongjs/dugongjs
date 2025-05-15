import type { Constructor } from "@dugongjs/core";
import { Module, type DynamicModule } from "@nestjs/common";
import {
    QueryModelProjectionConsumerModule,
    type QueryModelProjectionConsumerModuleOptions
} from "../../../../../../src/query-model-projection-consumer/query-model-projection-consumer.module.js";
import { IUserQueryModelRepository } from "../../ports/repository/i-user-query-model-repository.js";
import { UserQueryModelProjectionHandlerService } from "./user-query-model-projection-handler.service.js";

export type UserQueryModelProjectionModuleOptions = Omit<
    QueryModelProjectionConsumerModuleOptions,
    "queryModelProjectionHandler"
> & {
    repository: Constructor<IUserQueryModelRepository>;
};

@Module({})
export class UserQueryModelProjectionModule {
    public static register(options: UserQueryModelProjectionModuleOptions): DynamicModule {
        return QueryModelProjectionConsumerModule.register({
            queryModelProjectionHandler: UserQueryModelProjectionHandlerService,
            module: {
                imports: options.module?.imports,
                providers: [
                    ...(options.module?.providers ?? []),
                    {
                        provide: IUserQueryModelRepository,
                        useClass: options.repository
                    }
                ]
            },
            ...options
        });
    }
}
