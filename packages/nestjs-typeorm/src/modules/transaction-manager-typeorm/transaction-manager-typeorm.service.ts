import { TransactionManagerTypeOrm } from "@dugongjs/typeorm";
import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import type { DataSource } from "typeorm";

@Injectable()
export class TransactionManagerTypeOrmService extends TransactionManagerTypeOrm {
    constructor(@InjectDataSource() dataSource: DataSource) {
        super(dataSource);
    }
}
