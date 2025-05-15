import { MessageSerdesInMemory } from "@dugongjs/core";
import { Injectable } from "@nestjs/common";

@Injectable()
export class MessageSerdesInMemoryService extends MessageSerdesInMemory {}
