interface DetailItemProps {
  label: string;
  value: string;
}

export function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-light-secondary-text dark:text-dark-secondary-text mb-1">{label}</h4>
      <p>{value || "N/A"}</p>
    </div>
  );
}
