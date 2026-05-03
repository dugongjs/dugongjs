import { InboundMessageMapperInMemory } from "@dugongjs/core";
import { Injectable } from "@nestjs/common";

@Injectable()
export class InMemoryInboundMessageMapperService extends InboundMessageMapperInMemory {}
