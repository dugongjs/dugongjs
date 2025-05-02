import { Box, Spacer, Text } from "ink";
import SelectInput from "ink-select-input";
import TextInput from "ink-text-input";
import React from "react";
import { Pane, type PaneProps } from "../components/pane.js";

export type AggregateIdSelectPaneProps = PaneProps & {
    selectedType: string | null;
    ids: string[];
    selectedId: string | null;
    setSelectedId: (value: string) => void;
};

export const AggregateIdSelectPane: React.FC<AggregateIdSelectPaneProps> = (props) => {
    const { isFocused, isLoading, selectedType, ids, selectedId, setSelectedId } = props;

    const [filter, setFilter] = React.useState("");

    const filteredItems = React.useMemo(() => {
        return ids
            .filter((id) => id.toLowerCase().includes(filter.toLowerCase()))
            .map((id) => ({ label: id, value: id }));
    }, [ids, filter]);

    return (
        <Pane isFocused={isFocused} isLoading={isLoading}>
            <Text bold>Aggregate instances</Text>
            {!selectedType && <Text color="gray">No aggregate type selected</Text>}

            <Box flexDirection="column" width="100%" marginTop={1}>
                {selectedType && (
                    <>
                        {isFocused && (
                            <Box>
                                <Text>
                                    <Text color="gray">Search:</Text>{" "}
                                    <TextInput value={filter} onChange={setFilter} showCursor={false} />
                                </Text>
                            </Box>
                        )}
                        {filteredItems.length === 0 ? (
                            <Text color="gray">No instances found</Text>
                        ) : (
                            <SelectInput
                                items={filteredItems}
                                onSelect={(item) => setSelectedId(item.value)}
                                initialIndex={selectedId ? ids.indexOf(selectedId) : 0}
                                isFocused={isFocused}
                            />
                        )}
                    </>
                )}
            </Box>

            <Spacer />
            <Box marginTop={1}>
                <Text color="gray">↑/↓ : navigate • ↵ : select</Text>
            </Box>
        </Pane>
    );
};
