import { Box, Spacer, Text } from "ink";
import SelectInput from "ink-select-input";
import React from "react";
import { HotkeyIndicator } from "../components/hotkey-indicator.js";

export type SidebarProps = {
    isFocused: boolean;
    isLoading: boolean;
    error?: string | null;
    types: string[];
    selectedType: string | null;
    setSelectedType: (value: string) => void;
};

export const SIDEBAR_WIDTH = 30;

export const Sidebar: React.FC<SidebarProps> = (props) => {
    const { isFocused, isLoading, error, types, selectedType, setSelectedType } = props;

    const items = types.map((type) => ({ label: type, value: type }));

    return (
        <Box
            width={SIDEBAR_WIDTH}
            height="100%"
            flexDirection="column"
            borderStyle="single"
            borderColor={isFocused ? "cyan" : "gray"}
        >
            <Box flexDirection="column" width="100%">
                {isLoading ? (
                    <Text color="gray">Loading types…</Text>
                ) : error ? (
                    <Text color="red">{error}</Text>
                ) : items.length === 0 ? (
                    <Text color="gray">No types</Text>
                ) : (
                    <SelectInput
                        items={items}
                        onSelect={(item) => setSelectedType(item.value)}
                        initialIndex={selectedType ? types.indexOf(selectedType) : 0}
                        isFocused={isFocused}
                    />
                )}
            </Box>

            <Spacer />
            <Box flexDirection="column" width={15}>
                <HotkeyIndicator hotkey="↑/↓" label="navigate" />
                <HotkeyIndicator hotkey="↵" label="select" />
            </Box>
        </Box>
    );
};
