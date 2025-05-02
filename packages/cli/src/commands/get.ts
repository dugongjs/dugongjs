import { Command } from "commander";
import { getAggregateQueryAdapter } from "../adapters/resolver.js";
import formatAggregate from "../utils/format-aggregate.js";

const get = new Command("get").description("Get a resource from the server");

get.command("aggregates")
    .description("Get all aggregates")
    .action(async () => {
        try {
            const { adapter, close } = getAggregateQueryAdapter();
            const aggregates = await adapter.getAggregateTypes();
            await close?.();

            if (aggregates.length === 0) {
                console.log("No aggregates found.");
                return;
            }

            console.log("Aggregates:");
            aggregates.forEach((aggregate) => {
                console.log(`- ${aggregate}`);
            });
        } catch (error: any) {
            console.error("Error retrieving aggregates:", error.message);
        }
    });

get.command("aggregate-ids")
    .alias("aggregateids")
    .description("Get all aggregate IDs for a given aggregate type")
    .option("-o, --origin <origin>", "The origin of the aggregate")
    .argument("<aggregateType>", "The aggregate type to get IDs for")
    .action(async (aggregateType, options) => {
        try {
            const { origin } = options;
            const { adapter, close } = getAggregateQueryAdapter();
            const aggregateIds = await adapter.getAggregateIds(origin, aggregateType);
            await close?.();

            if (aggregateIds.length === 0) {
                console.log(
                    `No aggregate IDs found for type "${aggregateType}"${origin ? `, origin "${origin}"` : ""}.`
                );
                return;
            }

            console.log(`Aggregate IDs for type "${aggregateType}"${origin ? `, origin "${origin}"` : ""}:`);
            aggregateIds.forEach((aggregateId) => {
                console.log(`- ${aggregateId}`);
            });
        } catch (error: any) {
            console.error("Error retrieving aggregate IDs:", error.message);
        }
    });

get.command("aggregate")
    .description("Get an aggregate by its ID")
    .argument("<aggregateType>", "The aggregate type")
    .argument("<aggregateId>", "The aggregate ID")
    .option("-o, --origin <origin>", "The origin of the aggregate")
    .option("-s, --sequence-number <sequenceNumber>", "The sequence number to build the aggregate up to", parseInt)
    .action(async (aggregateType, aggregateId, options) => {
        try {
            const { origin, sequenceNumber } = options;
            const { adapter, close } = getAggregateQueryAdapter();
            const aggregate = await adapter.getAggregate(origin, aggregateType, aggregateId, sequenceNumber);
            await close?.();

            if (!aggregate) {
                console.log(
                    `No aggregate found for type "${aggregateType}"${origin ? `, origin "${origin}"` : ""} and ID "${aggregateId}".`
                );
                return;
            }

            const formattedAggregate = formatAggregate(aggregate);

            console.log(
                `Aggregate for type "${aggregateType}"${origin ? `, origin "${origin}"` : ""} and ID "${aggregateId}":`
            );
            console.log(JSON.stringify(formattedAggregate, null, 2));
        } catch (error: any) {
            console.error("Error retrieving aggregate:", error.message);
        }
    });

get.command("domain-events")
    .alias("domainevents")
    .description("Get all domain events for a given aggregate")
    .argument("<aggregateType>", "The aggregate type")
    .argument("<aggregateId>", "The aggregate ID")
    .option("-o, --origin <origin>", "The origin of the aggregate")
    .option("-f, --format <format>", "The format of the output", "json")
    .action(async (aggregateType, aggregateId, options) => {
        try {
            const { origin, format } = options;
            const { adapter, close } = getAggregateQueryAdapter();
            const domainEvents = await adapter.getDomainEventsForAggregate(origin, aggregateType, aggregateId);
            await close?.();

            if (domainEvents.length === 0) {
                console.log(
                    `No domain events found for type "${aggregateType}"${origin ? `, origin "${origin}"` : ""} and ID "${aggregateId}".`
                );
                return;
            }

            console.log(
                `Domain events for type "${aggregateType}"${origin ? `, origin "${origin}"` : ""} and ID "${aggregateId}":`
            );

            if (format === "table") {
                console.table(domainEvents);
            } else {
                domainEvents.forEach((event) => {
                    console.log(JSON.stringify(event, null, 2));
                });
            }
        } catch (error: any) {
            console.error("Error retrieving domain events:", error.message);
        }
    });

export default get;
