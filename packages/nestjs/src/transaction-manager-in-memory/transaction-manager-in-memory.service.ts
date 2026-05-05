import { TransactionManagerInMemory } from "@dugongjs/core";
import { Injectable } from "@nestjs/common";

@Injectable()
export class TransactionManagerInMemoryService extends TransactionManagerInMemory {}
