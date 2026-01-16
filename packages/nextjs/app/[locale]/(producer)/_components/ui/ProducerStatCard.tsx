import { Card, Badge } from "~~/components/ui";
import { cn } from "~~/lib/utils/cn";

type ProducerStatVariant = "primary" | "info" | "accent";

interface ProducerStatCardProps {
  label: string;
  value: string;
  helper?: string;
  badge?: string;
  variant?: ProducerStatVariant;
  className?: string;
}

const accentMap: Record<ProducerStatVariant, "green" | "blue" | "brown"> = {
  primary: "green",
  info: "blue",
  accent: "brown",
};

const valueColorMap: Record<ProducerStatVariant, string> = {
  primary: "text-vaca-green",
  info: "text-vaca-blue",
  accent: "text-vaca-brown",
};

/**
 * ProducerStatCard - Display producer metrics
 * Composes the shared Card component with producer-specific styling.
 */
export function ProducerStatCard({
  label,
  value,
  helper,
  badge,
  variant = "primary",
  className,
}: ProducerStatCardProps) {
  return (
    <Card
      variant="elevated"
      accent={accentMap[variant]}
      padding="md"
      className={cn("shadow-sm", className)}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-inter text-xs font-semibold uppercase tracking-wide text-vaca-neutral-gray-500">
          {label}
        </p>
        {badge && (
          <Badge tone="neutral" size="sm">
            {badge}
          </Badge>
        )}
      </div>
      <p
        className={cn(
          "mt-3 font-playfair text-3xl font-semibold leading-tight",
          valueColorMap[variant],
        )}
      >
        {value}
      </p>
      {helper && (
        <p className="mt-1 text-sm text-vaca-neutral-gray-500">{helper}</p>
      )}
    </Card>
  );
}
