import { ITransactionManager } from "@dugongjs/core";
import { Inject } from "@nestjs/common";

export const InjectTransactionManager = () => Inject(ITransactionManager);
