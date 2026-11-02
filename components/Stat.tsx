export default function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string | number;
  note?: string;
}) {
  return (
    <div className="card stat">
      <p className="stat-value">{value}</p>
      <p className="muted text-sm">{label}</p>
      {note && <p className="muted text-sm">{note}</p>}
    </div>
  );
}
