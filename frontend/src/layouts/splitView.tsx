import NavBar from "./navbar";

export default function SplitView({
  childrenLeft,
  childrenRight,
  leftRatio,
}: {
  childrenLeft: React.ReactNode;
  childrenRight: React.ReactNode;
  leftRatio?: number;
}) {
  const actualLeftRatio = leftRatio ? leftRatio * 0.8 : 40;
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
          flex: `0 0 ${actualLeftRatio}%`,
          padding: "1rem",
          overflowY: "auto",
          borderRight: "1px solid #ccc",
        }}
      >
        {childrenLeft}
      </div>
      <div style={{ flex: 1, padding: "1rem", overflowY: "auto" }}>
        {childrenRight}
      </div>
    </div>
  );
}
