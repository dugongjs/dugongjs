import chalk from "chalk";
import { Box, Text, useInput } from "ink";
import React from "react";

export type JSONViewerProps = {
    data: unknown | null;
    width: number;
    height: number;
    isFocused: boolean;
};

export const JSONViewer: React.FC<JSONViewerProps> = ({ data, width, height, isFocused }) => {
    const [offset, setOffset] = React.useState(0);

    React.useEffect(() => setOffset(0), [data, width, height]);

    const lines = React.useMemo(() => {
        if (!data) return ["—"];
        const pretty = JSON.stringify(data, null, 2) ?? "";
        const raw = pretty.split("\n");
        const wrapped = wrapLines(raw, width);
        return wrapped.map(colorizeLine);
    }, [data, width]);

    const maxOffset = Math.max(0, lines.length - height);

    React.useEffect(() => {
        setOffset((o) => Math.min(Math.max(0, o), maxOffset));
    }, [maxOffset]);

    useInput(
        (input, key) => {
            if (!isFocused) return;
            if (key.upArrow || input === "k") setOffset((o) => Math.max(0, o - 1));
            if (key.downArrow || input === "j") setOffset((o) => Math.min(maxOffset, o + 1));
            if (key.pageUp) setOffset((o) => Math.max(0, o - Math.max(1, height - 1)));
            if (key.pageDown) setOffset((o) => Math.min(maxOffset, o + Math.max(1, height - 1)));
        },
        { isActive: isFocused }
    );

    const windowed = lines.slice(offset, offset + height);

    return (
        <>
            <Box flexDirection="column" width={width}>
                {windowed.length === 0 ? (
                    <Text color="gray" wrap="truncate">
                        —
                    </Text>
                ) : (
                    windowed.map((line, i) => (
                        <Text key={`${offset}-${i}`} wrap="truncate">
                            {line}
                        </Text>
                    ))
                )}
            </Box>

            <Box width={width} marginTop={0}>
                <Text color="gray" dimColor wrap="truncate">
                    {lines.length > 0
                        ? `${Math.min(lines.length, offset + 1)}-${Math.min(lines.length, offset + height)} / ${lines.length}`
                        : ""}
                </Text>
            </Box>
        </>
    );
};

function wrapLines(lines: string[], width: number): string[] {
    if (width <= 0) return lines;
    const out: string[] = [];
    for (const line of lines) {
        if (line.length <= width) {
            out.push(line);
            continue;
        }
        let start = 0;
        while (start < line.length) {
            out.push(line.slice(start, start + width));
            start += width;
        }
    }
    return out;
}

function colorizeLine(line: string): string {
    let s = line.replace(/("([^"\\]|\\.)*")\s*:/g, (m) => chalk.cyan(m));
    s = s.replace(/:\s*("([^"\\]|\\.)*")/g, (_, g1) => `: ${chalk.green(g1)}`);
    s = s.replace(/:\s*(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)/gi, (_, num) => `: ${chalk.yellow(num)}`);
    s = s.replace(/:\s*(true|false|null)/g, (_, kw) => `: ${chalk.magenta(kw)}`);
    return s;
}
