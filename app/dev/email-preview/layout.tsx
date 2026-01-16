export default function EmailPreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout overrides the app layout to provide a clean preview
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        margin: 0,
        padding: "40px 20px",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        minHeight: "100vh",
        backgroundColor: "#2D3250",
        overflow: "auto",
      }}
    >
      <div style={{ width: "100%", maxWidth: "600px" }}>{children}</div>
    </div>
  );
}
