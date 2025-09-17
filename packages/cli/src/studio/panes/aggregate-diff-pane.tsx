import { Box, Spacer, Text } from "ink";
import { diff as jsonDiff } from "jsondiffpatch";
import React from "react";

export type AggregateDiffPaneProps = {
    isFocused: boolean;
    isLoading: boolean;
    error?: string | null;
    current: object | null;
    previous: object | null;
};

export const AggregateDiffPane: React.FC<AggregateDiffPaneProps> = ({
    isFocused,
    isLoading,
    error,
    current,
    previous
}) => {
    const diff = React.useMemo(() => {
        if (!current || !previous) return null;
        try {
            return jsonDiff(previous, current);
        } catch (err) {
            return { error: "Failed to compute diff" };
        }
    }, [current, previous]);

    const renderDiff = (value: any, indent = 0): React.ReactNode[] => {
        if (value === undefined || value === null) return [];

        const lines: React.ReactNode[] = [];

        const prefix = " ".repeat(indent * 2);

        // Handle array diffs
        if (value._t === "a") {
            for (const key in value) {
                if (key === "_t") continue;

                const index = key.startsWith("_") ? key.slice(1) : key;
                const val = value[key];

                if (Array.isArray(val) && val.length === 1) {
                    // Added
                    lines.push(
                        <Text key={`${key}-add`}>
                            {prefix}[+{index}]: <Text color="green">{JSON.stringify(val[0])}</Text>
                        </Text>
                    );
                } else if (Array.isArray(val) && val.length === 3 && val[2] === 0) {
                    // Deleted
                    lines.push(
                        <Text key={`${key}-del`}>
                            {prefix}[-{index}]: <Text color="red">{JSON.stringify(val[0])}</Text>
                        </Text>
                    );
                } else if (Array.isArray(val) && val.length === 2) {
                    // Changed
                    lines.push(
                        <Text key={`${key}-change`}>
                            {prefix}[~{index}]: <Text color="red">{JSON.stringify(val[0])}</Text> →{" "}
                            <Text color="green">{JSON.stringify(val[1])}</Text>
                        </Text>
                    );
                }
            }
            return lines;
        }

        // Handle object diffs
        for (const key in value) {
            const val = value[key];
            const isNested = typeof val === "object" && !Array.isArray(val) && val !== null;

            if (Array.isArray(val) && val.length === 2 && typeof val[0] !== "object") {
                lines.push(
                    <Text key={`${key}-${indent}`}>
                        {prefix}
                        <Text color="cyan">{key}</Text>: <Text color="red">{JSON.stringify(val[0])}</Text> →{" "}
                        <Text color="green">{JSON.stringify(val[1])}</Text>
                    </Text>
                );
            } else if (Array.isArray(val) && val.length === 3 && val[2] === 0) {
                lines.push(
                    <Text key={`${key}-removed`}>
                        {prefix}
                        <Text color="cyan">{key}</Text>: <Text color="red">{JSON.stringify(val[0])} (deleted)</Text>
                    </Text>
                );
            } else if (isNested || (val && typeof val === "object" && val._t === "a")) {
                lines.push(
                    <Text key={`${key}-head`} bold>
                        {prefix}
                        <Text color="cyan">{key}</Text>:
                    </Text>
                );
                lines.push(...renderDiff(val, indent + 1));
            }
        }

        return lines;
    };

    return (
        <Box
            width="100%"
            height="100%"
            borderStyle="round"
            borderColor={isFocused ? "cyan" : "gray"}
            flexDirection="column"
        >
            <Box paddingX={1}>
                <Text bold>Diff</Text>
            </Box>

            {isLoading ? (
                <Box paddingX={1}>
                    <Text color="gray">Loading aggregate…</Text>
                </Box>
            ) : error ? (
                <Box paddingX={1}>
                    <Text color="red">{error}</Text>
                </Box>
            ) : !current || !previous ? (
                <Box paddingX={1}>
                    <Text color="gray">No aggregate selected</Text>
                </Box>
            ) : !diff ? (
                <Text color="gray">No changes detected.</Text>
            ) : (
                <Box flexDirection="column" paddingX={1}>
                    {renderDiff(diff)}
                </Box>
            )}

            <Spacer />

            <Text color="gray" dimColor>
                Compares the current and previous state of the aggregate
            </Text>
        </Box>
    );
};
