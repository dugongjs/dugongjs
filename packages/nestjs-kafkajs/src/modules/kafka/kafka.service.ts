import { Inject, Injectable } from "@nestjs/common";
import { Kafka } from "kafkajs";
import { ConfigurableKafkaModule } from "./kafka.module-definition.js";

@Injectable()
export class KafkaService extends Kafka {
    constructor(
        @Inject(ConfigurableKafkaModule.MODULE_OPTIONS_TOKEN) config: typeof ConfigurableKafkaModule.OPTIONS_TYPE
    ) {
        super(config);
    }
}
