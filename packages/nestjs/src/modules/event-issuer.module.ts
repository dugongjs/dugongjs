import { Global, Module, type DynamicModule } from "@nestjs/common";
import { CURRENT_ORIGIN_TOKEN } from "../tokens.js";

export type EventIssuerModuleOptions = {
    currentOrigin: string;
};

@Global()
@Module({})
export class EventIssuerModule {
    public static forRoot(options: EventIssuerModuleOptions): DynamicModule {
        return {
            module: EventIssuerModule,
            providers: [
                {
                    provide: CURRENT_ORIGIN_TOKEN,
                    useValue: options.currentOrigin
                }
            ],
            exports: [CURRENT_ORIGIN_TOKEN]
        };
    }
}
