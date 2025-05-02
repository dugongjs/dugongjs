import { Box, Spacer, Text } from "ink";
import SelectInput from "ink-select-input";
import React from "react";
import { Pane, type PaneProps } from "../components/pane.js";

export type AggregateTypeSelectPaneProps = PaneProps & {
    types: string[];
    selectedType: string | null;
    setSelectedType: (value: string) => void;
};

export const AggregateTypeSelectPane: React.FC<AggregateTypeSelectPaneProps> = (props) => {
    const { isFocused, types, selectedType, setSelectedType } = props;

    const items = types.map((type) => ({ label: type, value: type }));

    return (
        <Pane isFocused={isFocused}>
            <Text bold>Aggregate Types</Text>

            <Box flexDirection="column" width="100%" marginTop={1}>
                <SelectInput
                    items={items}
                    onSelect={(item) => setSelectedType(item.value)}
                    initialIndex={selectedType ? types.indexOf(selectedType) : 0}
                    isFocused={isFocused}
                />
            </Box>

            <Spacer />
            <Box marginTop={1}>
                <Text color="gray">↑/↓ : navigate • ↵ : select</Text>
            </Box>
        </Pane>
    );
};
