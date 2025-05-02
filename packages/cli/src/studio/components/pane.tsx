import { Box, type DOMElement, Text } from "ink";
import React from "react";

export type PaneProps = React.PropsWithChildren<{
    isFocused?: boolean;
    isLoading?: boolean;
}>;

export const Pane = React.forwardRef<DOMElement, PaneProps>(function Pane(props, ref) {
    const { isFocused, isLoading, children } = props;

    return (
        <Box
            ref={ref}
            width="100%"
            height="100%"
            flexDirection="column"
            paddingX={1}
            borderColor={isFocused ? "green" : "gray"}
            borderStyle="round"
        >
            {isLoading ? (
                <Box flexDirection="column" width="100%" height="100%">
                    <Text color="gray">Loading...</Text>
                </Box>
            ) : (
                children
            )}
        </Box>
    );
});
