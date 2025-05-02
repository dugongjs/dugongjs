import { Box, Spacer, Text } from "ink";
import React from "react";

export type ValueDisplayProps = {
    label: string;
    value?: string;
};

export const ValueDisplay: React.FC<ValueDisplayProps> = (props) => {
    const { label, value } = props;

    return (
        <Box>
            <Text color="gray">{label}:</Text>
            <Spacer />
            <Text color="cyan">{value ?? "none"}</Text>
        </Box>
    );
};
