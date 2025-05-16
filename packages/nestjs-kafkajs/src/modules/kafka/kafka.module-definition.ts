import { ConfigurableModuleBuilder } from "@nestjs/common";
import type { KafkaConfig } from "kafkajs";

export const ConfigurableKafkaModule = new ConfigurableModuleBuilder<KafkaConfig>()
    .setExtras(
        {
            isGlobal: true
        },
        (definition, extras) => ({
            ...definition,
            global: extras.isGlobal
        })
    )
    .build();
