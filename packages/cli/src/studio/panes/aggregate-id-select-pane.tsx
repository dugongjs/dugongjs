import { Box, Spacer, Text } from "ink";
import SelectInput from "ink-select-input";
import TextInput from "ink-text-input";
import React from "react";
import { HotkeyIndicator } from "../components/hotkey-indicator.js";

export type AggregateIdSelectPaneProps = {
    isFocused: boolean;
    isLoading: boolean;
    error?: string | null;
    selectedType: string;
    ids: string[];
    selectedId: string | null;
    setSelectedId: (value: string) => void;
};

export const AggregateIdSelectPane: React.FC<AggregateIdSelectPaneProps> = ({
    isFocused,
    isLoading,
    error,
    selectedType,
    ids,
    selectedId,
    setSelectedId
}) => {
    const [filter, setFilter] = React.useState("");

    const filteredItems = React.useMemo(() => {
        return ids
            .filter((id) => id.toLowerCase().includes(filter.toLowerCase()))
            .map((id) => ({ label: id, value: id }));
    }, [ids, filter]);

    return (
        <Box flexDirection="column" width="100%" height="100%">
            <Text bold>
                {selectedType} list ({ids.length})
            </Text>

            <Box>
                <Text>
                    <Text color="gray">Search: </Text>
                    <TextInput value={filter} onChange={setFilter} showCursor focus={isFocused} />
                </Text>
            </Box>

            <Box flexDirection="column" width="100%" marginTop={1}>
                {isLoading ? (
                    <Text color="gray">Loading IDs…</Text>
                ) : error ? (
                    <Text color="red">{error}</Text>
                ) : filteredItems.length === 0 ? (
                    <Text color="gray">No aggregates found</Text>
                ) : (
                    <SelectInput
                        items={filteredItems}
                        onSelect={(item) => setSelectedId(item.value)}
                        initialIndex={selectedId ? ids.indexOf(selectedId) : 0}
                        isFocused={isFocused}
                    />
                )}
            </Box>

            <Spacer />
            <Box marginTop={1} flexDirection="column">
                <HotkeyIndicator hotkey="↑/↓" label="navigate" />
                <HotkeyIndicator hotkey="↵" label="select" />
            </Box>
        </Box>
    );
};
