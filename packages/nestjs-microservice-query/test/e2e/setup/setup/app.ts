import { EventIssuerModule } from "@dugongjs/nestjs";
import { RepositoryTypeOrmModule, TransactionManagerTypeOrmModule } from "@dugongjs/nestjs-typeorm";
import { ConsumedMessageEntity, DomainEventEntity, OutboxEntity, SnapshotEntity } from "@dugongjs/typeorm";
import type { INestApplication } from "@nestjs/common";
import { ClientProxyFactory, type MicroserviceOptions, Transport } from "@nestjs/microservices";
import { Test } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Logger, LoggerModule } from "nestjs-pino";
import { DataSource } from "typeorm";
import { AggregateQueryMicroserviceModule } from "../../../../src/modules/aggregate-query-microservice/aggregate-query-microservice.module.js";
import { AggregateQueryClientProxyService } from "../../../../src/services/aggregate-query-client-proxy.service.js";
import { UserCommandModule } from "../../use-cases/user-aggregate/application/command/user.command.module.js";
import { UserQueryModule } from "../../use-cases/user-aggregate/application/query/user.query.module.js";

let app: INestApplication;
let dataSource: DataSource;
let client: AggregateQueryClientProxyService;

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
            AggregateQueryMicroserviceModule,
            UserCommandModule,
            UserQueryModule
        ]
    }).compile();

    dataSource = module.get<DataSource>(DataSource);

    app = module.createNestApplication({ bufferLogs: true });

    app.useLogger(app.get(Logger));

    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.TCP,
        options: {
            host: "localhost",
            port: +process.env.TCP_PORT!
        }
    });

    await app.init();
    await app.startAllMicroservices();
    await app.listen(+process.env.APP_PORT!);

    client = new AggregateQueryClientProxyService(
        ClientProxyFactory.create({
            transport: Transport.TCP,
            options: {
                host: "localhost",
                port: +process.env.TCP_PORT!
            }
        })
    );
});

afterEach(async () => {
    await dataSource.getRepository(DomainEventEntity).delete({});
    await dataSource.getRepository(SnapshotEntity).delete({});
    await dataSource.getRepository(ConsumedMessageEntity).delete({});
    await dataSource.getRepository(OutboxEntity).delete({});
});

export { app, client, dataSource };
