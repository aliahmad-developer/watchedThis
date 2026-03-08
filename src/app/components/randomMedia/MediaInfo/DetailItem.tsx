interface DetailItemProps {
  label: string;
  value: string;
  primaryClass?: string;
  secondaryClass?: string;
}

export function DetailItem({
  label,
  value,
  primaryClass = "text-white",
  secondaryClass = "text-white/75",
}: DetailItemProps) {
  return (
    <div>
      <h4 className={`text-sm font-semibold mb-1 ${secondaryClass}`}>{label}</h4>
      <p className={primaryClass}>{value || "N/A"}</p>
    </div>
  );
}