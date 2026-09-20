type Tone = "neutral" | "ready" | "warn" | "planned";

export function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  return <span className={`badge badge-${tone}`}>{label}</span>;
}
