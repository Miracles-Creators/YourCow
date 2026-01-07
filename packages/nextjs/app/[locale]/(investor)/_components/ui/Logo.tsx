import { BRAND_COPY } from "~~/lib/constants/brand";
import { cn } from "~~/lib/utils/cn";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizeStyles = {
  sm: {
    icon: "w-8 h-8",
    text: "text-xl",
  },
  md: {
    icon: "w-12 h-12",
    text: "text-3xl",
  },
  lg: {
    icon: "w-16 h-16",
    text: "text-4xl",
  },
} as const;

export function Logo({ size = "md", showText = true, className }: LogoProps) {
  const styles = sizeStyles[size];

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      {/* Cow Icon */}
      <svg
        viewBox="0 0 48 48"
        fill="none"
        className={cn(styles.icon, "text-vaca-green")}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="YourCow logo - cattle silhouette"
      >
        <path
          d="M24 4C20 4 16.5 6 14 9C11.5 6 8 4 4 4C4 12 8 18 14 20C14 28 18 36 24 40C30 36 34 28 34 20C40 18 44 12 44 4C40 4 36.5 6 34 9C31.5 6 28 4 24 4Z"
          fill="currentColor"
        />
        {/* Eyes */}
        <circle cx="18" cy="16" r="2" fill="#FAFAF8" />
        <circle cx="30" cy="16" r="2" fill="#FAFAF8" />
      </svg>

      {/* Brand Name */}
      {showText && (
        <h1
          className={cn(
            "font-playfair font-bold text-vaca-green tracking-tight",
            styles.text,
          )}
        >
          {BRAND_COPY.name}
        </h1>
      )}
    </div>
  );
}
