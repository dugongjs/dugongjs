import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Command } from "commander";
import { withFullScreen } from "fullscreen-ink";
import React from "react";
import { getAggregateQueryAdapter } from "../adapters/resolver.js";
import { MainView } from "../studio/main-view.js";

const studio = new Command("studio").description("Launch the interactive studio").action(async () => {
    try {
        // Test the connection before launching the UI
        const { adapter, close } = getAggregateQueryAdapter();
        await adapter.getAggregateTypes();
        await close?.();
    } catch (error: any) {
        console.error("Failed to connect to the current data source");
        console.error(error);
        process.exit(1);
    }

    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: 0,
                refetchOnWindowFocus: false
            }
        }
    });

    withFullScreen(
        <QueryClientProvider client={queryClient}>
            <MainView />
        </QueryClientProvider>
    ).start();
});

export default studio;
