import { IConsumedMessageRepository } from "@dugongjs/core";
import { Inject } from "@nestjs/common";

export const InjectConsumedMessageRepository = () => Inject(IConsumedMessageRepository);
