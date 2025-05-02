import chalk from "chalk";
import { Box, Text } from "ink";
import React from "react";

export type JSONViewerProps = {
    data: any;
};

function colorizeJson(value: unknown): string {
    return JSON.stringify(value, null, 2)
        .replace(/"([^"]+)":/g, chalk.cyan(`"$1":`)) // keys
        .replace(/: "(.*?)"/g, (_, str) => `: ${chalk.green(`"${str}"`)}`) // strings
        .replace(/: (\d+)/g, (_, num) => `: ${chalk.yellow(num)}`); // numbers
}

export const JSONViewer: React.FC<JSONViewerProps> = (props) => {
    const { data } = props;

    return (
        <Box flexDirection="column">
            {colorizeJson(data)
                .split("\n")
                .map((line, i) => (
                    <Text key={i}>{line}</Text>
                ))}
        </Box>
    );
};
