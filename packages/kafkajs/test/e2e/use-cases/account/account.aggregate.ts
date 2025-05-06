import { AbstractEventSourcedAggregateRoot, ExternalAggregate } from "@dugongjs/core";
import { WithAccountKernel } from "./with-account-kernel.aggregate.js";

@ExternalAggregate("Account", "AccountService")
export class Account extends WithAccountKernel(AbstractEventSourcedAggregateRoot) {}
