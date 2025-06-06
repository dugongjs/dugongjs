import { IExternalOriginMap } from "@dugongjs/core";
import {
    Module,
    type ClassProvider,
    type DynamicModule,
    type FactoryProvider,
    type ValueProvider
} from "@nestjs/common";
import type { ModuleInjectables } from "../providers/module-providers.js";

export type ExternalOriginModuleOptions = {
    module?: ModuleInjectables;
    externalOriginMap:
        | Omit<FactoryProvider<IExternalOriginMap>, "provide">
        | Omit<ClassProvider<IExternalOriginMap>, "provide">
        | Omit<ValueProvider<IExternalOriginMap>, "provide">;
    isGlobal?: boolean;
};

@Module({})
export class ExternalOriginModule {
    public static register(options: ExternalOriginModuleOptions): DynamicModule {
        return {
            module: ExternalOriginModule,
            imports: options.module?.imports,
            providers: [
                {
                    provide: IExternalOriginMap,
                    ...options.externalOriginMap
                },
                ...(options.module?.providers ?? [])
            ],
            exports: [IExternalOriginMap],
            global: options.isGlobal
        };
    }

    public static forRoot(options: ExternalOriginModuleOptions): DynamicModule {
        return this.register({ ...options, isGlobal: true });
    }
}
