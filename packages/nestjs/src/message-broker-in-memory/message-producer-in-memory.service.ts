import { MessageProducerInMemory, type SerializedDomainEvent } from "@dugongjs/core";
import { Injectable } from "@nestjs/common";
import { MessageBusInMemoryService } from "./message-bus-in-memory.service.js";

@Injectable()
export class MessageProducerInMemoryService extends MessageProducerInMemory {
    constructor(messageBus: MessageBusInMemoryService<SerializedDomainEvent>) {
        super(messageBus);
    }
}
