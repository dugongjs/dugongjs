import { Box, Spacer, Text } from "ink";
import React from "react";

export type ValueDisplayProps = {
    label: string;
    value?: string | null;
    spacer?: boolean;
};

export const ValueDisplay: React.FC<ValueDisplayProps> = ({ label, value, spacer }) => {
    return (
        <Box>
            <Text color="blueBright">{label}: </Text>
            {spacer && <Spacer />}
            <Text color="white" bold>
                {value ?? "none"}
            </Text>
        </Box>
    );
};
