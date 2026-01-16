import type { ReactNode } from "react";
import { Section, type SectionAccent } from "~~/components/ui";

interface InfoSectionProps {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
  variant?: "default" | "traceability";
  className?: string;
}

/**
 * InfoSection - Sectioned content wrapper for investor screens
 * Composes the shared Section component.
 * Used in Lot Detail screen for organized information display.
 */
export function InfoSection({
  title,
  children,
  icon,
  variant = "default",
  className,
}: InfoSectionProps) {
  const accentMap: Record<typeof variant, SectionAccent> = {
    default: "default",
    traceability: "brown",
  };

  return (
    <Section
      title={title}
      icon={icon}
      accent={accentMap[variant]}
      divider
      className={className}
    >
      {children}
    </Section>
  );
}
