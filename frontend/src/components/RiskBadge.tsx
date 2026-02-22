import { RiskLevel } from "@/data/types";

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

const labels: Record<RiskLevel, string> = {
  alto: "Alto",
  medio: "Medio",
  bajo: "Bajo",
};

export function RiskBadge({ level, className = "" }: RiskBadgeProps) {
  return (
    <span className={`risk-badge-${level} ${className}`}>
      {labels[level]}
    </span>
  );
}
