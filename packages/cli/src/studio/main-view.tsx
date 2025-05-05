import type { IAggregateQueryService } from "@dugongjs/core";
import { Box, measureElement, Spacer, Text, useApp, useInput, type DOMElement } from "ink";
import React from "react";
import { getAggregateQueryAdapter } from "../adapters/resolver.js";
import formatAggregate from "../utils/format-aggregate.js";
import { useStdoutDimensions } from "./hooks/use-stdout-dimensions.js";
import { AggregateDiffPane } from "./panes/aggregate-diff-pane.js";
import { AggregateIdSelectPane } from "./panes/aggregate-id-select-pane.js";
import { AggregateTypeSelectPane } from "./panes/aggregate-type-select-pane.js";
import { AggregateViewPane } from "./panes/aggregate-view-pane.js";
import { DomainEventSelectPane } from "./panes/domain-event-select-pane.js";
import { DomainEventViewPane } from "./panes/domain-event-view-pane.js";

export type MainViewProps = {
    preselectedType?: string;
    preselectedId?: string;
};

const PaneIndex = {
    AGGREGATE_TYPE: 0,
    AGGREGATE_ID: 1,
    DOMAIN_EVENT: 2
} as const;
type PaneIndex = (typeof PaneIndex)[keyof typeof PaneIndex];

