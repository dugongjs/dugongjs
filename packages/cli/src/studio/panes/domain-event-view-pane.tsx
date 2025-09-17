import { Box, Text, measureElement, type DOMElement } from "ink";
import React from "react";
import { JSONViewer } from "../components/json-viewer.js";
import { ValueDisplay } from "../components/value-display.js";

export type DomainEventViewPaneProps = {
    isFocused: boolean;
    isLoading: boolean;
    error?: string | null;
    domainEvent: any | null;
    maximumSequenceNumber: number | null;
};

const PADDING_X = 1;

export const DomainEventViewPane: React.FC<DomainEventViewPaneProps> = ({
    isFocused,
    isLoading,
    error,
    domainEvent,
    maximumSequenceNumber
}) => {
    const containerRef = React.useRef<DOMElement>(null);
    const titleRef = React.useRef<DOMElement>(null);
    const infoRef = React.useRef<DOMElement>(null);

    const [contentWidth, setContentWidth] = React.useState(40);
    const [metaViewport, setMetaViewport] = React.useState(6);
    const [payloadViewport, setPayloadViewport] = React.useState(6);

    const sequenceNumberDisplay = `${domainEvent?.sequenceNumber ?? "0"}/${maximumSequenceNumber ?? "0"}`;

    React.useLayoutEffect(() => {
        if (!containerRef.current) return;

        const { height: ch, width: cw } = measureElement(containerRef.current);
        const { height: th } = titleRef.current ? measureElement(titleRef.current) : { height: 1 };
        const { height: ih } = infoRef.current ? measureElement(infoRef.current) : { height: 0 };

        const usableW = Math.max(1, cw - 2 - PADDING_X * 2);
        const remainingH = Math.max(0, ch - 2 - th - ih);

        const metaBlock = Math.floor(remainingH / 2);
        const payloadBlock = remainingH - metaBlock;

        const metaView = Math.max(0, metaBlock - 1 - 1);
        const payloadView = Math.max(0, payloadBlock - 1 - 1);

        setContentWidth(usableW);
        setMetaViewport(metaView);
        setPayloadViewport(payloadView);
    });

    return (
        <Box
            ref={containerRef}
            flexDirection="column"
            flexGrow={1}
            borderStyle="round"
            borderColor={isFocused ? "cyan" : "gray"}
        >
            <Box ref={titleRef} paddingX={PADDING_X}>
                <Text bold>Domain Event</Text>
            </Box>

            {isLoading ? (
                <Box paddingX={PADDING_X}>
                    <Text color="gray">Loading event…</Text>
                </Box>
            ) : error ? (
                <Box paddingX={PADDING_X}>
                    <Text color="red">{error}</Text>
                </Box>
            ) : !domainEvent ? (
                <Box paddingX={PADDING_X}>
                    <Text color="gray">No domain event selected</Text>
                </Box>
            ) : (
                <>
                    <Box ref={infoRef} flexDirection="column" width="100%" paddingX={PADDING_X}>
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
                        <ValueDisplay label="Tenant ID" value={domainEvent.tenantId} />
                        <ValueDisplay label="Correlation ID" value={domainEvent.correlationId} />
                        <ValueDisplay label="Triggered by user ID" value={domainEvent.triggeredByUserId} />
                        <ValueDisplay label="Triggered by event ID" value={domainEvent.triggeredByEventId} />
                    </Box>

                    <Box flexDirection="column" width="100%" paddingX={PADDING_X}>
                        <Text bold>Metadata</Text>
                        <JSONViewer
                            data={domainEvent.metadata}
                            width={contentWidth}
                            height={metaViewport}
                            isFocused={isFocused}
                        />
                    </Box>

                    <Box flexDirection="column" width="100%" paddingX={PADDING_X}>
                        <Text bold>Payload</Text>
                        <JSONViewer
                            data={domainEvent.payload}
                            width={contentWidth}
                            height={payloadViewport}
                            isFocused={isFocused}
                        />
                    </Box>
                </>
            )}
        </Box>
    );
};
