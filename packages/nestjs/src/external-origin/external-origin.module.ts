import { IExternalOriginMap } from "@dugongjs/core";
import {
    Module,
    type ClassProvider,
    type DynamicModule,
    type FactoryProvider,
    type ValueProvider
} from "@nestjs/common";

export type ExternalOriginModuleOptions = {
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
            providers: [
                {
                    provide: IExternalOriginMap,
                    ...options.externalOriginMap
                }
            ],
            exports: [IExternalOriginMap],
            global: options.isGlobal
        };
    }

    public static forRoot(options: ExternalOriginModuleOptions): DynamicModule {
        return this.register({ ...options, isGlobal: true });
    }
}
