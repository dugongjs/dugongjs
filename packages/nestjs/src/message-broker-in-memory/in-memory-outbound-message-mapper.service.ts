import { OutboundMessageMapperInMemory } from "@dugongjs/core";
import { Injectable } from "@nestjs/common";

@Injectable()
export class InMemoryOutboundMessageMapperService extends OutboundMessageMapperInMemory {}
