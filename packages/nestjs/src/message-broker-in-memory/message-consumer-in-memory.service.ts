import { MessageConsumerInMemory, type SerializedDomainEvent } from "@dugongjs/core";
import { Injectable } from "@nestjs/common";
import { MessageBusInMemoryService } from "./message-bus-in-memory.service.js";

@Injectable()
export class MessageConsumerInMemoryService extends MessageConsumerInMemory {
    constructor(messageBus: MessageBusInMemoryService<SerializedDomainEvent>) {
        super(messageBus);
    }
}
