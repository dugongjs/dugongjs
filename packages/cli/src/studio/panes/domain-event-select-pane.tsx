import { Box, measureElement, Spacer, Text, useInput, type DOMElement } from "ink";

import React from "react";
import { HotkeyIndicator } from "../components/hotkey-indicator.js";
import { useStdoutDimensions } from "../hooks/use-stdout-dimensions.js";

export type DomainEventSelectPaneProps = {
    isFocused: boolean;
    isLoading: boolean;
    error?: string | null;
    domainEvents: any[];
    selectedDomainEventIndex: number | null;
    setSelectedDomainEventIndex: (value: number) => void;
};

export const VISIBLE_LINES_SUBTRACT = 6;

export const DomainEventSelectPane: React.FC<DomainEventSelectPaneProps> = ({
    isFocused,
    isLoading,
    error,
    domainEvents,
    selectedDomainEventIndex,
    setSelectedDomainEventIndex
}) => {
    const selectedIndex = selectedDomainEventIndex ?? domainEvents.length - 1;

    const containerRef = React.useRef<DOMElement>(null);
    const [visibleLines, setVisibleLines] = React.useState<number>(10);
    const [scrollOffset, setScrollOffset] = React.useState<number>(0);
    const [_, rows] = useStdoutDimensions();

    React.useEffect(() => {
        if (containerRef.current) {
            const { height } = measureElement(containerRef.current);
            setVisibleLines(height - VISIBLE_LINES_SUBTRACT);
        }
    }, [rows]);

    React.useEffect(() => {
        const maxOffset = Math.max(0, domainEvents.length - visibleLines);

        if (selectedIndex < scrollOffset) {
            setScrollOffset(Math.max(0, selectedIndex));
        } else if (selectedIndex >= scrollOffset + visibleLines) {
            setScrollOffset(Math.min(selectedIndex - visibleLines + 1, maxOffset));
        }
    }, [selectedIndex, visibleLines, domainEvents.length]);

    useInput((_, key) => {
        if (!isFocused || domainEvents.length === 0) {
            return;
        }

        if (key.upArrow) {
            setSelectedDomainEventIndex(Math.max(0, selectedIndex - 1));
        } else if (key.downArrow) {
            setSelectedDomainEventIndex(Math.min(domainEvents.length - 1, selectedIndex + 1));
        }
    });

    const visibleDomainEvents = domainEvents.slice(scrollOffset, scrollOffset + visibleLines);

    return (
        <Box
            ref={containerRef}
            flexDirection="column"
            flexGrow={1}
            borderStyle="round"
            borderColor={isFocused ? "cyan" : "gray"}
            paddingX={1}
        >
            <Text bold>Domain Events ({domainEvents.length})</Text>

            {isLoading ? (
                <Text color="gray">Loading events…</Text>
            ) : error ? (
                <Text color="red">{error}</Text>
            ) : domainEvents.length === 0 ? (
                <Text color="gray">No domain events to display</Text>
            ) : (
                <Box flexDirection="column" marginTop={1}>
                    {visibleDomainEvents.map((event, idx) => {
                        const realIndex = scrollOffset + idx;
                        const isSelected = realIndex === selectedIndex;
                        return (
                            <Text key={realIndex} color={isSelected ? "cyan" : undefined} inverse={isSelected}>
                                {realIndex + 1}: {event.type}
                            </Text>
                        );
                    })}
                </Box>
            )}

            <Spacer />

            <Box marginTop={1}>
                <HotkeyIndicator hotkey="↑/↓" label="navigate + select" />
            </Box>
        </Box>
    );
};