export function MainView(props: MainViewProps) {
    const { preselectedType, preselectedId } = props;

    const app = useApp();
    const [_, rows] = useStdoutDimensions();

    const [activePaneIndex, setActivePaneIndex] = React.useState<PaneIndex>(PaneIndex.AGGREGATE_TYPE);
    const totalPanes = 3;

    useInput((_, key) => {
        if (key.tab && !key.shift) {
            setActivePaneIndex((prev) => ((prev + 1) % totalPanes) as PaneIndex);
        } else if (key.shift && key.tab) {
            setActivePaneIndex((prev) => ((prev - 1 + totalPanes) % totalPanes) as PaneIndex);
        }
    });

    useInput((_, key) => {
        if (key.escape) {
            app.exit();
        }
    });

    const [types, setTypes] = React.useState<string[]>([]);
    const [selectedType, setSelectedType] = React.useState<string | null>(preselectedType ?? null);

    const [ids, setIds] = React.useState<string[]>([]);
    const [selectedId, setSelectedId] = React.useState<string | null>(preselectedId ?? null);

    const [aggregate, setAggregate] = React.useState<object | null>(null);
    const [previousAggregate, setPreviousAggregate] = React.useState<object | null>(null);

    const [domainEvents, setDomainEvents] = React.useState<any[]>([]);
    const [selectedDomainEventIndex, setSelectedDomainEventIndex] = React.useState<number | null>(null);

    const [adapter, setAdapter] = React.useState<IAggregateQueryService | null>(null);

    const containerRef = React.useRef<DOMElement>(null);
    const [containerSize, setContainerSize] = React.useState<{ width: number; height: number }>({
        width: 0,
        height: 0
    });

    React.useEffect(() => {
        const { adapter, close } = getAggregateQueryAdapter();
        setAdapter(adapter);

        return () => {
            close?.();
        };
    }, []);

    React.useEffect(() => {
        if (adapter) {
            adapter
                .getAggregateTypes()
                .then(setTypes)
                .catch((error) => console.error("Error retrieving aggregate types:", error.message));
        }
    }, [adapter]);

    React.useEffect(() => {
        if (adapter && selectedType) {
            adapter
                .getAggregateIds(null, selectedType)
                .then(setIds)
                .catch((error) => console.error("Error retrieving aggregate IDs:", error.message));
            setActivePaneIndex(PaneIndex.AGGREGATE_ID);
        }
    }, [adapter, selectedType]);

    React.useEffect(() => {
        if (adapter && selectedType && selectedId) {
            adapter
                .getDomainEventsForAggregate(null, selectedType, selectedId)
                .then((domainEvents) => {
                    setDomainEvents(domainEvents);
                    setSelectedDomainEventIndex(domainEvents.length - 1);
                })
                .catch((error) => console.error("Error retrieving domain events:", error.message));
            setActivePaneIndex(PaneIndex.DOMAIN_EVENT);
        }
    }, [adapter, selectedId]);

    React.useEffect(() => {
        if (adapter && selectedType && selectedId) {
            adapter
                .getAggregate(
                    null,
                    selectedType,
                    selectedId,
                    domainEvents[selectedDomainEventIndex ?? 0]?.sequenceNumber
                )
                .then((aggregate) => setAggregate(aggregate))
                .catch((error) => console.error("Error retrieving aggregate:", error.message));

            if (selectedDomainEventIndex && selectedDomainEventIndex > 0) {
                adapter
                    .getAggregate(
                        null,
                        selectedType,
                        selectedId,
                        domainEvents[selectedDomainEventIndex - 1]?.sequenceNumber
                    )
                    .then((previousAggregate) => setPreviousAggregate(previousAggregate))
                    .catch((error) => console.error("Error retrieving previous aggregate:", error.message));
            }
        }
    }, [adapter, selectedType, selectedId, selectedDomainEventIndex]);

    React.useEffect(() => {
        if (containerRef.current) {
            const size = measureElement(containerRef.current);
            setContainerSize(size);
        }
    }, [rows]);

    return (
        <Box ref={containerRef} width="100%" height="100%" flexDirection="column">
            <Box width="100%" height={containerSize.height - 2} flexDirection="row" flexWrap="nowrap">
                <Box width="25%" height="100%" flexDirection="column">
                    <Box width="100%" height="25%">
                        <AggregateTypeSelectPane
                            types={types}
                            selectedType={selectedType}
                            setSelectedType={setSelectedType}
                            isFocused={activePaneIndex === PaneIndex.AGGREGATE_TYPE}
                        />
                    </Box>

                    <Box width="100%" height="75%">
                        <AggregateIdSelectPane
                            ids={ids}
                            selectedType={selectedType}
                            selectedId={selectedId}
                            setSelectedId={setSelectedId}
                            isFocused={activePaneIndex === PaneIndex.AGGREGATE_ID}
                        />
                    </Box>
                </Box>

                <Box width="40%" height="100%" flexDirection="column">
                    <Box width="100%" height="75%">
                        <AggregateViewPane
                            aggregateType={selectedType}
                            aggregateId={selectedId}
                            aggregate={formatAggregate(aggregate)}
                            isDeleted={(aggregate as any)?.isDeletedInternal ?? false}
                        />
                    </Box>

                    <Box width="100%" height="25%">
                        <AggregateDiffPane
                            current={formatAggregate({
                                ...aggregate,
                                isDeleted: (aggregate as any)?.isDeletedInternal ?? false
                            })}
                            previous={formatAggregate({
                                ...previousAggregate,
                                isDeleted: (previousAggregate as any)?.isDeletedInternal ?? false
                            })}
                        />
                    </Box>
                </Box>

                <Box width="35%" height="100%" flexDirection="column">
                    <Box width="100%" height="25%">
                        <DomainEventSelectPane
                            domainEvents={domainEvents}
                            selectedDomainEventIndex={selectedDomainEventIndex}
                            setSelectedDomainEventIndex={setSelectedDomainEventIndex}
                            isFocused={activePaneIndex === PaneIndex.DOMAIN_EVENT}
                        />
                    </Box>

                    <Box width="100%" height="75%">
                        <DomainEventViewPane
                            domainEvent={domainEvents[selectedDomainEventIndex ?? 0]}
                            maximumSequenceNumber={Math.max(
                                ...domainEvents.map((domainEvent) => domainEvent.sequenceNumber ?? 0)
                            )}
                        />
                    </Box>
                </Box>
            </Box>

            <Box width="100%" height={2} marginTop={1} paddingX={2} flexDirection="row">
                <Text color="gray">↹ / ⇧ + ↹ : switch pane • Esc : exit</Text>

                <Spacer />

                <Text color="blueBright">dugongjs studio</Text>
            </Box>
        </Box>
    );
}
