import { Global, Module, type DynamicModule } from "@nestjs/common";
import { REQUIRE_TENANT_SCOPE_TOKEN } from "./tenancy.tokens.js";

export type TenancyModuleOptions = {
    requireTenantScope: boolean;
};

@Global()
@Module({})
export class TenancyModule {
    public static forRoot(options: TenancyModuleOptions): DynamicModule {
        return {
            module: TenancyModule,
            providers: [
                {
                    provide: REQUIRE_TENANT_SCOPE_TOKEN,
                    useValue: options.requireTenantScope
                }
            ],
            exports: [REQUIRE_TENANT_SCOPE_TOKEN]
        };
    }
}
