#!/usr/bin/env node

/**
 * Fails when a branch changes the published dependencies of a publishable package
 * without adding a changeset.
 *
 * Only `dependencies` and `peerDependencies` of non-private packages are considered,
 * because those are what reach npm. `devDependencies` are stripped from the published
 * manifest, so bumping one leaves the published artifact identical and a changeset
 * would only produce version churn.
 *
 * This deliberately ignores source changes — whether those warrant a changeset is a
 * judgement call. The narrow case it catches is a dependency fix that gets merged and
 * then sits unpublished because nothing triggered a release.
 *
 * Usage:
 *   node scripts/check-changeset.mjs [base] [head]
 *
 * Defaults to `origin/main` and `HEAD`.
 */

import { execSync } from "node:child_process";

const base = process.argv[2] ?? "origin/main";
const head = process.argv[3] ?? "HEAD";

function git(args) {
    return execSync(`git ${args}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
}

function manifestAt(ref, path) {
    try {
        return JSON.parse(git(`show ${ref}:${path}`));
    } catch {
        return null;
    }
}

function changedFiles(filter, pathspec) {
    const flag = filter ? `--diff-filter=${filter}` : "";
    try {
        return git(`diff --name-only ${flag} ${base}...${head} -- ${pathspec}`).split("\n").filter(Boolean);
    } catch {
        return [];
    }
}

const PUBLISHED_SECTIONS = ["dependencies", "peerDependencies"];

const needsChangeset = [];

for (const file of changedFiles(null, '"packages/*/package.json"')) {
    const after = manifestAt(head, file);
    if (!after || after.private) {
        continue;
    }

    const before = manifestAt(base, file);
    const changed = PUBLISHED_SECTIONS.filter(
        (section) => JSON.stringify(before?.[section] ?? {}) !== JSON.stringify(after[section] ?? {})
    );

    if (changed.length > 0) {
        needsChangeset.push({ name: after.name, sections: changed });
    }
}

if (needsChangeset.length === 0) {
    console.log("No published dependency changes — a changeset is not required.");
    process.exit(0);
}

const addedChangesets = changedFiles("A", '".changeset/*.md"').filter((file) => !file.endsWith("README.md"));

if (addedChangesets.length > 0) {
    console.log(`Published dependencies changed and a changeset is present: ${addedChangesets.join(", ")}`);
    process.exit(0);
}

console.error("These packages changed dependencies that reach npm, but no changeset was added:\n");
for (const { name, sections } of needsChangeset) {
    console.error(`  ${name}  (${sections.join(", ")})`);
}
console.error("\nRun `pnpm changeset` to add one. Without it the change is merged but never published,");
console.error("so it only reaches consumers when some unrelated release happens to carry it.");
process.exit(1);
