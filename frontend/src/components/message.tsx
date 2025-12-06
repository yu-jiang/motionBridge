export default function Message({
  message,
  label,
}: {
  message: string;
  label?: string;
}) {
  const noLabel = label === "";
  return (
    <>
      {message && (
        <div className="message" style={{ whiteSpace: "pre-line" }}>
          {!noLabel && <strong>{label ? label : "Message:"}</strong>} {message}
        </div>
      )}
    </>
  );
}
