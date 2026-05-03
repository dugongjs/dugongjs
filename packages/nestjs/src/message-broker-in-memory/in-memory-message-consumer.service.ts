import { MessageConsumerInMemory, type SerializedDomainEvent } from "@dugongjs/core";
import { Injectable } from "@nestjs/common";
import { InMemoryMessageBusService } from "./in-memory-message-bus.service.js";

@Injectable()
export class InMemoryMessageConsumerService extends MessageConsumerInMemory {
    constructor(messageBus: InMemoryMessageBusService<SerializedDomainEvent>) {
        super(messageBus);
    }
}
