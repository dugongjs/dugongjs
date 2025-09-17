import { RepositoryTypeOrmModule, TransactionManagerTypeOrmModule } from "@dugongjs/nestjs-typeorm";
import { ConsumedMessageEntity, DomainEventEntity, OutboxEntity, SnapshotEntity } from "@dugongjs/typeorm";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Logger, LoggerModule } from "nestjs-pino";
import { DataSource } from "typeorm";
import { EventIssuerModule } from "../../../../src/event-issuer/event-issuer.module.js";
import { MessageBrokerInMemoryModule } from "../../../../src/message-broker-in-memory/message-broker-in-memory.module.js";
import { UserQueryModelEntity } from "../../use-cases/user/adapters/repository/user-query-model-entity.js";
import { UserQueryModelRepositoryTypeOrmService } from "../../use-cases/user/adapters/repository/user-query-model-repository-typeorm.service.js";
import { UserCommandModule } from "../../use-cases/user/application/command/user.command.module.js";
import { UserQueryModelProjectionModule } from "../../use-cases/user/application/consumer/user-query-model-projection.module.js";
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
                entities: [
                    DomainEventEntity,
                    SnapshotEntity,
                    ConsumedMessageEntity,
                    OutboxEntity,
                    UserQueryModelEntity
                ],
                synchronize: true
            }),
            EventIssuerModule.forRoot({ currentOrigin: "IAM-UserService" }),
            RepositoryTypeOrmModule.forRoot(),
            TransactionManagerTypeOrmModule.forRoot(),
            MessageBrokerInMemoryModule.forRoot(),
            UserCommandModule,
            UserQueryModule.register({
                module: { imports: [TypeOrmModule.forFeature([UserQueryModelEntity])] },
                repository: UserQueryModelRepositoryTypeOrmService
            }),
            UserQueryModelProjectionModule.register({
                repository: UserQueryModelRepositoryTypeOrmService
            })
        ]
    }).compile();

    dataSource = module.get<DataSource>(DataSource);

    app = module.createNestApplication({ bufferLogs: true });

    app.useLogger(app.get(Logger));

    await app.init();
    await app.listen(+process.env.APP_PORT!);
});

afterEach(async () => {
    await dataSource.getRepository(DomainEventEntity).clear();
    await dataSource.getRepository(SnapshotEntity).clear();
    await dataSource.getRepository(ConsumedMessageEntity).clear();
    await dataSource.getRepository(OutboxEntity).clear();
    await dataSource.getRepository(UserQueryModelEntity).clear();
});

export { app, dataSource };
