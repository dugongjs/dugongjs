import { IMessageProducer } from "@dugongjs/core";
import { Inject } from "@nestjs/common";

export const InjectMessageProducer = () => Inject(IMessageProducer);
