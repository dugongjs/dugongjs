import { InMemoryMessageBus } from "@dugongjs/core";
import { Injectable } from "@nestjs/common";

@Injectable()
export class InMemoryMessageBusService<TMessage> extends InMemoryMessageBus<TMessage> {}
