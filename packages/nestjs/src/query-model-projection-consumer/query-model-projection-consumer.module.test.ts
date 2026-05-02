import { IInboundMessageMapper, IMessageConsumer } from "@dugongjs/core";
import "reflect-metadata";
import { IQueryModelProjectionHandler } from "./i-query-model-projection-handler.js";
import { QUERY_MODEL_PROJECTION_CONSUMER_OPTIONS_TOKEN } from "./query-model-projection-consumer.constants.js";
import { QueryModelProjectionConsumerModule } from "./query-model-projection-consumer.module.js";

class TestProjectionHandler {}
class TestMessageConsumer {}
class TestInboundMessageMapper {}
class ExistingProvider {}

describe("QueryModelProjectionConsumerModule", () => {
    it("should register projection handler and options token", () => {
        const handleMessageOptions = { isAsync: true } as any;

        const module = QueryModelProjectionConsumerModule.register({
            queryModelProjectionHandler: TestProjectionHandler as any,
            handleMessageOptions
        });

        expect(module.providers).toEqual(
            expect.arrayContaining([
                { provide: IQueryModelProjectionHandler, useClass: TestProjectionHandler },
                { provide: QUERY_MODEL_PROJECTION_CONSUMER_OPTIONS_TOKEN, useValue: handleMessageOptions }
            ])
        );
    });

    it("should register message broker providers when configured", () => {
        const module = QueryModelProjectionConsumerModule.register({
            queryModelProjectionHandler: TestProjectionHandler as any,
            messageBroker: {
                messageConsumer: TestMessageConsumer as any,
                inboundMessageMapper: TestInboundMessageMapper as any
            }
        });

        expect(module.providers).toEqual(
            expect.arrayContaining([
                { provide: IMessageConsumer, useClass: TestMessageConsumer },
                { provide: IInboundMessageMapper, useClass: TestInboundMessageMapper }
            ])
        );
    });

    it("should keep module imports and providers from options", () => {
        const imports = [class ImportA {}];
        const providers = [ExistingProvider];

        const module = QueryModelProjectionConsumerModule.register({
            queryModelProjectionHandler: TestProjectionHandler as any,
            module: {
                imports,
                providers
            }
        });

        expect(module.imports).toEqual(imports);
        expect(module.providers).toEqual(expect.arrayContaining([ExistingProvider]));
    });

    it("should not mutate provided module providers array", () => {
        const providers = [ExistingProvider];

        QueryModelProjectionConsumerModule.register({
            queryModelProjectionHandler: TestProjectionHandler as any,
            module: {
                providers
            },
            messageBroker: {
                messageConsumer: TestMessageConsumer as any
            }
        });

        expect(providers).toEqual([ExistingProvider]);
    });
});
