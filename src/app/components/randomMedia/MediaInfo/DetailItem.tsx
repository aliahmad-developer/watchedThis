import type { AmbientTextColors } from "../detailsPage";

interface DetailItemProps {
  label: string;
  value: string;
  ambientText: AmbientTextColors;
}

export function DetailItem({ label, value, ambientText }: DetailItemProps) {
  return (
    <div>
      <h4
        className="text-sm font-semibold mb-1 transition-colors duration-700"
        style={{ color: ambientText.secondary }}
      >
        {label}
      </h4>
      <p
        className="transition-colors duration-700"
        style={{ color: ambientText.primary }}
      >
        {value || "N/A"}
      </p>
    </div>
  );
}