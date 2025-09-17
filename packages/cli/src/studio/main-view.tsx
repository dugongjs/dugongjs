import type { IAggregateQueryService } from "@dugongjs/core";
import { Box, Text, useInput } from "ink";
import React from "react";
import { getAggregateQueryAdapter } from "../adapters/resolver.js";
import { getCurrentContext } from "../config/context.js";
import type { Context } from "../types/context.js";
import { HotkeyIndicator } from "./components/hotkey-indicator.js";
import { ValueDisplay } from "./components/value-display.js";
import { useAggregateIds } from "./hooks/use-aggregate-ids.js";
import { useAggregateTypes } from "./hooks/use-aggregate-types.js";
import { useAggregate } from "./hooks/use-aggregate.js";
import { useDomainEvents } from "./hooks/use-domain-events.js";
import { useStdoutDimensions } from "./hooks/use-stdout-dimensions.js";
import { AggregateDiffPane } from "./panes/aggregate-diff-pane.js";
import { AggregateIdSelectPane } from "./panes/aggregate-id-select-pane.js";
import { AggregateViewPane } from "./panes/aggregate-view-pane.js";
import { DomainEventSelectPane } from "./panes/domain-event-select-pane.js";
import { DomainEventViewPane } from "./panes/domain-event-view-pane.js";
import { ProgressBar } from "./panes/progress-bar.js";
import { Sidebar } from "./panes/sidebar.js";

export type MainViewProps = {
    preselectedType?: string;
    preselectedId?: string;
};

const FocusIndex = {
    SIDEBAR: 0,
    AGGREGATE_ID_SELECT: 1,
    DOMAIN_EVENT_SELECT: 2,
    DOMAIN_EVENT_VIEW: 3,
    AGGREGATE_VIEW: 4
} as const;
type FocusIndex = (typeof FocusIndex)[keyof typeof FocusIndex];

function focusOrder(sidebarOpen: boolean): FocusIndex[] {
    return sidebarOpen
        ? [
              FocusIndex.SIDEBAR,
              FocusIndex.AGGREGATE_ID_SELECT,
              FocusIndex.DOMAIN_EVENT_SELECT,
              FocusIndex.DOMAIN_EVENT_VIEW,
              FocusIndex.AGGREGATE_VIEW
          ]
        : [
              FocusIndex.AGGREGATE_ID_SELECT,
              FocusIndex.DOMAIN_EVENT_SELECT,
              FocusIndex.DOMAIN_EVENT_VIEW,
              FocusIndex.AGGREGATE_VIEW
          ];
}

function maxReachablePos(hasSelectedId: boolean, order: FocusIndex[]) {
    const maxTarget = hasSelectedId ? FocusIndex.AGGREGATE_VIEW : FocusIndex.AGGREGATE_ID_SELECT;
    return order.indexOf(maxTarget);
}

