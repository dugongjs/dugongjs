export default function BookCardContainer({ children }: { children: React.ReactNode }) {
    return <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>{children}</div>;
}
