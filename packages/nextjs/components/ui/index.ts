/**
 * Shared UI Components
 *
 * Generic, reusable primitives used across the entire application.
 * These components are NOT branded - feature-specific styling should
 * be applied by composing these with feature-specific wrappers.
 *
 * Usage:
 *   import { Button, Card, Badge } from "~/components/ui";
 */

// Core Components
export { Button } from "./Button";
export type { ButtonProps } from "./Button";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./Card";
export type {
  CardProps,
  CardHeaderProps,
  CardTitleProps,
  CardDescriptionProps,
  CardContentProps,
  CardFooterProps,
  CardVariant,
  CardAccent,
} from "./Card";

export { Input } from "./Input";
export type { InputProps } from "./Input";

export { Badge } from "./Badge";
export type { BadgeProps, BadgeTone, BadgeSize } from "./Badge";

export { ProgressBar } from "./ProgressBar";
export type { ProgressBarProps, ProgressBarColor, ProgressBarSize } from "./ProgressBar";

export { Section } from "./Section";
export type { SectionProps, SectionAccent } from "./Section";
