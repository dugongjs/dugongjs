import figures from "figures";
import { Box, type DOMElement, Text, measureElement } from "ink";
import React, { useState } from "react";

// Inspired by @ink/ui

export type ProgressBarProps = {
    readonly value: number;
};

export function ProgressBar({ value }: ProgressBarProps) {
    const [width, setWidth] = useState(0);

    const [ref, setRef] = useState<DOMElement | null>(null);

    if (ref) {
        const dimensions = measureElement(ref);

        if (dimensions.width !== width) {
            setWidth(dimensions.width);
        }
    }

    const progress = Math.min(100, Math.max(0, value));
    const complete = Math.round((progress / 100) * width);
    const remaining = width - complete;

    return (
        <Box ref={setRef} flexGrow={1} minWidth={20}>
            {complete > 0 && <Text color="cyanBright">{figures.square.repeat(complete)}</Text>}

            {remaining > 0 && <Text dimColor>{figures.squareLightShade.repeat(remaining)}</Text>}
        </Box>
    );
}
