import { SeverityLevel } from "@/lib/otlp/types";
import { SEVERITY_BADGE_CLASSES } from "@/lib/otlp/severity";

interface Props {
  level: SeverityLevel;
  text?: string;
}

export default function SeverityBadge({ level, text }: Props) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold font-mono uppercase tracking-wide ${SEVERITY_BADGE_CLASSES[level]}`}
    >
      {text || level}
    </span>
  );
}
