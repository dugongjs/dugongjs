import { InMemoryMessageBus } from "@dugongjs/core";
import { Injectable } from "@nestjs/common";

@Injectable()
export class MessageBusInMemoryService<TMessage> extends InMemoryMessageBus<TMessage> {}
