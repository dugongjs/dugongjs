import { RepositoryTypeOrmModule, TransactionManagerTypeOrmModule } from "@dugongjs/nestjs-typeorm";
import { ConsumedMessageEntity, DomainEventEntity, OutboxEntity, SnapshotEntity } from "@dugongjs/typeorm";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Logger, LoggerModule } from "nestjs-pino";
import { DataSource } from "typeorm";
import { EventIssuerModule } from "../../../../src/event-issuer/event-issuer.module.js";
import { UserCommandModule } from "../../use-cases/user/application/command/user.command.module.js";
import { UserQueryModule } from "../../use-cases/user/application/query/user.query.module.js";

let app: INestApplication;
let dataSource: DataSource;

beforeAll(async () => {
    const module = await Test.createTestingModule({
        imports: [
            LoggerModule.forRoot({
                pinoHttp: { level: "trace" }
            }),
            TypeOrmModule.forRoot({
                type: "postgres",
                schema: "public",
                port: +process.env.DB_PORT!,
                host: process.env.DB_HOST!,
                username: process.env.DB_USERNAME!,
                password: process.env.DB_PASSWORD!,
                database: process.env.DB_NAME!,
                entities: [DomainEventEntity, SnapshotEntity, ConsumedMessageEntity, OutboxEntity],
                synchronize: true
            }),
            EventIssuerModule.forRoot({ currentOrigin: "IAM-UserService" }),
            RepositoryTypeOrmModule.forRoot(),
            TransactionManagerTypeOrmModule.forRoot(),
            UserCommandModule,
            UserQueryModule
        ]
    }).compile();

    dataSource = module.get<DataSource>(DataSource);

    app = module.createNestApplication({ bufferLogs: true });

    app.useLogger(app.get(Logger));

    await app.init();
    await app.listen(+process.env.APP_PORT!);
});

afterEach(async () => {
    await dataSource.getRepository(DomainEventEntity).delete({});
    await dataSource.getRepository(SnapshotEntity).delete({});
    await dataSource.getRepository(ConsumedMessageEntity).delete({});
    await dataSource.getRepository(OutboxEntity).delete({});
});

export { app, dataSource };
