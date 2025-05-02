import { useStdout } from "ink";
import React from "react";

/*
 * Taken from the ink-use-stdout-dimensions package.
 * Copied here as it does not support ESM.
 *
 * Source: https://github.com/cameronhunter/ink-monorepo/blob/master/packages/ink-use-stdout-dimensions/src/index.ts
 */

export function useStdoutDimensions(): [number, number] {
    const { stdout } = useStdout();
    const [dimensions, setDimensions] = React.useState<[number, number]>([stdout.columns, stdout.rows]);

    React.useEffect(() => {
        const handler = () => setDimensions([stdout.columns, stdout.rows]);
        stdout.on("resize", handler);
        return () => {
            stdout.off("resize", handler);
        };
    }, [stdout]);

    return dimensions;
}
