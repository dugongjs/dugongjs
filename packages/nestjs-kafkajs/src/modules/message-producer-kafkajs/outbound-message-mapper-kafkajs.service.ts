import { OutboundMessageMapperKafkaJs } from "@dugongjs/kafkajs";
import { Injectable } from "@nestjs/common";

@Injectable()
export class OutboundMessageMapperKafkaJsService extends OutboundMessageMapperKafkaJs {}
