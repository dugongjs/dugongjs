import { Box, Text } from "ink";
import React from "react";
import { JSONViewer } from "../components/json-viewer.js";
import { Pane, type PaneProps } from "../components/pane.js";
import { ValueDisplay } from "../components/value-display.js";

export type AggregateViewPaneProps = PaneProps & {
    aggregateType: string | null;
    aggregateId: string | null;
    aggregate: object | null;
    isDeleted: boolean;
};

export const AggregateViewPane: React.FC<AggregateViewPaneProps> = (props) => {
    const { isLoading, aggregateType, aggregateId, aggregate, isDeleted } = props;

    return (
        <Pane isLoading={isLoading}>
            <Text bold>Aggregate</Text>

            {!aggregate ? (
                <Text color="gray">No aggregate selected</Text>
            ) : (
                <Box flexDirection="column" width="100%" height="100%">
                    <Box flexDirection="column" width="100%" padding={1}>
                        <ValueDisplay label="Type" value={aggregateType ?? "none"} />
                        <ValueDisplay label="ID" value={aggregateId ?? "none"} />
                        <ValueDisplay label="Is deleted" value={isDeleted ? "Yes" : "No"} />
                    </Box>

                    <Box flexDirection="column" rowGap={1} width="100%" padding={1}>
                        <Text bold>State</Text>

                        <JSONViewer data={aggregate} />
                    </Box>
                </Box>
            )}
        </Pane>
    );
};
