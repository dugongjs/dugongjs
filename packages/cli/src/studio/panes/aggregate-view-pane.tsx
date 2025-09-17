import { Box, measureElement, Text, type DOMElement } from "ink";
import React from "react";
import formatAggregate from "../../utils/format-aggregate.js";
import { JSONViewer } from "../components/json-viewer.js";

export type AggregateViewPaneProps = {
    isFocused: boolean;
    isLoading: boolean;
    error?: string | null;
    isDeleted: boolean;
    aggregate: object | null;
};

const PADDING_X = 1;
const FOOTER_LINES = 1;

export const AggregateViewPane: React.FC<AggregateViewPaneProps> = ({
    isFocused,
    isLoading,
    error,
    aggregate,
    isDeleted
}) => {
    const containerRef = React.useRef<DOMElement>(null);
    const headerRef = React.useRef<DOMElement>(null);

    const [viewportLines, setViewportLines] = React.useState(8);
    const [contentWidth, setContentWidth] = React.useState(40);

    React.useLayoutEffect(() => {
        if (!containerRef.current) return;

        const { height: containerH, width: containerW } = measureElement(containerRef.current);

        let headerH = 0;
        if (headerRef.current) {
            const { height } = measureElement(headerRef.current);
            headerH = height;
        }

        const usableH = Math.max(0, containerH - 2 - headerH - FOOTER_LINES);
        const usableW = Math.max(1, containerW - 2 - PADDING_X * 2);

        setViewportLines(usableH);
        setContentWidth(usableW);
    });

    return (
        <Box
            ref={containerRef}
            width="100%"
            height="100%"
            borderStyle="round"
            borderColor={isFocused ? "cyan" : "gray"}
            flexDirection="column"
        >
            <Box ref={headerRef} flexDirection="row" justifyContent="space-between" paddingX={PADDING_X} paddingY={0}>
                <Text bold>Aggregate state</Text>
                <Text backgroundColor={isDeleted ? "red" : "cyanBright"} color="black">
                    {` ${isDeleted ? "DELETED" : "ACTIVE"} `}
                </Text>
            </Box>

            {isLoading ? (
                <Box paddingX={1}>
                    <Text color="gray">Loading aggregate…</Text>
                </Box>
            ) : error ? (
                <Box paddingX={1}>
                    <Text color="red">{error}</Text>
                </Box>
            ) : !aggregate ? (
                <Box paddingX={1}>
                    <Text color="gray">No aggregate selected</Text>
                </Box>
            ) : (
                <Box flexDirection="column" paddingX={PADDING_X}>
                    {!aggregate ? (
                        <Text color="gray">No aggregate selected</Text>
                    ) : (
                        <JSONViewer
                            data={formatAggregate(aggregate)}
                            width={contentWidth}
                            height={viewportLines}
                            isFocused={isFocused}
                        />
                    )}
                </Box>
            )}
        </Box>
    );
};
