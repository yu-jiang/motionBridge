import NavBar from "./navbar";

export default function TrifoldView({
  children1,
  children2,
  children3,
  children1Ratio,
  children2Ratio,
}: {
  children1: React.ReactNode;
  children2: React.ReactNode;
  children3: React.ReactNode;
  children1Ratio?: number;
  children2Ratio?: number;
}) {
  const actualChildren1Ratio = children1Ratio ? children1Ratio * 0.9 : 30;
  const actualChildren2Ratio = children2Ratio ? children2Ratio * 0.9 : 30;
  return (
    <div className="flex h-full">
      <div
        style={{
          flex: "0 0 10%",
          padding: "1rem"
        }}
      >
        <NavBar />
      </div>
      <div
        style={{
          flex: `0 0 ${actualChildren1Ratio}%`,
          padding: "1rem",
          overflowY: "auto",
          borderRight: "1px solid #ccc",
        }}
      >
        {children1}
      </div>
      <div
        style={{
          flex: `0 0 ${actualChildren2Ratio}%`,
          padding: "1rem",
          overflowY: "auto",
          borderRight: "1px solid #ccc",
        }}
      >
        {children2}
      </div>
      <div style={{ flex: 1, padding: "1rem", overflowY: "auto" }}>
        {children3}
      </div>
    </div>
  );
}
