import { Box, Text } from "ink";
import React from "react";

export type HotkeyIndicatorProps = {
    label: string;
    hotkey: string;
    hotkeyWidth?: number;
};

export const HotkeyIndicator: React.FC<HotkeyIndicatorProps> = ({ label, hotkey, hotkeyWidth = 4 }) => {
    return (
        <Box flexDirection="row">
            <Box width={hotkeyWidth}>
                <Text color="cyan">{hotkey}</Text>
            </Box>

            <Box flexGrow={1}>
                <Text>: </Text>
                <Text color="grey">{label}</Text>
            </Box>
        </Box>
    );
};
