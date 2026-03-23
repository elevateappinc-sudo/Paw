"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{
      minHeight: "100dvh", background: "#000000",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: 32, fontFamily: "monospace", color: "#fff"
    }}>
      <h2 style={{ color: "#FF7A45", marginBottom: 16 }}>Error al cargar</h2>
      <pre style={{
        background: "#111", padding: 16, borderRadius: 8,
        maxWidth: 600, overflowX: "auto", fontSize: 12,
        color: "#EF4444", whiteSpace: "pre-wrap"
      }}>
        {error.message}
        {"\n\n"}
        {error.stack}
      </pre>
      <button
        onClick={reset}
        style={{
          marginTop: 24, padding: "12px 24px",
          background: "#FF7A45", color: "#000",
          border: "none", borderRadius: 8, cursor: "pointer"
        }}
      >
        Reintentar
      </button>
    </div>
  );
}
