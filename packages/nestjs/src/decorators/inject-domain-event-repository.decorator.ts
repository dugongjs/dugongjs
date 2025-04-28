import { IDomainEventRepository } from "@dugongjs/core";
import { Inject } from "@nestjs/common";

export const InjectDomainEventRepository = () => Inject(IDomainEventRepository);
