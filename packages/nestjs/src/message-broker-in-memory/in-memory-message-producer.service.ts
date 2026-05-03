import { MessageProducerInMemory, type SerializedDomainEvent } from "@dugongjs/core";
import { Injectable } from "@nestjs/common";
import { InMemoryMessageBusService } from "./in-memory-message-bus.service.js";

@Injectable()
export class InMemoryMessageProducerService extends MessageProducerInMemory {
    constructor(messageBus: InMemoryMessageBusService<SerializedDomainEvent>) {
        super(messageBus);
    }
}
