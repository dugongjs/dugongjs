import { Command } from "commander";
import { deleteContext, getCurrentContext, listContexts, setConfig, switchContext } from "../config/context.js";

const config = new Command("config");

config
    .command("set-context")
    .description("Set a new context")
    .option("-n, --name <name>", "Name of the context", "default")
    .option("-c, --current", "Make this context the current context", false)
    .option("-h, --host <host>", "Server host")
    .option("-p, --port <port>", "Server port", parseInt)
    .option("-a, --adapter <adapter>", "Adapter type", "nestjs-microservices")
    .option("-t, --transport <transport>", "Transport method", "tcp")
    .action((options) => {
        const { name, current, host, port, adapter, transport } = options;

        const context = {
            name,
            host,
            port,
            adapter,
            transport
        };

        setConfig(name, context, current);
        console.log(`Context "${name}" saved${current ? " and set as current" : ""}.`);
    });

config
    .command("use-context")
    .description("Switch current context")
    .argument("<name>", "Name of the context to switch to")
    .action((name) => {
        const success = switchContext(name);

        if (!success) {
            console.error(`Context "${name}" not found.`);
        }

        console.log(`Switched to context "${name}".`);
    });

config
    .command("current-context")
    .description("Show current context")
    .action(() => {
        const context = getCurrentContext();

        if (!context) {
            console.log("No current context set.");
            return;
        }

        console.log("Current context:");
        console.log(`- Name: ${context.name}`);
        console.log(`- Host: ${context.host ?? "<not set>"}`);
        console.log(`- Port: ${context.port ?? "<not set>"}`);
        console.log(`- Adapter: ${context.adapter ?? "<not set>"}`);
        console.log(`- Transport: ${context.transport ?? "<not set>"}`);
    });

config
    .command("delete-context")
    .description("Delete a context")
    .argument("<name>", "Name of the context to delete")
    .action((name) => {
        const success = deleteContext(name);

        if (!success) {
            console.error(`Context "${name}" not found.`);
            return;
        }

        console.log(`Context "${name}" deleted.`);
    });

config
    .command("list-contexts")
    .description("List all contexts")
    .action(() => {
        const contexts = listContexts();
        if (contexts.length === 0) {
            console.log("No contexts found.");
            return;
        }
        console.log("Available contexts:");
        contexts.forEach((context) => {
            console.log(`- ${context}`);
        });
    });

export default config;
