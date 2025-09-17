// hooks/use-log-overlay.tsx
import { Box, measureElement, Text, useInput, type DOMElement } from "ink";
import React from "react";
import { useStdoutDimensions } from "./use-stdout-dimensions.js";

type LogLevel = "debug" | "info" | "warn" | "error";

type LogEntry = {
    level: LogLevel;
    message: string;
    ts: number;
};

const levelColor: Record<LogLevel, string> = {
    debug: "white",
    info: "blueBright",
    warn: "yellow",
    error: "redBright"
};

function fmtArg(a: unknown) {
    if (a instanceof Error) return a.stack || a.message;
    if (typeof a === "string") return a;
    try {
        return JSON.stringify(a, null, 2);
    } catch {
        return String(a);
    }
}

function ts(d = new Date()) {
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    const s = String(d.getSeconds()).padStart(2, "0");
    return `${h}:${m}:${s}`;
}

export function useLogOverlay() {
    const [open, setOpen] = React.useState(false);
    const [logs, setLogs] = React.useState<LogEntry[]>([]);
    const [cols, rows] = useStdoutDimensions();

    const containerRef = React.useRef<DOMElement>(null);
    const [visibleLines, setVisibleLines] = React.useState(10);
    const [contentWidth, setContentWidth] = React.useState(60);

    const [scrollOffset, setScrollOffset] = React.useState(0);
    const [stickBottom, setStickBottom] = React.useState(true);

    useInput(
        (input, key) => {
            if (!open) {
                if (key.ctrl && input.toLowerCase() === "l") setOpen(true);
                return;
            }
            if (key.escape || input.toLowerCase() === "q") {
                setOpen(false);
                return;
            }
            if (key.upArrow || input === "k") {
                setScrollOffset((v) => Math.max(0, v - 1));
                setStickBottom(false);
            } else if (key.downArrow || input === "j") {
                setScrollOffset((v) => v + 1);
            } else if (input === "u") {
                setScrollOffset((v) => Math.max(0, v - Math.max(1, Math.floor(visibleLines / 2))));
                setStickBottom(false);
            } else if (input === "d") {
                setScrollOffset((v) => v + Math.max(1, Math.floor(visibleLines / 2)));
            } else if (input === "g" && !key.shift) {
                setScrollOffset(0);
                setStickBottom(false);
            } else if (input === "G" || (input === "g" && key.shift)) {
                setStickBottom(true);
            }
        },
        { isActive: true }
    );

    const log = React.useCallback((level: LogLevel, ...args: unknown[]) => {
        const msg = args.map(fmtArg).join(" ");
        setLogs((prev) => {
            const next = prev.length >= 800 ? prev.slice(-799) : prev.slice();
            next.push({ level, message: msg, ts: Date.now() });
            return next;
        });
    }, []);

    const debug = React.useCallback((...args: unknown[]) => log("debug", ...args), [log]);
    const info = React.useCallback((...args: unknown[]) => log("info", ...args), [log]);
    const warn = React.useCallback((...args: unknown[]) => log("warn", ...args), [log]);
    const error = React.useCallback((...args: unknown[]) => log("error", ...args), [log]);

    React.useEffect(() => {
        if (!containerRef.current) return;
        const { width, height } = measureElement(containerRef.current);
        setContentWidth(Math.max(40, Math.min(width - 2, 120)));
        setVisibleLines(Math.max(5, height - 3));
    }, [cols, rows, open]);

    const rendered = React.useMemo(() => {
        const lines: Array<{ level: LogLevel; text: string }> = [];
        for (let i = 0; i < logs.length; i++) {
            const entry = logs[i];
            const prefix = `[${ts(new Date(entry.ts))}] [${entry.level.toUpperCase()}] `;
            const width = Math.max(10, contentWidth);
            const avail = Math.max(1, width - prefix.length);
            const chunks = String(entry.message).split("\n");
            for (let j = 0; j < chunks.length; j++) {
                const raw = chunks[j];
                if (raw.length <= avail) {
                    lines.push({ level: entry.level, text: prefix + raw });
                } else {
                    for (let k = 0; k < raw.length; k += avail) {
                        const part = raw.slice(k, k + avail);
                        const pad = k === 0 ? prefix : " ".repeat(prefix.length);
                        lines.push({ level: entry.level, text: pad + part });
                    }
                }
            }
        }
        return lines;
    }, [logs, contentWidth]);

    React.useEffect(() => {
        if (!stickBottom) return;
        const overflow = Math.max(0, rendered.length - visibleLines);
        setScrollOffset(overflow);
    }, [rendered.length, visibleLines, stickBottom]);

    const start = Math.max(0, Math.min(rendered.length, scrollOffset));
    const end = Math.min(rendered.length, start + visibleLines);
    const page = rendered.slice(start, end);
    const width = Math.max(10, contentWidth);

    const Overlay = open ? (
        <Box position="absolute" width="100%" height="100%" alignItems="center" justifyContent="center">
            <Box
                ref={containerRef}
                borderStyle="round"
                borderColor="yellow"
                backgroundColor="black"
                width={Math.min(Math.max(50, Math.floor(cols * 0.8)), 120)}
                height={Math.min(Math.max(12, Math.floor(rows * 0.8)), 40)}
                flexDirection="column"
            >
                <Text inverse>{` LOGS  ↑/↓ j/k  u/d  g/G  q/esc `.padEnd(width, " ")}</Text>
                {page.length === 0 ? (
                    <Text>{" ".repeat(width)}</Text>
                ) : (
                    page.map((l, i) => (
                        <Text key={i} color={levelColor[l.level] as any}>
                            {l.text.length > width ? l.text.slice(0, width) : l.text.padEnd(width, " ")}
                        </Text>
                    ))
                )}
            </Box>
        </Box>
    ) : null;

    return { log, debug, info, warn, error, Overlay, isOpen: open };
}
