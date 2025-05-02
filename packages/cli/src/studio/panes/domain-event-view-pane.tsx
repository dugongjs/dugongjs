import { Box, Text } from "ink";
import React from "react";
import { JSONViewer } from "../components/json-viewer.js";
import { Pane, type PaneProps } from "../components/pane.js";
import { ValueDisplay } from "../components/value-display.js";

export type DomainEventViewPaneProps = PaneProps & {
    domainEvent: any | null;
    maximumSequenceNumber: number | null;
};

export const DomainEventViewPane: React.FC<DomainEventViewPaneProps> = (props) => {
    const { isLoading, domainEvent, maximumSequenceNumber } = props;

    return (
        <Pane isLoading={isLoading}>
            <Text bold>Domain Event</Text>

            {!domainEvent ? (
                <Text color="gray">No domain event selected</Text>
            ) : (
                <Box flexDirection="column" width="100%" height="100%">
                    <Box flexDirection="column" width="100%" padding={1}>
                        <ValueDisplay label="ID" value={domainEvent.id} />
                        <ValueDisplay
                            label="Sequence number"
                            value={`${domainEvent.sequenceNumber ?? "0"}/${maximumSequenceNumber ?? "0"}`}
                        />
                        <ValueDisplay label="Timestamp" value={domainEvent.timestamp} />
                        <ValueDisplay label="Type" value={domainEvent.type} />
                        <ValueDisplay label="Version" value={domainEvent.version} />
                        <ValueDisplay label="Origin" value={domainEvent.origin} />
                        <ValueDisplay label="Aggregate Type" value={domainEvent.aggregateType} />
                        <ValueDisplay label="Aggregate ID" value={domainEvent.aggregateId} />
                        <ValueDisplay label="Correlation ID" value={domainEvent.correlationId} />
                        <ValueDisplay label="Triggered by user ID" value={domainEvent.triggeredByUserId} />
                        <ValueDisplay label="Triggered by event ID" value={domainEvent.triggeredByEventId} />
                    </Box>

                    <Box flexDirection="column" rowGap={1} width="100%" padding={1}>
                        <Text bold>Metadata</Text>
                        <JSONViewer data={domainEvent.metadata} />
                    </Box>

                    <Box flexDirection="column" rowGap={1} width="100%" padding={1}>
                        <Text bold>Payload</Text>
                        <JSONViewer data={domainEvent.payload} />
                    </Box>
                </Box>
            )}
        </Pane>
    );
};
