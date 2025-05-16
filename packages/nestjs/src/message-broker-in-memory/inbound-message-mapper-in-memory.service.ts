import { InboundMessageMapperInMemory } from "@dugongjs/core";
import { Injectable } from "@nestjs/common";

@Injectable()
export class InboundMessageMapperInMemoryService extends InboundMessageMapperInMemory {}
