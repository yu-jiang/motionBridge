import Message from "./message";

export default function StatusBar({
  connected,
  label,
}: {
  connected: boolean;
  label?: string;
}) {
  return (
    <Message
      message={connected ? "🟢 Connected" : "🔴 Disconnected"}
      label={label}
    />
  );
}
