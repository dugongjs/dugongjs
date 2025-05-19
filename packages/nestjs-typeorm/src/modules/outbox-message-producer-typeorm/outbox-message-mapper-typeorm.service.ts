import { OutboxMessageMapperTypeOrm } from "@dugongjs/typeorm";
import { Injectable } from "@nestjs/common";

@Injectable()
export class OutboxMessageMapperTypeOrmService extends OutboxMessageMapperTypeOrm {}
