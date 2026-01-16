import { Button, Card } from "~~/components/ui";
import type { AdminStatusTone } from "./StatusPill";
import { StatusPill } from "./StatusPill";

interface QueueCardProps {
  title: string;
  description?: string;
  href: string;
  statusLabel: string;
  statusTone?: AdminStatusTone;
  meta?: string;
  className?: string;
}

/**
 * QueueCard - Needs-attention item with status and review CTA.
 * Composes the shared Card and Button components.
 */
export function QueueCard({
  title,
  description,
  href,
  statusLabel,
  statusTone = "neutral",
  meta,
  className,
}: QueueCardProps) {
  return (
    <Card variant="bordered" padding="md" className={className}>
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-vaca-neutral-gray-900">
              {title}
            </h3>
            {description && (
              <p className="mt-1 text-sm text-vaca-neutral-gray-500">
                {description}
              </p>
            )}
          </div>
          <StatusPill label={statusLabel} tone={statusTone} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-vaca-neutral-gray-500">
            {meta ?? "Action required"}
          </span>
          <Button
            href={href}
            variant="outline"
            colorScheme="neutral"
            size="sm"
            className="rounded-full"
          >
            Review
          </Button>
        </div>
      </div>
    </Card>
  );
}
