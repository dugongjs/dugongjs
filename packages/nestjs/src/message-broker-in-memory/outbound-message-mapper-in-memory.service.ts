import { OutboundMessageMapperInMemory } from "@dugongjs/core";
import { Injectable } from "@nestjs/common";

@Injectable()
export class OutboundMessageMapperInMemoryService extends OutboundMessageMapperInMemory {}