export function MainView({ preselectedType, preselectedId }: MainViewProps) {
    const [cols, rows] = useStdoutDimensions();
    const [focusIndex, setFocusIndex] = React.useState<FocusIndex>(FocusIndex.SIDEBAR);
    const [sidebarOpen, setSidebarOpen] = React.useState<boolean>(true);
    const [showDiff, setShowDiff] = React.useState<boolean>(false);

    const [selectedType, setSelectedType] = React.useState<string | null>(preselectedType ?? null);
    const [selectedId, setSelectedId] = React.useState<string | null>(preselectedId ?? null);
    const [selectedDomainEventIndex, setSelectedDomainEventIndex] = React.useState<number | null>(null);

    const [context, setContext] = React.useState<Context | null>(null);
    const [adapter, setAdapter] = React.useState<IAggregateQueryService | null>(null);

    useInput((_, key) => {
        if (!key.tab) return;

        const order = focusOrder(sidebarOpen);
        const maxPos = maxReachablePos(!!selectedId, order);
        const reachable = order.slice(0, Math.max(0, maxPos) + 1);

        const currPos = Math.max(0, reachable.indexOf(focusIndex));
        const dir = key.shift ? -1 : 1;
        const nextPos = (currPos + dir + reachable.length) % reachable.length;

        setFocusIndex(reachable[nextPos]);
    });
    useInput((input, key) => {
        if (key.ctrl && input.toLowerCase() === "b") {
            setSidebarOpen((o) => {
                const nextOpen = !o;
                if (!nextOpen && focusIndex === FocusIndex.SIDEBAR) {
                    setFocusIndex(FocusIndex.AGGREGATE_ID_SELECT);
                }
                return nextOpen;
            });
        }
    });

    useInput((_, key) => {
        if (key.delete || key.backspace) {
            if (selectedId) {
                setSelectedId(null);
                setFocusIndex(FocusIndex.AGGREGATE_ID_SELECT);
            } else if (selectedType) {
                setSelectedType(null);
                setFocusIndex(FocusIndex.SIDEBAR);
            }
        }
    });

    useInput((input, key) => {
        if (key.ctrl && input.toLowerCase() === "d") {
            setShowDiff((d) => !d);
        }
    });

    React.useEffect(() => {
        const { adapter, close } = getAggregateQueryAdapter();
        const context = getCurrentContext();
        setAdapter(adapter);
        setContext(context);
        return () => void close?.();
    }, []);

    React.useEffect(() => {
        if (selectedType) {
            setSelectedId(null);
            setSelectedDomainEventIndex(null);
            setFocusIndex(FocusIndex.AGGREGATE_ID_SELECT);
        }
    }, [selectedType]);

    React.useEffect(() => {
        if (selectedId) setFocusIndex(FocusIndex.DOMAIN_EVENT_SELECT);
    }, [selectedId]);

    const {
        data: types,
        isLoading: typesLoading,
        isError: typesError,
        error: typesErrObj
    } = useAggregateTypes(adapter);

    const {
        data: ids,
        isLoading: idsLoading,
        isError: idsError,
        error: idsErrObj
    } = useAggregateIds(adapter, selectedType);

    const {
        data: domainEvents,
        isLoading: eventsLoading,
        isError: eventsError,
        error: eventsErrObj
    } = useDomainEvents(adapter, selectedType, selectedId);

    React.useEffect(() => {
        if (!domainEvents || domainEvents.length === 0) {
            setSelectedDomainEventIndex(null);
        } else {
            setSelectedDomainEventIndex((prev) =>
                prev == null ? domainEvents.length - 1 : Math.min(prev, domainEvents.length - 1)
            );
        }
    }, [domainEvents]);

    const currentSeq =
        selectedDomainEventIndex != null && domainEvents
            ? domainEvents[selectedDomainEventIndex]?.sequenceNumber
            : null;

    const prevSeq = currentSeq != null && currentSeq > 0 ? currentSeq - 1 : currentSeq;

    const {
        data: aggregate,
        isLoading: aggregateLoading,
        isError: aggregateError,
        error: aggregateErrObj
    } = useAggregate(adapter, selectedType, selectedId, currentSeq);

    const {
        data: previousAggregate,
        isLoading: prevAggLoading,
        isError: prevAggError
    } = useAggregate(adapter, selectedType, selectedId, prevSeq);

    return (
        <Box width={cols} height={rows - 1} marginTop={1} flexDirection="row">
            {sidebarOpen && (
                <Sidebar
                    types={types ?? []}
                    selectedType={selectedType}
                    setSelectedType={setSelectedType}
                    isFocused={focusIndex === FocusIndex.SIDEBAR}
                    isLoading={typesLoading}
                    error={typesError ? ((typesErrObj as Error)?.message ?? "Failed to load types") : null}
                />
            )}

            <Box flexGrow={1} height="100%" flexDirection="column">
                <Box flexBasis={6} padding={1} flexDirection="row" justifyContent="space-between">
                    <Box flexDirection="row" gap={4}>
                        <Box flexDirection="column">
                            <ValueDisplay label="Context" value={context?.name} />
                            <ValueDisplay label="Host" value={context?.host} />
                            <ValueDisplay label="Port" value={context?.port?.toString()} />
                            <ValueDisplay label="Adapter" value={context?.adapter} />
                            <ValueDisplay label="Transport" value={context?.transport} />
                        </Box>

                        <Box flexDirection="column">
                            <ValueDisplay label="Aggregate type" value={selectedType} />
                            <ValueDisplay label="Aggregate ID" value={selectedId} />
                            <ValueDisplay
                                label="Domain event ID"
                                value={
                                    selectedDomainEventIndex != null && domainEvents
                                        ? domainEvents[selectedDomainEventIndex]?.id
                                        : null
                                }
                            />
                            <Box>
                                <Text color="blueBright">Aggregate progression: </Text>
                                <ProgressBar
                                    value={
                                        domainEvents && selectedDomainEventIndex != null && domainEvents.length > 0
                                            ? Math.round(((selectedDomainEventIndex + 1) / domainEvents.length) * 100)
                                            : 0
                                    }
                                />
                                <Text>
                                    {domainEvents && selectedDomainEventIndex != null && domainEvents.length > 0
                                        ? ` ${selectedDomainEventIndex + 1}/${domainEvents.length}`
                                        : " N/A"}
                                </Text>
                            </Box>
                        </Box>
                    </Box>

                    <Box>
                        <Text color="cyanBright">dugong studio</Text>
                    </Box>
                </Box>

                <Box
                    flexGrow={1}
                    borderStyle="doubleSingle"
                    borderColor={
                        focusIndex === FocusIndex.SIDEBAR
                            ? "gray"
                            : focusIndex === FocusIndex.AGGREGATE_ID_SELECT
                              ? "cyan"
                              : "magentaBright"
                    }
                >
                    {selectedType ? (
                        !selectedId ? (
                            <AggregateIdSelectPane
                                ids={ids ?? []}
                                selectedId={selectedId}
                                setSelectedId={setSelectedId}
                                selectedType={selectedType}
                                isFocused={focusIndex === FocusIndex.AGGREGATE_ID_SELECT}
                                isLoading={idsLoading}
                                error={idsError ? ((idsErrObj as Error)?.message ?? "Failed to load IDs") : null}
                            />
                        ) : (
                            <Box flexDirection="row" flexGrow={1}>
                                <Box width="20%">
                                    <DomainEventSelectPane
                                        domainEvents={domainEvents ?? []}
                                        selectedDomainEventIndex={selectedDomainEventIndex}
                                        setSelectedDomainEventIndex={setSelectedDomainEventIndex}
                                        isFocused={focusIndex === FocusIndex.DOMAIN_EVENT_SELECT}
                                        isLoading={eventsLoading}
                                        error={
                                            eventsError
                                                ? ((eventsErrObj as Error)?.message ?? "Failed to load events")
                                                : null
                                        }
                                    />
                                </Box>

                                <Box width="40%">
                                    <DomainEventViewPane
                                        domainEvent={
                                            selectedDomainEventIndex != null && domainEvents
                                                ? domainEvents[selectedDomainEventIndex]
                                                : null
                                        }
                                        maximumSequenceNumber={
                                            domainEvents && domainEvents.length > 0
                                                ? domainEvents[domainEvents.length - 1].sequenceNumber
                                                : null
                                        }
                                        isFocused={focusIndex === FocusIndex.DOMAIN_EVENT_VIEW}
                                        isLoading={eventsLoading}
                                        error={
                                            eventsError
                                                ? ((eventsErrObj as Error)?.message ?? "Failed to load event")
                                                : null
                                        }
                                    />
                                </Box>

                                <Box width="40%">
                                    {showDiff ? (
                                        <AggregateDiffPane
                                            current={aggregate ?? null}
                                            previous={previousAggregate ?? null}
                                            isFocused={focusIndex === FocusIndex.AGGREGATE_VIEW}
                                            isLoading={aggregateLoading || prevAggLoading}
                                            error={
                                                aggregateError
                                                    ? ((aggregateErrObj as Error)?.message ??
                                                      "Failed to load aggregate")
                                                    : prevAggError
                                                      ? "Failed to load previous aggregate"
                                                      : null
                                            }
                                        />
                                    ) : (
                                        <AggregateViewPane
                                            aggregate={aggregate ?? null}
                                            isDeleted={(aggregate as any)?.isDeletedInternal ?? false}
                                            isFocused={focusIndex === FocusIndex.AGGREGATE_VIEW}
                                            isLoading={aggregateLoading || prevAggLoading}
                                            error={
                                                aggregateError
                                                    ? ((aggregateErrObj as Error)?.message ??
                                                      "Failed to load aggregate")
                                                    : prevAggError
                                                      ? "Failed to load previous aggregate"
                                                      : null
                                            }
                                        />
                                    )}
                                </Box>
                            </Box>
                        )
                    ) : (
                        <Text color="grey">No aggregate type selected</Text>
                    )}
                </Box>

                <Box borderStyle="single" borderColor="gray" gap={2} flexBasis={3} flexShrink={0}>
                    <HotkeyIndicator hotkey="Tab" label="next pane" />
                    <HotkeyIndicator hotkey="Shift+Tab" label="previous pane" hotkeyWidth={9} />
                    <HotkeyIndicator
                        hotkey="Ctrl+B"
                        label={`${sidebarOpen ? "hide" : "show"} sidebar`}
                        hotkeyWidth={6}
                    />
                    <HotkeyIndicator hotkey="↑/↓" label="navigate" />
                    <HotkeyIndicator hotkey="⏎" label="select" hotkeyWidth={1} />
                    <HotkeyIndicator hotkey="⌫" label="deselect" hotkeyWidth={1} />
                    <HotkeyIndicator
                        hotkey="Ctrl+D"
                        label={`show ${showDiff ? "aggregate" : "diff"}`}
                        hotkeyWidth={6}
                    />
                </Box>
            </Box>
        </Box>
    );
}
