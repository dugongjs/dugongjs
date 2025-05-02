#!/usr/bin/env node
import "reflect-metadata";

import { Command } from "commander";
import config from "./commands/config.js";
import get from "./commands/get.js";
import studio from "./commands/studio.js";

const program = new Command();

program.name("dugong").description("Dugong CLI");

program.addCommand(config);
program.addCommand(get);
program.addCommand(studio);

program.parse();
