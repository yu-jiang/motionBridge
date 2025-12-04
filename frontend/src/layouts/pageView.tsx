import NavBar from "./navbar";

export default function PageView({ children }: { children: React.ReactNode }) {
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
        className="flex-col no-gap"
        style={{ flex: 1, padding: "1rem", overflowY: "auto" }}
      >
        {children}
      </div>
    </div>
  );
}
