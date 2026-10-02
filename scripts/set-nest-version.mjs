#!/usr/bin/env node

/**
 * Pins every @nestjs/* package to a single major via pnpm overrides, so the test suite
 * can be run against each NestJS major the packages support. devDependencies resolve
 * one major at a time; overrides force that major across every workspace package at
 * once, which is what makes a matrix leg meaningful.
 *
 * Usage:
 *   node scripts/set-nest-version.mjs 11     # pin to NestJS v11
 *   node scripts/set-nest-version.mjs reset  # drop the @nestjs/* overrides again
 *
 * Follow either with `pnpm install --no-frozen-lockfile`, since overrides change
 * resolution and therefore the lockfile. Do not commit the resulting lockfile churn.
 *
 * NestJS declares no `engines`, but its transitive `file-type` dependency does: v10
 * needs Node >=18, v11 >=20 and v12 >=22.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Every @nestjs/* package the workspace resolves. All of them track NestJS's major,
// @nestjs/typeorm included (10.x -> Nest 10, 11.x -> Nest 11, 12.x -> Nest 12).
const NEST_PACKAGES = [
    "@nestjs/common",
    "@nestjs/core",
    "@nestjs/microservices",
    "@nestjs/platform-express",
    "@nestjs/testing",
    "@nestjs/typeorm"
];

const SUPPORTED_MAJORS = ["10", "11", "12"];

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const packageJsonPath = join(rootDir, "package.json");

const target = process.argv[2];

if (!target || (target !== "reset" && !SUPPORTED_MAJORS.includes(target))) {
    console.error(
        `Usage: node scripts/set-nest-version.mjs <${SUPPORTED_MAJORS.join("|")}|reset>\n` +
            `Received: ${target ?? "(nothing)"}`
    );
    process.exit(1);
}

const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

packageJson.pnpm ??= {};
packageJson.pnpm.overrides ??= {};

const overrides = packageJson.pnpm.overrides;

// Only ever touch the @nestjs/* keys — the repository has unrelated overrides
// (protobufjs, vite, webpackbar) that must survive untouched.
for (const name of NEST_PACKAGES) {
    delete overrides[name];
}

if (target !== "reset") {
    for (const name of NEST_PACKAGES) {
        overrides[name] = `^${target}.0.0`;
    }
}

writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4) + "\n");

if (target === "reset") {
    console.log("Removed @nestjs/* overrides — NestJS now resolves from devDependencies.");
} else {
    console.log(`Pinned @nestjs/* to ^${target}.0.0:`);
    for (const name of NEST_PACKAGES) {
        console.log(`  ${name}: ${overrides[name]}`);
    }
}

console.log("\nRun `pnpm install --no-frozen-lockfile` to apply.");
