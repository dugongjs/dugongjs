import { Module, type DynamicModule } from "@nestjs/common";
import type { ModuleImports, ModuleProviders } from "../../../../../../src/providers/module-providers.js";
import { IUserQueryModelRepository } from "../../ports/repository/i-user-query-model-repository.js";
import { UserQueryController } from "./user.query.controller.js";
import { UserQueryService } from "./user.query.service.js";

export type UserQueryModuleOptions = {
    module?: ModuleImports & ModuleProviders;
    repository: new (...args: any) => IUserQueryModelRepository;
};
@Module({
    imports: [],
    providers: [UserQueryService],
    controllers: [UserQueryController]
})
export class UserQueryModule {
    public static register(options: UserQueryModuleOptions): DynamicModule {
        return {
            module: UserQueryModule,
            imports: options.module?.imports,
            providers: [
                ...(options.module?.providers ?? []),
                {
                    provide: IUserQueryModelRepository,
                    useClass: options.repository
                }
            ]
        };
    }
}
