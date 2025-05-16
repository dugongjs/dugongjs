import type { IMessageChannelParticipant } from "@dugongjs/core";
import * as changeCase from "change-case";

export class MessageChannelParticipantKafkaJS implements IMessageChannelParticipant {
    public generateMessageChannelIdForAggregate(origin: string, aggregateType: string): string {
        const originKebabCase = changeCase.kebabCase(origin);
        const aggregateTypeKebabCase = changeCase.kebabCase(aggregateType);

        return `${originKebabCase}-${aggregateTypeKebabCase}`;
    }
}
