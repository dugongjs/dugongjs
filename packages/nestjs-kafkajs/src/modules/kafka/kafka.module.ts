import { Module, type DynamicModule } from "@nestjs/common";
import { ConfigurableKafkaModule } from "./kafka.module-definition.js";
import { KafkaService } from "./kafka.service.js";

@Module({
    providers: [KafkaService],
    exports: [KafkaService]
})
export class KafkaModule extends ConfigurableKafkaModule.ConfigurableModuleClass {
    public static forRoot(config: typeof ConfigurableKafkaModule.OPTIONS_TYPE): DynamicModule {
        return {
            module: KafkaModule,
            global: true,
            providers: [
                {
                    provide: ConfigurableKafkaModule.MODULE_OPTIONS_TOKEN,
                    useValue: config
                }
            ]
        };
    }
}
