import type { ReactNode } from "react";
import { cn } from "~~/lib/utils/cn";

interface ProducerLayoutProps {
  children: ReactNode;
  className?: string;
}

/**
 * Layout for Producer screens.
 * Producer = Ganadero/Feedlot that tokenizes lots and manages animals.
 */
export function ProducerLayout({ children, className }: ProducerLayoutProps) {
  return (
    <div
      className={cn(
        "min-h-screen bg-vaca-neutral-bg text-vaca-neutral-gray-900",
        "px-4 py-8 sm:px-6 lg:px-10",
        className,
      )}
    >
      <main className="mx-auto w-full max-w-6xl">{children}</main>
    </div>
  );
}

// Backwards compatibility alias
export const OperatorLayout = ProducerLayout;
