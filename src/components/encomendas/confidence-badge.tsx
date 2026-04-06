"use client";

import { Badge } from "@/components/ui/badge";
import type { ConfidenceLevel } from "@/lib/validations/encomenda-scan";

interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
}

const config: Record<ConfidenceLevel, { label: string; className: string }> = {
  high: {
    label: "Alta confiança",
    className: "bg-success-100 text-success-700 border-transparent",
  },
  medium: {
    label: "Média confiança",
    className: "bg-warning-100 text-warning-700 border-transparent",
  },
  low: {
    label: "Baixa confiança",
    className: "bg-error-100 text-error-700 border-transparent",
  },
};

export function ConfidenceBadge({ level }: ConfidenceBadgeProps) {
  const { label, className } = config[level];
  return (
    <Badge variant="outline" className={`text-[10px] font-semibold shrink-0 ${className}`}>
      {label}
    </Badge>
  );
}
